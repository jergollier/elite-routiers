ALTER TABLE "Entreprise"
ADD COLUMN IF NOT EXISTS "prixLitreCuve" DECIMAL(10,2) NOT NULL DEFAULT 1.35,
ADD COLUMN IF NOT EXISTS "prixLitreHorsCuve" DECIMAL(10,2) NOT NULL DEFAULT 2.30;

ALTER TABLE "PleinCarburant"
ADD COLUMN IF NOT EXISTS "moteurEteint" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "litresPrisCuve" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "litresHorsCuve" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "prixLitreHorsCuve" DECIMAL(10,2) NOT NULL DEFAULT 2.30,
ADD COLUMN IF NOT EXISTS "montantHorsCuve" DECIMAL(10,2) NOT NULL DEFAULT 0.00;

ALTER TABLE "Finance"
ADD COLUMN IF NOT EXISTS "pleinId" TEXT;

CREATE INDEX IF NOT EXISTS "Finance_pleinId_idx" ON "Finance"("pleinId");
CREATE INDEX IF NOT EXISTS "Finance_type_idx" ON "Finance"("type");
CREATE INDEX IF NOT EXISTS "Entreprise_nom_idx" ON "Entreprise"("nom");
CREATE INDEX IF NOT EXISTS "Entreprise_jeu_idx" ON "Entreprise"("jeu");
CREATE INDEX IF NOT EXISTS "MouvementCuve_type_idx" ON "MouvementCuve"("type");
CREATE INDEX IF NOT EXISTS "TackySession_userId_idx" ON "TackySession"("userId");
CREATE INDEX IF NOT EXISTS "TackySession_token_idx" ON "TackySession"("token");
CREATE INDEX IF NOT EXISTS "TackySession_deviceCode_idx" ON "TackySession"("deviceCode");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Finance_pleinId_fkey'
  ) THEN
    ALTER TABLE "Finance"
    ADD CONSTRAINT "Finance_pleinId_fkey"
    FOREIGN KEY ("pleinId") REFERENCES "PleinCarburant"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
  END IF;
END $$;