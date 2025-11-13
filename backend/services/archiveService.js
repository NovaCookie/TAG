const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class ArchiveService {
  // Archiver une entité
  async archiveEntity(table_name, entity_id, raison = "", user_id = null) {
    try {
      // Vérifier si déjà archivée
      const existingArchive = await prisma.archive.findUnique({
        where: {
          table_name_entity_id: {
            table_name,
            entity_id,
          },
        },
      });

      if (existingArchive) {
        throw new Error(`${table_name} déjà archivée`);
      }

      // Récupérer l'entité complète selon la table
      const entity = await this.getEntityData(table_name, entity_id);
      if (!entity) {
        throw new Error(`${table_name} avec ID ${entity_id} non trouvée`);
      }

      // Créer l'entrée d'archivage
      const archive = await prisma.archive.create({
        data: {
          table_name,
          entity_id,
          entity_data: entity,
          raison,
          archived_by_id: user_id,
        },
        include: {
          archived_by: {
            select: { nom: true, prenom: true },
          },
        },
      });

      return archive;
    } catch (error) {
      console.error(`Erreur archivage ${table_name}:`, error);
      throw error;
    }
  }

  // Restaurer une entité
  async restoreEntity(table_name, entity_id) {
    try {
      // Vérifier que l'archive existe
      const archive = await prisma.archive.findUnique({
        where: {
          table_name_entity_id: {
            table_name,
            entity_id,
          },
        },
      });

      if (!archive) {
        throw new Error("Archive non trouvée");
      }

      // Supprimer l'archive (restauration)
      await prisma.archive.delete({
        where: { id: archive.id },
      });

      return {
        message: `${table_name} restaurée avec succès`,
        entity_id,
        table_name,
      };
    } catch (error) {
      console.error(`Erreur restauration ${table_name}:`, error);
      throw error;
    }
  }

  // Vérifier si une entité est archivée
  async isArchived(table_name, entity_id) {
    const archive = await prisma.archive.findUnique({
      where: {
        table_name_entity_id: {
          table_name,
          entity_id,
        },
      },
    });

    return archive;
  }

  // Lister les entités archivées pour une table spécifique
  async ArchiveListByTable(table_name, page = 1, limit = 20) {
    const where = { table_name };

    const [archives, total] = await Promise.all([
      prisma.archive.findMany({
        where,
        include: {
          archived_by: {
            select: { nom: true, prenom: true, email: true },
          },
        },
        orderBy: { date_archivage: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.archive.count({ where }),
    ]);

    return {
      archives,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Nouvelle méthode pour les archives avec filtres avancés
  async getArchivesByTableWithFilters(
    table_name,
    filters = {},
    page = 1,
    limit = 20
  ) {
    let where = { table_name };

    // Application des filtres
    if (filters.search) {
      where.OR = [
        { entity_data: { path: ["nom"], string_contains: filters.search } },
        { entity_data: { path: ["prenom"], string_contains: filters.search } },
        { entity_data: { path: ["email"], string_contains: filters.search } },
        { entity_data: { path: ["titre"], string_contains: filters.search } },
      ];
    }

    if (filters.role && table_name === "utilisateurs") {
      where.entity_data = {
        ...where.entity_data,
        path: ["role"],
        equals: filters.role,
      };
    }

    if (
      (filters.populationMin || filters.populationMax) &&
      table_name === "communes"
    ) {
      where.entity_data = {
        ...where.entity_data,
        path: ["population"],
      };
      if (filters.populationMin) {
        where.entity_data.gte = parseInt(filters.populationMin);
      }
      if (filters.populationMax) {
        where.entity_data.lte = parseInt(filters.populationMax);
      }
    }

    if (filters.dateArchivageDebut || filters.dateArchivageFin) {
      where.date_archivage = {};
      if (filters.dateArchivageDebut) {
        where.date_archivage.gte = new Date(filters.dateArchivageDebut);
      }
      if (filters.dateArchivageFin) {
        where.date_archivage.lte = new Date(
          filters.dateArchivageFin + "T23:59:59.999Z"
        );
      }
    }

    const [archives, total] = await Promise.all([
      prisma.archive.findMany({
        where,
        include: {
          archived_by: {
            select: { nom: true, prenom: true, email: true },
          },
        },
        orderBy: { date_archivage: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.archive.count({ where }),
    ]);

    return {
      archives,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async archiverCommune(communeId, raison = "", userId = null) {
    return await this.archiveEntity("communes", communeId, raison, userId);
  }

  async archiveUser(utilisateurId, raison = "", userId = null) {
    return await this.archiveEntity(
      "utilisateurs",
      utilisateurId,
      raison,
      userId
    );
  }

  async restoreCommune(communeId) {
    return await this.restoreEntity("communes", communeId);
  }

  async restoreUser(utilisateurId) {
    return await this.restoreEntity("utilisateurs", utilisateurId);
  }

  // Méthode pour récupérer les données d'une entité
  async getEntityData(table_name, entity_id) {
    switch (table_name) {
      case "interventions":
        return await prisma.interventions.findUnique({
          where: { id: entity_id },
          include: {
            commune: {
              select: { nom: true, code_postal: true, population: true },
            },
            theme: { select: { designation: true } },
            demandeur: { select: { nom: true, prenom: true, email: true } },
            juriste: { select: { nom: true, prenom: true, email: true } },
            pieces_jointes: true,
          },
        });

      case "communes":
        return await prisma.communes.findUnique({
          where: { id: entity_id },
          include: {
            utilisateurs: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
                role: true,
              },
            },
            interventions: {
              select: {
                id: true,
                titre: true,
                date_question: true,
                theme: { select: { designation: true } },
              },
            },
          },
        });

      case "utilisateurs":
        return await prisma.utilisateurs.findUnique({
          where: { id: entity_id },
          include: {
            commune: { select: { nom: true, code_postal: true } },
            interventions_demandees: {
              select: {
                id: true,
                titre: true,
                date_question: true,
                theme: { select: { designation: true } },
              },
            },
            interventions_traitees: {
              select: {
                id: true,
                titre: true,
                date_question: true,
                theme: { select: { designation: true } },
              },
            },
          },
        });

      default:
        throw new Error(`Table ${table_name} non supportée`);
    }
  }

  // Méthode pour récupérer les statistiques d'archivage
  async getStatsArchivage() {
    const stats = await prisma.archive.groupBy({
      by: ["table_name"],
      _count: {
        id: true,
      },
    });

    const total = await prisma.archive.count();

    return {
      par_table: stats,
      total_archives: total,
    };
  }

  async getArchivedIds(table_name) {
    const archives = await prisma.archive.findMany({
      where: { table_name },
      select: { entity_id: true },
    });
    return archives.map((archive) => archive.entity_id);
  }

  async checkArchiveStatus(table_name, entity_id) {
    try {
      const archive = await prisma.archive.findUnique({
        where: {
          table_name_entity_id: {
            table_name,
            entity_id,
          },
        },
        include: {
          archived_by: {
            select: { nom: true, prenom: true },
          },
        },
      });

      return {
        archived: !!archive,
        archive: archive,
        archive_date: archive?.date_archivage,
      };
    } catch (error) {
      console.error(`Erreur vérification archivage ${table_name}:`, error);
      return { archived: false };
    }
  }

  // // Méthode pour filtrer automatiquement les entités archivées dans les listings
  // async excludeArchivedFromQuery(where, table_name) {
  //   const archivedIds = await this.getArchivedIds(table_name);
  //   if (archivedIds.length > 0) {
  //     where.id = where.id
  //       ? { ...where.id, notIn: archivedIds }
  //       : { notIn: archivedIds };
  //   }
  //   return where;
  // }

  // // Méthode pour vérifier l'archivage avant action
  // async F(table_name, entity_id, action = "modifier") {
  //   const archiveStatus = await this.checkArchiveStatus(table_name, entity_id);
  //   if (archiveStatus.archived) {
  //     throw new Error(`Impossible de ${action} ${table_name} archivé`);
  //   }
  //   return true;
  // }
}
module.exports = new ArchiveService();
