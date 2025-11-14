// routes/themes.js
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authMiddleware, requireRole } = require("../middleware/auth");
const ThemesService = require("../services/themesService");
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/themes - Récupère tous les thèmes actifs
router.get("/", authMiddleware, async (req, res) => {
  try {
    const themes = await ThemesService.getAllActiveThemes();
    res.json(themes);
  } catch (error) {
    console.error("Erreur récupération thèmes:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des thèmes" });
  }
});

// GET /api/themes/all - Récupère tous les thèmes (même inactifs)
router.get("/all", authMiddleware, async (req, res) => {
  try {
    const themes = await ThemesService.getAllThemes();
    res.json(themes);
  } catch (error) {
    console.error("Erreur récupération tous les thèmes:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des thèmes" });
  }
});

// GET /api/themes/:id - Récupérer un thème par son ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const themeId = parseInt(req.params.id);

    // Validation de l'ID
    if (isNaN(themeId)) {
      return res.status(400).json({ error: "ID de thème invalide" });
    }

    const theme = await prisma.themes.findUnique({
      where: { id: themeId },
    });

    if (!theme) {
      return res.status(404).json({ error: "Thème non trouvé" });
    }

    res.json(theme);
  } catch (error) {
    console.error("Erreur récupération thème:", error);
    res.status(500).json({ error: "Erreur récupération thème" });
  }
});

// POST /api/themes - Créer un nouveau thème
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { designation, actif = true } = req.body; // Ajout de actif avec valeur par défaut

    if (!designation || designation.trim() === "") {
      return res.status(400).json({ error: "La désignation est obligatoire" });
    }

    const theme = await ThemesService.createTheme(designation.trim(), actif);

    res.status(201).json({
      message: "Thème créé avec succès",
      theme,
    });
  } catch (error) {
    if (error.message === "Ce thème existe déjà") {
      return res.status(400).json({ error: error.message });
    }
    console.error("Erreur création thème:", error);
    res.status(500).json({ error: "Erreur lors de la création du thème" });
  }
});

// PUT /api/themes/:id - Modifier un thème
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const themeId = parseInt(req.params.id);

    // Validation de l'ID
    if (isNaN(themeId)) {
      return res.status(400).json({ error: "ID de thème invalide" });
    }

    const { designation, actif } = req.body;

    const theme = await ThemesService.updateTheme(themeId, {
      designation,
      actif,
    });

    res.json({
      message: "Thème modifié avec succès",
      theme,
    });
  } catch (error) {
    console.error("Erreur modification thème:", error);
    res.status(500).json({ error: "Erreur lors de la modification du thème" });
  }
});

// DELETE /api/themes/:id - Supprimer un thème (Admin seulement)
router.delete(
  "/:id",
  authMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const themeId = parseInt(req.params.id);

      if (isNaN(themeId)) {
        return res.status(400).json({ error: "ID de thème invalide" });
      }

      // Vérifier si le thème existe
      const theme = await prisma.themes.findUnique({
        where: { id: themeId },
      });

      if (!theme) {
        return res.status(404).json({ error: "Thème non trouvé" });
      }

      // Vérifier si le thème est utilisé dans des interventions
      const interventionsCount = await prisma.interventions.count({
        where: { theme_id: themeId },
      });

      if (interventionsCount > 0) {
        return res.status(400).json({
          error: `Impossible de supprimer ce thème car il est utilisé par ${interventionsCount} intervention(s). Désactivez-le plutôt.`,
        });
      }

      // Supprimer les politiques de rétention associées
      await prisma.retentionPolicy.deleteMany({
        where: { theme_id: themeId },
      });

      // Supprimer le thème
      await prisma.themes.delete({
        where: { id: themeId },
      });

      res.json({
        message: "Thème supprimé avec succès",
        deletedThemeId: themeId,
      });
    } catch (error) {
      console.error("Erreur suppression thème:", error);
      res.status(500).json({ error: "Erreur lors de la suppression du thème" });
    }
  }
);

module.exports = router;
