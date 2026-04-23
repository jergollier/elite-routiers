import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  calculerPrixLitreCuveSite,
  cargoEstCarburant,
} from "@/lib/fuel-market";

type LivraisonEndBody = {
  steamId?: string;
  jobId?: string | null;
  livraisonId?: string | null;
  endOdometerKm?: number;
  income?: number;
  endReason?: string | null;
  status?: string | null;
};

async function envoyerWebhookLivraison(params: {
  webhookUrl?: string | null;
  entrepriseNom: string;
  chauffeur: string;
  sourceCity?: string | null;
  destinationCity?: string | null;
  cargo?: string | null;
  gainSociete?: number | null;
  gainChauffeur?: number | null;
  distanceReelleKm?: number | null;
  truck?: string | null;
}) {
  const {
    webhookUrl,
    entrepriseNom,
    chauffeur,
    sourceCity,
    destinationCity,
    cargo,
    gainSociete,
    gainChauffeur,
    distanceReelleKm,
    truck,
  } = params;

  if (!webhookUrl) return;

  try {
    const trajet =
      sourceCity && destinationCity
        ? `${sourceCity} → ${destinationCity}`
        : "Trajet inconnu";

    const message = [
      "📦 **Livraison terminée**",
      `🏢 Société : **${entrepriseNom}**`,
      `👤 Chauffeur : **${chauffeur}**`,
      `🚛 Camion : **${truck || "Inconnu"}**`,
      `🗺️ Trajet : **${trajet}**`,
      `📦 Marchandise : **${cargo || "Inconnue"}**`,
      `📏 Distance réelle : **${Math.round(distanceReelleKm || 0)} km**`,
      `💰 Gain société : **${Number(gainSociete || 0).toLocaleString("fr-FR")} €**`,
      `💵 Gain chauffeur : **${Number(gainChauffeur || 0).toLocaleString("fr-FR")} €**`,
    ].join("\n");

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: message,
      }),
    });

    if (!response.ok) {
      console.error("Webhook livraison refusé par Discord :", response.status);
    }
  } catch (error) {
    console.error("Erreur webhook livraison :", error);
  }
}

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
        ? Math.max(0, Math.round(body.income))
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
      livraison = await prisma.livraison.findFirst({
        where: {
          steamId,
          jobId,
          status: "EN_COURS",
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    if (!livraison) {
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

    if (
      livraison.argentAjoute ||
      livraison.status === "TERMINEE" ||
      livraison.status === "ANNULEE"
    ) {
      return NextResponse.json({
        ok: true,
        message: "Livraison déjà traitée.",
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

    const finalIncome = !isCancelled ? rawIncome : 0;
    const gainSociete = !isCancelled ? Math.round(finalIncome * 0.15) : 0;
    const gainChauffeur = !isCancelled ? Math.round(finalIncome * 0.2) : 0;
    const charges = !isCancelled
      ? finalIncome - gainSociete - gainChauffeur
      : 0;

    const transactionResult = await prisma.$transaction(async (tx) => {
      const freshLivraison = await tx.livraison.findUnique({
        where: { id: livraison!.id },
      });

      if (!freshLivraison) {
        throw new Error("Livraison introuvable dans la transaction.");
      }

      if (
        freshLivraison.argentAjoute ||
        freshLivraison.status === "TERMINEE" ||
        freshLivraison.status === "ANNULEE"
      ) {
        return {
          alreadyProcessed: true,
          status: freshLivraison.status,
          livraison: freshLivraison,
          carburantAjoute: 0,
          stockCuveSite: null as number | null,
        };
      }

      const livraisonUpdated = await tx.livraison.update({
        where: { id: freshLivraison.id },
        data: {
          status: finalStatus,
          finishedAt: new Date(),
          endOdometerKm,
          distanceReelleKm: distanceReelle,
          income: finalIncome,
          gainSociete,
          gainChauffeur,
          charges,
          argentAjoute: true,
          cancelReason: isCancelled ? endReason : null,
        },
      });

      if (!isCancelled && freshLivraison.entrepriseId && gainSociete > 0) {
        await tx.entreprise.update({
          where: { id: freshLivraison.entrepriseId },
          data: {
            argent: {
              increment: gainSociete,
            },
          },
        });

        await tx.finance.create({
          data: {
            entrepriseId: freshLivraison.entrepriseId,
            chauffeurId: user.id,
            type: "LIVRAISON",
            description: `Part société livraison ${freshLivraison.truck || ""}`,
            montant: gainSociete,
          },
        });
      }

      if (!isCancelled && freshLivraison.entrepriseId && charges > 0) {
        await tx.finance.create({
          data: {
            entrepriseId: freshLivraison.entrepriseId,
            chauffeurId: user.id,
            type: "CHARGES_LIVRAISON",
            description: `Charges livraison ${freshLivraison.truck || ""}`,
            montant: -charges,
          },
        });
      }

      if (!isCancelled && gainChauffeur > 0) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            argentPerso: {
              increment: gainChauffeur,
            },
          },
        });
      }

      if (freshLivraison.entrepriseId) {
        await tx.chauffeurStat.upsert({
          where: {
            userId_entrepriseId: {
              userId: user.id,
              entrepriseId: freshLivraison.entrepriseId,
            },
          },
          update: !isCancelled
            ? {
                argentGagne: { increment: gainChauffeur },
                kilometres: { increment: distanceReelle },
                livraisons: { increment: 1 },
              }
            : {
                kilometres: { increment: distanceReelle },
              },
          create: {
            userId: user.id,
            entrepriseId: freshLivraison.entrepriseId,
            argentGagne: !isCancelled ? gainChauffeur : 0,
            kilometres: distanceReelle,
            livraisons: !isCancelled ? 1 : 0,
          },
        });
      }

      if (freshLivraison.camionId) {
  const camion = await tx.camion.findUnique({
    where: { id: freshLivraison.camionId },
    select: {
      id: true,
      kilometrage: true,
      vidangeRestante: true,
      revisionRestante: true,
      pneusRestantsKm: true,
      freinsRestantsKm: true,
      batterieRestanteKm: true,
    },
  });

  if (camion) {
    await tx.camion.update({
      where: { id: camion.id },
      data: {
        statut: "DISPONIBLE",
        kilometrage: {
          increment: distanceReelle,
        },
        vidangeRestante: Math.max(
          0,
          (camion.vidangeRestante ?? 0) - distanceReelle
        ),
        revisionRestante: Math.max(
          0,
          (camion.revisionRestante ?? 0) - distanceReelle
        ),
        pneusRestantsKm: Math.max(
          0,
          (camion.pneusRestantsKm ?? 0) - distanceReelle
        ),
        freinsRestantsKm: Math.max(
          0,
          (camion.freinsRestantsKm ?? 0) - distanceReelle
        ),
        batterieRestanteKm: Math.max(
          0,
          (camion.batterieRestanteKm ?? 0) - distanceReelle
        ),
      },
    });
  }
}

      let carburantAjoute = 0;
      let stockCuveSite: number | null = null;

      const estLivraisonCarburant =
        !isCancelled && cargoEstCarburant(freshLivraison.cargo);

      if (estLivraisonCarburant) {
        let cuveSite = await tx.cuveSite.findUnique({
          where: { id: 1 },
        });

        if (!cuveSite) {
          cuveSite = await tx.cuveSite.create({
            data: {
              id: 1,
              stockActuel: 0,
              capaciteMax: 300000,
              prixActuelLitre: 1.95,
            },
          });
        }

        const stockAvant = cuveSite.stockActuel;
        const stockApres = Math.min(cuveSite.capaciteMax, stockAvant + 15000);
        carburantAjoute = stockApres - stockAvant;

        const nouveauPrix = calculerPrixLitreCuveSite(
          stockApres,
          cuveSite.capaciteMax
        );

        await tx.cuveSite.update({
          where: { id: cuveSite.id },
          data: {
            stockActuel: stockApres,
            prixActuelLitre: nouveauPrix,
          },
        });

        stockCuveSite = stockApres;

        const livraisonCarburantSite = await tx.livraisonCarburantSite.create({
          data: {
            cuveSiteId: cuveSite.id,
            livraisonId: freshLivraison.id,
            steamId: freshLivraison.steamId,
            entrepriseId: freshLivraison.entrepriseId,
            cargo: freshLivraison.cargo || "Carburant",
            litresAjoutes: carburantAjoute,
            stockAvant,
            stockApres,
            prixAuMoment: nouveauPrix,
          },
        });

        await tx.mouvementCuveSite.create({
          data: {
            cuveSiteId: cuveSite.id,
            type: "LIVRAISON_CARBURANT",
            litres: carburantAjoute,
            stockAvant,
            stockApres,
            prixLitreAuMoment: nouveauPrix,
            description: `Livraison carburant ${freshLivraison.cargo || "Carburant"} par ${user.username || steamId}`,
            livraisonCarburantSiteId: livraisonCarburantSite.id,
          },
        });
      }

      return {
        alreadyProcessed: false,
        status: finalStatus,
        livraison: livraisonUpdated,
        carburantAjoute,
        stockCuveSite,
      };
    });

    if (transactionResult.alreadyProcessed) {
      return NextResponse.json({
        ok: true,
        message: "Livraison déjà traitée.",
        status: transactionResult.status,
      });
    }

    if (!isCancelled && livraison.entrepriseId) {
      try {
        const entreprise = await prisma.entreprise.findUnique({
          where: { id: livraison.entrepriseId },
          select: {
            nom: true,
            discordWebhookLivraison: true,
          },
        });

        await envoyerWebhookLivraison({
          webhookUrl: entreprise?.discordWebhookLivraison,
          entrepriseNom: entreprise?.nom || "Entreprise inconnue",
          chauffeur: user.username || `Steam ${steamId}`,
          sourceCity: livraison.sourceCity,
          destinationCity: livraison.destinationCity,
          cargo: livraison.cargo,
          gainSociete,
          gainChauffeur,
          distanceReelleKm: distanceReelle,
          truck: livraison.truck,
        });
      } catch (error) {
        console.error("Erreur post-transaction webhook livraison :", error);
      }
    }

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
      gainSociete,
      gainChauffeur,
      charges,
      carburantAjouteCuveSite: transactionResult.carburantAjoute,
      stockCuveSite: transactionResult.stockCuveSite,
      livraisonCarburantDetectee:
        !isCancelled && cargoEstCarburant(livraison.cargo),
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