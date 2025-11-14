const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class StatsService {
  // === MÉTHODES EXISTANTES ++++ ===

  async getGlobalStats() {
    try {
      const archives = await this._getArchivedIds();

      const [
        totalUsers,
        totalCommunes,
        totalThemes,
        statsByRole,
        totalInterventions,
        pendingInterventions,
        answeredInterventions,
        satisfactionStats,
      ] = await Promise.all([
        prisma.utilisateurs.count({
          where: { id: { notIn: archives.utilisateurs } },
        }),
        prisma.communes.count({ where: { id: { notIn: archives.communes } } }),
        prisma.themes.count(),
        prisma.utilisateurs.groupBy({
          by: ["role"],
          _count: { id: true },
          where: { id: { notIn: archives.utilisateurs } },
        }),
        prisma.interventions.count({
          where: { id: { notIn: archives.interventions } },
        }),
        prisma.interventions.count({
          where: { id: { notIn: archives.interventions }, reponse: null },
        }),
        prisma.interventions.count({
          where: {
            id: { notIn: archives.interventions },
            reponse: { not: null },
          },
        }),
        prisma.interventions.aggregate({
          where: {
            id: { notIn: archives.interventions },
            satisfaction: { not: null },
          },
          _avg: { satisfaction: true },
        }),
      ]);

      const responseRate =
        totalInterventions > 0
          ? Math.round((answeredInterventions / totalInterventions) * 100)
          : 0;

      return {
        users: {
          total: totalUsers,
          byRole: statsByRole.reduce((acc, item) => {
            acc[item.role] = item._count.id;
            return acc;
          }, {}),
        },
        communes: { total: totalCommunes },
        themes: { total: totalThemes },
        interventions: {
          total: totalInterventions,
          pending: pendingInterventions,
          answered: answeredInterventions,
          responseRate,
          averageSatisfaction: satisfactionStats._avg.satisfaction || 0,
        },
      };
    } catch (error) {
      console.error("Erreur getGlobalStats:", error);
      throw error;
    }
  }

  async getUserStats() {
    try {
      const archives = await this._getArchivedIds();

      const [totalUsers, statsByRole] = await Promise.all([
        prisma.utilisateurs.count({
          where: { id: { notIn: archives.utilisateurs } },
        }),
        prisma.utilisateurs.groupBy({
          by: ["role"],
          _count: { id: true },
          where: { id: { notIn: archives.utilisateurs } },
        }),
      ]);

      return {
        total: totalUsers,
        byRole: statsByRole.reduce((acc, item) => {
          acc[item.role] = item._count.id;
          return acc;
        }, {}),
      };
    } catch (error) {
      console.error("Erreur getUserStats:", error);
      throw error;
    }
  }

  async getCommuneStats() {
    try {
      const archives = await this._getArchivedIds();

      const totalCommunes = await prisma.communes.count({
        where: { id: { notIn: archives.communes } },
      });

      const communesWithInterventions = await prisma.communes.count({
        where: {
          id: { notIn: archives.communes },
          interventions: { some: {} },
        },
      });

      return {
        total: totalCommunes,
        withInterventions: communesWithInterventions,
        withoutInterventions: totalCommunes - communesWithInterventions,
      };
    } catch (error) {
      console.error("Erreur getCommuneStats:", error);
      throw error;
    }
  }

  async getThemeStats() {
    try {
      const archives = await this._getArchivedIds();

      const totalThemes = await prisma.themes.count();

      const themesWithInterventions = await prisma.themes.count({
        where: {
          interventions: {
            some: { id: { notIn: archives.interventions } },
          },
        },
      });

      return {
        total: totalThemes,
        withInterventions: themesWithInterventions,
        withoutInterventions: totalThemes - themesWithInterventions,
      };
    } catch (error) {
      console.error("Erreur getThemeStats:", error);
      throw error;
    }
  }

  // === NOUVELLE MÉTHODE POUR LE DASHBOARD ===

  async getDashboardStats(userRole, userId) {
    try {
      const archives = await this._getArchivedIds();

      let whereBase = { id: { notIn: archives.interventions } };

      // Si commune, ne voir que ses interventions
      if (userRole === "commune") {
        whereBase.demandeur_id = userId;
      }

      const [total, pending, answered, satisfaction, recent] =
        await Promise.all([
          prisma.interventions.count({ where: whereBase }),
          prisma.interventions.count({
            where: { ...whereBase, reponse: null },
          }),
          prisma.interventions.count({
            where: { ...whereBase, reponse: { not: null } },
          }),
          prisma.interventions.aggregate({
            where: { ...whereBase, satisfaction: { not: null } },
            _avg: { satisfaction: true },
          }),
          prisma.interventions.findMany({
            where: whereBase,
            include: {
              commune: { select: { nom: true } },
              theme: { select: { designation: true } },
              demandeur: { select: { nom: true, prenom: true } },
            },
            orderBy: { date_question: "desc" },
            take: 5,
          }),
        ]);

      const responseRate = total > 0 ? Math.round((answered / total) * 100) : 0;

      return {
        totalInterventions: total,
        pendingInterventions: pending,
        answeredInterventions: answered,
        responseRate,
        averageSatisfaction: satisfaction._avg.satisfaction || 0,
        recentInterventions: recent,
      };
    } catch (error) {
      console.error("Erreur getDashboardStats:", error);
      throw error;
    }
  }

  // === MÉTHODE ADVANCED STATS (ANCIENNEMENT DANS themes.js) ===

  async getAdvancedStats(filters = {}) {
    try {
      const { dateDebut, dateFin, strate } = filters;
      const archives = await this._getArchivedIds();

      let whereBase = {
        id: { notIn: archives.interventions },
        commune: { id: { notIn: archives.communes } },
      };

      // Filtres date
      if (dateDebut || dateFin) {
        whereBase.date_question = {};
        if (dateDebut) whereBase.date_question.gte = new Date(dateDebut);
        if (dateFin) whereBase.date_question.lte = new Date(dateFin);
      }

      // Filtre strate
      if (strate) {
        switch (strate) {
          case "petite":
            whereBase.commune.population = { lt: 100 };
            break;
          case "moyenne":
            whereBase.commune.population = { gte: 100, lte: 500 };
            break;
          case "grande":
            whereBase.commune.population = { gt: 500 };
            break;
        }
      }

      // Exécution en parallèle de toutes les stats
      const [
        questionsParCommune,
        questionsParTheme,
        questionsParStrate,
        satisfactionParCommune,
        satisfactionParStrate,
        resume,
      ] = await Promise.all([
        this._getQuestionsByCommune(whereBase),
        this._getQuestionsByTheme(whereBase),
        this._getQuestionsByStrate(whereBase),
        this._getSatisfactionByCommune(whereBase),
        this._getSatisfactionByStrate(whereBase),
        this._getResumeAdvanced(whereBase),
      ]);

      return {
        questionsParCommune,
        questionsParTheme,
        questionsParStrate,
        satisfactionParCommune,
        satisfactionParStrate,
        resume,
      };
    } catch (error) {
      console.error("Erreur getAdvancedStats:", error);
      throw error;
    }
  }

  // === MÉTHODES PRIVÉES HELPERS ===

  async _getArchivedIds() {
    const archives = await prisma.archive.findMany({
      select: { table_name: true, entity_id: true },
    });

    return {
      interventions: archives
        .filter((a) => a.table_name === "interventions")
        .map((a) => a.entity_id),
      communes: archives
        .filter((a) => a.table_name === "communes")
        .map((a) => a.entity_id),
      utilisateurs: archives
        .filter((a) => a.table_name === "utilisateurs")
        .map((a) => a.entity_id),
    };
  }

  async _getQuestionsByCommune(whereBase) {
    const questions = await prisma.interventions.groupBy({
      by: ["commune_id"],
      where: whereBase,
      _count: { id: true },
      _avg: { satisfaction: true },
    });

    return Promise.all(
      questions.map(async (item) => {
        const commune = await prisma.communes.findUnique({
          where: { id: item.commune_id },
          select: { nom: true, population: true },
        });

        const questionsAvecReponse = await prisma.interventions.count({
          where: {
            commune_id: item.commune_id,
            reponse: { not: null },
            ...whereBase,
          },
        });

        const tauxReponse =
          item._count.id > 0
            ? Math.round((questionsAvecReponse / item._count.id) * 100)
            : 0;

        return {
          commune: commune?.nom || "Commune inconnue",
          population: commune?.population || 0,
          nb_questions: item._count.id,
          questions_repondues: questionsAvecReponse,
          taux_reponse: tauxReponse,
          satisfaction_moyenne: item._avg.satisfaction || 0,
          nb_evaluations: await prisma.interventions.count({
            where: {
              commune_id: item.commune_id,
              satisfaction: { not: null },
              ...whereBase,
            },
          }),
        };
      })
    );
  }

  async _getQuestionsByTheme(whereBase) {
    const tousLesThemes = await prisma.themes.findMany({
      select: { id: true, designation: true },
      orderBy: { designation: "asc" },
    });

    return Promise.all(
      tousLesThemes.map(async (theme) => {
        const count = await prisma.interventions.count({
          where: { ...whereBase, theme_id: theme.id },
        });

        const satisfaction = await prisma.interventions.aggregate({
          where: {
            ...whereBase,
            theme_id: theme.id,
            satisfaction: { not: null },
          },
          _avg: { satisfaction: true },
        });

        const totalInterventions = await prisma.interventions.count({
          where: whereBase,
        });

        const pourcentage =
          totalInterventions > 0
            ? Math.round((count / totalInterventions) * 100)
            : 0;

        return {
          theme: theme.designation,
          nb_questions: count,
          pourcentage,
          satisfaction_moyenne: satisfaction._avg.satisfaction || 0,
          nb_evaluations: await prisma.interventions.count({
            where: {
              theme_id: theme.id,
              satisfaction: { not: null },
              ...whereBase,
            },
          }),
        };
      })
    );
  }

  async _getQuestionsByStrate(whereBase) {
    const strates = [
      { condition: { lt: 100 }, label: "< 100 habitants" },
      { condition: { gte: 100, lte: 500 }, label: "100-500 habitants" },
      { condition: { gt: 500 }, label: "> 500 habitants" },
    ];

    return Promise.all(
      strates.map(async (strate) => {
        const whereStrate = {
          ...whereBase,
          commune: { ...whereBase.commune, population: strate.condition },
        };

        const nbQuestions = await prisma.interventions.count({
          where: whereStrate,
        });
        const nbCommunes = await prisma.communes.count({
          where: {
            population: strate.condition,
            id: { notIn: await this._getArchivedIds().then((a) => a.communes) },
          },
        });

        const totalInterventions = await prisma.interventions.count({
          where: whereBase,
        });
        const satisfaction = await prisma.interventions.aggregate({
          where: { ...whereStrate, satisfaction: { not: null } },
          _avg: { satisfaction: true },
        });

        const nbEvaluations = await prisma.interventions.count({
          where: { ...whereStrate, satisfaction: { not: null } },
        });

        const pourcentage =
          totalInterventions > 0
            ? Math.round((nbQuestions / totalInterventions) * 100)
            : 0;

        return {
          strate: strate.label,
          nb_communes: nbCommunes,
          nb_questions: nbQuestions,
          pourcentage,
          satisfaction_moyenne: satisfaction._avg.satisfaction || 0,
          nb_evaluations: nbEvaluations,
        };
      })
    );
  }

  async _getSatisfactionByCommune(whereBase) {
    const satisfactionParCommune = await prisma.interventions.groupBy({
      by: ["commune_id"],
      where: { ...whereBase, satisfaction: { not: null } },
      _count: { satisfaction: true },
      _avg: { satisfaction: true },
    });

    return Promise.all(
      satisfactionParCommune.map(async (item) => {
        const commune = await prisma.communes.findUnique({
          where: { id: item.commune_id },
          select: { nom: true },
        });

        const totalQuestionsCommune = await prisma.interventions.count({
          where: { commune_id: item.commune_id, ...whereBase },
        });

        const tauxEvaluation =
          totalQuestionsCommune > 0
            ? Math.round(
                (item._count.satisfaction / totalQuestionsCommune) * 100
              )
            : 0;

        return {
          commune: commune?.nom || "Commune inconnue",
          satisfaction_moyenne: item._avg.satisfaction || 0,
          nb_evaluations: item._count.satisfaction,
          taux_evaluation: tauxEvaluation,
        };
      })
    );
  }

  async _getSatisfactionByStrate(whereBase) {
    const strates = [
      { condition: { lt: 100 }, label: "< 100 habitants" },
      { condition: { gte: 100, lte: 500 }, label: "100-500 habitants" },
      { condition: { gt: 500 }, label: "> 500 habitants" },
    ];

    return Promise.all(
      strates.map(async (strate) => {
        const whereStrate = {
          ...whereBase,
          satisfaction: { not: null },
          commune: { ...whereBase.commune, population: strate.condition },
        };

        const satisfaction = await prisma.interventions.aggregate({
          where: whereStrate,
          _avg: { satisfaction: true },
          _min: { satisfaction: true },
          _max: { satisfaction: true },
          _count: { satisfaction: true },
        });

        return {
          strate: strate.label,
          satisfaction_moyenne: satisfaction._avg.satisfaction || 0,
          nb_evaluations: satisfaction._count.satisfaction,
          note_min: satisfaction._min.satisfaction,
          note_max: satisfaction._max.satisfaction,
        };
      })
    );
  }

  async _getResumeAdvanced(whereBase) {
    const archives = await this._getArchivedIds();

    const [
      totalCommunes,
      totalThemes,
      totalInterventions,
      satisfactionGlobale,
    ] = await Promise.all([
      prisma.communes.count({ where: { id: { notIn: archives.communes } } }),
      prisma.themes.count(),
      prisma.interventions.count({ where: whereBase }),
      prisma.interventions.aggregate({
        where: { ...whereBase, satisfaction: { not: null } },
        _avg: { satisfaction: true },
      }),
    ]);

    return {
      totalCommunes,
      totalThemes,
      totalInterventions,
      satisfactionGlobale: satisfactionGlobale._avg.satisfaction || 0,
    };
  }

  // async getRetentionStats() {
  //   const policies = await prisma.retentionPolicy.findMany({
  //     include: {
  //       theme: true,
  //       _count: {
  //         select: {
  //           theme: {
  //             interventions: {
  //               where: {
  //                 date_reponse: { not: null },
  //               },
  //             },
  //           },
  //         },
  //       },
  //     },
  //   });

  //   return policies.map((policy) => ({
  //     theme: policy.theme.designation,
  //     duree_mois: policy.duree_mois,
  //     interventions_concernées: policy._count.theme.interventions,
  //   }));
  // }
}

module.exports = new StatsService();
