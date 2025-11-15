const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const suggestionService = require("../services/suggestionService");
const router = express.Router();

// GET /api/suggestions/interventions/:id/similar - Questions similaires pour une intervention existante
router.get("/interventions/:id/similar", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit } = req.query;

    const similarInterventions =
      await suggestionService.findSimilarInterventions(
        parseInt(id),
        limit ? parseInt(limit) : 5
      );

    res.json({
      similarInterventions,
      count: similarInterventions.length,
    });
  } catch (error) {
    console.error("Erreur recherche questions similaires:", error);
    res.status(500).json({
      error: "Erreur lors de la recherche de questions similaires",
      details: error.message,
    });
  }
});

// GET /api/suggestions/interventions/:id/similar/count - Nombre de questions similaires
router.get(
  "/interventions/:id/similar/count",
  authMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      const count = await suggestionService.countSimilarInterventions(
        parseInt(id)
      );

      res.json({ count });
    } catch (error) {
      console.error("Erreur comptage questions similaires:", error);
      res.status(500).json({
        error: "Erreur lors du comptage des questions similaires",
        details: error.message,
      });
    }
  }
);

// POST /api/suggestions/interventions/similar - Questions similaires pour une nouvelle question (avant création)
router.post("/interventions/similar", authMiddleware, async (req, res) => {
  try {
    const { titre, theme_id, limit } = req.body;

    if (!titre || !theme_id) {
      return res.status(400).json({
        error: "Le titre et le thème sont obligatoires",
      });
    }

    const similarInterventions =
      await suggestionService.findSimilarForNewQuestion(
        titre,
        parseInt(theme_id),
        limit || 5
      );

    res.json({
      similarInterventions,
      count: similarInterventions.length,
      hasSimilar: similarInterventions.length > 0,
    });
  } catch (error) {
    console.error("Erreur recherche similarités nouvelle question:", error);
    res.status(500).json({
      error: "Erreur lors de la recherche de questions similaires",
      details: error.message,
    });
  }
});

module.exports = router;
