-- AlterTable
ALTER TABLE "Communes" ADD COLUMN     "actif" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "code_postal" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Interventions" ALTER COLUMN "theme_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Themes" ADD COLUMN     "actif" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Utilisateurs" ADD COLUMN     "actif" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "commune_id" DROP NOT NULL;
