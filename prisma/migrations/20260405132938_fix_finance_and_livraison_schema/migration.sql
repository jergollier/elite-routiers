/*
  Warnings:

  - The `entrepriseId` column on the `Livraison` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Livraison" DROP COLUMN "entrepriseId",
ADD COLUMN     "entrepriseId" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "argentPerso" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Livraison_steamId_idx" ON "Livraison"("steamId");

-- CreateIndex
CREATE INDEX "Livraison_entrepriseId_idx" ON "Livraison"("entrepriseId");
