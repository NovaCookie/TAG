// backend/routes/interventions.js
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authMiddleware, requireRole } = require("../middleware/auth");
const prisma = new PrismaClient();
const router = express.Router();

// GET /api/interventions - Lister les interventions (avec filtres)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { commune, theme, statut, page = 1, limit = 10 } = req.query;

    const where = {};

    // Filtre par commune (pour les communes)
    if (req.user.role === "commune") {
      where.commune_id = req.user.id;
    } else if (commune) {
      where.commune_id = parseInt(commune);
    }

    // Filtre par thème
    if (theme) {
      where.theme_id = parseInt(theme);
    }

    // Filtre par statut (répondu/non répondu)
    if (statut === "repondu") {
      where.NOT = { reponse: null };
    } else if (statut === "en_attente") {
      where.reponse = null;
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
      intervention.commune_id !== req.user.id
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
        commune_id: utilisateur.commune_id, // La commune de l'utilisateur connecté
        demandeur_id: req.user.id, // L'utilisateur qui pose la question
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

      if (!intervention || intervention.commune_id !== req.user.id) {
        return res
          .status(404)
          .json({ error: "Intervention non trouvée ou accès non autorisé" });
      }

      if (!intervention.reponse) {
        return res
          .status(400)
          .json({ error: "Impossible de noter une intervention sans réponse" });
      }

      const updatedIntervention = await prisma.interventions.update({
        where: { id: parseInt(req.params.id) },
        data: { satisfaction: parseInt(satisfaction) },
        include: {
          commune: { select: { nom: true } },
          juriste: { select: { nom: true, prenom: true } },
        },
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

module.exports = router;
