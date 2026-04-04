-- CreateTable
CREATE TABLE "ChauffeurStat" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "entrepriseId" INTEGER NOT NULL,
    "argentGagne" INTEGER NOT NULL DEFAULT 0,
    "kilometres" INTEGER NOT NULL DEFAULT 0,
    "infractions" INTEGER NOT NULL DEFAULT 0,
    "accidents" INTEGER NOT NULL DEFAULT 0,
    "livraisons" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChauffeurStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChauffeurStat_entrepriseId_idx" ON "ChauffeurStat"("entrepriseId");

-- CreateIndex
CREATE INDEX "ChauffeurStat_userId_idx" ON "ChauffeurStat"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChauffeurStat_userId_entrepriseId_key" ON "ChauffeurStat"("userId", "entrepriseId");

-- AddForeignKey
ALTER TABLE "ChauffeurStat" ADD CONSTRAINT "ChauffeurStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChauffeurStat" ADD CONSTRAINT "ChauffeurStat_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
