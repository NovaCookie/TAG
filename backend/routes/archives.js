const express = require("express");
const { authMiddleware, requireRole } = require("../middleware/auth");
const ArchiveService = require("../services/archiveService");
const router = express.Router();

// GET /api/archives - Liste toutes les archives avec filtres
router.get(
  "/",
  authMiddleware,
  requireRole(["admin", "juriste"]),
  async (req, res) => {
    try {
      const {
        table_name,
        search,
        role,
        populationMin,
        populationMax,
        dateArchivageDebut,
        dateArchivageFin,
        page,
        limit,
      } = req.query;

      let result;
      if (table_name) {
        // Archives d'une table spécifique avec filtres avancés
        result = await ArchiveService.getArchivesByTableWithFilters(
          table_name,
          {
            search,
            role,
            populationMin,
            populationMax,
            dateArchivageDebut,
            dateArchivageFin,
          },
          parseInt(page) || 1,
          parseInt(limit) || 20
        );
      } else {
        // Toutes les archives (pourrait nécessiter une implémentation différente)
        result = await ArchiveService.ArchiveListByTable(
          "interventions",
          parseInt(page) || 1,
          parseInt(limit) || 20
        );
      }

      res.json(result);
    } catch (error) {
      console.error("Erreur liste archives:", error);
      res.status(500).json({ error: "Erreur lors du chargement des archives" });
    }
  }
);

// POST /api/archives/:table/:id - Archiver une entité
router.post(
  "/:table/:id",
  authMiddleware,
  requireRole(["admin", "juriste"]),
  async (req, res) => {
    try {
      const { table, id } = req.params;
      const { raison } = req.body;

      // Validation des tables autorisées
      const tablesAutorisees = ["interventions", "communes", "utilisateurs"];
      if (!tablesAutorisees.includes(table)) {
        return res
          .status(400)
          .json({ error: "Table non autorisée pour l'archivage" });
      }

      const archive = await ArchiveService.archiveEntity(
        table,
        parseInt(id),
        raison,
        req.user.id
      );

      res.json({
        message: `${table} archivée avec succès`,
        archive,
      });
    } catch (error) {
      console.error("Erreur archivage:", error);

      if (
        error.message.includes("déjà archivée") ||
        error.message.includes("non trouvée")
      ) {
        return res.status(400).json({ error: error.message });
      }

      res.status(500).json({ error: "Erreur lors de l'archivage" });
    }
  }
);

// DELETE /api/archives/:table/:id - Restaurer une entité
router.delete(
  "/:table/:id",
  authMiddleware,
  requireRole(["admin", "juriste"]),
  async (req, res) => {
    try {
      const { table, id } = req.params;

      // Validation des tables autorisées
      const tablesAutorisees = ["interventions", "communes", "utilisateurs"];
      if (!tablesAutorisees.includes(table)) {
        return res.status(400).json({ error: "Table non autorisée" });
      }

      const result = await ArchiveService.restoreEntity(table, parseInt(id));
      res.json(result);
    } catch (error) {
      console.error("Erreur restauration:", error);

      if (error.message.includes("non trouvée")) {
        return res.status(404).json({ error: error.message });
      }

      res.status(500).json({ error: "Erreur lors de la restauration" });
    }
  }
);

// GET /api/archives/:table/:id/status - Vérifier statut archivage
router.get("/:table/:id/status", authMiddleware, async (req, res) => {
  try {
    const { table, id } = req.params;
    const archive = await ArchiveService.isArchived(table, parseInt(id));
    res.json({
      archived: !!archive,
      archive: archive,
    });
  } catch (error) {
    console.error("Erreur vérification statut:", error);
    res.status(500).json({ error: "Erreur vérification statut archivage" });
  }
});

// GET /api/archives/stats/global - Statistiques d'archivage
router.get(
  "/stats/global",
  authMiddleware,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const stats = await ArchiveService.getStatsArchivage();
      res.json(stats);
    } catch (error) {
      console.error("Erreur stats archives:", error);
      res.status(500).json({ error: "Erreur calcul statistiques archives" });
    }
  }
);

module.exports = router;
