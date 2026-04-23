import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type DamageBody = {
  steamId?: string;
  truckDamage?: number;
  cabDamage?: number;
  chassisDamage?: number;
  wheelDamage?: number;
};

function clampDamage(value: unknown) {
  const num = Number(value ?? 0);

  if (!Number.isFinite(num)) return 0;

  return Math.max(0, Math.min(100, Math.round(num * 100)));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DamageBody;

    const steamId = body.steamId?.trim();

    if (!steamId) {
      return NextResponse.json(
        { error: "steamId manquant" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { steamId },
      select: {
        id: true,
        steamId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    const camion = await prisma.camion.findFirst({
      where: {
        chauffeurAttribueId: user.id,
      },
      select: {
        id: true,
        degatsMoteur: true,
        degatsCarrosserie: true,
        degatsChassis: true,
        degatsRoues: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    if (!camion) {
      return NextResponse.json(
        { error: "Aucun camion attribué à ce chauffeur" },
        { status: 404 }
      );
    }

    const degatsMoteur = clampDamage(body.truckDamage);
    const degatsCarrosserie = clampDamage(body.cabDamage);
    const degatsChassis = clampDamage(body.chassisDamage);
    const degatsRoues = clampDamage(body.wheelDamage);

    const updatedCamion = await prisma.camion.update({
      where: {
        id: camion.id,
      },
      data: {
        degatsMoteur,
        degatsCarrosserie,
        degatsChassis,
        degatsRoues,
      },
      select: {
        id: true,
        degatsMoteur: true,
        degatsCarrosserie: true,
        degatsChassis: true,
        degatsRoues: true,
      },
    });

    return NextResponse.json({
      success: true,
      camion: updatedCamion,
    });
  } catch (error) {
    console.error("Erreur API damages:", error);

    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}