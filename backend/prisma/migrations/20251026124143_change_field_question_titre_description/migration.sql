/*
  Warnings:

  - You are about to drop the column `question` on the `Interventions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Interventions" DROP COLUMN "question",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "titre" TEXT;
