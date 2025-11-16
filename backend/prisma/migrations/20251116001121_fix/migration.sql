-- CreateTable
CREATE TABLE "Communes" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "code_postal" TEXT,
    "population" INTEGER NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Communes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Themes" (
    "id" SERIAL NOT NULL,
    "designation" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Utilisateurs" (
    "id" SERIAL NOT NULL,
    "role" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mot_de_passe" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "telephone" TEXT,
    "poste" TEXT,
    "preferences_notifications" JSONB,
    "reset_token" TEXT,
    "reset_token_expiry" TIMESTAMP(3),
    "email_temp" TEXT,
    "email_confirmation_token" TEXT,
    "email_confirmation_expiry" TIMESTAMP(3),
    "commune_id" INTEGER,

    CONSTRAINT "Utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interventions" (
    "id" SERIAL NOT NULL,
    "titre" TEXT,
    "description" TEXT,
    "reponse" TEXT,
    "notes" TEXT,
    "satisfaction" INTEGER,
    "date_question" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_reponse" TIMESTAMP(3),
    "est_faq" BOOLEAN NOT NULL DEFAULT false,
    "date_publication_faq" TIMESTAMP(3),
    "commune_id" INTEGER NOT NULL,
    "demandeur_id" INTEGER NOT NULL,
    "juriste_id" INTEGER,
    "theme_id" INTEGER,

    CONSTRAINT "Interventions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PiecesJointes" (
    "id" SERIAL NOT NULL,
    "nom_original" TEXT NOT NULL,
    "nom_fichier" TEXT NOT NULL,
    "chemin" TEXT NOT NULL,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "intervention_id" INTEGER NOT NULL,

    CONSTRAINT "PiecesJointes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetentionPolicy" (
    "id" SERIAL NOT NULL,
    "theme_id" INTEGER NOT NULL,
    "duree_mois" INTEGER NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "RetentionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "archives" (
    "id" SERIAL NOT NULL,
    "table_name" TEXT NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "entity_data" JSONB NOT NULL,
    "raison" TEXT,
    "archived_by_id" INTEGER,
    "date_archivage" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_suppression" TIMESTAMP(3),

    CONSTRAINT "archives_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateurs_email_key" ON "Utilisateurs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "archives_table_name_entity_id_key" ON "archives"("table_name", "entity_id");

-- AddForeignKey
ALTER TABLE "Utilisateurs" ADD CONSTRAINT "Utilisateurs_commune_id_fkey" FOREIGN KEY ("commune_id") REFERENCES "Communes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interventions" ADD CONSTRAINT "Interventions_commune_id_fkey" FOREIGN KEY ("commune_id") REFERENCES "Communes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interventions" ADD CONSTRAINT "Interventions_demandeur_id_fkey" FOREIGN KEY ("demandeur_id") REFERENCES "Utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interventions" ADD CONSTRAINT "Interventions_juriste_id_fkey" FOREIGN KEY ("juriste_id") REFERENCES "Utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interventions" ADD CONSTRAINT "Interventions_theme_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "Themes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiecesJointes" ADD CONSTRAINT "PiecesJointes_intervention_id_fkey" FOREIGN KEY ("intervention_id") REFERENCES "Interventions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetentionPolicy" ADD CONSTRAINT "RetentionPolicy_theme_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "Themes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archives" ADD CONSTRAINT "archives_archived_by_id_fkey" FOREIGN KEY ("archived_by_id") REFERENCES "Utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
