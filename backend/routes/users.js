const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authMiddleware, requireRole } = require("../middleware/auth");
const prisma = new PrismaClient();
const router = express.Router();

router.get(
  "/stats",
  authMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      // Compter TOUS les utilisateurs actifs
      const totalUtilisateurs = await prisma.utilisateurs.count({
        where: {
          actif: true,
        },
      });

      // Compter les communes actives
      const communesActives = await prisma.communes.count({
        where: {
          actif: true,
        },
      });

      // Formater les données
      const stats = {
        totalCommunes: communesActives,
        totalUtilisateurs: totalUtilisateurs,
      };

      res.json(stats);
    } catch (error) {
      console.error("Erreur stats utilisateurs:", error);
      res.status(500).json({ error: "Erreur calcul stats utilisateurs" });
    }
  }
);

module.exports = router;
