const cron = require("node-cron");
const retentionService = require("./retentionService");

class CronService {
  startAutoArchive() {
    // Tous les jours à 2h du matin
    cron.schedule("0 2 * * *", async () => {
      console.log("Début archivage automatique RGPD...");
      try {
        await retentionService.autoArchiveExpiredInterventions();
        console.log("Archivage automatique terminé");
      } catch (error) {
        console.error("Erreur archivage automatique:", error);
      }
    });

    console.log(
      "Tâche d'archivage automatique programmée (tous les jours à 2h)"
    );
  }
}

module.exports = new CronService();
