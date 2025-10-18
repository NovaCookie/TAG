-- AlterTable
ALTER TABLE "Interventions" ALTER COLUMN "satisfaction" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "Utilisateurs" ADD COLUMN     "reset_token" TEXT,
ADD COLUMN     "reset_token_expiry" TIMESTAMP(3);
