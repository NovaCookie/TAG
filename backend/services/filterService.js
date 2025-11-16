const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class FilterService {
  /**
   * Construit les filtres pour les interventions
   * @param {Object} query - Paramètres de requête
   * @param {Object} user - Utilisateur connecté
   * @param {boolean} isArchive - Si on filtre les archives
   * @returns {Object} Conditions WHERE pour Prisma
   */
  buildInterventionFilters(query, user, isArchive = false) {
    const {
      search,
      status,
      theme,
      commune,
      dateStart,
      dateEnd,
      archiveDateStart,
      archiveDateEnd,
      questionDateStart,
      questionDateEnd,
    } = query;

    const where = {};

    // Exclusion des questions faq
    if (!isArchive) {
      where.est_faq = false;
    }

    // Filtre par rôle utilisateur
    if (user.role === "commune") {
      where.demandeur_id = user.id;
    }

    // Application des filtres de recherche
    this._applySearchFilter(where, search);

    // Filtre par statut
    if (status && status !== "all") {
      this._applyStatusFilter(where, status);
    }

    // Filtres par entité
    if (theme && theme !== "all") where.theme_id = parseInt(theme);
    if (commune && commune !== "all") where.commune_id = parseInt(commune);

    // Filtres par date
    this._applyDateFilters(
      where,
      {
        dateStart: dateStart || questionDateStart,
        dateEnd: dateEnd || questionDateEnd,
        archiveDateStart,
        archiveDateEnd,
      },
      isArchive
    );

    return where;
  }

  /**
   * Applique le filtre de recherche texte
   * @param {Object} where - Conditions WHERE
   * @param {string} search - Terme de recherche
   */
  _applySearchFilter(where, search) {
    if (search && search.trim() !== "") {
      const searchTerms = search
        .trim()
        .split(/\s+/)
        .filter((term) => term.length > 0);

      if (searchTerms.length > 0) {
        where.AND = searchTerms.map((term) => ({
          OR: [
            { titre: { contains: term, mode: "insensitive" } },
            { description: { contains: term, mode: "insensitive" } },
            { reponse: { contains: term, mode: "insensitive" } },
            { notes: { contains: term, mode: "insensitive" } },
            { commune: { nom: { contains: term, mode: "insensitive" } } },
            { theme: { designation: { contains: term, mode: "insensitive" } } },
          ],
        }));
      }
    }
  }

  /**
   * Applique le filtre par statut
   * @param {Object} where - Conditions WHERE
   * @param {string} status - Statut à filtrer
   */
  _applyStatusFilter(where, status) {
    switch (status) {
      case "pending":
        where.reponse = null;
        break;
      case "answered":
        where.reponse = { not: null };
        where.satisfaction = null;
        break;
      case "completed":
        where.reponse = { not: null };
        where.satisfaction = { not: null };
        break;
      default:
        break;
    }
  }

  /**
   * Applique les filtres de date
   * @param {Object} where - Conditions WHERE
   * @param {Object} dates - Objet contenant les dates
   * @param {boolean} isArchive - Si on filtre les archives
   */
  _applyDateFilters(where, dates, isArchive) {
    const { dateStart, dateEnd, archiveDateStart, archiveDateEnd } = dates;

    // Filtre par date de question
    if (dateStart || dateEnd) {
      where.date_question = {};
      if (dateStart) where.date_question.gte = new Date(dateStart);
      if (dateEnd)
        where.date_question.lte = new Date(dateEnd + "T23:59:59.999Z");
    }

    // Filtre par date d'archivage (uniquement pour les archives)
    if (isArchive && (archiveDateStart || archiveDateEnd)) {
      where.date_archivage = where.date_archivage || {};
      if (archiveDateStart)
        where.date_archivage.gte = new Date(archiveDateStart);
      if (archiveDateEnd)
        where.date_archivage.lte = new Date(archiveDateEnd + "T23:59:59.999Z");
    }
  }

  /**
   * Récupère les options de pagination
   * @param {Object} query - Paramètres de requête
   * @returns {Object} Options de pagination
   */
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

  /**
   * Récupère les options d'inclusion pour Prisma
   * @returns {Object} Options d'inclusion
   */
  getIncludeOptions() {
    return {
      commune: {
        select: {
          id: true,
          nom: true,
          population: true,
        },
      },
      theme: {
        select: {
          id: true,
          designation: true,
        },
      },
      demandeur: {
        select: {
          id: true,
          nom: true,
          prenom: true,
        },
      },
      juriste: {
        select: {
          id: true,
          nom: true,
          prenom: true,
        },
      },
    };
  }

  /**
   * Recherche les interventions non archivées
   * @param {Object} where - Conditions WHERE
   * @param {Object} pagination - Options de pagination
   * @param {Object} include - Options d'inclusion
   * @param {Object} orderBy - Options de tri
   * @returns {Object} Résultats paginés
   */
  async findNonArchived(where, pagination, include, orderBy) {
    // Récupérer les IDs des interventions archivées
    const archivedInterventions = await prisma.archive.findMany({
      where: { table_name: "interventions" },
      select: { entity_id: true },
    });
    const archivedIds = archivedInterventions.map(
      (archive) => archive.entity_id
    );

    // Exclure les interventions archivées
    if (archivedIds.length > 0) {
      where.id = { notIn: archivedIds };
    }

    return this._findInterventions(where, pagination, include, orderBy);
  }

  /**
   * Recherche les interventions archivées
   * @param {Object} where - Conditions WHERE
   * @param {Object} pagination - Options de pagination
   * @param {Object} include - Options d'inclusion
   * @param {Object} orderBy - Options de tri
   * @returns {Object} Résultats paginés
   */
  async findArchived(where, pagination, include, orderBy) {
    // Récupérer les IDs des interventions archivées
    const archivedInterventions = await prisma.archive.findMany({
      where: { table_name: "interventions" },
      select: { entity_id: true },
    });
    const archivedIds = archivedInterventions.map(
      (archive) => archive.entity_id
    );

    // Inclure uniquement les interventions archivées
    if (archivedIds.length > 0) {
      where.id = { in: archivedIds };
    } else {
      where.id = { in: [] };
    }

    return this._findInterventions(where, pagination, include, orderBy);
  }

  /**
   * Méthode privée pour exécuter la recherche d'interventions
   * @param {Object} where - Conditions WHERE
   * @param {Object} pagination - Options de pagination
   * @param {Object} include - Options d'inclusion
   * @param {Object} orderBy - Options de tri
   * @returns {Object} Résultats paginés
   */
  async _findInterventions(where, pagination, include, orderBy) {
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
