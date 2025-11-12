const archiveService = require("../services/archiveService");

const checkArchived = (tableName) => {
  return async (req, res, next) => {
    try {
      const entityId = parseInt(req.params.id);

      // Pour les routes sans ID spécifique
      if (!entityId || isNaN(entityId)) {
        return next();
      }

      const archiveStatus = await archiveService.checkArchiveStatus(
        tableName,
        entityId
      );

      if (archiveStatus.archived) {
        return res.status(410).json({
          error: `${tableName} est archivé et ne peut pas être modifié`,
          archive_date: archiveStatus.archive_date,
          archived_by: archiveStatus.archive?.archived_by,
        });
      }

      next();
    } catch (error) {
      console.error(`Erreur vérification archivage ${tableName}:`, error);
      res.status(500).json({ error: "Erreur vérification archivage" });
    }
  };
};

// Middleware pour vérifier si l'utilisateur connecté est archivé
const checkUserArchived = async (req, res, next) => {
  try {
    const archiveStatus = await archiveService.checkArchiveStatus(
      "utilisateurs",
      req.user.id
    );

    if (archiveStatus.archived) {
      return res.status(410).json({
        error: "Votre compte est archivé. Accès refusé.",
        archive_date: archiveStatus.archive_date,
      });
    }

    next();
  } catch (error) {
    console.error("Erreur vérification archivage utilisateur:", error);
    next();
  }
};

module.exports = { checkArchived, checkUserArchived };
