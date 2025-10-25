const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authMiddleware, requireRole } = require("../middleware/auth");
const prisma = new PrismaClient();
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// GET /api/interventions - Lister les interventions (avec filtres)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      theme,
      commune,
      dateDebut,
      dateFin,
      search,
    } = req.query;
    const where = {};

    // Filtre recherche
    if (search && search.trim() !== "") {
      const searchLower = search.toLowerCase();

      // Si la recherche correspond à un statut connu, on utilise le filtre de statut
      const statusMapping = {
        "en attente": "en_attente",
        en_attente: "en_attente",
        répondu: "repondu",
        repondu: "repondu",
        terminé: "termine",
        termine: "termine",
        urgent: "urgent",
      };

      const matchedStatus = statusMapping[searchLower];
      if (matchedStatus) {
        // Appliquer le filtre de statut correspondant
        if (matchedStatus === "en_attente") {
          where.reponse = null;
        } else if (matchedStatus === "repondu") {
          where.reponse = { not: null };
          where.satisfaction = null;
        } else if (matchedStatus === "termine") {
          where.satisfaction = { not: null };
        } else if (matchedStatus === "urgent") {
          where.urgent = true;
        }
      } else {
        // Recherche normale dans les autres champs
        where.OR = [
          { question: { contains: search, mode: "insensitive" } },
          { reponse: { contains: search, mode: "insensitive" } },
          { notes: { contains: search, mode: "insensitive" } },
          { commune: { nom: { contains: search, mode: "insensitive" } } },
        ];
      }
    }

    // Filtre par statut (si spécifié séparément)
    if (status && status !== "all" && !search) {
      if (status === "en_attente") {
        where.reponse = null;
      } else if (status === "repondu") {
        where.reponse = { not: null };
        where.satisfaction = null;
      } else if (status === "termine") {
        where.satisfaction = { not: null };
      } else if (status === "urgent") {
        where.urgent = true;
      }
    }

    // Filtre par thème
    if (theme && theme !== "all") {
      where.theme_id = parseInt(theme);
    }

    // Filtre par commune
    if (commune && commune !== "all") {
      where.commune_id = parseInt(commune);
    }

    // Filtre par date
    if (dateDebut || dateFin) {
      where.date_question = {};
      if (dateDebut) where.date_question.gte = new Date(dateDebut);
      if (dateFin)
        where.date_question.lte = new Date(dateFin + "T23:59:59.999Z");
    }

    const interventions = await prisma.interventions.findMany({
      where,
      include: {
        commune: { select: { nom: true } },
        theme: { select: { designation: true } },
        demandeur: { select: { nom: true, prenom: true } },
        juriste: { select: { nom: true, prenom: true } },
      },
      orderBy: { date_question: "desc" },
      skip: (page - 1) * limit,
      take: parseInt(limit),
    });

    const total = await prisma.interventions.count({ where });

    res.json({
      interventions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur liste interventions:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des interventions" });
  }
});

// GET /api/interventions/:id - Détail d'une intervention
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const intervention = await prisma.interventions.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        commune: { select: { nom: true, population: true } },
        theme: { select: { designation: true } },
        demandeur: { select: { nom: true, prenom: true, email: true } },
        juriste: { select: { nom: true, prenom: true, email: true } },
        pieces_jointes: true,
      },
    });

    if (!intervention) {
      return res.status(404).json({ error: "Intervention non trouvée" });
    }

    // Vérifier les permissions
    if (
      req.user.role === "commune" &&
      intervention.demandeur_id !== req.user.id
    ) {
      return res
        .status(403)
        .json({ error: "Accès non autorisé à cette intervention" });
    }

    res.json(intervention);
  } catch (error) {
    console.error("Erreur détail intervention:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération de l'intervention" });
  }
});

// POST /api/interventions - Créer une intervention (communes seulement)
router.post("/", authMiddleware, requireRole(["commune"]), async (req, res) => {
  try {
    const { question, theme_id, pieces_jointes } = req.body;

    if (!question || !theme_id) {
      return res
        .status(400)
        .json({ error: "Question et thème sont obligatoires" });
    }

    // Récupérer l'utilisateur avec sa commune
    const utilisateur = await prisma.utilisateurs.findUnique({
      where: { id: req.user.id },
      select: { commune_id: true },
    });

    if (!utilisateur || !utilisateur.commune_id) {
      return res
        .status(400)
        .json({ error: "Utilisateur sans commune associée" });
    }

    const intervention = await prisma.interventions.create({
      data: {
        question,
        theme_id: parseInt(theme_id),
        commune_id: utilisateur.commune_id,
        demandeur_id: req.user.id,
      },
      include: {
        commune: { select: { nom: true } },
        theme: { select: { designation: true } },
        demandeur: { select: { nom: true, prenom: true } },
      },
    });

    res.status(201).json({
      message: "Intervention créée avec succès",
      intervention,
    });
  } catch (error) {
    console.error("Erreur création intervention:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la création de l'intervention" });
  }
});

