import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const type = body.type ?? "unknown";
    const data = body.data ?? {};

    const event = await prisma.clientEvent.create({
      data: {
        type,
        payload: body,
      },
    });

    if (type === "job_started" && data.jobId) {
      let entrepriseId: string | null = null;

      if (data.steamId) {
        const membership = await prisma.entrepriseMembre.findFirst({
          where: {
            user: {
              steamId: data.steamId,
            },
          },
          select: {
            entrepriseId: true,
          },
        });

        entrepriseId =
          membership?.entrepriseId != null
            ? String(membership.entrepriseId)
            : null;
      }

      await prisma.livraison.upsert({
        where: {
          jobId: data.jobId,
        },
        update: {
          steamId: data.steamId ?? null,
          entrepriseId,
          truck: data.truck ?? "",
          sourceCity: data.sourceCity ?? "",
          destinationCity: data.destinationCity ?? "",
          cargo: data.cargo ?? "",
          income: Math.round(data.income ?? 0),
          status: "EN_COURS",
        },
        create: {
          jobId: data.jobId,
          steamId: data.steamId ?? null,
          entrepriseId,
          truck: data.truck ?? "",
          sourceCity: data.sourceCity ?? "",
          destinationCity: data.destinationCity ?? "",
          cargo: data.cargo ?? "",
          income: Math.round(data.income ?? 0),
          status: "EN_COURS",
        },
      });
    }

    if (type === "job_finished" && data.jobId) {
      const income = Math.max(0, Math.round(data.income ?? 0));
      const gainEntreprise = Math.round(income * 0.15);
      const gainChauffeur = Math.round(income * 0.2);

      let entrepriseId: string | null = null;
      let userId: string | null = null;

      if (data.steamId) {
        const user = await prisma.user.findUnique({
          where: {
            steamId: data.steamId,
          },
          select: {
            id: true,
          },
        });

        userId = user?.id ?? null;

        const membership = await prisma.entrepriseMembre.findFirst({
          where: {
            user: {
              steamId: data.steamId,
            },
          },
          select: {
            entrepriseId: true,
          },
        });

        entrepriseId =
          membership?.entrepriseId != null
            ? String(membership.entrepriseId)
            : null;
      }

      await prisma.livraison.updateMany({
        where: {
          jobId: data.jobId,
          status: "EN_COURS",
        },
        data: {
          steamId: data.steamId ?? null,
          entrepriseId,
          finishedAt: new Date(),
          status: "TERMINEE",
          truck: data.truck ?? "",
          sourceCity: data.sourceCity ?? "",
          destinationCity: data.destinationCity ?? "",
          cargo: data.cargo ?? "",
          income,
        },
      });

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
      }

      console.log("💰 Répartition livraison :", {
        total: income,
        entreprise: gainEntreprise,
        chauffeur: gainChauffeur,
        charges: income - gainEntreprise - gainChauffeur,
      });
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