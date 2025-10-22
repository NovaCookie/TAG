-- AlterTable
ALTER TABLE "Utilisateurs" ADD COLUMN     "secure_reset_token" TEXT,
ADD COLUMN     "secure_token_expiry" TIMESTAMP(3);
