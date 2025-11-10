const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class FilterService {
  buildInterventionFilters(query, user, isArchive = false) {
    const {
      search,
      status,
      theme,
      commune,
      dateDebut,
      dateFin,
      dateArchivageDebut,
      dateArchivageFin,
      dateQuestionDebut,
      dateQuestionFin,
    } = query;

    const where = {};

    // Filtre archivage
    if (isArchive) {
      where.date_archivage = { not: null };
    } else {
      where.date_archivage = null;
    }

    // Filtre par rôle utilisateur
    if (user.role === "commune") {
      where.demandeur_id = user.id;
    }

    // Filtre recherche
    this.applySearchFilter(where, search);

    // Filtre statut
    if (status && status !== "all") {
      this.applyStatusFilter(where, status);
    }

    // Filtres communs
    if (theme && theme !== "all") where.theme_id = parseInt(theme);
    if (commune && commune !== "all") where.commune_id = parseInt(commune);

    // Filtres dates
    this.applyDateFilters(
      where,
      {
        dateDebut: dateDebut || dateQuestionDebut,
        dateFin: dateFin || dateQuestionFin,
        dateArchivageDebut,
        dateArchivageFin,
      },
      isArchive
    );

    return where;
  }

  applySearchFilter(where, search) {
    if (search && search.trim() !== "") {
      const mots = search
        .trim()
        .split(/\s+/)
        .filter((mot) => mot.length > 0);

      if (mots.length > 0) {
        where.AND = mots.map((mot) => ({
          OR: [
            { titre: { contains: mot, mode: "insensitive" } },
            { description: { contains: mot, mode: "insensitive" } },
            { reponse: { contains: mot, mode: "insensitive" } },
            { notes: { contains: mot, mode: "insensitive" } },
            { commune: { nom: { contains: mot, mode: "insensitive" } } },
            { theme: { designation: { contains: mot, mode: "insensitive" } } },
          ],
        }));
      }
    }
  }

  applyStatusFilter(where, status) {
    switch (status) {
      case "en_attente":
        where.reponse = null;
        break;
      case "repondu":
        where.reponse = { not: null };
        where.satisfaction = null;
        break;
      case "termine":
        where.reponse = { not: null };
        where.satisfaction = { not: null };
        break;
    }
  }

  applyDateFilters(where, dates, isArchive) {
    const { dateDebut, dateFin, dateArchivageDebut, dateArchivageFin } = dates;

    // Date de question
    if (dateDebut || dateFin) {
      where.date_question = {};
      if (dateDebut) where.date_question.gte = new Date(dateDebut);
      if (dateFin)
        where.date_question.lte = new Date(dateFin + "T23:59:59.999Z");
    }

    // Date d'archivage (archives seulement)
    if (isArchive && (dateArchivageDebut || dateArchivageFin)) {
      where.date_archivage = where.date_archivage || {};
      if (dateArchivageDebut)
        where.date_archivage.gte = new Date(dateArchivageDebut);
      if (dateArchivageFin)
        where.date_archivage.lte = new Date(
          dateArchivageFin + "T23:59:59.999Z"
        );
    }
  }

  getPaginationOptions(query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;

    return {
      skip: (page - 1) * limit,
      take: limit,
      page,
      limit,
    };
  }

  getIncludeOptions(isArchive = false) {
    return {
      commune: { select: { id: true, nom: true } },
      theme: { select: { id: true, designation: true } },
      demandeur: { select: { id: true, nom: true, prenom: true, actif: true } },
      juriste: { select: { id: true, nom: true, prenom: true, actif: true } },
    };
  }

  async findInterventions(where, pagination, include, orderBy) {
    const [interventions, total] = await Promise.all([
      prisma.interventions.findMany({
        where,
        include,
        orderBy,
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.interventions.count({ where }),
    ]);

    return {
      interventions,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        pages: Math.ceil(total / pagination.limit),
      },
    };
  }
}

module.exports = new FilterService();
