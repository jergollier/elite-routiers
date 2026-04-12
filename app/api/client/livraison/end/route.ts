import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type LivraisonEndBody = {
  steamId?: string;
  jobId?: string | null;
  livraisonId?: string | null;
  endOdometerKm?: number;
  income?: number;
  endReason?: string | null;
  status?: string | null;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LivraisonEndBody;

    const steamId = body.steamId?.trim();
    const jobId = body.jobId?.trim() || null;
    const livraisonId = body.livraisonId?.trim() || null;
    const endReason = body.endReason?.trim() || "job_finished";
    const requestedStatus = body.status?.trim() || null;

    const endOdometerKm =
      typeof body.endOdometerKm === "number" &&
      Number.isFinite(body.endOdometerKm)
        ? body.endOdometerKm
        : NaN;

    const rawIncome =
      typeof body.income === "number" && Number.isFinite(body.income)
        ? Math.round(body.income)
        : 0;

    if (!steamId) {
      return NextResponse.json(
        { ok: false, error: "steamId manquant." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(endOdometerKm)) {
      return NextResponse.json(
        { ok: false, error: "endOdometerKm invalide." },
        { status: 400 }
      );
    }

    let livraison = null;

    if (livraisonId) {
      livraison = await prisma.livraison.findUnique({
        where: { id: livraisonId },
      });
    } else if (jobId) {
      livraison = await prisma.livraison.findUnique({
        where: { jobId },
      });
    } else {
      livraison = await prisma.livraison.findFirst({
        where: {
          steamId,
          status: "EN_COURS",
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    if (!livraison) {
      return NextResponse.json(
        { ok: false, error: "Livraison introuvable." },
        { status: 404 }
      );
    }

    if (livraison.status === "TERMINEE" || livraison.status === "ANNULEE") {
      return NextResponse.json({
        ok: true,
        message: "Livraison déjà clôturée.",
        status: livraison.status,
      });
    }

    const distanceReelle = Math.max(
      0,
      Math.round(endOdometerKm - livraison.startOdometerKm)
    );

    const user = await prisma.user.findUnique({
      where: { steamId },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Utilisateur introuvable." },
        { status: 404 }
      );
    }

    const isCancelled =
      endReason === "job_cancelled" ||
      endReason === "job_cleared" ||
      requestedStatus === "ANNULEE";

    const finalStatus = isCancelled ? "ANNULEE" : "TERMINEE";
    const finalIncome = isCancelled ? 0 : Math.max(0, rawIncome);
    const shouldCountAsDelivered = finalStatus === "TERMINEE";

    await prisma.$transaction(async (tx) => {
      await tx.livraison.update({
        where: { id: livraison.id },
        data: {
          status: finalStatus,
          finishedAt: new Date(),
          endOdometerKm,
          distanceReelleKm: distanceReelle,
          income: finalIncome,
        },
      });

      if (shouldCountAsDelivered && livraison.entrepriseId && finalIncome > 0) {
        await tx.entreprise.update({
          where: { id: livraison.entrepriseId },
          data: {
            argent: {
              increment: finalIncome,
            },
          },
        });

        await tx.finance.create({
          data: {
            entrepriseId: livraison.entrepriseId,
            chauffeurId: user.id,
            type: "LIVRAISON",
            description: `Livraison ${livraison.truck || ""}`,
            montant: finalIncome,
          },
        });
      }

      if (livraison.entrepriseId) {
        await tx.chauffeurStat.upsert({
          where: {
            userId_entrepriseId: {
              userId: user.id,
              entrepriseId: livraison.entrepriseId,
            },
          },
          update: shouldCountAsDelivered
            ? {
                argentGagne: { increment: finalIncome },
                kilometres: { increment: distanceReelle },
                livraisons: { increment: 1 },
              }
            : {
                kilometres: { increment: distanceReelle },
              },
          create: {
            userId: user.id,
            entrepriseId: livraison.entrepriseId,
            argentGagne: shouldCountAsDelivered ? finalIncome : 0,
            kilometres: distanceReelle,
            livraisons: shouldCountAsDelivered ? 1 : 0,
          },
        });
      }

      if (livraison.camionId) {
        await tx.camion.update({
          where: { id: livraison.camionId },
          data: {
            statut: "DISPONIBLE",
          },
        });
      }
    });

    return NextResponse.json({
      ok: true,
      message:
        finalStatus === "ANNULEE"
          ? "Livraison annulée avec succès."
          : "Livraison terminée avec succès.",
      status: finalStatus,
      endReason,
      distanceReelle,
      income: finalIncome,
    });
  } catch (error) {
    console.error("Erreur API livraison end :", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Erreur serveur fin livraison.",
      },
      { status: 500 }
    );
  }
}