const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authMiddleware, requireRole } = require("../middleware/auth");
const prisma = new PrismaClient();
const router = express.Router();

// GET /api/communes - Liste des communes avec recherche par code postal
router.get("/", authMiddleware, async (req, res) => {
  try {
    const {
      search,
      code_postal,
      utilisateurs,
      interventions,
      page = 1,
      limit = 10,
    } = req.query;

    let where = {};

    // Filtre recherche par nom OU code postal
    if (search && search.trim() !== "") {
      where.OR = [
        { nom: { contains: search, mode: "insensitive" } },
        { code_postal: { contains: search, mode: "insensitive" } },
        { population: { equals: parseInt(search) || undefined } },
      ].filter(Boolean);
    }

    // Filtre spécifique par code postal
    if (code_postal && code_postal.trim() !== "") {
      where.code_postal = { contains: code_postal, mode: "insensitive" };
    }

    // Récupérer toutes les communes d'abord
    const communes = await prisma.communes.findMany({
      where: {
        // On applique les filtres de recherche
        ...where,
      },
      include: {
        _count: {
          select: {
            utilisateurs: true,
            interventions: true,
          },
        },
      },
      orderBy: { nom: "asc" },
    });

    // Appliquer les filtres sur les counts après récupération
    let communesFiltrees = communes;

    if (utilisateurs && utilisateurs !== "all") {
      communesFiltrees = communesFiltrees.filter((commune) => {
        const nbUtilisateurs = commune._count.utilisateurs;
        switch (utilisateurs) {
          case "0":
            return nbUtilisateurs === 0;
          case "1-10":
            return nbUtilisateurs >= 1 && nbUtilisateurs <= 10;
          case "11-100":
            return nbUtilisateurs >= 11 && nbUtilisateurs <= 100;
          case "101+":
            return nbUtilisateurs > 100;
          default:
            return true;
        }
      });
    }

    if (interventions && interventions !== "all") {
      communesFiltrees = communesFiltrees.filter((commune) => {
        const nbInterventions = commune._count.interventions;
        switch (interventions) {
          case "0":
            return nbInterventions === 0;
          case "1-10":
            return nbInterventions >= 1 && nbInterventions <= 10;
          case "11-50":
            return nbInterventions >= 11 && nbInterventions <= 50;
          case "51-100":
            return nbInterventions >= 51 && nbInterventions <= 100;
          case "100+":
            return nbInterventions > 100;
          default:
            return true;
        }
      });
    }

    // Appliquer la pagination manuellement
    const total = communesFiltrees.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const communesPaginees = communesFiltrees.slice(startIndex, endIndex);

    // Formater la réponse
    const communesFormatees = communesPaginees.map((commune) => ({
      id: commune.id,
      nom: commune.nom,
      code_postal: commune.code_postal,
      population: commune.population,
      actif: commune.actif,
      date_creation: commune.date_creation,
      stats: {
        nb_utilisateurs: commune._count.utilisateurs,
        nb_interventions: commune._count.interventions,
      },
    }));

    res.json({
      communes: communesFormatees,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur liste communes:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des communes" });
  }
});

router.get("/users/communes/list", authMiddleware, async (req, res) => {
  try {
    const communes = await prisma.communes.findMany({
      select: {
        id: true,
        nom: true,
        code_postal: true,
        population: true,
        actif: true,
      },
      orderBy: { nom: "asc" },
    });

    res.json(communes);
  } catch (error) {
    console.error("Erreur liste communes users:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des communes" });
  }
});

// GET /api/communes/:id - Détail d'une commune
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const commune = await prisma.communes.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        utilisateurs: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            role: true,
            actif: true,
          },
        },
        interventions: {
          include: {
            theme: true,
            demandeur: true,
            juriste: true,
          },
          orderBy: { date_question: "desc" },
          take: 10,
        },
        _count: {
          select: {
            utilisateurs: true,
            interventions: true,
          },
        },
      },
    });

    if (!commune) {
      return res.status(404).json({ error: "Commune non trouvée" });
    }

    res.json(commune);
  } catch (error) {
    console.error("Erreur détail commune:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération de la commune" });
  }
});

// POST /api/communes - Créer une commune (Admin seulement)
router.post("/", authMiddleware, requireRole(["admin"]), async (req, res) => {
  try {
    const { nom, population, code_postal } = req.body;

    if (!nom || !population) {
      return res
        .status(400)
        .json({ error: "Le nom et la population sont obligatoires" });
    }

    // Vérifier si la commune existe déjà
    const communeExistante = await prisma.communes.findFirst({
      where: {
        OR: [
          { nom: { equals: nom, mode: "insensitive" } },
          { code_postal: code_postal ? { equals: code_postal } : undefined },
        ].filter(Boolean),
      },
    });

    if (communeExistante) {
      return res.status(400).json({ error: "Cette commune existe déjà" });
    }

    const commune = await prisma.communes.create({
      data: {
        nom,
        code_postal: code_postal || null,
        population: parseInt(population),
        actif: true,
      },
    });

    res.status(201).json({
      message: "Commune créée avec succès",
      commune,
    });
  } catch (error) {
    console.error("Erreur création commune:", error);
    res.status(500).json({ error: "Erreur lors de la création de la commune" });
  }
});

// PUT /api/communes/:id - Modifier une commune (Admin seulement)
router.put("/:id", authMiddleware, requireRole(["admin"]), async (req, res) => {
  try {
    const { nom, population, code_postal, actif } = req.body;

    const commune = await prisma.communes.update({
      where: { id: parseInt(req.params.id) },
      data: {
        nom,
        population: population ? parseInt(population) : undefined,
        code_postal: code_postal || null,
        actif,
      },
    });

    res.json({
      message: "Commune modifiée avec succès",
      commune,
    });
  } catch (error) {
    console.error("Erreur modification commune:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la modification de la commune" });
  }
});

// PATCH /api/communes/:id/toggle-status - Activer/désactiver une commune (Admin seulement)
router.patch(
  "/:id/toggle-status",
  authMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const commune = await prisma.communes.findUnique({
        where: { id: parseInt(req.params.id) },
      });

      if (!commune) {
        return res.status(404).json({ error: "Commune non trouvée" });
      }

      const communeModifiee = await prisma.communes.update({
        where: { id: parseInt(req.params.id) },
        data: { actif: !commune.actif },
      });

      res.json({
        message: `Commune ${
          communeModifiee.actif ? "activée" : "désactivée"
        } avec succès`,
        commune: communeModifiee,
      });
    } catch (error) {
      console.error("Erreur changement statut commune:", error);
      res.status(500).json({ error: "Erreur lors du changement de statut" });
    }
  }
);

// GET /api/communes/stats - Statistiques communes
router.get("/stats/globales", authMiddleware, async (req, res) => {
  try {
    const totalCommunes = await prisma.communes.count({
      where: { actif: true },
    });

    const communesAvecInterventions = await prisma.communes.count({
      where: {
        actif: true,
        interventions: { some: {} },
      },
    });

    const stats = {
      totalCommunes,
      communesAvecInterventions,
      communesSansInterventions: totalCommunes - communesAvecInterventions,
    };

    res.json(stats);
  } catch (error) {
    console.error("Erreur stats communes:", error);
    res.status(500).json({ error: "Erreur calcul stats communes" });
  }
});

module.exports = router;
