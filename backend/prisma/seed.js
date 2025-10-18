import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Démarrage du peuplement de la base...')

  // Nettoyage (utile en développement)
  await prisma.piecesJointes.deleteMany()
  await prisma.interventions.deleteMany()
  await prisma.utilisateurs.deleteMany()
  await prisma.themes.deleteMany()
  await prisma.communes.deleteMany()

  console.log('🧹 Base nettoyée')

  // --- COMMUNES ---
  const communes = await prisma.communes.createMany({
    data: [
      { nom: 'Nuuk', population: 18000 },
      { nom: 'Sisimiut', population: 5500 },
      { nom: 'Ilulissat', population: 4800 },
    ],
  })
  console.log('🏙️ Communes créées')

  // --- THEMES ---
  const themes = await prisma.themes.createMany({
    data: [
      { designation: 'Urbanisme' },
      { designation: 'Environnement' },
      { designation: 'Éducation' },
      { designation: 'Santé publique' },
    ],
  })
  console.log('📚 Thèmes créés')

  // --- UTILISATEURS ---
  const salt = await bcrypt.genSalt(10)

  const passwordCommune = await bcrypt.hash('commune123', salt)
  const passwordJuriste = await bcrypt.hash('juriste123', salt)
  const passwordAdmin = await bcrypt.hash('admin123', salt)

  const [nuuk, sisimiut, ilulissat] = await prisma.communes.findMany()

  const [uNuuk, uSisimiut, uIlulissat, juriste1, juriste2, admin] = await Promise.all([
    prisma.utilisateurs.create({
      data: {
        role: 'commune',
        nom: 'Andersen',
        prenom: 'Marie',
        email: 'marie.nuuk@commune.gl',
        mot_de_passe: passwordCommune,
        commune_id: nuuk.id,
      },
    }),
    prisma.utilisateurs.create({
      data: {
        role: 'commune',
        nom: 'Poulsen',
        prenom: 'Peter',
        email: 'peter.sisimiut@commune.gl',
        mot_de_passe: passwordCommune,
        commune_id: sisimiut.id,
      },
    }),
    prisma.utilisateurs.create({
      data: {
        role: 'commune',
        nom: 'Olsen',
        prenom: 'Sara',
        email: 'sara.ilulissat@commune.gl',
        mot_de_passe: passwordCommune,
        commune_id: ilulissat.id,
      },
    }),
    prisma.utilisateurs.create({
      data: {
        role: 'juriste',
        nom: 'Christensen',
        prenom: 'Lars',
        email: 'lars.juriste@tag.gl',
        mot_de_passe: passwordJuriste,
      },
    }),
    prisma.utilisateurs.create({
      data: {
        role: 'juriste',
        nom: 'Nielsen',
        prenom: 'Anna',
        email: 'anna.juriste@tag.gl',
        mot_de_passe: passwordJuriste,
      },
    }),
    prisma.utilisateurs.create({
      data: {
        role: 'admin',
        nom: 'Admin',
        prenom: 'TAG',
        email: 'admin@tag.gl',
        mot_de_passe: passwordAdmin,
      },
    }),
  ])

  console.log('👥 Utilisateurs créés')

  // --- INTERVENTIONS ---
  const [themeUrbanisme, themeEnvironnement] = await prisma.themes.findMany({
    where: { designation: { in: ['Urbanisme', 'Environnement'] } },
  })

  const intervention1 = await prisma.interventions.create({
    data: {
      question:
        'Quelle est la procédure pour obtenir un permis de construire dans la commune ?',
      urgent: false,
      satisfaction: 4,
      commune_id: nuuk.id,
      demandeur_id: uNuuk.id,
      juriste_id: juriste1.id,
      theme_id: themeUrbanisme.id,
      reponse:
        'La demande doit être déposée en ligne avec les plans du projet. Le délai de traitement est d’environ 4 semaines.',
      date_reponse: new Date(),
    },
  })

  const intervention2 = await prisma.interventions.create({
    data: {
      question:
        'Comment gérer le traitement des déchets dangereux ?',
      urgent: true,
      satisfaction: 5,
      commune_id: sisimiut.id,
      demandeur_id: uSisimiut.id,
      juriste_id: juriste2.id,
      theme_id: themeEnvironnement.id,
      reponse:
        'Les déchets dangereux doivent être remis au centre de tri régional selon le protocole TAG-ENV-2024.',
      date_reponse: new Date(),
    },
  })

  console.log('📞 Interventions créées')

  // --- PIECES JOINTES ---
  await prisma.piecesJointes.createMany({
    data: [
      {
        nom_original: 'Plan_construction.pdf',
        nom_fichier: 'plan_construction_1.pdf',
        chemin: '/uploads/plan_construction_1.pdf',
        intervention_id: intervention1.id,
      },
      {
        nom_original: 'Guide_tri.pdf',
        nom_fichier: 'guide_tri_2.pdf',
        chemin: '/uploads/guide_tri_2.pdf',
        intervention_id: intervention2.id,
      },
    ],
  })

  console.log('📎 Pièces jointes créées')

  console.log('✅ Base peuplée avec succès !')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
