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
        // Champs sont obligatoires pour prisma mais non utilisés pour les questions
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
    return await prisma.interventions.update({
      where: { id: parseInt(interventionId) },
      data: {
        est_faq: true,
        date_publication_faq: new Date(),
        juriste_id: userId,
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

  // Retirer une intervention de la Faq
  async unpublishFromFaq(interventionId) {
    return await prisma.interventions.update({
      where: { id: parseInt(interventionId) },
      data: {
        est_faq: false,
        date_publication_faq: null,
      },
    });
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
