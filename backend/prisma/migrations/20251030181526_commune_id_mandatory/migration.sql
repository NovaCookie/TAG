/*
  Warnings:

  - Made the column `commune_id` on table `Utilisateurs` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Utilisateurs" ALTER COLUMN "commune_id" SET NOT NULL;
