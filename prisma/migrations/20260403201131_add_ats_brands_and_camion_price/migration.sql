-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MarqueCamion" ADD VALUE 'FREIGHTLINER';
ALTER TYPE "MarqueCamion" ADD VALUE 'INTERNATIONAL';
ALTER TYPE "MarqueCamion" ADD VALUE 'MACK';
ALTER TYPE "MarqueCamion" ADD VALUE 'WESTERN_STAR';

-- AlterTable
ALTER TABLE "Camion" ADD COLUMN     "accessoiresExterieur" TEXT,
ADD COLUMN     "accessoiresInterieur" TEXT,
ADD COLUMN     "prixAchat" INTEGER;
