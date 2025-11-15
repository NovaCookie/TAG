const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authMiddleware, requireRole } = require("../middleware/auth");
const filterService = require("../services/filterService");
const prisma = new PrismaClient();
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { checkArchived } = require("../middleware/archived");

// GET /api/interventions - Liste des interventions non archivées
router.get("/", authMiddleware, async (req, res) => {
  try {
    const where = filterService.buildInterventionFilters(
      req.query,
      req.user,
      false
    );
    const pagination = filterService.getPaginationOptions(req.query);
    const include = filterService.getIncludeOptions();

    const result = await filterService.findNonArchived(
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

// GET /api/interventions/archives/list - Liste des interventions archivées
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
      const include = filterService.getIncludeOptions();

      const result = await filterService.findArchived(
        where,
        pagination,
        include,
        { date_question: "desc" }
      );

      const stats = await prisma.archive.groupBy({
        by: ["table_name"],
        where: { table_name: "interventions" },
        _count: { id: true },
      });

      const totalArchives = await prisma.archive.count({
        where: { table_name: "interventions" },
      });

      res.json({
        ...result,
        stats: {
          totalArchives,
          archivesParTheme: stats.length,
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
    const interventionId = parseInt(req.params.id);

    const intervention = await prisma.interventions.findUnique({
      where: { id: interventionId },
      include: {
        commune: { select: { nom: true, population: true } },
        theme: { select: { designation: true } },
        demandeur: {
          select: {
            nom: true,
            prenom: true,
            email: true,
          },
        },
        juriste: {
          select: {
            nom: true,
            prenom: true,
            email: true,
          },
        },
        pieces_jointes: true,
      },
    });

    if (!intervention) {
      return res.status(404).json({ error: "Intervention non trouvée" });
    }

    // Vérifier si l'utilisateur a accès
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

// PUT /api/interventions/:id/response - Répondre ou modifier une intervention
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

      // Vérifier que l'intervention existe
      const interventionExistante = await prisma.interventions.findUnique({
        where: { id: parseInt(req.params.id) },
        include: {
          commune: { select: { nom: true } },
          theme: { select: { designation: true } },
          demandeur: {
            select: { nom: true, prenom: true, email: true },
          },
        },
      });

      if (!interventionExistante) {
        return res.status(404).json({ error: "Intervention non trouvée" });
      }

      // Empêcher la modification si l'intervention a déjà une satisfaction
      if (interventionExistante.satisfaction) {
        return res.status(400).json({
          error: "Impossible de modifier une intervention déjà notée",
        });
      }

      // Mettre à jour l'intervention
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
            select: { nom: true, prenom: true, email: true },
          },
          juriste: { select: { nom: true, prenom: true } },
        },
      });

      res.json({
        message: interventionExistante.reponse
          ? "Réponse modifiée avec succès"
          : "Réponse enregistrée avec succès",
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
  checkArchived("communes"),
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

module.exports = router;
