import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Démarrage du peuplement de la base...");

  // Nettoyage COMPLET (important avec le nouveau schéma)
  console.log("🧹 Nettoyage de la base...");
  await prisma.archive.deleteMany();
  await prisma.piecesJointes.deleteMany();
  await prisma.interventions.deleteMany();
  await prisma.retentionPolicy.deleteMany();
  await prisma.themes.deleteMany();
  await prisma.utilisateurs.deleteMany();
  await prisma.communes.deleteMany();

  console.log("✅ Base nettoyée");

  // --- COMMUNES ---
  console.log("🏙️ Création des communes...");
  const communes = await prisma.communes.createMany({
    data: [
      { nom: "Nuuk", code_postal: "3900", population: 18000 },
      { nom: "Sisimiut", code_postal: "3911", population: 5500 },
      { nom: "Ilulissat", code_postal: "3952", population: 4800 },
      { nom: "Qaqortoq", code_postal: "3920", population: 3200 },
      { nom: "Aasiaat", code_postal: "3950", population: 3100 },
    ],
  });

  const [nuuk, sisimiut, ilulissat, qaqortoq, aasiaat] =
    await prisma.communes.findMany();
  console.log(`✅ ${communes.count} communes créées`);

  // --- THEMES ---
  console.log("📚 Création des thèmes...");
  const themes = await prisma.themes.createMany({
    data: [
      { designation: "Urbanisme" },
      { designation: "Environnement" },
      { designation: "Éducation" },
      { designation: "Santé publique" },
      { designation: "Transport" },
      { designation: "Finances locales" },
    ],
  });
  console.log(`✅ ${themes.count} thèmes créés`);

  // --- POLITIQUES DE RETENTION ---
  console.log("📋 Création des politiques de rétention...");
  const [
    themeUrbanisme,
    themeEnvironnement,
    themeEducation,
    themeSante,
    themeTransport,
    themeFinances,
  ] = await prisma.themes.findMany();

  await prisma.retentionPolicy.createMany({
    data: [
      {
        theme_id: themeUrbanisme.id,
        duree_mois: 60,
        description: "Archivage après 5 ans pour urbanisme",
      },
      {
        theme_id: themeEnvironnement.id,
        duree_mois: 84,
        description: "Archivage après 7 ans pour environnement",
      },
      {
        theme_id: themeEducation.id,
        duree_mois: 36,
        description: "Archivage après 3 ans pour éducation",
      },
      {
        theme_id: themeSante.id,
        duree_mois: 120,
        description: "Archivage après 10 ans pour santé",
      },
      {
        theme_id: themeTransport.id,
        duree_mois: 48,
        description: "Archivage après 4 ans pour transport",
      },
      {
        theme_id: themeFinances.id,
        duree_mois: 72,
        description: "Archivage après 6 ans pour finances",
      },
    ],
  });
  console.log("✅ Politiques de rétention créées");

  // --- UTILISATEURS ---
  console.log("👥 Création des utilisateurs...");
  const salt = await bcrypt.genSalt(10);

  const passwordCommune = await bcrypt.hash("commune123", salt);
  const passwordJuriste = await bcrypt.hash("juriste123", salt);
  const passwordAdmin = await bcrypt.hash("admin123", salt);

  const users = await Promise.all([
    // Communes
    prisma.utilisateurs.create({
      data: {
        role: "commune",
        nom: "Andersen",
        prenom: "Marie",
        email: "marie.nuuk@commune.gl",
        mot_de_passe: passwordCommune,
        commune_id: nuuk.id,
      },
    }),
    prisma.utilisateurs.create({
      data: {
        role: "commune",
        nom: "Poulsen",
        prenom: "Peter",
        email: "peter.sisimiut@commune.gl",
        mot_de_passe: passwordCommune,
        commune_id: sisimiut.id,
      },
    }),

    prisma.utilisateurs.create({
      data: {
        role: "commune",
        nom: "Jensen",
        prenom: "Thomas",
        email: "thomas.qaqortoq@commune.gl",
        mot_de_passe: passwordCommune,
        commune_id: qaqortoq.id,
      },
    }),

    // Juristes
    prisma.utilisateurs.create({
      data: {
        role: "juriste",
        nom: "Christensen",
        prenom: "Lars",
        email: "lars.juriste@tag.gl",
        mot_de_passe: passwordJuriste,
        commune_id: nuuk.id, // Un juriste peut avoir une commune de référence
      },
    }),
    prisma.utilisateurs.create({
      data: {
        role: "juriste",
        nom: "Nielsen",
        prenom: "Anna",
        email: "anna.juriste@tag.gl",
        mot_de_passe: passwordJuriste,
        commune_id: sisimiut.id,
      },
    }),
    prisma.utilisateurs.create({
      data: {
        role: "juriste",
        nom: "Pedersen",
        prenom: "Mikkel",
        email: "mikkel.juriste@tag.gl",
        mot_de_passe: passwordJuriste,
        commune_id: ilulissat.id,
      },
    }),
    // Admin
    prisma.utilisateurs.create({
      data: {
        role: "admin",
        nom: "Admin",
        prenom: "TAG",
        email: "admin@tag.gl",
        mot_de_passe: passwordAdmin,
        commune_id: nuuk.id,
      },
    }),
    prisma.utilisateurs.create({
      data: {
        role: "admin",
        nom: "Curieux",
        prenom: "Pingouin",
        email: "nat.carteau@sfr.fr",
        mot_de_passe: passwordAdmin,
        commune_id: nuuk.id,
      },
    }),
    prisma.utilisateurs.create({
      data: {
        role: "admin",
        nom: "Emphatique",
        prenom: "Lion",
        email: "admin2@tag.gl",
        mot_de_passe: passwordAdmin,
        commune_id: nuuk.id,
      },
    }),
  ]);

  const [
    uNuuk,
    uSisimiut,
    uIlulissat,
    uQaqortoq,
    uAasiaat,
    juriste1,
    juriste2,
    juriste3,
    admin,
  ] = users;
  console.log(`✅ ${users.length} utilisateurs créés`);

  // --- INTERVENTIONS ---
  console.log("📞 Création des interventions...");

  const interventions = await Promise.all([
    // Interventions avec réponses
    prisma.interventions.create({
      data: {
        titre: "Permis de construire pour extension mairie",
        description:
          "Quelle est la procédure pour obtenir un permis de construire pour l'extension de notre mairie ? Doit-on fournir une étude d'impact environnementale ?",
        theme_id: themeUrbanisme.id,
        commune_id: nuuk.id,
        demandeur_id: uNuuk.id,
        juriste_id: juriste1.id,
        reponse:
          "La demande de permis doit inclure les plans architecturaux, une notice d'impact et l'avis de la commission urbanisme. L'étude d'impact environnementale est obligatoire pour les surfaces supérieures à 500m².",
        date_reponse: new Date("2024-10-15"),
        satisfaction: 4,
      },
    }),
    prisma.interventions.create({
      data: {
        titre: "Gestion des déchets dangereux",
        description:
          "Comment gérer le traitement des déchets dangereux provenant de notre laboratoire municipal ?",
        theme_id: themeEnvironnement.id,
        commune_id: sisimiut.id,
        demandeur_id: uSisimiut.id,
        juriste_id: juriste2.id,
        reponse:
          "Les déchets dangereux doivent être conditionnés selon le protocole TAG-ENV-2024 et transportés vers le centre de traitement agréé de Nuuk. Un registre de traçabilité est obligatoire.",
        date_reponse: new Date("2024-09-20"),
        satisfaction: 5,
      },
    }),
    prisma.interventions.create({
      data: {
        titre: "Rénovation école primaire",
        description:
          "Quelles sont les normes de sécurité à respecter pour la rénovation de notre école primaire ?",
        theme_id: themeEducation.id,
        commune_id: ilulissat.id,
        demandeur_id: uIlulissat.id,
        juriste_id: juriste3.id,
        reponse:
          "Les travaux doivent respecter les normes ERP (Établissement Recevant du Public) et inclure un diagnostic amiante/plomb. Un coordinateur SPS doit être désigné pour les travaux.",
        date_reponse: new Date("2024-11-05"),
        satisfaction: 4,
      },
    }),
    // Interventions en attente
    prisma.interventions.create({
      data: {
        titre: "Subventions pour transport scolaire",
        description:
          "Quelles sont les démarches pour obtenir des subventions pour le transport scolaire des élèves en zone rurale ?",
        theme_id: themeTransport.id,
        commune_id: qaqortoq.id,
        demandeur_id: uQaqortoq.id,
      },
    }),
    prisma.interventions.create({
      data: {
        titre: "Budget équipements sportifs",
        description:
          "Peut-on utiliser les fonds de la réserve parlementaire pour financer des équipements sportifs municipaux ?",
        theme_id: themeFinances.id,
        commune_id: aasiaat.id,
        demandeur_id: uAasiaat.id,
      },
    }),
    // Interventions répondues mais non notées
    prisma.interventions.create({
      data: {
        titre: "Normes isolation bâtiments",
        description:
          "Quelles sont les nouvelles normes d'isolation thermique pour les bâtiments municipaux ?",
        theme_id: themeUrbanisme.id,
        commune_id: nuuk.id,
        demandeur_id: uNuuk.id,
        juriste_id: juriste1.id,
        reponse:
          "La réglementation RT2024 impose une isolation renforcée avec un coefficient Uw ≤ 1.3 W/m².K pour les fenêtres et une étanchéité à l'air inférieure à 0.6 m³/h.m².",
        date_reponse: new Date("2024-11-08"),
      },
    }),
  ]);

  console.log(`✅ ${interventions.length} interventions créées`);

  // --- PIECES JOINTES ---
  console.log("📎 Création des pièces jointes...");
  await prisma.piecesJointes.createMany({
    data: [
      {
        nom_original: "plan_extension_mairie.pdf",
        nom_fichier: "plan_mairie_12345.pdf",
        chemin: "/uploads/plan_mairie_12345.pdf",
        intervention_id: interventions[0].id,
      },
      {
        nom_original: "protocole_dechets.pdf",
        nom_fichier: "protocole_dechets_67890.pdf",
        chemin: "/uploads/protocole_dechets_67890.pdf",
        intervention_id: interventions[1].id,
      },
      {
        nom_original: "normes_ecole.docx",
        nom_fichier: "normes_ecole_54321.docx",
        chemin: "/uploads/normes_ecole_54321.docx",
        intervention_id: interventions[2].id,
      },
    ],
  });
  console.log("✅ Pièces jointes créées");

  // --- ARCHIVES (exemple) ---
  console.log("📁 Création d'exemples d'archives...");
  await prisma.archive.create({
    data: {
      table_name: "interventions",
      entity_id: 999, // ID fictif pour démonstration
      entity_data: {
        id: 999,
        titre: "Ancienne intervention archivée",
        description: "Ceci est un exemple d'intervention archivée",
        date_question: new Date("2020-05-15"),
        date_reponse: new Date("2020-05-20"),
        satisfaction: 5,
      },
      raison: "Durée de conservation dépassée",
      archived_by_id: admin.id,
    },
  });
  console.log("✅ Exemple d'archive créé");

  console.log("🎉 Base peuplée avec succès !");
  console.log("📊 Récapitulatif :");
  console.log(`   - ${communes.count} communes`);
  console.log(`   - ${themes.count} thèmes`);
  console.log(`   - ${users.length} utilisateurs`);
  console.log(`   - ${interventions.length} interventions`);
  console.log("🔑 Comptes de test :");
  console.log("   Admin: admin@tag.gl / admin123");
  console.log("   Juriste: lars.juriste@tag.gl / juriste123");
  console.log("   Commune: marie.nuuk@commune.gl / commune123");
}

main()
  .catch((e) => {
    console.error("Erreur lors du peuplement:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
