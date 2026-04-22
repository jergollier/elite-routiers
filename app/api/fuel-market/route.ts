import { NextResponse } from "next/server";
import { getOrCreateCuveSite, recalculerPrixCuveSite } from "@/lib/fuel-market";

export async function GET() {
  try {
    await getOrCreateCuveSite();
    const cuveSite = await recalculerPrixCuveSite();

    const pourcentage =
      cuveSite.capaciteMax > 0
        ? Math.round((cuveSite.stockActuel / cuveSite.capaciteMax) * 100)
        : 0;

    return NextResponse.json({
      success: true,
      stockActuel: cuveSite.stockActuel,
      capaciteMax: cuveSite.capaciteMax,
      prixActuelLitre: Number(cuveSite.prixActuelLitre),
      pourcentage,
    });
  } catch (error) {
    console.error("Erreur lecture fuel market:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération de la cuve du site.",
      },
      { status: 500 }
    );
  }
}