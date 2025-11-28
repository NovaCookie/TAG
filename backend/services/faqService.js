const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class FaqService {
  // Récupérer toutes les Faq publiées
  async getAllFaqs(filters = {}) {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;

    const where = {
      est_faq: true,
      date_publication_faq: { not: null },
    };

    if (filters.search) {
      where.OR = [
        { titre: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { reponse: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters.theme && filters.theme !== "all") {
      where.theme_id = parseInt(filters.theme);
    }

    const [faqs, total] = await Promise.all([
      prisma.interventions.findMany({
        where,
        include: {
          theme: {
            select: { designation: true },
          },
          juriste: {
            select: { nom: true, prenom: true },
          },
        },
        orderBy: { date_publication_faq: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.interventions.count({ where }),
    ]);

    return {
      faqs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Créer une question Faq directement (sans commune ni demandeur)
  async createFaqQuestion(data, userId) {
    return await prisma.interventions.create({
      data: {
        titre: data.titre,
        description: data.description,
        reponse: data.reponse,
        theme_id: parseInt(data.theme_id),
        // Champs obligatoires pour prisma mais non utilisés pour les questions FAQ
        commune_id: 1, // ID d'une commune par défaut
        demandeur_id: userId, // L'utilisateur qui crée la Faq
        juriste_id: userId,
        est_faq: true,
        date_publication_faq: new Date(),
        date_question: new Date(),
        date_reponse: new Date(),
      },
      include: {
        theme: {
          select: { designation: true },
        },
        juriste: {
          select: { nom: true, prenom: true },
        },
      },
    });
  }

  // Publier une intervention existante en Faq
  async publishAsFaq(interventionId, userId) {
    try {
      console.log(`=== DÉBUT publishAsFaq ===`);
      console.log(`Intervention ID: ${interventionId}`);
      console.log(`User ID: ${userId}`);

      // D'abord, vérifier que l'intervention existe et a une réponse
      const intervention = await prisma.interventions.findUnique({
        where: { id: parseInt(interventionId) },
        select: {
          id: true,
          reponse: true,
          juriste_id: true,
          est_faq: true,
          titre: true,
        },
      });

      console.log(`Intervention trouvée:`, intervention);

      if (!intervention) {
        throw new Error(`Intervention avec ID ${interventionId} non trouvée`);
      }

      if (!intervention.reponse) {
        throw new Error(
          "Impossible d'ajouter à la FAQ une intervention sans réponse"
        );
      }

      // Vérifier si l'intervention est déjà en FAQ
      if (intervention.est_faq) {
        console.log(`L'intervention ${interventionId} est déjà en FAQ`);
        return intervention;
      }

      // Préparer les données de mise à jour
      const updateData = {
        est_faq: true,
        date_publication_faq: new Date(),
      };

      console.log(`Données de mise à jour:`, updateData);

      // Mettre à jour l'intervention
      const result = await prisma.interventions.update({
        where: { id: parseInt(interventionId) },
        data: updateData,
        include: {
          theme: {
            select: { designation: true },
          },
          juriste: {
            select: { nom: true, prenom: true },
          },
        },
      });

      console.log(`Résultat de la mise à jour:`, result);
      console.log(`=== SUCCÈS publishAsFaq ===`);

      return result;
    } catch (error) {
      console.error(`=== ERREUR publishAsFaq ===`);
      console.error(`Message: ${error.message}`);
      console.error(`Code: ${error.code}`);
      console.error(`Stack: ${error.stack}`);

      // Si c'est une erreur Prisma, logger les détails
      if (error.code) {
        console.error(`Code d'erreur Prisma: ${error.code}`);
      }

      if (error.meta) {
        console.error(`Métadonnées d'erreur:`, error.meta);
      }

      throw error;
    }
  }

  // Retirer une intervention de la Faq
  async unpublishFromFaq(interventionId) {
    try {
      console.log(`=== DÉBUT unpublishFromFaq ===`);
      console.log(`Intervention ID: ${interventionId}`);

      const intervention = await prisma.interventions.findUnique({
        where: { id: parseInt(interventionId) },
        select: {
          id: true,
          est_faq: true,
        },
      });

      console.log(`Intervention trouvée:`, intervention);

      if (!intervention) {
        throw new Error(`Intervention avec ID ${interventionId} non trouvée`);
      }

      if (!intervention.est_faq) {
        console.log(`L'intervention ${interventionId} n'est pas en FAQ`);
        return intervention;
      }

      const result = await prisma.interventions.update({
        where: { id: parseInt(interventionId) },
        data: {
          est_faq: false,
          date_publication_faq: null,
        },
      });

      console.log(`Résultat de la mise à jour:`, result);
      console.log(`=== SUCCÈS unpublishFromFaq ===`);

      return result;
    } catch (error) {
      console.error(`=== ERREUR unpublishFromFaq ===`);
      console.error(`Message: ${error.message}`);
      console.error(`Code: ${error.code}`);
      console.error(`Stack: ${error.stack}`);

      if (error.code) {
        console.error(`Code d'erreur Prisma: ${error.code}`);
      }

      throw error;
    }
  }

  // Trouver des Faq similaires pour une nouvelle question
  async findSimilarFaqs(titre, themeId, limit = 3) {
    const keywords = this.extractKeywords(titre);

    if (keywords.length === 0) {
      return [];
    }

    return await prisma.interventions.findMany({
      where: {
        est_faq: true,
        date_publication_faq: { not: null },
        OR: [
          {
            AND: [
              { theme_id: themeId },
              {
                OR: keywords.map((keyword) => ({
                  titre: { contains: keyword, mode: "insensitive" },
                })),
              },
            ],
          },
          {
            OR: keywords.map((keyword) => ({
              titre: { contains: keyword, mode: "insensitive" },
            })),
          },
        ],
      },
      include: {
        theme: {
          select: { designation: true },
        },
      },
      take: limit,
      orderBy: { date_publication_faq: "desc" },
    });
  }

  extractKeywords(text) {
    if (!text) return [];
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .slice(0, 5);
  }
}

module.exports = new FaqService();
