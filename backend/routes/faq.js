const express = require("express");
const { authMiddleware, requireRole } = require("../middleware/auth");
const faqService = require("../services/faqService");
const router = express.Router();

// GET /api/faq - Liste des questions (accessible à tous)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const faqs = await faqService.getAllFaqs(req.query);
    res.json(faqs);
  } catch (error) {
    console.error("Erreur récupération Faq:", error);
    res.status(500).json({ error: "Erreur récupération Faq" });
  }
});

// POST /api/faq/:id/add - Ajouter une intervention à la Faq
router.post(
  "/:id/add",
  authMiddleware,
  requireRole(["admin", "juriste"]),
  async (req, res) => {
    try {
      const intervention = await faqService.addToFaq(req.params.id);
      res.json({
        message: "Question ajoutée à la Faq",
        intervention,
      });
    } catch (error) {
      console.error("Erreur ajout Faq:", error);
      res.status(500).json({ error: "Erreur ajout Faq" });
    }
  }
);

// POST /api/faq/:id/remove - Retirer une intervention de la Faq
router.post(
  "/:id/remove",
  authMiddleware,
  requireRole(["admin", "juriste"]),
  async (req, res) => {
    try {
      await faqService.removeFromFaq(req.params.id);
      res.json({ message: "Question retirée de la Faq" });
    } catch (error) {
      console.error("Erreur retrait Faq:", error);
      res.status(500).json({ error: "Erreur retrait Faq" });
    }
  }
);

// POST /api/faq/create - Créer directement une question Faq
router.post(
  "/create",
  authMiddleware,
  requireRole(["admin", "juriste"]),
  async (req, res) => {
    try {
      const { titre, description, reponse, theme_id } = req.body;

      if (!titre || !reponse || !theme_id) {
        return res.status(400).json({
          error: "Titre, réponse et thème sont obligatoires",
        });
      }

      // Utiliser une commune et utilisateur par défaut pour les questions Faq créées directement
      const faq = await faqService.createFaq({
        titre,
        description,
        reponse,
        theme_id,
        commune_id: 1, // ID d'une commune par défaut
        demandeur_id: req.user.id, // L'utilisateur actuel comme demandeur
        juriste_id: req.user.id, // L'utilisateur actuel comme juriste
      });

      res.status(201).json({
        message: "Faq créée avec succès",
        faq,
      });
    } catch (error) {
      console.error("Erreur création Faq:", error);
      res.status(500).json({ error: "Erreur création Faq" });
    }
  }
);

// POST /api/faq/questions - Créer une question faq directement
router.post(
  "/questions",
  authMiddleware,
  requireRole(["admin", "juriste"]),
  async (req, res) => {
    try {
      const { titre, description, reponse, theme_id } = req.body;

      if (!titre || !description || !reponse || !theme_id) {
        return res.status(400).json({
          error: "Tous les champs sont obligatoires",
        });
      }

      const faqQuestion = await faqService.createFaqQuestion(
        {
          titre,
          description,
          reponse,
          theme_id,
        },
        req.user.id
      );

      res.status(201).json({
        message: "Question Faq créée avec succès",
        question: faqQuestion,
      });
    } catch (error) {
      console.error("Erreur création question Faq:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la création de la question Faq" });
    }
  }
);

module.exports = router;
