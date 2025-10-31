/*
  Warnings:

  - You are about to drop the column `code_postale` on the `Communes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Communes" DROP COLUMN "code_postale",
ADD COLUMN     "code_postal" TEXT;
