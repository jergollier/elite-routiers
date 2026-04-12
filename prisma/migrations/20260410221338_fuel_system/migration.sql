-- AlterTable
ALTER TABLE "ClientEvent" ADD COLUMN     "deviceId" TEXT,
ADD COLUMN     "game" TEXT,
ADD COLUMN     "sessionId" TEXT,
ADD COLUMN     "steamId" TEXT;

-- AlterTable
ALTER TABLE "Livraison" ADD COLUMN     "camionId" INTEGER,
ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "deviceId" TEXT,
ADD COLUMN     "game" TEXT,
ADD COLUMN     "sessionId" TEXT,
ADD COLUMN     "truckBrand" TEXT,
ADD COLUMN     "truckModel" TEXT,
ADD COLUMN     "validatedByServer" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PleinCarburant" (
    "id" TEXT NOT NULL,
    "steamId" TEXT NOT NULL,
    "entrepriseId" INTEGER,
    "camionId" INTEGER,
    "livraisonId" TEXT,
    "game" TEXT,
    "sessionId" TEXT,
    "deviceId" TEXT,
    "truck" TEXT,
    "fuelBefore" DOUBLE PRECISION NOT NULL,
    "fuelAfter" DOUBLE PRECISION NOT NULL,
    "litresAjoutes" DOUBLE PRECISION NOT NULL,
    "cuveAvant" INTEGER,
    "cuveApres" INTEGER,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PleinCarburant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MouvementCuve" (
    "id" TEXT NOT NULL,
    "entrepriseId" INTEGER NOT NULL,
    "pleinId" TEXT,
    "chauffeurId" TEXT,
    "type" TEXT NOT NULL,
    "litres" INTEGER NOT NULL,
    "cuveAvant" INTEGER NOT NULL,
    "cuveApres" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MouvementCuve_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PleinCarburant_steamId_idx" ON "PleinCarburant"("steamId");

-- CreateIndex
CREATE INDEX "PleinCarburant_entrepriseId_idx" ON "PleinCarburant"("entrepriseId");

-- CreateIndex
CREATE INDEX "PleinCarburant_camionId_idx" ON "PleinCarburant"("camionId");

-- CreateIndex
CREATE INDEX "PleinCarburant_livraisonId_idx" ON "PleinCarburant"("livraisonId");

-- CreateIndex
CREATE INDEX "PleinCarburant_detectedAt_idx" ON "PleinCarburant"("detectedAt");

-- CreateIndex
CREATE INDEX "MouvementCuve_entrepriseId_idx" ON "MouvementCuve"("entrepriseId");

-- CreateIndex
CREATE INDEX "MouvementCuve_pleinId_idx" ON "MouvementCuve"("pleinId");

-- CreateIndex
CREATE INDEX "MouvementCuve_chauffeurId_idx" ON "MouvementCuve"("chauffeurId");

-- CreateIndex
CREATE INDEX "MouvementCuve_createdAt_idx" ON "MouvementCuve"("createdAt");

-- CreateIndex
CREATE INDEX "ClientEvent_steamId_idx" ON "ClientEvent"("steamId");

-- CreateIndex
CREATE INDEX "ClientEvent_deviceId_idx" ON "ClientEvent"("deviceId");

-- CreateIndex
CREATE INDEX "ClientEvent_sessionId_idx" ON "ClientEvent"("sessionId");

-- CreateIndex
CREATE INDEX "ClientEvent_type_idx" ON "ClientEvent"("type");

-- CreateIndex
CREATE INDEX "ClientEvent_createdAt_idx" ON "ClientEvent"("createdAt");

-- CreateIndex
CREATE INDEX "Livraison_camionId_idx" ON "Livraison"("camionId");

-- CreateIndex
CREATE INDEX "Livraison_startedAt_idx" ON "Livraison"("startedAt");

-- CreateIndex
CREATE INDEX "Livraison_finishedAt_idx" ON "Livraison"("finishedAt");

-- AddForeignKey
ALTER TABLE "Livraison" ADD CONSTRAINT "Livraison_steamId_fkey" FOREIGN KEY ("steamId") REFERENCES "User"("steamId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Livraison" ADD CONSTRAINT "Livraison_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Livraison" ADD CONSTRAINT "Livraison_camionId_fkey" FOREIGN KEY ("camionId") REFERENCES "Camion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PleinCarburant" ADD CONSTRAINT "PleinCarburant_steamId_fkey" FOREIGN KEY ("steamId") REFERENCES "User"("steamId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PleinCarburant" ADD CONSTRAINT "PleinCarburant_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PleinCarburant" ADD CONSTRAINT "PleinCarburant_camionId_fkey" FOREIGN KEY ("camionId") REFERENCES "Camion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PleinCarburant" ADD CONSTRAINT "PleinCarburant_livraisonId_fkey" FOREIGN KEY ("livraisonId") REFERENCES "Livraison"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementCuve" ADD CONSTRAINT "MouvementCuve_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementCuve" ADD CONSTRAINT "MouvementCuve_pleinId_fkey" FOREIGN KEY ("pleinId") REFERENCES "PleinCarburant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementCuve" ADD CONSTRAINT "MouvementCuve_chauffeurId_fkey" FOREIGN KEY ("chauffeurId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
