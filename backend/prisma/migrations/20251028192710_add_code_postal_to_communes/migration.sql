/*
  Warnings:

  - You are about to drop the column `conde_postal` on the `Communes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Communes" DROP COLUMN "conde_postal",
ADD COLUMN     "code_postale" TEXT;
