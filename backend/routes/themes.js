const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const ThemesService = require("../services/themesService");
const router = express.Router();

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

// POST /api/themes - Créer un nouveau thème
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { designation } = req.body;

    if (!designation || designation.trim() === "") {
      return res.status(400).json({ error: "La désignation est obligatoire" });
    }

    const theme = await ThemesService.createTheme(designation);

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
    const { id } = req.params;
    const { designation, actif } = req.body;

    const theme = await ThemesService.updateTheme(id, {
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

module.exports = router;
