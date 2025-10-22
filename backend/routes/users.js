const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authMiddleware, requireRole } = require("../middleware/auth");
const prisma = new PrismaClient();
const router = express.Router();

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

// GET /api/users/:id - Détail d'un utilisateur
router.get("/:id", authMiddleware, requireRole(["admin"]), async (req, res) => {
  try {
    const user = await prisma.utilisateurs.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        commune: {
          select: {
            id: true,
            nom: true,
            population: true,
          },
        },
        interventions_demandees: {
          include: {
            theme: true,
            juriste: true,
          },
          orderBy: { date_question: "desc" },
          take: 5,
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
    const { nom, prenom, email, role, commune_id, mot_de_passe } = req.body;

    // Validation des données requises
    if (!nom || !prenom || !email || !role) {
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

    // Pour les communes, vérifier que commune_id est fourni
    if (role === "commune" && !commune_id) {
      return res
        .status(400)
        .json({
          error:
            "Une commune doit être associée aux utilisateurs de type 'commune'",
        });
    }

    // Créer l'utilisateur
    const user = await prisma.utilisateurs.create({
      data: {
        nom,
        prenom,
        email,
        role,
        commune_id: role === "commune" ? parseInt(commune_id) : null,
        mot_de_passe: mot_de_passe, // ⚠️ À hasher en production!
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

    res.status(201).json({
      message: "Utilisateur créé avec succès",
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

// PUT /api/users/:id - Modifier un utilisateur
router.put("/:id", authMiddleware, requireRole(["admin"]), async (req, res) => {
  try {
    const { nom, prenom, email, role, commune_id, actif } = req.body;

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.utilisateurs.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email && email !== existingUser.email) {
      const emailUser = await prisma.utilisateurs.findUnique({
        where: { email },
      });

      if (emailUser) {
        return res.status(400).json({ error: "Cet email est déjà utilisé" });
      }
    }

    const user = await prisma.utilisateurs.update({
      where: { id: parseInt(req.params.id) },
      data: {
        nom: nom || existingUser.nom,
        prenom: prenom || existingUser.prenom,
        email: email || existingUser.email,
        role: role || existingUser.role,
        commune_id: role === "commune" ? parseInt(commune_id) : null,
        actif: actif !== undefined ? actif : existingUser.actif,
      },
      include: {
        commune: {
          select: {
            nom: true,
          },
        },
      },
    });

    res.json({
      message: "Utilisateur modifié avec succès",
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
    console.error("Erreur modification utilisateur:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la modification de l'utilisateur" });
  }
});

// PATCH /api/users/:id/toggle-status - Activer/désactiver un utilisateur
router.patch(
  "/:id/toggle-status",
  authMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const user = await prisma.utilisateurs.findUnique({
        where: { id: parseInt(req.params.id) },
      });

      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      const updatedUser = await prisma.utilisateurs.update({
        where: { id: parseInt(req.params.id) },
        data: { actif: !user.actif },
        include: {
          commune: {
            select: {
              nom: true,
            },
          },
        },
      });

      res.json({
        message: `Utilisateur ${
          updatedUser.actif ? "activé" : "désactivé"
        } avec succès`,
        user: {
          id: updatedUser.id,
          nom: updatedUser.nom,
          prenom: updatedUser.prenom,
          email: updatedUser.email,
          role: updatedUser.role,
          actif: updatedUser.actif,
          commune: updatedUser.commune,
        },
      });
    } catch (error) {
      console.error("Erreur changement statut utilisateur:", error);
      res.status(500).json({ error: "Erreur lors du changement de statut" });
    }
  }
);

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

module.exports = router;
