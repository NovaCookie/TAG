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
      const interventionId = parseInt(req.params.id);

      console.log(
        `[FAQ] Requête d'ajout pour l'intervention ${interventionId} par l'utilisateur ${req.user.id}`
      );

      if (isNaN(interventionId)) {
        return res.status(400).json({ error: "ID d'intervention invalide" });
      }

      const intervention = await faqService.publishAsFaq(
        interventionId,
        req.user.id
      );

      console.log(
        `[FAQ] Succès - Intervention ${interventionId} ajoutée à la FAQ`
      );

      res.json({
        message: "Question ajoutée à la Faq",
        intervention,
      });
    } catch (error) {
      console.error("[FAQ] Erreur ajout Faq:", error);

      // Messages d'erreur plus spécifiques
      if (error.message.includes("non trouvée")) {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes("sans réponse")) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes("déjà en FAQ")) {
        return res.status(400).json({ error: error.message });
      }

      // Erreur Prisma spécifique
      if (error.code) {
        console.error(`[FAQ] Code d'erreur Prisma: ${error.code}`);

        if (error.code === "P2025") {
          return res.status(404).json({ error: "Intervention non trouvée" });
        }
        if (error.code === "P2002") {
          return res
            .status(400)
            .json({ error: "Violation de contrainte unique" });
        }
        if (error.code === "P2003") {
          return res.status(400).json({ error: "Violation de clé étrangère" });
        }
      }

      res.status(500).json({
        error: "Erreur lors de l'ajout à la FAQ",
        details:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Erreur interne du serveur",
      });
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
      const interventionId = parseInt(req.params.id);

      console.log(
        `[FAQ] Requête de retrait pour l'intervention ${interventionId}`
      );

      if (isNaN(interventionId)) {
        return res.status(400).json({ error: "ID d'intervention invalide" });
      }

      await faqService.unpublishFromFaq(interventionId);

      console.log(
        `[FAQ] Succès - Intervention ${interventionId} retirée de la FAQ`
      );

      res.json({
        message: "Question retirée de la Faq",
        interventionId,
      });
    } catch (error) {
      console.error("[FAQ] Erreur retrait Faq:", error);

      if (error.message.includes("non trouvée")) {
        return res.status(404).json({ error: error.message });
      }

      // Erreur Prisma spécifique
      if (error.code) {
        console.error(`[FAQ] Code d'erreur Prisma: ${error.code}`);

        if (error.code === "P2025") {
          return res.status(404).json({ error: "Intervention non trouvée" });
        }
      }

      res.status(500).json({
        error: "Erreur lors du retrait de la FAQ",
        details:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Erreur interne du serveur",
      });
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

      const faq = await faqService.createFaqQuestion(
        {
          titre,
          description,
          reponse,
          theme_id,
        },
        req.user.id
      );

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

router.get("/test-intervention/:id", authMiddleware, async (req, res) => {
  try {
    const interventionId = parseInt(req.params.id);
    const intervention = await prisma.interventions.findUnique({
      where: { id: interventionId },
      include: {
        theme: true,
        juriste: true,
        demandeur: true,
        commune: true,
      },
    });

    res.json({
      intervention,
      exists: !!intervention,
      hasResponse: !!intervention?.reponse,
      hasJuriste: !!intervention?.juriste_id,
      isAlreadyFAQ: intervention?.est_faq,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
