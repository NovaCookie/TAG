/*
  Warnings:

  - You are about to drop the column `urgent` on the `Interventions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Communes" ADD COLUMN     "conde_postal" TEXT;

-- AlterTable
ALTER TABLE "Interventions" DROP COLUMN "urgent";
