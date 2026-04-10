/*
  Warnings:

  - You are about to drop the column `cargo` on the `Livraison` table. All the data in the column will be lost.
  - Made the column `steamId` on table `Livraison` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Livraison" DROP COLUMN "cargo",
ADD COLUMN     "argentAjoute" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "distanceReelleKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "endOdometerKm" DOUBLE PRECISION,
ADD COLUMN     "kmPrevu" INTEGER,
ADD COLUMN     "startOdometerKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "jobId" DROP NOT NULL,
ALTER COLUMN "sourceCity" DROP NOT NULL,
ALTER COLUMN "destinationCity" DROP NOT NULL,
ALTER COLUMN "income" SET DEFAULT 0,
ALTER COLUMN "steamId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Livraison_status_idx" ON "Livraison"("status");
