import { NextResponse } from "next/server";
import { getOrCreateCuveSite, recalculerPrixCuveSite } from "@/lib/fuel-market";

export async function POST() {
  try {
    await getOrCreateCuveSite();
    const cuveSite = await recalculerPrixCuveSite();

    return NextResponse.json({
      success: true,
      cuveSite,
    });
  } catch (error) {
    console.error("Erreur init fuel market:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de l'initialisation de la cuve du site.",
      },
      { status: 500 }
    );
  }
}