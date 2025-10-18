const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
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
    res.status(500).json({ error: "Erreur lors de l'inscription" });
  }
});

// Route de connexion
router.post("/login", async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    // Trouver l'utilisateur
    const user = await prisma.utilisateurs.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(mot_de_passe, user.mot_de_passe);

    if (!validPassword) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    // Créer le token JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Connexion réussie",
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
    res.status(500).json({ error: "Erreur lors de la connexion" });
  }
});

//POST /api/auth/forgot-password - Demande de réinitialisation
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email requis" });
    }

    // Vérifier si l'utilisateur existe
    const user = await prisma.utilisateurs.findUnique({
      where: { email },
    });

    // Pour la sécurité, on ne révèle pas si l'email existe ou non
    if (!user) {
      return res.json({
        message:
          "Si cet email existe, un lien de réinitialisation a été envoyé",
      });
    }

    // Générer un token sécurisé
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Date d'expiration (1 heure)
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    // Stocker le token hashé dans la base
    await prisma.utilisateurs.update({
      where: { email },
      data: {
        reset_token: resetTokenHash,
        reset_token_expiry: resetTokenExpiry,
      },
    });

    // Envoyer l'email (simulation pour l'instant)
    const resetUrl = `${
      process.env.FRONTEND_URL
    }/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    console.log("📧 Email de réinitialisation envoyé à:", email);
    console.log("🔗 Lien de réinitialisation:", resetUrl);

    // TODO: Intégrer un vrai service d'email (SendGrid, Mailjet, etc.)
    // await sendResetEmail(email, resetUrl);

    res.json({
      message: "Si cet email existe, un lien de réinitialisation a été envoyé",
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
    const { token, email, newPassword } = req.body;

    if (!token || !email || !newPassword) {
      return res
        .status(400)
        .json({ error: "Token, email et nouveau mot de passe requis" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "Le mot de passe doit faire au moins 6 caractères" });
    }

    // Hasher le token pour comparaison
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Trouver l'utilisateur avec token valide
    const user = await prisma.utilisateurs.findFirst({
      where: {
        email,
        reset_token: resetTokenHash,
        reset_token_expiry: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Token invalide ou expiré" });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Mettre à jour le mot de passe et effacer le token
    await prisma.utilisateurs.update({
      where: { email },
      data: {
        mot_de_passe: hashedPassword,
        reset_token: null,
        reset_token_expiry: null,
      },
    });

    console.log("✅ Mot de passe réinitialisé pour:", email);

    res.json({ message: "Mot de passe réinitialisé avec succès" });
  } catch (error) {
    console.error("Erreur reset-password:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la réinitialisation du mot de passe" });
  }
});

module.exports = router;
