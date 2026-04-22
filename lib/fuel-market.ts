import { prisma } from "@/lib/prisma";

export function calculerPrixLitreCuveSite(stockActuel: number, capaciteMax: number) {
  if (capaciteMax <= 0) return 1.95;

  const pourcentage = (stockActuel / capaciteMax) * 100;

  if (pourcentage <= 20) return 1.95;
  if (pourcentage <= 40) return 1.8;
  if (pourcentage <= 60) return 1.7;
  if (pourcentage <= 80) return 1.58;
  return 1.45;
}

export function cargoEstCarburant(cargo?: string | null) {
  if (!cargo) return false;

  const value = cargo.toLowerCase();

  return (
    value.includes("diesel") ||
    value.includes("gasoline") ||
    value.includes("fuel") ||
    value.includes("petroleum")
  );
}

export async function getOrCreateCuveSite() {
  let cuveSite = await prisma.cuveSite.findUnique({
    where: { id: 1 },
  });

  if (!cuveSite) {
    cuveSite = await prisma.cuveSite.create({
      data: {
        id: 1,
        stockActuel: 0,
        capaciteMax: 300000,
        prixActuelLitre: 1.95,
      },
    });
  }

  return cuveSite;
}

export async function recalculerPrixCuveSite() {
  const cuveSite = await getOrCreateCuveSite();

  const prix = calculerPrixLitreCuveSite(
    cuveSite.stockActuel,
    cuveSite.capaciteMax
  );

  return prisma.cuveSite.update({
    where: { id: cuveSite.id },
    data: {
      prixActuelLitre: prix,
    },
  });
}