const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const archiveService = require("./archiveService");

class RetentionService {
  async autoArchiveExpiredInterventions() {
    try {
      console.log("Début archivage automatique RGPD...");

      // Récupérer les IDs des interventions déjà archivées
      const archivedInterventions = await prisma.archive.findMany({
        where: { table_name: "interventions" },
        select: { entity_id: true },
      });
      const archivedIds = archivedInterventions.map(
        (archive) => archive.entity_id
      );

      const interventions = await prisma.interventions.findMany({
        where: {
          date_reponse: { not: null },
          id: { notIn: archivedIds.length > 0 ? archivedIds : [-1] },
        },
        include: {
          theme: {
            include: {
              retentionPolicies: {
                take: 1,
              },
            },
          },
          commune: {
            select: { nom: true },
          },
          demandeur: {
            select: { nom: true, prenom: true },
          },
        },
      });

      console.log(`${interventions.length} interventions à vérifier`);

      let archivedCount = 0;
      let errorCount = 0;
      let skippedCount = 0;

      for (const intervention of interventions) {
        try {
          const retentionPolicy = intervention.theme?.retentionPolicies[0];

          // Si pas de politique, on saute (ne pas archiver sans politique explicite)
          if (!retentionPolicy) {
            console.log(
              `Intervention ${intervention.id} ignorée: pas de politique de rétention`
            );
            skippedCount++;
            continue;
          }

          const dureeMois = retentionPolicy.duree_mois;
          const archiveDate = new Date(intervention.date_reponse);
          archiveDate.setMonth(archiveDate.getMonth() + dureeMois);

          if (archiveDate < new Date()) {
            await archiveService.archiveEntity(
              "interventions",
              intervention.id,
              `Archivage automatique RGPD - Politique "${retentionPolicy.description}" (${dureeMois} mois)`,
              null // système automatique
            );
            archivedCount++;
            console.log(
              `Intervention ${intervention.id} archivée (${
                intervention.commune?.nom || "Commune inconnue"
              })`
            );
          } else {
            const joursRestants = Math.ceil(
              (archiveDate - new Date()) / (1000 * 60 * 60 * 24)
            );
            console.log(
              `Intervention ${intervention.id}: archivage dans ${joursRestants} jours`
            );
          }
        } catch (error) {
          console.error(
            `Erreur intervention ${intervention.id}:`,
            error.message
          );
          errorCount++;
        }
      }

      console.log(
        `Archivage terminé: ${archivedCount} archivées, ${errorCount} erreurs, ${skippedCount} ignorées`
      );

      return {
        archivedCount,
        errorCount,
        skippedCount,
        totalProcessed: interventions.length,
      };
    } catch (error) {
      console.error("Erreur lors de l'archivage automatique:", error);
      throw error;
    }
  }

  // Méthode pour tester manuellement
  async testAutoArchive() {
    console.log("Test manuel de l'archivage automatique...");
    return await this.autoArchiveExpiredInterventions();
  }

  // Méthode pour forcer l'archivage d'une intervention spécifique (pour tests)
  async forceArchiveIntervention(interventionId, raison = "Test manuel") {
    try {
      await archiveService.archiveEntity(
        "interventions",
        interventionId,
        raison,
        null
      );
      console.log(`Intervention ${interventionId} archivée manuellement`);
      return { success: true, interventionId };
    } catch (error) {
      console.error(`Erreur archivage manuel ${interventionId}:`, error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new RetentionService();
