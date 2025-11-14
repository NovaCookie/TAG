const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authMiddleware, requireRole } = require("../middleware/auth");
const prisma = new PrismaClient();
const router = express.Router();
const archiveService = require("../services/archiveService");
const emailService = require("../services/emailService");
const { checkArchived, checkUserArchived } = require("../middleware/archived");
const bcrypt = require("bcryptjs");

// GET /api/users - Liste des utilisateurs (Admin seulement)
router.get("/", authMiddleware, requireRole(["admin"]), async (req, res) => {
  try {
    const { search, role, page = 1, limit = 10 } = req.query;

    const where = {};

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

    // Exclure les utilisateurs archivés
    const archivesUtilisateurs = await prisma.archive.findMany({
      where: { table_name: "utilisateurs" },
      select: { entity_id: true },
    });
    const idsUtilisateursArchives = archivesUtilisateurs.map(
      (archive) => archive.entity_id
    );

    if (idsUtilisateursArchives.length > 0) {
      where.id = { notIn: idsUtilisateursArchives };
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
      date_creation: user.date_creation,
      commune: user.commune,
      avatar: `${user.prenom?.[0] || ""}${user.nom?.[0] || ""}`,
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
    res.status(500).json({ error: "Erreur récupération utilisateurs" });
  }
});

// GET /api/users/communes/list - Liste des communes pour les filtres
router.get("/communes/list", authMiddleware, async (req, res) => {
  try {
    const archivesCommunes = await prisma.archive.findMany({
      where: { table_name: "communes" },
      select: { entity_id: true },
    });
    const idsCommunesArchives = archivesCommunes.map(
      (archive) => archive.entity_id
    );

    const where = {};
    if (idsCommunesArchives.length > 0) {
      where.id = { notIn: idsCommunesArchives };
    }

    const communes = await prisma.communes.findMany({
      where,
      select: {
        id: true,
        code_postal: true,
        nom: true,
        population: true,
      },
      orderBy: { nom: "asc" },
    });

    res.json(communes);
  } catch (error) {
    console.error("Erreur chargement communes:", error);
    res.status(500).json({ error: "Erreur chargement communes" });
  }
});

// GET /api/users/:id - Détail d'un utilisateur
router.get("/:id", authMiddleware, requireRole(["admin"]), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Utiliser ArchiveService pour vérifier le statut
    const archiveStatus = await archiveService.checkArchiveStatus(
      "utilisateurs",
      userId
    );

    // Si archivé, récupérer depuis les données d'archive
    if (archiveStatus.archived && archiveStatus.archive) {
      const userData = archiveStatus.archive.entity_data;
      return res.json({
        ...userData,
        archived: true,
        archive_info: {
          date_archivage: archiveStatus.archive.date_archivage,
          archived_by: archiveStatus.archive.archived_by,
          raison: archiveStatus.archive.raison,
        },
      });
    }

    // Sinon, récupérer normalement depuis la table utilisateurs
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

    res.json({
      ...user,
      archived: false,
    });
  } catch (error) {
    console.error("Erreur détail utilisateur:", error);
    res.status(500).json({ error: "Erreur récupération utilisateur" });
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
        commune: user.commune,
      },
    });
  } catch (error) {
    console.error("Erreur création utilisateur:", error);
    res.status(500).json({ error: "Erreur création utilisateur" });
  }
});

// PUT /api/users/:id - Modifier complètement un utilisateur (Admin seulement)
router.put(
  "/:id",
  authMiddleware,
  requireRole(["admin"]),
  checkArchived("utilisateurs"),
  async (req, res) => {
    try {
      const {
        nom,
        prenom,
        email,
        role,
        commune_id,
        actif,
        mot_de_passe,
        envoyerEmail = false,
      } = req.body;
      const userId = parseInt(req.params.id);

      // Vérifier que l'utilisateur existe et n'est pas archivé
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

      // Gestion du mot de passe
      let passwordChanged = false;
      if (mot_de_passe && mot_de_passe.trim() !== "") {
        const saltRounds = 10;
        updateData.mot_de_passe = await bcrypt.hash(mot_de_passe, saltRounds);
        passwordChanged = true;
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

      if (passwordChanged && envoyerEmail) {
        try {
          await emailService.sendPasswordChangedNotification(
            utilisateurExistant
          );
        } catch (emailError) {
          console.error("Erreur envoi notification mot de passe:", emailError);
          // On continue même si l'email échoue
        }
      }

      res.json({
        message: passwordChanged
          ? envoyerEmail
            ? "Utilisateur modifié et notification de changement de mot de passe envoyée"
            : "Utilisateur et mot de passe modifiés avec succès"
          : "Utilisateur modifié avec succès",
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
      res.status(500).json({ error: "Erreur modification utilisateur" });
    }
  }
);

// PUT /api/users/:id/email - Modifier l'email (Admin seulement)
router.put(
  "/:id/email",
  authMiddleware,
  requireRole(["admin"]),
  checkArchived("utilisateurs"),
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
          error: "Erreur envoi email confirmation",
        });
      }

      res.json({
        message:
          "Email de confirmation envoyé. L'utilisateur doit confirmer sa nouvelle adresse.",
        requiresConfirmation: true,
      });
    } catch (error) {
      console.error("Erreur modification email:", error);
      res.status(500).json({ error: "Erreur modification email" });
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
    res.status(500).json({ error: "Erreur confirmation email" });
  }
});

// PUT /api/users/:id/password - Modifier le mot de passe (Admin seulement)
router.put(
  "/:id/password",
  authMiddleware,
  requireRole(["admin"]),
  checkArchived("utilisateurs"),
  async (req, res) => {
    try {
      const { nouveauMotDePasse, envoyerEmail = false } = req.body;
      const userId = parseInt(req.params.id);

      // Vérifier que l'utilisateur existe
      const utilisateur = await prisma.utilisateurs.findUnique({
        where: { id: userId },
      });

      if (!utilisateur) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      // Hasher le nouveau mot de passe
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
      res.status(500).json({ error: "Erreur modification mot de passe" });
    }
  }
);

// PUT /api/users/:id/infos - Modifier les informations basiques (TOUS les utilisateurs)
router.put(
  "/:id/infos",
  authMiddleware,
  checkArchived("utilisateurs"),
  async (req, res) => {
    try {
      const { nom, prenom, telephone, poste } = req.body;
      const userId = parseInt(req.params.id);

      // SÉCURITÉ : Un utilisateur ne peut modifier que SON PROPRE compte
      if (req.user.id !== userId) {
        return res.status(403).json({
          error: "Vous ne pouvez modifier que votre propre profil",
        });
      }

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
          telephone: telephone || undefined,
          poste: poste || undefined,
        },
      });

      res.json({
        message: "Informations mises à jour avec succès",
        user: {
          id: utilisateur.id,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          email: utilisateur.email,
          telephone: utilisateur.telephone,
          poste: utilisateur.poste,
        },
      });
    } catch (error) {
      console.error("Erreur modification informations:", error);
      res.status(500).json({ error: "Erreur modification informations" });
    }
  }
);

module.exports = router;
