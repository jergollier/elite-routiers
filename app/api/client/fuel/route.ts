import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type FuelBody = {
  steamId?: string;
  camionId?: number | null;
  livraisonId?: string | null;
  game?: string | null;
  sessionId?: string | null;
  deviceId?: string | null;
  truck?: string | null;
  fuelBefore?: number;
  fuelAfter?: number;
  litresAjoutes?: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FuelBody;

    const steamId = body.steamId?.trim();
    const camionId = body.camionId ?? null;
    const livraisonId = body.livraisonId?.trim() || null;
    const game = body.game?.trim() || null;
    const sessionId = body.sessionId?.trim() || null;
    const deviceId = body.deviceId?.trim() || null;
    const truck = body.truck?.trim() || null;

    const fuelBefore =
      typeof body.fuelBefore === "number" ? body.fuelBefore : NaN;
    const fuelAfter =
      typeof body.fuelAfter === "number" ? body.fuelAfter : NaN;

    let litresAjoutes =
      typeof body.litresAjoutes === "number" ? body.litresAjoutes : NaN;

    if (!steamId) {
      return NextResponse.json(
        { ok: false, error: "steamId manquant." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(fuelBefore) || !Number.isFinite(fuelAfter)) {
      return NextResponse.json(
        { ok: false, error: "fuelBefore et fuelAfter sont obligatoires." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(litresAjoutes)) {
      litresAjoutes = fuelAfter - fuelBefore;
    }

    if (!Number.isFinite(litresAjoutes) || litresAjoutes <= 0) {
      return NextResponse.json(
        { ok: false, error: "litresAjoutes invalide." },
        { status: 400 }
      );
    }

    // Sécurité simple anti-anomalie
    if (litresAjoutes > 2000) {
      return NextResponse.json(
        { ok: false, error: "Quantité de carburant incohérente." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { steamId },
      include: {
        memberships: {
          include: {
            entreprise: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Utilisateur introuvable." },
        { status: 404 }
      );
    }

    const membership = user.memberships[0] ?? null;
    const entreprise = membership?.entreprise ?? null;

    if (!entreprise) {
      return NextResponse.json(
        { ok: false, error: "Aucune entreprise liée à ce chauffeur." },
        { status: 400 }
      );
    }

    const litresArrondis = Math.round(litresAjoutes);
    const cuveAvant = entreprise.cuveActuelle;
    const cuveApres = Math.max(0, cuveAvant - litresArrondis);

    const result = await prisma.$transaction(async (tx) => {
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
          litresAjoutes,
          cuveAvant,
          cuveApres,
        },
      });

      await tx.entreprise.update({
        where: { id: entreprise.id },
        data: {
          cuveActuelle: cuveApres,
        },
      });

      const mouvement = await tx.mouvementCuve.create({
        data: {
          entrepriseId: entreprise.id,
          pleinId: plein.id,
          chauffeurId: user.id,
          type: "REFUEL",
          litres: litresArrondis,
          cuveAvant,
          cuveApres,
          description: `Plein carburant de ${user.username ?? steamId}`,
        },
      });

      const finance = await tx.finance.create({
        data: {
          entrepriseId: entreprise.id,
          chauffeurId: user.id,
          type: "CARBURANT",
          description: `Plein carburant${truck ? ` - ${truck}` : ""}`,
          montant: 0,
        },
      });

      return {
        plein,
        mouvement,
        finance,
      };
    });

    return NextResponse.json({
      ok: true,
      message: "Plein carburant enregistré avec succès.",
      pleinId: result.plein.id,
      mouvementId: result.mouvement.id,
      cuveAvant,
      cuveApres,
      litresAjoutes,
    });
  } catch (error) {
    console.error("Erreur API /api/client/fuel :", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Erreur serveur lors de l'enregistrement du plein.",
      },
      { status: 500 }
    );
  }
}