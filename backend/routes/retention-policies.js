const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authMiddleware, requireRole } = require("../middleware/auth");
const prisma = new PrismaClient();
const router = express.Router();

// GET /api/retention-policies/theme/:themeId - Politiques d'un thème
router.get("/theme/:themeId", authMiddleware, async (req, res) => {
  try {
    const policies = await prisma.retentionPolicy.findMany({
      where: { theme_id: parseInt(req.params.themeId) },
      orderBy: { duree_mois: "desc" },
    });
    res.json(policies);
  } catch (error) {
    console.error("Erreur récupération politiques:", error);
    res.status(500).json({ error: "Erreur récupération politiques" });
  }
});

// POST /api/retention-policies - Créer une politique
router.post(
  "/",
  authMiddleware,
  requireRole(["admin", "juriste"]),
  async (req, res) => {
    try {
      const { theme_id, duree_mois, description } = req.body;

      const policy = await prisma.retentionPolicy.create({
        data: { theme_id, duree_mois, description },
      });

      res.status(201).json(policy);
    } catch (error) {
      console.error("Erreur création politique:", error);
      res.status(500).json({ error: "Erreur création politique" });
    }
  }
);

module.exports = router;
