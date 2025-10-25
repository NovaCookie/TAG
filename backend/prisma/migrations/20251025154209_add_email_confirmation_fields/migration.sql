-- AlterTable
ALTER TABLE "Utilisateurs" ADD COLUMN     "email_confirmation_expiry" TIMESTAMP(3),
ADD COLUMN     "email_confirmation_token" TEXT,
ADD COLUMN     "email_temp" TEXT;
