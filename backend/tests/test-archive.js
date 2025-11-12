// backend/test-archive.js
const ArchiveService = require("./services/archiveService");

async function testArchiveSystem() {
  try {
    console.log("🧪 TEST du nouveau système d'archivage...");

    // 1. Tester l'archivage d'une intervention
    const archive = await ArchiveService.archiveEntity(
      "interventions",
      1,
      "Test archivage nouveau système",
      1 // ID utilisateur admin
    );

    console.log("✅ Archivage réussi:", archive);

    // 2. Vérifier le statut
    const isArchived = await ArchiveService.isArchived("interventions", 1);
    console.log("✅ Statut vérifié:", isArchived);

    // 3. Lister les archives
    const archives = await ArchiveService.ArchiveListByTable("interventions");
    console.log("✅ Liste archives:", archives.archives.length, "trouvées");
  } catch (error) {
    console.log("Test échoué:", error.message);
  }
}

testArchiveSystem();
