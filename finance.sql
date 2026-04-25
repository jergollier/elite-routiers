CREATE TABLE IF NOT EXISTS "FinancePerso" (
  "id" SERIAL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "montant" INTEGER NOT NULL,
  "livraisonId" TEXT,
  "camionId" INTEGER,
  "pleinId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);