import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function resolveUserContext(steamId?: string) {
  if (!steamId) {
    return {
      userId: null as string | null,
      entrepriseId: null as number | null,
    };
  }

  const user = await prisma.user.findUnique({
    where: { steamId },
    select: { id: true },
  });

  const membership = await prisma.entrepriseMembre.findFirst({
    where: {
      user: {
        steamId,
      },
    },
    select: {
      entrepriseId: true,
    },
  });

  return {
    userId: user?.id ?? null,
    entrepriseId: membership?.entrepriseId ?? null,
  };
}

function safeString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function safeIncome(value: unknown) {
  return Math.max(0, Math.round(Number(value ?? 0) || 0));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const type = body.type ?? "unknown";
    const data = body.data ?? {};

    const steamId = safeString(data.steamId) || undefined;
    const truck = safeString(data.truck);
    const sourceCity = safeString(data.sourceCity);
    const destinationCity = safeString(data.destinationCity);
    const cargo = safeString(data.cargo);
    const income = safeIncome(data.income);

    const { userId, entrepriseId } = await resolveUserContext(steamId);

    const event = await prisma.clientEvent.create({
      data: {
        type,
        payload: body,
      },
    });

    // -------------------------
    // JOB STARTED
    // -------------------------
    if (type === "job_started" && steamId) {
      const existingActive = await prisma.livraison.findFirst({
        where: {
          steamId,
          status: "EN_COURS",
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (existingActive) {
        await prisma.livraison.update({
          where: {
            id: existingActive.id,
          },
          data: {
            entrepriseId,
            truck,
            sourceCity,
            destinationCity,
            cargo,
            income,
          },
        });

        console.log("📦 Livraison déjà active mise à jour :", existingActive.id);
      } else {
        await prisma.livraison.create({
          data: {
            jobId: `${steamId}-${Date.now()}`,
            steamId,
            entrepriseId,
            truck,
            sourceCity,
            destinationCity,
            cargo,
            income,
            status: "EN_COURS",
          },
        });

        console.log("📦 Nouvelle livraison créée pour :", steamId);
      }
    }

    // -------------------------
    // JOB FINISHED
    // -------------------------
    if (type === "job_finished" && steamId) {
      const activeLivraison = await prisma.livraison.findFirst({
        where: {
          steamId,
          status: "EN_COURS",
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (!activeLivraison) {
        console.log("⚠️ Aucune livraison EN_COURS à terminer pour :", steamId);

        return NextResponse.json({
          ok: true,
          eventId: event.id,
          ignored: true,
          reason: "no_active_delivery",
        });
      }

      const finishedLivraison = await prisma.livraison.update({
        where: {
          id: activeLivraison.id,
        },
        data: {
          steamId,
          entrepriseId,
          finishedAt: new Date(),
          status: "TERMINEE",
          truck,
          sourceCity,
          destinationCity,
          cargo,
          income,
        },
      });

      const gainEntreprise = Math.round(income * 0.15);
      const gainChauffeur = Math.round(income * 0.2);
      const charges = income - gainEntreprise - gainChauffeur;

      if (userId) {
        await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            argentPerso: {
              increment: gainChauffeur,
            },
          },
        });
      }

      if (entrepriseId) {
        await prisma.entreprise.update({
          where: {
            id: entrepriseId,
          },
          data: {
            argent: {
              increment: gainEntreprise,
            },
          },
        });

        await prisma.finance.createMany({
          data: [
            {
              entrepriseId,
              chauffeurId: userId,
              type: "LIVRAISON_ENTREPRISE",
              description: `Part société livraison ${sourceCity || "?"} → ${destinationCity || "?"} (${cargo || "Inconnu"})`,
              montant: gainEntreprise,
            },
            {
              entrepriseId,
              chauffeurId: userId,
              type: "SALAIRE_CHAUFFEUR",
              description: `Part chauffeur livraison ${sourceCity || "?"} → ${destinationCity || "?"} (${cargo || "Inconnu"})`,
              montant: gainChauffeur,
            },
            {
              entrepriseId,
              chauffeurId: userId,
              type: "CHARGES_LIVRAISON",
              description: `Charges livraison ${sourceCity || "?"} → ${destinationCity || "?"} (${cargo || "Inconnu"})`,
              montant: -charges,
            },
          ],
        });
      }

      console.log("✅ Livraison terminée :", finishedLivraison.id);
      console.log("💰 Répartition livraison terminée :", {
        total: income,
        entreprise: gainEntreprise,
        chauffeur: gainChauffeur,
        charges,
      });
    }

    // -------------------------
    // JOB CANCELLED
    // -------------------------
    if (type === "job_cancelled" && steamId) {
      const activeLivraison = await prisma.livraison.findFirst({
        where: {
          steamId,
          status: "EN_COURS",
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (!activeLivraison) {
        console.log("⚠️ Aucune livraison EN_COURS à annuler pour :", steamId);

        return NextResponse.json({
          ok: true,
          eventId: event.id,
          ignored: true,
          reason: "no_active_delivery",
        });
      }

      await prisma.livraison.update({
        where: {
          id: activeLivraison.id,
        },
        data: {
          steamId,
          entrepriseId,
          finishedAt: new Date(),
          status: "ANNULEE",
          truck,
          sourceCity,
          destinationCity,
          cargo,
          income,
        },
      });

      console.log("❌ Livraison annulée :", activeLivraison.id);
    }

    console.log("🚀 EVENT CLIENT :", body);

    return NextResponse.json({
      ok: true,
      eventId: event.id,
    });
  } catch (error) {
    console.error("Erreur EVENT :", error);

    return NextResponse.json(
      { ok: false, message: "Erreur réception event" },
      { status: 500 }
    );
  }
}