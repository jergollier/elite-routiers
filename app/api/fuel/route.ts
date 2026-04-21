import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type FuelBody = {
  steamId?: string;
  litresAjoutes?: number;
  fuelBefore?: number;
  fuelAfter?: number;
  moteurEteint?: boolean;
  camionId?: number;
  livraisonId?: string;
  game?: string;
  sessionId?: string;
  deviceId?: string;
  truck?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as FuelBody;

    const steamId = String(body.steamId || "").trim();
    const livraisonId = body.livraisonId ? String(body.livraisonId).trim() : null;
    const game = body.game ? String(body.game).trim() : null;
    const sessionId = body.sessionId ? String(body.sessionId).trim() : null;
    const deviceId = body.deviceId ? String(body.deviceId).trim() : null;
    const truck = body.truck ? String(body.truck).trim() : null;

    const litresAjoutes =
      typeof body.litresAjoutes === "number" && Number.isFinite(body.litresAjoutes)
        ? body.litresAjoutes
        : NaN;

    const fuelBefore =
      typeof body.fuelBefore === "number" && Number.isFinite(body.fuelBefore)
        ? body.fuelBefore
        : 0;

    const fuelAfter =
      typeof body.fuelAfter === "number" && Number.isFinite(body.fuelAfter)
        ? body.fuelAfter
        : 0;

    const moteurEteint = body.moteurEteint === true;

    const camionId =
      typeof body.camionId === "number" && Number.isInteger(body.camionId)
        ? body.camionId
        : null;

    if (!steamId) {
      return NextResponse.json(
        { success: false, error: "steamId manquant" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(litresAjoutes) || litresAjoutes <= 0) {
      return NextResponse.json(
        { success: false, error: "litres invalides" },
        { status: 400 }
      );
    }

    if (!moteurEteint) {
      return NextResponse.json(
        { success: false, error: "plein refusé (moteur allumé)" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { steamId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: `user introuvable pour steamId ${steamId}` },
        { status: 404 }
      );
    }

    const membership = await prisma.entrepriseMembre.findUnique({
      where: {
        userId: user.id,
      },
      include: {
        entreprise: true,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "chauffeur sans entreprise" },
        { status: 404 }
      );
    }

    const entreprise = membership.entreprise;

    if (!entreprise) {
      return NextResponse.json(
        { success: false, error: "entreprise introuvable" },
        { status: 404 }
      );
    }

    const litres = Math.max(1, Math.round(litresAjoutes));
    const cuveAvant = entreprise.cuveActuelle;

    const litresPrisCuve = Math.min(litres, cuveAvant);
    const litresHorsCuve = Math.max(0, litres - cuveAvant);
    const nouveauStock = Math.max(0, cuveAvant - litresPrisCuve);

    const prixHorsCuve = Number(entreprise.prixLitreHorsCuve ?? 2.3);
    const montantHorsCuve = Math.round(litresHorsCuve * prixHorsCuve);

    const result = await prisma.$transaction(async (tx) => {
      await tx.entreprise.update({
        where: { id: entreprise.id },
        data: {
          cuveActuelle: nouveauStock,
        },
      });

      const plein = await tx.pleinCarburant.create({
        data: {
          steamId,
          entrepriseId: entreprise.id,
          camionId,
          livraisonId,
          game,
          sessionId,
          deviceId,
          truck,
          fuelBefore,
          fuelAfter,
          litresAjoutes: litres,
          moteurEteint: true,
          litresPrisCuve,
          litresHorsCuve,
          prixLitreHorsCuve: prixHorsCuve,
          montantHorsCuve,
          cuveAvant,
          cuveApres: nouveauStock,
        },
      });

      if (litresPrisCuve > 0) {
        await tx.mouvementCuve.create({
          data: {
            entrepriseId: entreprise.id,
            pleinId: plein.id,
            chauffeurId: user.id,
            type: "SORTIE",
            litres: litresPrisCuve,
            cuveAvant,
            cuveApres: nouveauStock,
            description: `Plein chauffeur (${litresPrisCuve} L)`,
          },
        });
      }

      if (litresHorsCuve > 0) {
        await tx.finance.create({
          data: {
            entrepriseId: entreprise.id,
            chauffeurId: user.id,
            pleinId: plein.id,
            type: "CARBURANT_HORS_CUVE",
            description: `Carburant hors cuve (${litresHorsCuve} L à ${prixHorsCuve}€/L)`,
            montant: montantHorsCuve,
          },
        });
      }

      return plein;
    });

    return NextResponse.json({
      success: true,
      message: "plein enregistré",
      plein: result,
      resume: {
        steamId,
        entrepriseId: entreprise.id,
        litres,
        prisCuve: litresPrisCuve,
        horsCuve: litresHorsCuve,
        montant: montantHorsCuve,
        cuveAvant,
        cuveApres: nouveauStock,
      },
    });
  } catch (error) {
    console.error("Erreur /api/fuel :", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}