/*
  Warnings:

  - You are about to drop the column `secure_reset_token` on the `Utilisateurs` table. All the data in the column will be lost.
  - You are about to drop the column `secure_token_expiry` on the `Utilisateurs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Interventions" ALTER COLUMN "satisfaction" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Utilisateurs" DROP COLUMN "secure_reset_token",
DROP COLUMN "secure_token_expiry";
