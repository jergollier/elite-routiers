import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type LivraisonEndBody = {
  steamId?: string;
  jobId?: string | null;
  livraisonId?: string | null;
  endOdometerKm?: number;
  income?: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LivraisonEndBody;

    const steamId = body.steamId?.trim();
    const jobId = body.jobId?.trim() || null;
    const livraisonId = body.livraisonId?.trim() || null;

    const endOdometerKm =
      typeof body.endOdometerKm === "number" &&
      Number.isFinite(body.endOdometerKm)
        ? body.endOdometerKm
        : NaN;

    const income =
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

    // 🔎 On récupère la livraison
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

    if (livraison.status === "TERMINEE") {
      return NextResponse.json({
        ok: true,
        message: "Livraison déjà terminée.",
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

    const result = await prisma.$transaction(async (tx) => {
      // 🔹 Update livraison
      const updatedLivraison = await tx.livraison.update({
        where: { id: livraison.id },
        data: {
          status: "TERMINEE",
          finishedAt: new Date(),
          endOdometerKm,
          distanceReelleKm: distanceReelle,
          income,
        },
      });

      // 🔹 Ajouter argent entreprise
      if (livraison.entrepriseId && income > 0) {
        await tx.entreprise.update({
          where: { id: livraison.entrepriseId },
          data: {
            argent: {
              increment: income,
            },
          },
        });

        await tx.finance.create({
          data: {
            entrepriseId: livraison.entrepriseId,
            chauffeurId: user.id,
            type: "LIVRAISON",
            description: `Livraison ${livraison.truck || ""}`,
            montant: income,
          },
        });
      }

      // 🔹 Stats chauffeur
      await tx.chauffeurStat.upsert({
        where: {
          userId_entrepriseId: {
            userId: user.id,
            entrepriseId: livraison.entrepriseId!,
          },
        },
        update: {
          argentGagne: { increment: income },
          kilometres: { increment: distanceReelle },
          livraisons: { increment: 1 },
        },
        create: {
          userId: user.id,
          entrepriseId: livraison.entrepriseId!,
          argentGagne: income,
          kilometres: distanceReelle,
          livraisons: 1,
        },
      });

      // 🔹 Camion dispo
      if (livraison.camionId) {
        await tx.camion.update({
          where: { id: livraison.camionId },
          data: {
            statut: "DISPONIBLE",
          },
        });
      }

      return updatedLivraison;
    });

    return NextResponse.json({
      ok: true,
      message: "Livraison terminée avec succès.",
      distanceReelle,
      income,
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