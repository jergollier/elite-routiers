-- AlterTable
ALTER TABLE "Entreprise" ADD COLUMN     "entrepriseId" TEXT;

-- AlterTable
ALTER TABLE "Livraison" ADD COLUMN     "entrepriseId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "argent" INTEGER NOT NULL DEFAULT 0;
