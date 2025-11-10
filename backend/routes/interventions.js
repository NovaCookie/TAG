const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authMiddleware, requireRole } = require("../middleware/auth");
const filterService = require("../services/filterService");
const prisma = new PrismaClient();
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// GET /api/interventions - Liste des interventions (avec service de filtres)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const where = filterService.buildInterventionFilters(
      req.query,
      req.user,
      false
    );
    const pagination = filterService.getPaginationOptions(req.query);
    const include = filterService.getIncludeOptions(false);

    const result = await filterService.findInterventions(
      where,
      pagination,
      include,
      { date_question: "desc" }
    );

    res.json(result);
  } catch (error) {
    console.error("Erreur liste interventions:", error);
    res.status(500).json({ error: "Erreur récupération interventions" });
  }
});

// GET /api/interventions/archives/list - Archives avec filtres unifiés
router.get(
  "/archives/list",
  authMiddleware,
  requireRole(["admin", "juriste"]),
  async (req, res) => {
    try {
      const where = filterService.buildInterventionFilters(
        req.query,
        req.user,
        true
      );
      const pagination = filterService.getPaginationOptions(req.query);
      const include = filterService.getIncludeOptions(true);

      const result = await filterService.findInterventions(
        where,
        pagination,
        include,
        { date_archivage: "desc" }
      );

      // Ajout des stats spécifiques aux archives
      const stats = await prisma.interventions.groupBy({
        by: ["theme_id"],
        where: { date_archivage: { not: null } },
        _count: { id: true },
      });

      const totalArchives = await prisma.interventions.count({
        where: { date_archivage: { not: null } },
      });

      res.json({
        ...result,
        stats: {
          totalArchives,
          archivesParTheme: stats.length,
          derniereArchive:
            result.interventions.length > 0
              ? result.interventions[0].date_archivage
              : null,
        },
      });
    } catch (error) {
      console.error("Erreur archives:", error);
      res.status(500).json({ error: "Erreur chargement archives" });
    }
  }
);

// GET /api/interventions/:id - Détail d'une intervention
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const intervention = await prisma.interventions.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        commune: { select: { nom: true, population: true } },
        theme: { select: { designation: true } },
        demandeur: {
          select: {
            nom: true,
            prenom: true,
            email: true,
            actif: true,
          },
        },
        juriste: {
          select: {
            nom: true,
            prenom: true,
            email: true,
            actif: true,
          },
        },
        pieces_jointes: true,
      },
    });

    if (!intervention) {
      return res.status(404).json({ error: "Intervention non trouvée" });
    }

    if (
      req.user.role === "commune" &&
      intervention.demandeur_id !== req.user.id
    ) {
      return res.status(403).json({ error: "Accès non autorisé" });
    }

    res.json(intervention);
  } catch (error) {
    console.error("Erreur détail intervention:", error);
    res.status(500).json({ error: "Erreur récupération intervention" });
  }
});

// POST /api/interventions - Créer une intervention
router.post("/", authMiddleware, requireRole(["commune"]), async (req, res) => {
  try {
    const { titre, description, theme_id } = req.body;

    if (!titre || !description || !theme_id) {
      return res
        .status(400)
        .json({ error: "Titre, description et thème obligatoires" });
    }

    if (titre.length > 100) {
      return res.status(400).json({ error: "Titre max 100 caractères" });
    }

    if (description.length > 2000) {
      return res.status(400).json({ error: "Description max 2000 caractères" });
    }

    const utilisateur = await prisma.utilisateurs.findUnique({
      where: { id: req.user.id },
      select: { commune_id: true },
    });

    if (!utilisateur?.commune_id) {
      return res
        .status(400)
        .json({ error: "Utilisateur sans commune associée" });
    }

    const intervention = await prisma.interventions.create({
      data: {
        titre: titre.substring(0, 100),
        description: description.substring(0, 2000),
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
    res.status(500).json({ error: "Erreur création intervention" });
  }
});

// DELETE /api/interventions/:id - Supprimer une intervention
router.delete(
  "/:id",
  authMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const interventionId = parseInt(req.params.id);

      const intervention = await prisma.interventions.findUnique({
        where: { id: interventionId },
      });

      if (!intervention) {
        return res.status(404).json({ error: "Intervention non trouvée" });
      }

      await prisma.piecesJointes.deleteMany({
        where: { intervention_id: interventionId },
      });

      await prisma.interventions.delete({
        where: { id: interventionId },
      });

      res.json({
        message: "Intervention supprimée avec succès",
        deletedInterventionId: interventionId,
      });
    } catch (error) {
      console.error("Erreur suppression intervention:", error);

      if (error.code === "P2025") {
        return res.status(404).json({ error: "Intervention non trouvée" });
      }

      res.status(500).json({
        error: "Erreur suppression intervention",
        details: error.message,
      });
    }
  }
);

// PUT /api/interventions/:id/response - Répondre à une intervention
router.put(
  "/:id/response",
  authMiddleware,
  requireRole(["juriste", "admin"]),
  async (req, res) => {
    try {
      const { reponse, notes } = req.body;

      if (!reponse) {
        return res.status(400).json({ error: "Réponse obligatoire" });
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
          demandeur: {
            select: { nom: true, prenom: true, email: true, actif: true },
          },
          juriste: { select: { nom: true, prenom: true, actif: true } },
        },
      });

      res.json({
        message: "Réponse enregistrée avec succès",
        intervention,
      });
    } catch (error) {
      console.error("Erreur réponse intervention:", error);
      res.status(500).json({ error: "Erreur enregistrement réponse" });
    }
  }
);

