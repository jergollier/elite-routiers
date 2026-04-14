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

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function formatMarque(marque: string) {
  switch (marque) {
    case "RENAULT":
      return "Renault";
    case "SCANIA":
      return "Scania";
    case "VOLVO":
      return "Volvo";
    case "MAN":
      return "MAN";
    case "DAF":
      return "DAF";
    case "MERCEDES":
      return "Mercedes-Benz";
    case "IVECO":
      return "Iveco";
    case "KENWORTH":
      return "Kenworth";
    case "PETERBILT":
      return "Peterbilt";
    case "FREIGHTLINER":
      return "Freightliner";
    case "INTERNATIONAL":
      return "International";
    case "MACK":
      return "Mack";
    case "WESTERN_STAR":
      return "Western Star";
    default:
      return marque;
  }
}

function isTruckMatching(
  expectedBrand: string,
  expectedModel: string | null | undefined,
  gameBrand: string | null,
  gameModel: string | null
) {
  const expectedBrandNormalized = normalizeText(formatMarque(expectedBrand));
  const expectedModelNormalized = normalizeText(expectedModel);
  const gameBrandNormalized = normalizeText(gameBrand);
  const gameModelNormalized = normalizeText(gameModel);

  const brandMatches =
    expectedBrandNormalized !== "" &&
    gameBrandNormalized !== "" &&
    expectedBrandNormalized === gameBrandNormalized;

  const modelMatches =
    expectedModelNormalized !== "" &&
    gameModelNormalized !== "" &&
    (expectedModelNormalized === gameModelNormalized ||
      gameModelNormalized.includes(expectedModelNormalized) ||
      expectedModelNormalized.includes(gameModelNormalized));

  return brandMatches && modelMatches;
}

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

    const camionConforme = isTruckMatching(
      camionAttribue.marque,
      camionAttribue.modele,
      truckBrand,
      truckModel
    );

    if (!camionConforme) {
      return NextResponse.json(
        {
          ok: false,
          error: "CAMION_NON_CONFORME",
          message: `Camion incorrect. Camion attribué requis : ${formatMarque(
            camionAttribue.marque
          )} ${camionAttribue.modele ?? ""}`.trim(),
          expectedTruck: {
            id: camionAttribue.id,
            brand: formatMarque(camionAttribue.marque),
            model: camionAttribue.modele,
          },
          detectedTruck: {
            brand: truckBrand,
            model: truckModel,
          },
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
      const existingByJobId = await prisma.livraison.findUnique({
        where: { jobId },
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
        positionActuelle: sourceCity ?? undefined,
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