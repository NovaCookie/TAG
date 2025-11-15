const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const emailService = require("../services/emailService");
const router = express.Router();

// GET /api/test/email - Tester l'envoi d'email
router.get("/email", authMiddleware, async (req, res) => {
  try {
    const testUser = {
      prenom: "Test",
      nom: "User",
      email: req.user.email, // Envoyer à l'utilisateur connecté
    };

    const testIntervention = {
      id: 999,
      titre: "Question test sur les notifications",
      description:
        "Ceci est une question de test pour vérifier le système de notifications par email.",
    };

    const testJuriste = {
      prenom: "Jean",
      nom: "Juriste",
    };

    const testCommune = {
      nom: "Commune Test",
    };

    // Test notification nouvelle réponse
    await emailService.sendNewResponseNotification(
      testUser,
      testIntervention,
      testJuriste
    );

    // Test notification nouvelle notation
    await emailService.sendNewRatingNotification(
      testUser,
      testIntervention,
      testCommune,
      4
    );

    res.json({
      message: "Emails de test envoyés avec succès",
      destinataire: req.user.email,
    });
  } catch (error) {
    console.error("Erreur test email:", error);
    res.status(500).json({ error: "Erreur envoi email test" });
  }
});

module.exports = router;
