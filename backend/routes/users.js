const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authMiddleware, requireRole } = require("../middleware/auth");
const prisma = new PrismaClient();
const router = express.Router();
const emailService = require("../services/emailService");

// GET /api/users - Liste des utilisateurs (Admin seulement)
router.get("/", authMiddleware, requireRole(["admin"]), async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 10 } = req.query;

    const where = {};

    // Filtre par statut actif/inactif
    if (status && status !== "all") {
      where.actif = status === "active";
    }

    // Filtre par rôle
    if (role && role !== "all") {
      where.role = role;
    }

    // Filtre recherche (nom, prénom, email)
    if (search && search.trim() !== "") {
      where.OR = [
        { nom: { contains: search, mode: "insensitive" } },
        { prenom: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.utilisateurs.findMany({
      where,
      include: {
        commune: {
          select: {
            nom: true,
            population: true,
          },
        },
      },
      orderBy: { date_creation: "desc" },
      skip: (page - 1) * limit,
      take: parseInt(limit),
    });

    const total = await prisma.utilisateurs.count({ where });

    // Formater la réponse pour le frontend
    const usersFormatted = users.map((user) => ({
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
      actif: user.actif,
      date_creation: user.date_creation,
      commune: user.commune,
      avatar: `${user.prenom?.[0] || ""}${user.nom?.[0] || ""}`,
      status: user.actif ? "online" : "offline",
    }));

    res.json({
      users: usersFormatted,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur liste utilisateurs:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des utilisateurs" });
  }
});

// GET /api/users/stats - Statistiques utilisateurs
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

      // Statistiques par rôle
      const statsParRole = await prisma.utilisateurs.groupBy({
        by: ["role"],
        where: {
          actif: true,
        },
        _count: {
          id: true,
        },
      });

      // Formater les données
      const stats = {
        totalCommunes: communesActives,
        totalUtilisateurs: totalUtilisateurs,
        parRole: statsParRole.reduce((acc, item) => {
          acc[item.role] = item._count.id;
          return acc;
        }, {}),
      };

      res.json(stats);
    } catch (error) {
      console.error("Erreur stats utilisateurs:", error);
      res.status(500).json({ error: "Erreur calcul stats utilisateurs" });
    }
  }
);

// GET /api/users/communes/list - Liste des communes pour les filtres
router.get("/communes/list", authMiddleware, async (req, res) => {
  try {
    const communes = await prisma.communes.findMany({
      where: { actif: true },
      select: {
        id: true,
        code_postal: true,
        nom: true,
        population: true,
        actif: true,
      },
      orderBy: { nom: "asc" },
    });

    res.json(communes);
  } catch (error) {
    console.error("Erreur chargement communes:", error);
    res.status(500).json({ error: "Erreur lors du chargement des communes" });
  }
});

// GET /api/users/:id - Détail d'un utilisateur
router.get("/:id", authMiddleware, requireRole(["admin"]), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await prisma.utilisateurs.findUnique({
      where: { id: userId },
      include: {
        commune: {
          select: {
            id: true,
            nom: true,
            population: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    res.json(user);
  } catch (error) {
    console.error("Erreur détail utilisateur:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération de l'utilisateur" });
  }
});

// POST /api/users - Créer un utilisateur
router.post("/", authMiddleware, requireRole(["admin"]), async (req, res) => {
  try {
    const {
      nom,
      prenom,
      email,
      role,
      commune_id,
      mot_de_passe,
      envoyerEmail = true,
    } = req.body;

    // Validation des données requises
    if (!nom || !prenom || !email || !role || !mot_de_passe) {
      return res
        .status(400)
        .json({ error: "Tous les champs obligatoires doivent être remplis" });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.utilisateurs.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Cet email est déjà utilisé" });
    }

    // Hasher le mot de passe
    const bcrypt = require("bcrypt");
    const saltRounds = 10;
    const motDePasseHash = await bcrypt.hash(mot_de_passe, saltRounds);

    // Créer l'utilisateur
    const user = await prisma.utilisateurs.create({
      data: {
        nom,
        prenom,
        email,
        role,
        commune_id: role === "commune" ? parseInt(commune_id) : null,
        mot_de_passe: motDePasseHash,
        actif: true,
      },
      include: {
        commune: {
          select: {
            nom: true,
          },
        },
      },
    });

    // Envoyer l'email de bienvenue si demandé
    if (envoyerEmail) {
      try {
        await emailService.sendWelcomeEmail(user);
      } catch (emailError) {
        console.error("Erreur envoi email bienvenue:", emailError);
        // On continue même si l'email échoue
      }
    }

    res.status(201).json({
      message: envoyerEmail
        ? "Utilisateur créé avec succès et email de bienvenue envoyé"
        : "Utilisateur créé avec succès",
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        actif: user.actif,
        commune: user.commune,
      },
    });
  } catch (error) {
    console.error("Erreur création utilisateur:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la création de l'utilisateur" });
  }
});

