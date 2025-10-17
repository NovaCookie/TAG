/*
  Warnings:

  - You are about to drop the `Commune` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Intervention` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PieceJointe` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Theme` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Utilisateur` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Intervention" DROP CONSTRAINT "Intervention_commune_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Intervention" DROP CONSTRAINT "Intervention_demandeur_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Intervention" DROP CONSTRAINT "Intervention_juriste_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Intervention" DROP CONSTRAINT "Intervention_theme_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."PieceJointe" DROP CONSTRAINT "PieceJointe_intervention_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Utilisateur" DROP CONSTRAINT "Utilisateur_commune_id_fkey";

-- DropTable
DROP TABLE "public"."Commune";

-- DropTable
DROP TABLE "public"."Intervention";

-- DropTable
DROP TABLE "public"."PieceJointe";

-- DropTable
DROP TABLE "public"."Theme";

-- DropTable
DROP TABLE "public"."Utilisateur";

-- CreateTable
CREATE TABLE "Communes" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
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
    "commune_id" INTEGER,

    CONSTRAINT "Utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interventions" (
    "id" SERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "date_question" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reponse" TEXT,
    "date_reponse" TIMESTAMP(3),
    "notes" TEXT,
    "satisfaction" INTEGER,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commune_id" INTEGER NOT NULL,
    "demandeur_id" INTEGER NOT NULL,
    "juriste_id" INTEGER,
    "theme_id" INTEGER NOT NULL,

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

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateurs_email_key" ON "Utilisateurs"("email");

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
