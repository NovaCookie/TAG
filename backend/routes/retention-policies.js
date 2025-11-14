const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authMiddleware } = require("../middleware/auth");
const prisma = new PrismaClient();
const router = express.Router();

// GET /api/retention-policies/theme/:themeId - Récupérer les politiques par thème
router.get("/theme/:themeId", authMiddleware, async (req, res) => {
  try {
    const themeId = parseInt(req.params.themeId);

    if (isNaN(themeId)) {
      return res.status(400).json({ error: "ID de thème invalide" });
    }

    const policies = await prisma.retentionPolicy.findMany({
      where: { theme_id: themeId },
    });

    res.json(policies);
  } catch (error) {
    console.error("Erreur récupération politiques:", error);
    res.status(500).json({ error: "Erreur récupération politiques" });
  }
});

// POST /api/retention-policies - Créer une politique
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { theme_id, duree_mois, description } = req.body;

    if (!theme_id || !duree_mois) {
      return res
        .status(400)
        .json({ error: "theme_id et duree_mois obligatoires" });
    }

    const policy = await prisma.retentionPolicy.create({
      data: {
        theme_id: parseInt(theme_id),
        duree_mois: parseInt(duree_mois),
        description: description || "",
      },
    });

    res.status(201).json(policy);
  } catch (error) {
    console.error("Erreur création politique:", error);
    res.status(500).json({ error: "Erreur création politique" });
  }
});

// PUT /api/retention-policies/:id - Modifier une politique
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID invalide" });
    }

    const { duree_mois, description } = req.body;

    const policy = await prisma.retentionPolicy.update({
      where: { id: id },
      data: {
        duree_mois: duree_mois ? parseInt(duree_mois) : undefined,
        description: description,
      },
    });

    res.json(policy);
  } catch (error) {
    console.error("Erreur modification politique:", error);
    res.status(500).json({ error: "Erreur modification politique" });
  }
});

// DELETE /api/retention-policies/:id - Supprimer une politique
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID invalide" });
    }

    await prisma.retentionPolicy.delete({
      where: { id: id },
    });

    res.json({ message: "Politique supprimée" });
  } catch (error) {
    console.error("Erreur suppression politique:", error);
    res.status(500).json({ error: "Erreur suppression politique" });
  }
});

module.exports = router;
