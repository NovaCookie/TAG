const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// GET /api/stats/advanced
router.get("/advanced", async (req, res) => {
  try {
    const { dateDebut, dateFin, strate } = req.query;

    // Construction des conditions WHERE avec Prisma
    let whereBase = {
      commune: {
        actif: true,
      },
    };

    // Filtres de date
    if (dateDebut || dateFin) {
      whereBase.date_question = {};
      if (dateDebut) whereBase.date_question.gte = new Date(dateDebut);
      if (dateFin) whereBase.date_question.lte = new Date(dateFin);
    }

    // Filtre par strate
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

    // QUESTIONS PAR COMMUNE
    const questionsParCommune = await prisma.interventions.groupBy({
      by: ["commune_id"],
      where: whereBase,
      _count: {
        id: true,
      },
      _avg: {
        satisfaction: true,
      },
    });

    // Récupérer les noms des communes
    const questionsParCommuneAvecDetails = await Promise.all(
      questionsParCommune.map(async (item) => {
        const commune = await prisma.communes.findUnique({
          where: { id: item.commune_id },
          select: { nom: true, population: true },
        });

        // Compter les questions avec réponse
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

    // QUESTIONS PAR THÈME
    const questionsParTheme = await prisma.interventions.groupBy({
      by: ["theme_id"],
      where: whereBase,
      _count: {
        id: true,
      },
      _avg: {
        satisfaction: true,
      },
    });

    const questionsParThemeAvecDetails = await Promise.all(
      questionsParTheme.map(async (item) => {
        const theme = await prisma.themes.findUnique({
          where: { id: item.theme_id },
          select: { designation: true },
        });

        const totalInterventions = await prisma.interventions.count({
          where: whereBase,
        });

        const pourcentage =
          totalInterventions > 0
            ? Math.round((item._count.id / totalInterventions) * 100)
            : 0;

        return {
          theme: theme?.designation || "Thème inconnu",
          nb_questions: item._count.id,
          pourcentage: pourcentage,
          satisfaction_moyenne: item._avg.satisfaction || 0,
          nb_evaluations: await prisma.interventions.count({
            where: {
              theme_id: item.theme_id,
              satisfaction: { not: null },
              ...whereBase,
            },
          }),
        };
      })
    );

    // QUESTIONS PAR STRATE
    const strates = [
      { condition: { lt: 100 }, label: "< 100 habitants" },
      { condition: { gte: 100, lte: 500 }, label: "100-500 habitants" },
      { condition: { gt: 500 }, label: "> 500 habitants" },
    ];

    const questionsParStrate = await Promise.all(
      strates.map(async (strate) => {
        const whereStrate = {
          ...whereBase,
          commune: {
            ...whereBase.commune,
            population: strate.condition,
          },
        };

        const nbQuestions = await prisma.interventions.count({
          where: whereStrate,
        });

        const nbCommunes = await prisma.communes.count({
          where: {
            actif: true,
            population: strate.condition,
          },
        });

        const totalInterventions = await prisma.interventions.count({
          where: whereBase,
        });

        const satisfaction = await prisma.interventions.aggregate({
          where: {
            ...whereStrate,
            satisfaction: { not: null },
          },
          _avg: {
            satisfaction: true,
          },
        });

        const nbEvaluations = await prisma.interventions.count({
          where: {
            ...whereStrate,
            satisfaction: { not: null },
          },
        });

        const pourcentage =
          totalInterventions > 0
            ? Math.round((nbQuestions / totalInterventions) * 100)
            : 0;

        return {
          strate: strate.label,
          nb_communes: nbCommunes,
          nb_questions: nbQuestions,
          pourcentage: pourcentage,
          satisfaction_moyenne: satisfaction._avg.satisfaction || 0,
          nb_evaluations: nbEvaluations,
        };
      })
    );

    // SATISFACTION PAR COMMUNE
    const satisfactionParCommune = await prisma.interventions.groupBy({
      by: ["commune_id"],
      where: {
        ...whereBase,
        satisfaction: { not: null },
      },
      _count: {
        satisfaction: true,
      },
      _avg: {
        satisfaction: true,
      },
    });

    const satisfactionParCommuneAvecDetails = await Promise.all(
      satisfactionParCommune.map(async (item) => {
        const commune = await prisma.communes.findUnique({
          where: { id: item.commune_id },
          select: { nom: true },
        });

        const totalQuestionsCommune = await prisma.interventions.count({
          where: {
            commune_id: item.commune_id,
            ...whereBase,
          },
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

    // SATISFACTION PAR STRATE
    const satisfactionParStrate = await Promise.all(
      strates.map(async (strate) => {
        const whereStrate = {
          ...whereBase,
          satisfaction: { not: null },
          commune: {
            ...whereBase.commune,
            population: strate.condition,
          },
        };

        const satisfaction = await prisma.interventions.aggregate({
          where: whereStrate,
          _avg: {
            satisfaction: true,
          },
          _min: {
            satisfaction: true,
          },
          _max: {
            satisfaction: true,
          },
          _count: {
            satisfaction: true,
          },
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

    res.json({
      questionsParCommune: questionsParCommuneAvecDetails,
      questionsParTheme: questionsParThemeAvecDetails,
      questionsParStrate: questionsParStrate,
      satisfactionParCommune: satisfactionParCommuneAvecDetails,
      satisfactionParStrate: satisfactionParStrate,
      resume: {
        totalCommunes: questionsParCommuneAvecDetails.length,
        totalThemes: questionsParThemeAvecDetails.length,
        totalInterventions: questionsParCommuneAvecDetails.reduce(
          (acc, curr) => acc + curr.nb_questions,
          0
        ),
        totalStrates: questionsParStrate.length,
        satisfactionGlobale:
          satisfactionParCommuneAvecDetails.length > 0
            ? parseFloat(
                (
                  satisfactionParCommuneAvecDetails.reduce(
                    (acc, curr) => acc + curr.satisfaction_moyenne,
                    0
                  ) / satisfactionParCommuneAvecDetails.length
                ).toFixed(1)
              )
            : 0,
      },
    });
  } catch (error) {
    console.error("Erreur détaillée stats avancées:", error);
    res.status(500).json({ error: "Erreur lors du calcul des statistiques" });
  }
});

module.exports = router;
