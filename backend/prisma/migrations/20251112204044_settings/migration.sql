-- AlterTable
ALTER TABLE "Utilisateurs" ADD COLUMN     "poste" TEXT,
ADD COLUMN     "preferences_notifications" JSONB,
ADD COLUMN     "telephone" TEXT;