// PUT /api/users/:id - Modifier complètement un utilisateur (NOUVEAU)
router.put("/:id", authMiddleware, requireRole(["admin"]), async (req, res) => {
  try {
    const { nom, prenom, email, role, commune_id, actif } = req.body;
    const userId = parseInt(req.params.id);

    // Vérifier que l'utilisateur existe
    const utilisateurExistant = await prisma.utilisateurs.findUnique({
      where: { id: userId },
    });

    if (!utilisateurExistant) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Vérifier si le nouvel email est déjà utilisé par un autre utilisateur
    if (email && email !== utilisateurExistant.email) {
      const emailUtilise = await prisma.utilisateurs.findUnique({
        where: { email },
      });

      if (emailUtilise && emailUtilise.id !== userId) {
        return res.status(400).json({ error: "Cet email est déjà utilisé" });
      }
    }

    // Préparer les données de mise à jour
    const updateData = {
      nom: nom || utilisateurExistant.nom,
      prenom: prenom || utilisateurExistant.prenom,
      email: email || utilisateurExistant.email,
      role: role || utilisateurExistant.role,
      actif: actif !== undefined ? actif : utilisateurExistant.actif,
    };

    // Gestion de la commune selon le rôle
    if (role === "commune") {
      if (!commune_id) {
        return res.status(400).json({
          error:
            "Une commune doit être associée aux utilisateurs de type 'commune'",
        });
      }
      updateData.commune_id = parseInt(commune_id);
    } else {
      updateData.commune_id = null;
    }

    // Mettre à jour l'utilisateur
    const utilisateur = await prisma.utilisateurs.update({
      where: { id: userId },
      data: updateData,
      include: {
        commune: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
    });

    res.json({
      message: "Utilisateur modifié avec succès",
      user: {
        id: utilisateur.id,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        role: utilisateur.role,
        actif: utilisateur.actif,
        commune: utilisateur.commune,
      },
    });
  } catch (error) {
    console.error("Erreur modification utilisateur:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la modification de l'utilisateur" });
  }
});

// PUT /api/users/:id/email - Modifier l'email
router.put(
  "/:id/email",
  authMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { email } = req.body;
      const userId = parseInt(req.params.id);

      // Vérifier que l'utilisateur existe
      const utilisateurExistant = await prisma.utilisateurs.findUnique({
        where: { id: userId },
      });

      if (!utilisateurExistant) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      // Vérifier si le nouvel email est déjà utilisé
      const emailUtilise = await prisma.utilisateurs.findUnique({
        where: { email },
      });

      if (emailUtilise && emailUtilise.id !== userId) {
        return res.status(400).json({ error: "Cet email est déjà utilisé" });
      }

      // Générer un token de confirmation
      const crypto = require("crypto");
      const tokenConfirmation = crypto.randomBytes(32).toString("hex");
      const dateExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures

      // Stocker l'email temporaire et le token
      await prisma.utilisateurs.update({
        where: { id: userId },
        data: {
          email_temp: email,
          email_confirmation_token: tokenConfirmation,
          email_confirmation_expiry: dateExpiration,
        },
      });

      // Envoyer l'email de confirmation
      try {
        await emailService.sendEmailConfirmation({
          user: utilisateurExistant,
          newEmail: email,
          confirmationToken: tokenConfirmation,
        });
      } catch (emailError) {
        console.error("Erreur envoi email confirmation:", emailError);
        return res.status(500).json({
          error: "Erreur lors de l'envoi de l'email de confirmation",
        });
      }

      res.json({
        message:
          "Email de confirmation envoyé. L'utilisateur doit confirmer sa nouvelle adresse.",
        requiresConfirmation: true,
      });
    } catch (error) {
      console.error("Erreur modification email:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la modification de l'email" });
    }
  }
);

