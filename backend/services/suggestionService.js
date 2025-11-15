// services/suggestionService.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class SuggestionService {
  async findSimilarInterventions(interventionId, limit = 5) {
    try {
      // Récupérer l'intervention actuelle
      const currentIntervention = await prisma.interventions.findUnique({
        where: { id: interventionId },
        include: {
          theme: true,
        },
      });

      if (!currentIntervention) {
        throw new Error("Intervention non trouvée");
      }

      // Extraire les mots-clés du titre (mots de plus de 3 caractères)
      const keywords = this.extractKeywords(currentIntervention.titre || "");

      if (keywords.length === 0) {
        return [];
      }

      // Chercher les interventions similaires
      const similarInterventions = await prisma.interventions.findMany({
        where: {
          AND: [
            {
              id: { not: interventionId }, // Exclure l'intervention actuelle
            },
            {
              OR: [
                // Même thème ET mots similaires dans le titre
                {
                  AND: [
                    { theme_id: currentIntervention.theme_id },
                    {
                      OR: keywords.map((keyword) => ({
                        titre: {
                          contains: keyword,
                          mode: "insensitive",
                        },
                      })),
                    },
                  ],
                },
                // Ou bien titre très similaire même avec thème différent
                {
                  AND: [
                    {
                      OR: keywords.map((keyword) => ({
                        titre: {
                          contains: keyword,
                          mode: "insensitive",
                        },
                      })),
                    },
                    // Prioriser celles avec au moins 2 mots en commun
                    {
                      titre: {
                        contains:
                          keywords.length > 1 ? keywords[1] : keywords[0],
                        mode: "insensitive",
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
        include: {
          commune: {
            select: { nom: true },
          },
          theme: {
            select: { designation: true },
          },
          demandeur: {
            select: { nom: true, prenom: true },
          },
        },
        orderBy: [
          // Prioriser : même thème + plus de mots en commun
          { theme_id: "desc" }, // Même thème d'abord
          { date_question: "desc" }, // Plus récentes d'abord
        ],
        take: limit,
      });

      return similarInterventions;
    } catch (error) {
      console.error("Erreur recherche questions similaires:", error);
      throw error;
    }
  }

  async countSimilarInterventions(interventionId) {
    try {
      const similar = await this.findSimilarInterventions(interventionId, 50); // Limite haute pour comptage
      return similar.length;
    } catch (error) {
      console.error("Erreur comptage questions similaires:", error);
      return 0;
    }
  }

  extractKeywords(title) {
    if (!title) return [];

    // Nettoyer le titre : supprimer la ponctuation, mettre en minuscule
    const cleanTitle = title
      .replace(/[^\w\s]/g, " ") // Remplacer ponctuation par espaces
      .toLowerCase()
      .trim();

    // Séparer en mots
    const words = cleanTitle.split(/\s+/);

    // Filtrer : mots de plus de 3 caractères, exclure mots vides
    const stopWords = new Set([
      "les",
      "des",
      "une",
      "dans",
      "pour",
      "avec",
      "sans",
      "sous",
      "sur",
      "chez",
      "vers",
      "dont",
      "quoi",
      "quel",
      "quels",
      "quelle",
      "quelles",
      "comment",
      "pourquoi",
      "quand",
      "combien",
      "est",
      "sont",
      "sera",
      "seraient",
    ]);

    const keywords = words
      .filter(
        (word) =>
          word.length > 3 && !stopWords.has(word) && !this.isCommonWord(word)
      )
      .slice(0, 5); // Prendre max 5 mots-clés

    return keywords;
  }

  isCommonWord(word) {
    const commonWords = [
      "question",
      "demande",
      "information",
      "problème",
      "situation",
      "besoin",
      "aide",
      "conseil",
      "juridique",
      "droit",
      "loi",
    ];
    return commonWords.includes(word);
  }

  // Méthode pour les nouvelles questions (avant création)
  async findSimilarForNewQuestion(titre, themeId, limit = 5) {
    try {
      const keywords = this.extractKeywords(titre);

      if (keywords.length === 0) {
        return [];
      }

      const similarInterventions = await prisma.interventions.findMany({
        where: {
          OR: [
            // Même thème ET mots similaires
            {
              AND: [
                { theme_id: themeId },
                {
                  OR: keywords.map((keyword) => ({
                    titre: {
                      contains: keyword,
                      mode: "insensitive",
                    },
                  })),
                },
              ],
            },
            // Titre très similaire
            {
              AND: [
                {
                  OR: keywords.map((keyword) => ({
                    titre: {
                      contains: keyword,
                      mode: "insensitive",
                    },
                  })),
                },
                {
                  titre: {
                    contains: keywords.length > 1 ? keywords[1] : keywords[0],
                    mode: "insensitive",
                  },
                },
              ],
            },
          ],
        },
        include: {
          commune: {
            select: { nom: true },
          },
          theme: {
            select: { designation: true },
          },
        },
        orderBy: [{ theme_id: "desc" }, { date_question: "desc" }],
        take: limit,
      });

      return similarInterventions;
    } catch (error) {
      console.error("Erreur recherche similarités nouvelle question:", error);
      return [];
    }
  }
}

module.exports = new SuggestionService();