// PUT /api/interventions/:id/satisfaction - Noter une intervention
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
          .json({ error: "Satisfaction doit être entre 1 et 5" });
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
          .json({ error: "Impossible de noter sans réponse" });
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
      res.status(500).json({ error: "Erreur enregistrement satisfaction" });
    }
  }
);

// PUT /api/interventions/:id/archiver - Archiver une intervention
router.put(
  "/:id/archiver",
  authMiddleware,
  requireRole(["admin", "juriste"]),
  async (req, res) => {
    try {
      const interventionId = parseInt(req.params.id);

      const intervention = await prisma.interventions.findUnique({
        where: { id: interventionId },
      });

      if (!intervention) {
        return res.status(404).json({ error: "Intervention non trouvée" });
      }

      if (
        req.user.role === "commune" &&
        intervention.demandeur_id !== req.user.id
      ) {
        return res.status(403).json({ error: "Non autorisé" });
      }

      const interventionArchivee = await prisma.interventions.update({
        where: { id: interventionId },
        data: { date_archivage: new Date() },
      });

      res.json({
        message: "Intervention archivée avec succès",
        intervention: interventionArchivee,
      });
    } catch (error) {
      console.error("Erreur archivage:", error);
      res.status(500).json({ error: "Erreur archivage" });
    }
  }
);

// PUT /api/interventions/archives/:id/restaurer - Restaurer une intervention
router.put(
  "/archives/:id/restaurer",
  authMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const interventionId = parseInt(req.params.id);

      const intervention = await prisma.interventions.findUnique({
        where: { id: interventionId },
        select: { date_archivage: true, notes: true },
      });

      if (!intervention) {
        return res.status(404).json({ error: "Intervention non trouvée" });
      }

      if (!intervention.date_archivage) {
        return res.status(400).json({ error: "Intervention non archivée" });
      }

      const interventionRestoree = await prisma.interventions.update({
        where: { id: interventionId },
        data: {
          date_archivage: null,
          notes: intervention.notes
            ? `${
                intervention.notes
              }\n\n🔓 Restaurée le ${new Date().toLocaleDateString()}`
            : `🔓 Restaurée le ${new Date().toLocaleDateString()}`,
        },
        include: {
          commune: { select: { nom: true } },
          theme: { select: { designation: true } },
          demandeur: { select: { nom: true, prenom: true } },
        },
      });

      res.json({
        message: "Intervention restaurée avec succès",
        intervention: interventionRestoree,
      });
    } catch (error) {
      console.error("Erreur restauration:", error);
      res.status(500).json({ error: "Erreur restauration" });
    }
  }
);

