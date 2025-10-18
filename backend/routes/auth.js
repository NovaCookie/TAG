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

module.exports = router;
