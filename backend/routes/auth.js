const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const emailService = require("../services/emailService");
const archiveService = require("../services/archiveService"); // IMPORTANT
const prisma = new PrismaClient();
const router = express.Router();

// Route d'inscription
router.post("/register", async (req, res) => {
  try {
    const { nom, prenom, email, mot_de_passe, role, commune_id } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.utilisateurs.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Cet email est déjà utilisé" });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(mot_de_passe, 12);

    // Créer l'utilisateur
    const user = await prisma.utilisateurs.create({
      data: {
        nom,
        prenom,
        email,
        mot_de_passe: hashedPassword,
        role,
        commune_id: role === "commune" ? commune_id : null,
      },
    });

    // Créer le token JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    try {
      await emailService.sendWelcomeEmail(user);
    } catch (emailError) {
      console.error("Erreur envoi email bienvenue:", emailError);
    }

    res.status(201).json({
      message: "Utilisateur créé avec succès",
      token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Erreur inscription:", error);
    res.status(500).json({ error: "Erreur lors de l'inscription" });
  }
});

// Route de connexion - CRITIQUE : Vérification archivage
router.post("/login", async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    console.log("🔐 Tentative connexion:", email);

    // Trouver l'utilisateur
    const user = await prisma.utilisateurs.findUnique({
      where: { email },
    });

    if (!user) {
      console.log("❌ Utilisateur non trouvé:", email);
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    // VÉRIFICATION CRITIQUE : Vérifier si l'utilisateur est archivé
    const archiveStatus = await archiveService.checkArchiveStatus(
      "utilisateurs",
      user.id
    );
    if (archiveStatus.archived) {
      console.log("🚫 Utilisateur archivé tentant de se connecter:", email);
      return res.status(410).json({
        error: "Compte archivé. Accès refusé.",
        archive_date: archiveStatus.archive_date,
      });
    }

    // Vérifier si le compte est actif
    if (!user.actif) {
      console.log("❌ Compte désactivé:", email);
      return res
        .status(401)
        .json({ error: "Compte désactivé. Contactez l'administrateur." });
    }

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(mot_de_passe, user.mot_de_passe);

    if (!validPassword) {
      console.log("❌ Mot de passe incorrect pour:", email);
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    // Créer le token JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    console.log("✅ Connexion réussie pour:", email);

    res.json({
      message: "Connexion réussie",
      token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        commune_id: user.commune_id,
      },
    });
  } catch (error) {
    console.error("❌ Erreur connexion:", error);
    res.status(500).json({ error: "Erreur lors de la connexion" });
  }
});

// POST /api/auth/forgot-password - Demande de réinitialisation
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "L'email est requis" });
    }

    // Trouver l'utilisateur
    const user = await prisma.utilisateurs.findUnique({
      where: { email },
    });

    // Ne pas révéler si l'email existe ou non
    if (!user) {
      return res.json({
        message: "Si l'email existe, un lien de réinitialisation a été envoyé",
      });
    }

    // Vérifier si l'utilisateur est archivé
    const archiveStatus = await archiveService.checkArchiveStatus(
      "utilisateurs",
      user.id
    );
    if (archiveStatus.archived) {
      return res.json({
        message: "Si l'email existe, un lien de réinitialisation a été envoyé",
      });
    }

    // Générer un token sécurisé
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    // Sauvegarder le token dans la base
    await prisma.utilisateurs.update({
      where: { id: user.id },
      data: {
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry,
      },
    });

    // envoie email avec resend
    const emailResult = await emailService.sendPasswordResetEmail(
      user,
      resetToken
    );

    if (!emailResult.success) {
      console.error("Erreur envoi email :", emailResult.error);
    }

    res.json({
      message: "Si l'email existe, un lien de réinitialisation a été envoyé",
    });
  } catch (error) {
    console.error("Erreur forgot-password:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la demande de réinitialisation" });
  }
});

// POST /api/auth/reset-password - Réinitialisation du mot de passe
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        error: "Le token et le nouveau mot de passe sont requis",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: "Le mot de passe doit faire au moins 6 caractères",
      });
    }

    const user = await prisma.utilisateurs.findFirst({
      where: {
        reset_token: token,
        reset_token_expiry: {
          gt: new Date(), // Vérifier que le token n'a pas expiré
        },
      },
    });

    if (!user) {
      return res.status(400).json({
        error: "Token invalide ou expiré",
      });
    }

    // Vérifier si l'utilisateur est archivé
    const archiveStatus = await archiveService.checkArchiveStatus(
      "utilisateurs",
      user.id
    );
    if (archiveStatus.archived) {
      return res.status(410).json({
        error: "Compte archivé. Réinitialisation impossible.",
      });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Mettre à jour le mot de passe et effacer le token
    await prisma.utilisateurs.update({
      where: { id: user.id },
      data: {
        mot_de_passe: hashedPassword,
        reset_token: null,
        reset_token_expiry: null,
      },
    });

    res.json({
      message: "Mot de passe réinitialisé avec succès",
    });
  } catch (error) {
    console.error("Erreur reset-password:", error);
    res.status(500).json({ error: "Erreur lors de la réinitialisation" });
  }
});

module.exports = router;
