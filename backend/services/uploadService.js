const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const prisma = new PrismaClient();

class UploadService {
  // Upload des pièces jointes pour une intervention
  async uploadPiecesJointes(interventionId, files, userId, userRole) {
    const intervention = await prisma.interventions.findUnique({
      where: { id: interventionId },
      include: { demandeur: true },
    });

    if (!intervention) {
      this.cleanupFiles(files);
      throw new Error("Intervention non trouvée");
    }

    if (userRole === "commune" && intervention.demandeur_id !== userId) {
      this.cleanupFiles(files);
      throw new Error("Accès non autorisé");
    }

    const piecesJointes = await Promise.all(
      files.map((file) =>
        prisma.piecesJointes.create({
          data: {
            nom_original: file.originalname,
            nom_fichier: file.filename,
            chemin: file.path,
            intervention_id: interventionId,
          },
        })
      )
    );

    return {
      message: `${piecesJointes.length} fichier(s) uploadé(s) avec succès`,
      pieces_jointes: piecesJointes,
    };
  }

  // Obtenir les pièces jointes d'une intervention
  async getPiecesJointes(interventionId, userId, userRole) {
    const intervention = await prisma.interventions.findUnique({
      where: { id: interventionId },
      include: { demandeur: true },
    });

    if (!intervention) throw new Error("Intervention non trouvée");

    if (userRole === "commune" && intervention.demandeur_id !== userId) {
      throw new Error("Accès non autorisé");
    }

    return await prisma.piecesJointes.findMany({
      where: { intervention_id: interventionId },
    });
  }

  // Télécharger une pièce jointe
  async downloadPieceJointe(pieceId, userId, userRole) {
    const pieceJointe = await prisma.piecesJointes.findUnique({
      where: { id: pieceId },
      include: { intervention: { include: { demandeur: true } } },
    });

    if (!pieceJointe) throw new Error("Fichier non trouvé");

    const hasAccess =
      userRole === "admin" ||
      userRole === "juriste" ||
      (userRole === "commune" &&
        pieceJointe.intervention.demandeur_id === userId);

    if (!hasAccess) throw new Error("Accès non autorisé");
    if (!fs.existsSync(pieceJointe.chemin))
      throw new Error("Fichier introuvable");

    return {
      filePath: pieceJointe.chemin,
      originalName: pieceJointe.nom_original,
    };
  }

  // Supprimer une pièce jointe
  async deletePieceJointe(pieceId, userId, userRole) {
    const pieceJointe = await prisma.piecesJointes.findUnique({
      where: { id: pieceId },
      include: { intervention: { include: { demandeur: true } } },
    });

    if (!pieceJointe) throw new Error("Fichier non trouvé");

    const canDelete =
      userRole === "admin" ||
      (userRole === "commune" &&
        pieceJointe.intervention.demandeur_id === userId);

    if (!canDelete) throw new Error("Accès non autorisé");

    if (fs.existsSync(pieceJointe.chemin)) {
      fs.unlinkSync(pieceJointe.chemin);
    }

    await prisma.piecesJointes.delete({ where: { id: pieceId } });

    return { message: "Fichier supprimé avec succès" };
  }

  // Nettoyer les fichiers en cas d'erreur
  cleanupFiles(files) {
    if (files && files.length > 0) {
      files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch (error) {
            console.error(`Erreur suppression fichier ${file.path}:`, error);
          }
        }
      });
    }
  }
}

module.exports = new UploadService();