// GET /api/users/confirm-email/:token - Confirmer un email
router.get("/confirm-email/:token", async (req, res) => {
  try {
    const token = req.params.token;

    const utilisateur = await prisma.utilisateurs.findFirst({
      where: {
        email_confirmation_token: token,
        email_confirmation_expiry: {
          gt: new Date(),
        },
      },
    });

    if (!utilisateur) {
      return res.status(400).json({ error: "Token invalide ou expiré" });
    }

    if (!utilisateur.email_temp) {
      return res
        .status(400)
        .json({ error: "Aucun email en attente de confirmation" });
    }

    // Mettre à jour l'email définitif
    await prisma.utilisateurs.update({
      where: { id: utilisateur.id },
      data: {
        email: utilisateur.email_temp,
        email_temp: null,
        email_confirmation_token: null,
        email_confirmation_expiry: null,
      },
    });

    res.json({
      message: "Email confirmé avec succès",
      newEmail: utilisateur.email_temp,
    });
  } catch (error) {
    console.error("Erreur confirmation email:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la confirmation de l'email" });
  }
});

// PUT /api/users/:id/password - Modifier le mot de passe
router.put(
  "/:id/password",
  authMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { nouveauMotDePasse, envoyerEmail } = req.body;
      const userId = parseInt(req.params.id);

      // Vérifier que l'utilisateur existe
      const utilisateur = await prisma.utilisateurs.findUnique({
        where: { id: userId },
      });

      if (!utilisateur) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      // Hasher le nouveau mot de passe
      const bcrypt = require("bcrypt");
      const saltRounds = 10;
      const motDePasseHash = await bcrypt.hash(nouveauMotDePasse, saltRounds);

      // Mettre à jour le mot de passe
      await prisma.utilisateurs.update({
        where: { id: userId },
        data: {
          mot_de_passe: motDePasseHash,
        },
      });

      // Envoyer l'email de notification si demandé
      if (envoyerEmail) {
        try {
          await emailService.sendPasswordChangedNotification(utilisateur);
        } catch (emailError) {
          console.error("Erreur envoi notification mot de passe:", emailError);
          // On continue même si l'email échoue
        }
      }

      res.json({
        message: envoyerEmail
          ? "Mot de passe modifié et notification envoyée"
          : "Mot de passe modifié avec succès",
      });
    } catch (error) {
      console.error("Erreur modification mot de passe:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la modification du mot de passe" });
    }
  }
);

// PUT /api/users/:id/infos - Modifier les informations basiques
router.put(
  "/:id/infos",
  authMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { nom, prenom } = req.body;
      const userId = parseInt(req.params.id);

      // Vérifier que l'utilisateur existe
      const utilisateurExistant = await prisma.utilisateurs.findUnique({
        where: { id: userId },
      });

      if (!utilisateurExistant) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      // Mettre à jour les informations
      const utilisateur = await prisma.utilisateurs.update({
        where: { id: userId },
        data: {
          nom: nom || utilisateurExistant.nom,
          prenom: prenom || utilisateurExistant.prenom,
        },
      });

      res.json({
        message: "Informations mises à jour avec succès",
        user: {
          id: utilisateur.id,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          email: utilisateur.email,
        },
      });
    } catch (error) {
      console.error("Erreur modification informations:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la modification des informations" });
    }
  }
);

// PATCH /api/users/:id/toggle-status - Activer/Désactiver un utilisateur
router.patch(
  "/:id/toggle-status",
  authMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      // Vérifier que l'utilisateur existe
      const utilisateur = await prisma.utilisateurs.findUnique({
        where: { id: userId },
      });

      if (!utilisateur) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      // Inverser le statut actif
      const updatedUser = await prisma.utilisateurs.update({
        where: { id: userId },
        data: {
          actif: !utilisateur.actif,
        },
      });

      res.json({
        message: `Utilisateur ${
          updatedUser.actif ? "activé" : "désactivé"
        } avec succès`,
        user: {
          id: updatedUser.id,
          actif: updatedUser.actif,
        },
      });
    } catch (error) {
      console.error("Erreur changement statut utilisateur:", error);
      res
        .status(500)
        .json({
          error: "Erreur lors du changement de statut de l'utilisateur",
        });
    }
  }
);

module.exports = router;