// PUT /api/interventions/:id/reponse - Répondre à une intervention (juristes seulement)
router.put(
  "/:id/reponse",
  authMiddleware,
  requireRole(["juriste", "admin"]),
  async (req, res) => {
    try {
      const { reponse, notes } = req.body;

      if (!reponse) {
        return res.status(400).json({ error: "La réponse est obligatoire" });
      }

      const intervention = await prisma.interventions.update({
        where: { id: parseInt(req.params.id) },
        data: {
          reponse,
          notes,
          juriste_id: req.user.id,
          date_reponse: new Date(),
        },
        include: {
          commune: { select: { nom: true } },
          theme: { select: { designation: true } },
          demandeur: { select: { nom: true, prenom: true, email: true } },
          juriste: { select: { nom: true, prenom: true } },
        },
      });

      res.json({
        message: "Réponse enregistrée avec succès",
        intervention,
      });
    } catch (error) {
      console.error("Erreur réponse intervention:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de l'enregistrement de la réponse" });
    }
  }
);

// PUT /api/interventions/:id/satisfaction - Noter une intervention (communes seulement)
router.put(
  "/:id/satisfaction",
  authMiddleware,
  requireRole(["commune"]),
  async (req, res) => {
    try {
      const { satisfaction } = req.body;

      if (!satisfaction || satisfaction < 1 || satisfaction > 5) {
        return res
          .status(400)
          .json({ error: "La satisfaction doit être entre 1 et 5" });
      }

      const intervention = await prisma.interventions.findUnique({
        where: { id: parseInt(req.params.id) },
      });

      if (!intervention) {
        return res.status(404).json({ error: "Intervention non trouvée" });
      }

      if (!intervention.reponse) {
        return res
          .status(400)
          .json({ error: "Impossible de noter une intervention sans réponse" });
      }

      const updatedIntervention = await prisma.interventions.update({
        where: { id: parseInt(req.params.id) },
        data: { satisfaction: parseInt(satisfaction) },
      });

      res.json({
        message: "Satisfaction enregistrée avec succès",
        intervention: updatedIntervention,
      });
    } catch (error) {
      console.error("Erreur notation intervention:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de l'enregistrement de la satisfaction" });
    }
  }
);

// GET /api/interventions/stats/dashboard - Tableaux de bord
router.get(
  "/stats/dashboard",
  authMiddleware,
  requireRole(["admin", "juriste"]),
  async (req, res) => {
    try {
      // Questions par commune
      const questionsParCommune = await prisma.interventions.groupBy({
        by: ["commune_id"],
        _count: { id: true },
        where: {
          date_question: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { _count: { id: "desc" } },
      });

      // Questions par thème
      const questionsParTheme = await prisma.interventions.groupBy({
        by: ["theme_id"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      });

      // Satisfaction par strate de commune
      const satisfactionParStrate = await prisma.$queryRaw`
        SELECT 
          CASE 
            WHEN c.population < 100 THEN '< 100 habitants'
            WHEN c.population BETWEEN 100 AND 500 THEN '100-500 habitants' 
            ELSE '> 500 habitants'
          END as strate,
          (AVG(COALESCE(i.satisfaction, 1)))::float as satisfaction_moyenne,
          COUNT(i.id)::integer as nb_interventions
        FROM "Interventions" i
        JOIN "Communes" c ON i.commune_id = c.id
        GROUP BY strate
      `;

      // Temps moyen de réponse
      const interventionsAvecReponse = await prisma.interventions.findMany({
        where: {
          date_reponse: { not: null },
        },
        select: {
          date_question: true,
          date_reponse: true,
        },
      });

      let totalMs = 0;
      interventionsAvecReponse.forEach((intervention) => {
        const tempsReponse =
          new Date(intervention.date_reponse) -
          new Date(intervention.date_question);
        totalMs += tempsReponse;
      });

      const tempsMoyenMs =
        interventionsAvecReponse.length > 0
          ? totalMs / interventionsAvecReponse.length
          : 0;

      res.json({
        questionsParCommune,
        questionsParTheme,
        satisfactionParStrate,
        tempsMoyenReponse: {
          jours: Math.round(tempsMoyenMs / (1000 * 60 * 60 * 24)),
          heures: Math.round(tempsMoyenMs / (1000 * 60 * 60)),
        },
        totalInterventions: await prisma.interventions.count(),
        interventionsSansReponse: await prisma.interventions.count({
          where: { reponse: null },
        }),
      });
    } catch (error) {
      console.error("Erreur stats dashboard:", error);
      res.status(500).json({
        error: "Erreur lors du calcul des statistiques",
        details: error.message,
      });
    }
  }
);

// GET /api/interventions/theme/:themeId/similaires - Questions similaires
router.get("/theme/:themeId/similaires", authMiddleware, async (req, res) => {
  try {
    const { themeId } = req.params;
    const { keywords } = req.query;

    const interventions = await prisma.interventions.findMany({
      where: {
        theme_id: parseInt(themeId),
        reponse: { not: null },
      },
      include: {
        commune: { select: { nom: true } },
        theme: { select: { designation: true } },
      },
      orderBy: { date_question: "desc" },
      take: 10,
    });

    res.json({ questionsSimilaires: interventions });
  } catch (error) {
    res.status(500).json({ error: "Erreur recherche questions similaires" });
  }
});

// Configuration de multer pour l'upload
const checkFileType = (file, cb) => {
  const allowedMimes = {
    "application/pdf": [".pdf"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
      ".docx",
    ],
  };

  const fileExtension = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;

  if (
    allowedMimes[mimeType] &&
    allowedMimes[mimeType].includes(fileExtension)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(`Type de fichier non autorisé: ${mimeType} (${fileExtension})`),
      false
    );
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/pieces-jointes";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(cleanName);
    const nameWithoutExt = path.basename(cleanName, extension);

    cb(null, nameWithoutExt + "-" + uniqueSuffix + extension);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  },
});