router.get(
  "/stats/dashboard",
  authMiddleware,
  requireRole(["admin", "juriste"]),
  async (req, res) => {
    try {
      const [
        questionsParCommune,
        questionsParTheme,
        satisfactionParStrate,
        interventionsAvecReponse,
      ] = await Promise.all([
        prisma.interventions.groupBy({
          by: ["commune_id"],
          _count: { id: true },
          where: {
            date_question: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
          orderBy: { _count: { id: "desc" } },
        }),
        prisma.interventions.groupBy({
          by: ["theme_id"],
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
        }),
        prisma.$queryRaw`
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
      `,
        prisma.interventions.findMany({
          where: { date_reponse: { not: null } },
          select: { date_question: true, date_reponse: true },
        }),
      ]);

      let totalMs = 0;
      interventionsAvecReponse.forEach((intervention) => {
        totalMs +=
          new Date(intervention.date_reponse) -
          new Date(intervention.date_question);
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
      res
        .status(500)
        .json({ error: "Erreur calcul statistiques", details: error.message });
    }
  }
);

router.get(
  "/archives/stats",
  authMiddleware,
  requireRole(["admin", "juriste"]),
  async (req, res) => {
    try {
      const { periode } = req.query;
      let dateDebut = new Date();

      switch (periode) {
        case "7j":
          dateDebut.setDate(dateDebut.getDate() - 7);
          break;
        case "30j":
          dateDebut.setDate(dateDebut.getDate() - 30);
          break;
        case "90j":
          dateDebut.setDate(dateDebut.getDate() - 90);
          break;
        case "1an":
          dateDebut.setFullYear(dateDebut.getFullYear() - 1);
          break;
        default:
          dateDebut = new Date(0);
      }

      const where = {
        date_archivage: { not: null, gte: periode ? dateDebut : undefined },
      };

      const [
        totalArchives,
        archivesParTheme,
        archivesParMois,
        satisfactionMoyenne,
      ] = await Promise.all([
        prisma.interventions.count({ where }),
        prisma.interventions.groupBy({
          by: ["theme_id"],
          where,
          _count: { id: true },
          _avg: { satisfaction: true },
        }),
        prisma.$queryRaw`
        SELECT DATE_TRUNC('month', date_archivage) as mois, COUNT(*) as count
        FROM "Interventions" 
        WHERE date_archivage IS NOT NULL AND date_archivage >= ${dateDebut}
        GROUP BY DATE_TRUNC('month', date_archivage)
        ORDER BY mois DESC LIMIT 12
      `,
        prisma.interventions.aggregate({
          where: { ...where, satisfaction: { not: null } },
          _avg: { satisfaction: true },
        }),
      ]);

      const archivesParThemeAvecDetails = await Promise.all(
        archivesParTheme.map(async (item) => {
          const theme = await prisma.themes.findUnique({
            where: { id: item.theme_id },
            select: { designation: true },
          });
          return {
            theme: theme?.designation || "Thème inconnu",
            count: item._count.id,
            satisfactionMoyenne: item._avg.satisfaction,
          };
        })
      );

      res.json({
        totalArchives,
        archivesParTheme: archivesParThemeAvecDetails,
        archivesParMois,
        satisfactionMoyenne: satisfactionMoyenne._avg.satisfaction || 0,
        periode: periode || "toutes",
      });
    } catch (error) {
      console.error("Erreur stats archives:", error);
      res.status(500).json({ error: "Erreur calcul statistiques archives" });
    }
  }
);

router.get("/theme/:themeId/similaires", authMiddleware, async (req, res) => {
  try {
    const { themeId } = req.params;

    const interventions = await prisma.interventions.findMany({
      where: { theme_id: parseInt(themeId), reponse: { not: null } },
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

  if (allowedMimes[mimeType]?.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`Type non autorisé: ${mimeType} (${fileExtension})`), false);
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/pieces-jointes";
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
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
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => checkFileType(file, cb),
});

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

      if (!intervention)
        return res.status(404).json({ error: "Intervention non trouvée" });
      if (intervention.demandeur_id !== req.user.id)
        return res.status(403).json({ error: "Accès non autorisé" });

      const piecesJointes = [];
      if (req.files?.length > 0) {
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
      res.status(500).json({ error: "Erreur upload pièces jointes" });
    }
  }
);

router.get("/pieces-jointes/:id", authMiddleware, async (req, res) => {
  try {
    const pieceId = parseInt(req.params.id);
    const pieceJointe = await prisma.piecesJointes.findUnique({
      where: { id: pieceId },
      include: {
        intervention: { include: { demandeur: true, commune: true } },
      },
    });

    if (!pieceJointe)
      return res.status(404).json({ error: "Pièce jointe non trouvée" });

    const user = req.user;
    const intervention = pieceJointe.intervention;
    if (user.role === "commune" && intervention.demandeur_id !== user.id) {
      return res.status(403).json({ error: "Accès non autorisé" });
    }

    if (!fs.existsSync(pieceJointe.chemin)) {
      return res.status(404).json({ error: "Fichier non trouvé" });
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

    res.setHeader(
      "Content-Type",
      mimeTypes[extension] || "application/octet-stream"
    );
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(pieceJointe.nom_original)}"`
    );

    const fileStream = fs.createReadStream(pieceJointe.chemin);
    fileStream.on("error", () => {
      if (!res.headersSent)
        res.status(500).json({ error: "Erreur lecture fichier" });
    });
    fileStream.pipe(res);
  } catch (error) {
    console.error("Erreur téléchargement pièce jointe:", error);
    if (!res.headersSent)
      res.status(500).json({ error: "Erreur téléchargement" });
  }
});

module.exports = router;
