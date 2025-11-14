const express = require("express");
const { authMiddleware, requireRole } = require("../middleware/auth");
const retentionService = require("../services/retentionService");
const router = express.Router();

// GET /api/test/auto-archive - Tester manuellement l'archivage automatique
router.get(
  "/auto-archive",
  authMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const result = await retentionService.testAutoArchive();
      res.json({
        message: "Test d'archivage automatique terminé",
        ...result,
      });
    } catch (error) {
      console.error("Erreur test archivage:", error);
      res.status(500).json({ error: "Erreur test archivage" });
    }
  }
);

// POST /api/test/force-archive/:id - Forcer l'archivage d'une intervention
router.post(
  "/force-archive/:id",
  authMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { raison } = req.body;

      const result = await retentionService.forceArchiveIntervention(
        parseInt(id),
        raison || "Archivage manuel de test"
      );

      res.json(result);
    } catch (error) {
      console.error("Erreur archivage forcé:", error);
      res.status(500).json({ error: "Erreur archivage forcé" });
    }
  }
);

module.exports = router;

//  $headers = @{
// >>     "Authorization" = "Mon bearer token"
// >>     "Content-Type" = "application/json"
// >> }

//Invoke-RestMethod -Uri "http://localhost:5000/api/test/auto-archive" -Method GET -Headers $headers
