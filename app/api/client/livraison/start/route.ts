import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type LivraisonStartBody = {
  steamId?: string;
  jobId?: string | null;
  camionId?: number | null;
  game?: string | null;
  sessionId?: string | null;
  deviceId?: string | null;
  truck?: string | null;
  truckBrand?: string | null;
  truckModel?: string | null;
  cargo?: string | null;
  sourceCity?: string | null;
  destinationCity?: string | null;
  kmPrevu?: number | null;
  startOdometerKm?: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LivraisonStartBody;

    const steamId = body.steamId?.trim();
    const requestedCamionId = body.camionId ?? null;
    const jobId = body.jobId?.trim() || null;
    const game = body.game?.trim() || null;
    const sessionId = body.sessionId?.trim() || null;
    const deviceId = body.deviceId?.trim() || null;
    const truck = body.truck?.trim() || "Camion inconnu";
    const truckBrand = body.truckBrand?.trim() || null;
    const truckModel = body.truckModel?.trim() || null;
    const cargo = body.cargo?.trim() || null;
    const sourceCity = body.sourceCity?.trim() || null;
    const destinationCity = body.destinationCity?.trim() || null;
    const kmPrevu =
      typeof body.kmPrevu === "number" && Number.isFinite(body.kmPrevu)
        ? Math.round(body.kmPrevu)
        : null;
    const startOdometerKm =
      typeof body.startOdometerKm === "number" &&
      Number.isFinite(body.startOdometerKm)
        ? body.startOdometerKm
        : NaN;

    if (!steamId) {
      return NextResponse.json(
        { ok: false, error: "steamId manquant." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(startOdometerKm)) {
      return NextResponse.json(
        { ok: false, error: "startOdometerKm manquant ou invalide." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { steamId },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Utilisateur introuvable." },
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

    const entreprise = membership?.entreprise ?? null;

    if (!entreprise) {
      return NextResponse.json(
        { ok: false, error: "Aucune entreprise liée à ce chauffeur." },
        { status: 400 }
      );
    }

    const camionAttribue = await prisma.camion.findFirst({
      where: {
        entrepriseId: entreprise.id,
        chauffeurAttribueId: user.id,
        actif: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!camionAttribue) {
      return NextResponse.json(
        {
          ok: false,
          error: "AUCUN_CAMION_ATTRIBUE",
          message: "Aucun camion n’est attribué à ce chauffeur.",
        },
        { status: 403 }
      );
    }

    if (requestedCamionId && requestedCamionId !== camionAttribue.id) {
      return NextResponse.json(
        {
          ok: false,
          error: "CAMION_ID_INVALIDE",
          message: "Le camion envoyé ne correspond pas au camion attribué.",
        },
        { status: 403 }
      );
    }

    if (jobId) {
      const existingByJobId = await prisma.livraison.findFirst({
        where: {
          steamId,
          jobId,
          status: "EN_COURS",
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (existingByJobId) {
        return NextResponse.json({
          ok: true,
          message: "Livraison déjà existante pour ce jobId.",
          livraisonId: existingByJobId.id,
          alreadyExists: true,
        });
      }
    }

    const existingOpenLivraison = await prisma.livraison.findFirst({
      where: {
        steamId,
        status: "EN_COURS",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (existingOpenLivraison) {
      return NextResponse.json({
        ok: true,
        message: "Une livraison est déjà en cours pour ce chauffeur.",
        livraisonId: existingOpenLivraison.id,
        alreadyExists: true,
      });
    }

    const livraison = await prisma.livraison.create({
      data: {
        jobId,
        steamId,
        entrepriseId: entreprise.id,
        camionId: camionAttribue.id,
        game,
        sessionId,
        deviceId,
        truck,
        truckBrand,
        truckModel,
        cargo,
        status: "EN_COURS",
        startedAt: new Date(),
        startOdometerKm,
        sourceCity,
        destinationCity,
        kmPrevu,
        validatedByServer: true,
      },
    });

    await prisma.camion.update({
      where: { id: camionAttribue.id },
      data: {
        statut: "EN_MISSION",
        positionActuelle: sourceCity ?? null,
      },
    });

    await prisma.clientEvent.create({
      data: {
        type: "LIVRAISON_START",
        steamId,
        deviceId,
        sessionId,
        game,
        payload: {
          livraisonId: livraison.id,
          jobId,
          camionId: camionAttribue.id,
          truck,
          truckBrand,
          truckModel,
          cargo,
          sourceCity,
          destinationCity,
          kmPrevu,
          startOdometerKm,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Livraison démarrée avec succès.",
      livraisonId: livraison.id,
      camionId: camionAttribue.id,
    });
  } catch (error) {
    console.error("Erreur API /api/client/livraison/start :", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Erreur serveur lors du démarrage de la livraison.",
      },
      { status: 500 }
    );
  }
}