// POST /api/interventions/:id/pieces-jointes - Upload pièces jointes
router.post(
  "/:id/pieces-jointes",
  authMiddleware,
  requireRole(["commune"]),
  upload.array("pieces_jointes", 5),
  async (req, res) => {
    try {
      const interventionId = parseInt(req.params.id);

      const intervention = await prisma.interventions.findUnique({
        where: { id: interventionId },
        include: { demandeur: true },
      });

      if (!intervention) {
        return res.status(404).json({ error: "Intervention non trouvée" });
      }

      if (intervention.demandeur_id !== req.user.id) {
        return res.status(403).json({ error: "Accès non autorisé" });
      }

      const piecesJointes = [];

      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const pieceJointe = await prisma.piecesJointes.create({
            data: {
              nom_original: file.originalname,
              nom_fichier: file.filename,
              chemin: file.path,
              intervention_id: interventionId,
            },
          });
          piecesJointes.push(pieceJointe);
        }
      }

      res.status(201).json({
        message: "Pièces jointes uploadées avec succès",
        pieces_jointes: piecesJointes,
      });
    } catch (error) {
      console.error("Erreur upload pièces jointes:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de l'upload des pièces jointes" });
    }
  }
);

// GET /api/interventions/pieces-jointes/:id - Télécharger une pièce jointe
router.get("/pieces-jointes/:id", authMiddleware, async (req, res) => {
  try {
    const pieceId = parseInt(req.params.id);

    const pieceJointe = await prisma.piecesJointes.findUnique({
      where: { id: pieceId },
      include: {
        intervention: {
          include: {
            demandeur: true,
            commune: true,
          },
        },
      },
    });

    if (!pieceJointe) {
      return res.status(404).json({ error: "Pièce jointe non trouvée" });
    }

    const user = req.user;
    const intervention = pieceJointe.intervention;

    if (user.role === "commune" && intervention.demandeur_id !== user.id) {
      return res.status(403).json({ error: "Accès non autorisé" });
    }

    if (!fs.existsSync(pieceJointe.chemin)) {
      return res
        .status(404)
        .json({ error: "Fichier non trouvé sur le serveur" });
    }

    const extension = path.extname(pieceJointe.nom_original).toLowerCase();
    const mimeTypes = {
      ".pdf": "application/pdf",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".doc": "application/msword",
      ".docx":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };

    const mimeType = mimeTypes[extension] || "application/octet-stream";

    res.setHeader("Content-Type", mimeType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(pieceJointe.nom_original)}"`
    );

    const fileStream = fs.createReadStream(pieceJointe.chemin);

    fileStream.on("error", (error) => {
      if (!res.headersSent) {
        res.status(500).json({ error: "Erreur lors de la lecture du fichier" });
      }
    });

    fileStream.pipe(res);
  } catch (error) {
    console.error("Erreur téléchargement pièce jointe:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Erreur lors du téléchargement" });
    }
  }
});

module.exports = router;
