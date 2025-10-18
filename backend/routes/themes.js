const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authMiddleware, requireRole } = require("../middleware/auth");
const prisma = new PrismaClient();
const router = express.Router();

// GET /api/themes - Liste des thèmes actifs
router.get("/", authMiddleware, async (req, res) => {
  try {
    const themes = await prisma.themes.findMany({
      where: { actif: true },
      orderBy: { designation: "asc" },
    });
    res.json(themes);
  } catch (error) {
    res.status(500).json({ error: "Erreur récupération thèmes" });
  }
});

// POST /api/themes - Créer un thème (admin seulement)
router.post("/", authMiddleware, requireRole(["admin"]), async (req, res) => {
  try {
    const { designation } = req.body;
    const theme = await prisma.themes.create({
      data: { designation },
    });
    res.status(201).json(theme);
  } catch (error) {
    res.status(500).json({ error: "Erreur création thème" });
  }
});

module.exports = router;
