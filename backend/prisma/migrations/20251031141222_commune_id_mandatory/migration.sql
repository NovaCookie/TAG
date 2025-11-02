/*
  Warnings:

  - Made the column `code_postal` on table `Communes` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Communes" ALTER COLUMN "code_postal" SET NOT NULL;
