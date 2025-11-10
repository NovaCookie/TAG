-- AlterTable
ALTER TABLE "Interventions" ADD COLUMN     "date_archivage" TIMESTAMP(3),
ADD COLUMN     "date_suppression" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "RetentionPolicy" (
    "id" SERIAL NOT NULL,
    "theme_id" INTEGER NOT NULL,
    "duree_mois" INTEGER NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "RetentionPolicy_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RetentionPolicy" ADD CONSTRAINT "RetentionPolicy_theme_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "Themes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
