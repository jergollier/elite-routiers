-- CreateEnum
CREATE TYPE "RoleEntreprise" AS ENUM ('DIRECTEUR', 'SOUS_DIRECTEUR', 'CHEF_EQUIPE', 'CHEF_ATELIER', 'CHAUFFEUR');

-- CreateEnum
CREATE TYPE "StatutCandidature" AS ENUM ('EN_ATTENTE', 'ACCEPTEE', 'REFUSEE');

-- CreateEnum
CREATE TYPE "StatutCamion" AS ENUM ('DISPONIBLE', 'EN_MISSION', 'EN_MAINTENANCE');

-- CreateEnum
CREATE TYPE "MarqueCamion" AS ENUM ('RENAULT', 'SCANIA', 'VOLVO', 'MAN', 'DAF', 'MERCEDES', 'IVECO', 'KENWORTH', 'PETERBILT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "steamId" TEXT NOT NULL,
    "username" TEXT,
    "avatar" TEXT,
    "age" INTEGER,
    "region" TEXT,
    "email" TEXT,
    "password" TEXT,
    "jeuPrincipal" TEXT,
    "typeTransportPrefere" TEXT,
    "descriptionChauffeur" TEXT,
    "styleConduite" TEXT,
    "micro" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entreprise" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "abreviation" VARCHAR(3) NOT NULL,
    "villeETS2" TEXT,
    "villeATS" TEXT,
    "jeu" TEXT NOT NULL,
    "typeTransport" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "recrutement" BOOLEAN NOT NULL DEFAULT true,
    "banniere" TEXT,
    "ownerSteamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "argent" INTEGER NOT NULL DEFAULT 125000,
    "cuveActuelle" INTEGER NOT NULL DEFAULT 6200,
    "cuveMax" INTEGER NOT NULL DEFAULT 10000,

    CONSTRAINT "Entreprise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntrepriseMembre" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "entrepriseId" INTEGER NOT NULL,
    "role" "RoleEntreprise" NOT NULL DEFAULT 'CHAUFFEUR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntrepriseMembre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntrepriseCandidature" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "entrepriseId" INTEGER NOT NULL,
    "age" INTEGER,
    "region" TEXT,
    "jeuPrincipal" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "micro" BOOLEAN NOT NULL DEFAULT false,
    "disponibilites" TEXT,
    "motivation" TEXT NOT NULL,
    "message" TEXT,
    "statut" "StatutCandidature" NOT NULL DEFAULT 'EN_ATTENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntrepriseCandidature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDlc" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "jeu" TEXT NOT NULL,
    "nomDlc" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDlc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Finance" (
    "id" SERIAL NOT NULL,
    "entrepriseId" INTEGER NOT NULL,
    "chauffeurId" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "montant" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Finance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Camion" (
    "id" SERIAL NOT NULL,
    "entrepriseId" INTEGER NOT NULL,
    "chauffeurId" TEXT,
    "marque" "MarqueCamion" NOT NULL,
    "modele" TEXT NOT NULL,
    "image" TEXT,
    "kilometrage" INTEGER NOT NULL DEFAULT 0,
    "etat" INTEGER NOT NULL DEFAULT 100,
    "carburant" INTEGER NOT NULL DEFAULT 100,
    "positionActuelle" TEXT,
    "statut" "StatutCamion" NOT NULL DEFAULT 'DISPONIBLE',
    "vidangeRestante" INTEGER NOT NULL DEFAULT 60000,
    "revisionRestante" INTEGER NOT NULL DEFAULT 120000,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Camion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_steamId_key" ON "User"("steamId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Entreprise_ownerSteamId_idx" ON "Entreprise"("ownerSteamId");

-- CreateIndex
CREATE INDEX "EntrepriseMembre_entrepriseId_idx" ON "EntrepriseMembre"("entrepriseId");

-- CreateIndex
CREATE INDEX "EntrepriseMembre_userId_idx" ON "EntrepriseMembre"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EntrepriseMembre_userId_entrepriseId_key" ON "EntrepriseMembre"("userId", "entrepriseId");

-- CreateIndex
CREATE INDEX "EntrepriseCandidature_entrepriseId_idx" ON "EntrepriseCandidature"("entrepriseId");

-- CreateIndex
CREATE INDEX "EntrepriseCandidature_userId_idx" ON "EntrepriseCandidature"("userId");

-- CreateIndex
CREATE INDEX "EntrepriseCandidature_statut_idx" ON "EntrepriseCandidature"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "EntrepriseCandidature_userId_entrepriseId_key" ON "EntrepriseCandidature"("userId", "entrepriseId");

-- CreateIndex
CREATE INDEX "UserDlc_userId_idx" ON "UserDlc"("userId");

-- CreateIndex
CREATE INDEX "UserDlc_jeu_idx" ON "UserDlc"("jeu");

-- CreateIndex
CREATE UNIQUE INDEX "UserDlc_userId_jeu_nomDlc_key" ON "UserDlc"("userId", "jeu", "nomDlc");

-- CreateIndex
CREATE INDEX "Finance_entrepriseId_idx" ON "Finance"("entrepriseId");

-- CreateIndex
CREATE INDEX "Finance_chauffeurId_idx" ON "Finance"("chauffeurId");

-- CreateIndex
CREATE INDEX "Finance_createdAt_idx" ON "Finance"("createdAt");

-- CreateIndex
CREATE INDEX "Camion_entrepriseId_idx" ON "Camion"("entrepriseId");

-- CreateIndex
CREATE INDEX "Camion_chauffeurId_idx" ON "Camion"("chauffeurId");

-- CreateIndex
CREATE INDEX "Camion_statut_idx" ON "Camion"("statut");

-- AddForeignKey
ALTER TABLE "Entreprise" ADD CONSTRAINT "Entreprise_ownerSteamId_fkey" FOREIGN KEY ("ownerSteamId") REFERENCES "User"("steamId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntrepriseMembre" ADD CONSTRAINT "EntrepriseMembre_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntrepriseMembre" ADD CONSTRAINT "EntrepriseMembre_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntrepriseCandidature" ADD CONSTRAINT "EntrepriseCandidature_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntrepriseCandidature" ADD CONSTRAINT "EntrepriseCandidature_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDlc" ADD CONSTRAINT "UserDlc_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finance" ADD CONSTRAINT "Finance_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finance" ADD CONSTRAINT "Finance_chauffeurId_fkey" FOREIGN KEY ("chauffeurId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Camion" ADD CONSTRAINT "Camion_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Camion" ADD CONSTRAINT "Camion_chauffeurId_fkey" FOREIGN KEY ("chauffeurId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
