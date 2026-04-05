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
      await prisma.livraison.upsert({
        where: {
          jobId: data.jobId,
        },
        update: {
          steamId: data.steamId ?? null,
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
      await prisma.livraison.updateMany({
        where: {
          jobId: data.jobId,
          status: "EN_COURS",
        },
        data: {
          steamId: data.steamId ?? null,
          finishedAt: new Date(),
          status: "TERMINEE",
          truck: data.truck ?? "",
          sourceCity: data.sourceCity ?? "",
          destinationCity: data.destinationCity ?? "",
          cargo: data.cargo ?? "",
          income: Math.round(data.income ?? 0),
        },
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