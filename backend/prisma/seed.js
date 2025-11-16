import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Démarrage du peuplement de la base...");

  // Nettoyage COMPLET
  console.log("🧹 Nettoyage de la base...");
  await prisma.archive.deleteMany();
  await prisma.piecesJointes.deleteMany();
  await prisma.interventions.deleteMany();
  await prisma.retentionPolicy.deleteMany();
  await prisma.themes.deleteMany();
  await prisma.utilisateurs.deleteMany();
  await prisma.communes.deleteMany();

  console.log("Base nettoyée");

  // --- COMMUNES ---
  console.log("🏙️ Création des communes...");
  const communes = await prisma.communes.createMany({
    data: [
      { nom: "Nuuk", code_postal: "3900", population: 18000 },
      { nom: "Sisimiut", code_postal: "3911", population: 5500 },
      { nom: "Ilulissat", code_postal: "3952", population: 4800 },
      { nom: "Qaqortoq", code_postal: "3920", population: 3200 },
      { nom: "Aasiaat", code_postal: "3950", population: 3100 },
      { nom: "Maniitsoq", code_postal: "3912", population: 2600 },
      { nom: "Tasiilaq", code_postal: "3913", population: 2000 },
      { nom: "Paamiut", code_postal: "3940", population: 1500 },
    ],
  });

  const [
    nuuk,
    sisimiut,
    ilulissat,
    qaqortoq,
    aasiaat,
    maniitsoq,
    tasiilaq,
    paamiut,
  ] = await prisma.communes.findMany();
  console.log(`${communes.count} communes créées`);

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
      { designation: "Culture" },
      { designation: "Sports" },
    ],
  });
  console.log(`${themes.count} thèmes créés`);

  // --- POLITIQUES DE RETENTION ---
  console.log("📋 Création des politiques de rétention...");
  const allThemes = await prisma.themes.findMany();

  await prisma.retentionPolicy.createMany({
    data: [
      {
        theme_id: allThemes[0].id, // Urbanisme
        duree_mois: 60,
        description: "Archivage après 5 ans pour urbanisme",
      },
      {
        theme_id: allThemes[1].id, // Environnement
        duree_mois: 84,
        description: "Archivage après 7 ans pour environnement",
      },
      {
        theme_id: allThemes[2].id, // Éducation
        duree_mois: 36,
        description: "Archivage après 3 ans pour éducation",
      },
      {
        theme_id: allThemes[3].id, // Santé
        duree_mois: 120,
        description: "Archivage après 10 ans pour santé",
      },
      {
        theme_id: allThemes[4].id, // Transport
        duree_mois: 48,
        description: "Archivage après 4 ans pour transport",
      },
      {
        theme_id: allThemes[5].id, // Finances
        duree_mois: 72,
        description: "Archivage après 6 ans pour finances",
      },
    ],
  });
  console.log("Politiques de rétention créées");

  // --- UTILISATEURS ---
  console.log("👥 Création des utilisateurs...");
  const salt = await bcrypt.genSalt(10);

  const passwordCommune = await bcrypt.hash("commune123", salt);
  const passwordJuriste = await bcrypt.hash("juriste123", salt);
  const passwordAdmin = await bcrypt.hash("admin123", salt);

  const users = await Promise.all([
    // === COMMUNES (Adjectif + Animal) ===
    prisma.utilisateurs.create({
      data: {
        role: "commune",
        nom: "Colérique",
        prenom: "Lion",
        email: "lion.colerique@commune.tag.gl",
        mot_de_passe: passwordCommune,
        commune_id: nuuk.id,
      },
    }),
    prisma.utilisateurs.create({
      data: {
        role: "commune",
        nom: "Joyeux",
        prenom: "Dauphin",
        email: "dauphin.joyeux@commune.tag.gl",
        mot_de_passe: passwordCommune,
        commune_id: sisimiut.id,
      },
    }),
    prisma.utilisateurs.create({
      data: {
        role: "commune",
        nom: "Courageux",
        prenom: "Aigle",
        email: "aigle.courageux@commune.tag.gl",
        mot_de_passe: passwordCommune,
        commune_id: ilulissat.id,
      },
    }),
    prisma.utilisateurs.create({
      data: {
        role: "commune",
        nom: "Curieux",
        prenom: "Renard",
        email: "renard.curieux@commune.tag.gl",
        mot_de_passe: passwordCommune,
        commune_id: qaqortoq.id,
      },
    }),
    prisma.utilisateurs.create({
      data: {
        role: "commune",
        nom: "Fidèle",
        prenom: "Chien",
        email: "chien.fidele@commune.tag.gl",
        mot_de_passe: passwordCommune,
        commune_id: aasiaat.id,
      },
    }),
    prisma.utilisateurs.create({
      data: {
        role: "commune",
        nom: "Patient",
        prenom: "Tortue",
        email: "tortue.patient@commune.tag.gl",
        mot_de_passe: passwordCommune,
        commune_id: maniitsoq.id,
      },
    }),

    // === JURISTES (Adjectif + Animal) ===
    prisma.utilisateurs.create({
      data: {
        role: "juriste",
        nom: "Sage",
        prenom: "Hibou",
        email: "hibou.sage@juriste.tag.gl",
        mot_de_passe: passwordJuriste,
        commune_id: nuuk.id,
      },
    }),
    prisma.utilisateurs.create({
      data: {
        role: "juriste",
        nom: "Dynamique",
        prenom: "Écureuil",
        email: "ecureuil.dynamique@juriste.tag.gl",
        mot_de_passe: passwordJuriste,
        commune_id: sisimiut.id,
      },
    }),
    prisma.utilisateurs.create({
      data: {
        role: "juriste",
        nom: "Serein",
        prenom: "Panda",
        email: "panda.serein@juriste.tag.gl",
        mot_de_passe: passwordJuriste,
        commune_id: ilulissat.id,
      },
    }),
    prisma.utilisateurs.create({
      data: {
        role: "juriste",
        nom: "Emphatique",
        prenom: "Éléphant",
        email: "elephant.emphatique@juriste.tag.gl",
        mot_de_passe: passwordJuriste,
        commune_id: qaqortoq.id,
      },
    }),

    // === ADMINS (Adjectif + Animal) ===
    prisma.utilisateurs.create({
      data: {
        role: "admin",
        nom: "Carteau",
        prenom: "Nat",
        email: "nat.carteau@sfr.fr",
        mot_de_passe: passwordAdmin,
        commune_id: nuuk.id,
      },
    }),
    prisma.utilisateurs.create({
      data: {
        role: "admin",
        nom: "Vigilant",
        prenom: "Lynx",
        email: "lynx.vigilant@admin.tag.gl",
        mot_de_passe: passwordAdmin,
        commune_id: sisimiut.id,
      },
    }),
    prisma.utilisateurs.create({
      data: {
        role: "admin",
        nom: "Organisé",
        prenom: "Castor",
        email: "castor.organise@admin.tag.gl",
        mot_de_passe: passwordAdmin,
        commune_id: ilulissat.id,
      },
    }),
    prisma.utilisateurs.create({
      data: {
        role: "admin",
        nom: "Stratège",
        prenom: "Corbeau",
        email: "corbeau.strategie@admin.tag.gl",
        mot_de_passe: passwordAdmin,
        commune_id: qaqortoq.id,
      },
    }),
  ]);

  console.log(`${users.length} utilisateurs créés`);

  // Extraire les utilisateurs par rôle pour faciliter les références
  const communesUsers = users.filter((u) => u.role === "commune");
  const juristesUsers = users.filter((u) => u.role === "juriste");
  const adminsUsers = users.filter((u) => u.role === "admin");

  // --- INTERVENTIONS ---
  console.log("📞 Création des interventions...");

  const interventions = await Promise.all([
    // Interventions avec réponses (pour la Faq)
    prisma.interventions.create({
      data: {
        titre: "Permis de construire pour extension mairie",
        description:
          "Quelle est la procédure pour obtenir un permis de construire pour l'extension de notre mairie ? Doit-on fournir une étude d'impact environnementale ?",
        theme_id: allThemes[0].id, // Urbanisme
        commune_id: nuuk.id,
        demandeur_id: communesUsers[0].id, // Colérique Lion
        juriste_id: juristesUsers[0].id, // Sage Hibou
        reponse:
          "La demande de permis doit inclure les plans architecturaux, une notice d'impact et l'avis de la commission urbanisme. L'étude d'impact environnementale est obligatoire pour les surfaces supérieures à 500m². Le délai moyen de traitement est de 3 mois.",
        date_question: new Date("2024-10-10"),
        date_reponse: new Date("2024-10-15"),
        satisfaction: 4,
        est_faq: true,
        date_publication_faq: new Date("2024-10-20"),
      },
    }),
    prisma.interventions.create({
      data: {
        titre: "Gestion des déchets dangereux",
        description:
          "Comment gérer le traitement des déchets dangereux provenant de notre laboratoire municipal ?",
        theme_id: allThemes[1].id, // Environnement
        commune_id: sisimiut.id,
        demandeur_id: communesUsers[1].id, // Joyeux Dauphin
        juriste_id: juristesUsers[1].id, // Dynamique Écureuil
        reponse:
          "Les déchets dangereux doivent être conditionnés selon le protocole TAG-ENV-2024 et transportés vers le centre de traitement agréé de Nuuk. Un registre de traçabilité est obligatoire. Les coûts de traitement sont éligibles aux subventions environnementales.",
        date_question: new Date("2024-09-15"),
        date_reponse: new Date("2024-09-20"),
        satisfaction: 5,
        est_faq: true,
        date_publication_faq: new Date("2024-09-25"),
      },
    }),
    prisma.interventions.create({
      data: {
        titre: "Rénovation école primaire - normes de sécurité",
        description:
          "Quelles sont les normes de sécurité à respecter pour la rénovation de notre école primaire ?",
        theme_id: allThemes[2].id, // Éducation
        commune_id: ilulissat.id,
        demandeur_id: communesUsers[2].id, // Courageux Aigle
        juriste_id: juristesUsers[2].id, // Serein Panda
        reponse:
          "Les travaux doivent respecter les normes ERP (Établissement Recevant du Public) et inclure un diagnostic amiante/plomb. Un coordinateur SPS doit être désigné pour les travaux. Les issues de secours doivent être maintenues accessibles pendant toute la durée des travaux.",
        date_question: new Date("2024-10-28"),
        date_reponse: new Date("2024-11-05"),
        satisfaction: 4,
        est_faq: true,
        date_publication_faq: new Date("2024-11-10"),
      },
    }),
    // Interventions avec réponses mais pas en Faq
    prisma.interventions.create({
      data: {
        titre: "Subventions pour transport scolaire",
        description:
          "Quelles sont les démarches pour obtenir des subventions pour le transport scolaire des élèves en zone rurale ?",
        theme_id: allThemes[4].id, // Transport
        commune_id: qaqortoq.id,
        demandeur_id: communesUsers[3].id, // Curieux Renard
        juriste_id: juristesUsers[3].id, // Emphatique Éléphant
        reponse:
          "Les demandes de subvention doivent être déposées avant le 31 mars auprès de la Direction Régionale des Transports. Le formulaire CERFA 12345*08 est requis, accompagné d'une étude de fréquentation.",
        date_question: new Date("2024-11-05"),
        date_reponse: new Date("2024-11-12"),
        satisfaction: 3,
      },
    }),
    // Interventions en attente de réponse
    prisma.interventions.create({
      data: {
        titre: "Budget équipements sportifs",
        description:
          "Peut-on utiliser les fonds de la réserve parlementaire pour financer des équipements sportifs municipaux ?",
        theme_id: allThemes[5].id, // Finances
        commune_id: aasiaat.id,
        demandeur_id: communesUsers[4].id, // Fidèle Chien
        date_question: new Date("2024-11-14"),
      },
    }),
    prisma.interventions.create({
      data: {
        titre: "Organisation festival culturel",
        description:
          "Quelles sont les obligations légales pour organiser un festival culturel municipal ?",
        theme_id: allThemes[6].id, // Culture
        commune_id: maniitsoq.id,
        demandeur_id: communesUsers[5].id, // Patient Tortue
        date_question: new Date("2024-11-13"),
      },
    }),
    // Autre intervention en Faq
    prisma.interventions.create({
      data: {
        titre: "Normes isolation bâtiments municipaux",
        description:
          "Quelles sont les nouvelles normes d'isolation thermique pour les bâtiments municipaux ?",
        theme_id: allThemes[0].id, // Urbanisme
        commune_id: tasiilaq.id,
        demandeur_id: communesUsers[0].id,
        juriste_id: juristesUsers[0].id,
        reponse:
          "La réglementation RT2024 impose une isolation renforcée avec un coefficient Uw ≤ 1.3 W/m².K pour les fenêtres et une étanchéité à l'air inférieure à 0.6 m³/h.m². Des aides sont disponibles via le Fonds Vert Municipal.",
        date_question: new Date("2024-10-30"),
        date_reponse: new Date("2024-11-08"),
        est_faq: true,
        date_publication_faq: new Date("2024-11-15"),
      },
    }),
  ]);

  console.log(`${interventions.length} interventions créées`);

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
  console.log("Pièces jointes créées");

  // --- ARCHIVES (exemple) ---
  console.log("📁 Création d'exemples d'archives...");
  await prisma.archive.create({
    data: {
      table_name: "interventions",
      entity_id: 999,
      entity_data: {
        id: 999,
        titre: "Ancienne intervention archivée",
        description: "Ceci est un exemple d'intervention archivée",
        date_question: new Date("2023-05-15"),
        date_reponse: new Date("2023-05-20"),
        satisfaction: 5,
      },
      raison: "Durée de conservation dépassée",
      archived_by_id: adminsUsers[1].id,
    },
  });
  console.log("Exemple d'archive créé");

  console.log("🎉 Base peuplée avec succès !");
  console.log("📊 Récapitulatif :");
  console.log(`   - ${communes.count} communes`);
  console.log(`   - ${themes.count} thèmes`);
  console.log(
    `   - ${users.length} utilisateurs (${communesUsers.length} communes, ${juristesUsers.length} juristes, ${adminsUsers.length} admins)`
  );
  console.log(
    `   - ${interventions.length} interventions (dont ${
      interventions.filter((i) => i.est_faq).length
    } en Faq)`
  );

  console.log("\n🔑 Comptes de test :");
  console.log("   ADMIN: nat.carteau@sfr.fr / admin123");
  console.log("   ADMIN: lynx.vigilant@admin.tag.gl / admin123");
  console.log("   JURISTE: hibou.sage@juriste.tag.gl / juriste123");
  console.log("   COMMUNE: lion.colerique@commune.tag.gl / commune123");
  console.log("   COMMUNE: dauphin.joyeux@commune.tag.gl / commune123");

  console.log("\n🐾 Utilisateurs créés :");
  communesUsers.forEach((user) => {
    console.log(`   - ${user.prenom} ${user.nom} (${user.email})`);
  });
  juristesUsers.forEach((user) => {
    console.log(`   - ${user.prenom} ${user.nom} (${user.email})`);
  });
  adminsUsers.forEach((user) => {
    console.log(`   - ${user.prenom} ${user.nom} (${user.email})`);
  });
}

main()
  .catch((e) => {
    console.error("Erreur lors du peuplement:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
