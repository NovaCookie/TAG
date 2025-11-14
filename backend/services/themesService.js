const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class ThemesService {
  async getAllActiveThemes() {
    return await prisma.themes.findMany({
      where: { actif: true },
      select: {
        id: true,
        designation: true,
        date_creation: true,
      },
      orderBy: { designation: "asc" },
    });
  }

  async getAllThemes() {
    return await prisma.themes.findMany({
      select: {
        id: true,
        designation: true,
        actif: true,
        date_creation: true,
      },
      orderBy: { designation: "asc" },
    });
  }

  async createTheme(designation) {
    // Vérifier si le thème existe déjà
    const existingTheme = await prisma.themes.findFirst({
      where: {
        designation: {
          equals: designation,
          mode: "insensitive",
        },
      },
    });

    if (existingTheme) {
      throw new Error("Ce thème existe déjà");
    }

    return await prisma.themes.create({
      data: {
        designation: designation.trim(),
      },
    });
  }

  async updateTheme(id, data) {
    return await prisma.themes.update({
      where: { id: parseInt(id) },
      data: {
        designation: data.designation,
        actif: data.actif,
      },
    });
  }
}

module.exports = new ThemesService();
