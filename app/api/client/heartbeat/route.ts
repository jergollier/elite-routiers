import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log("🔥 HEARTBEAT CLIENT :", body);

    const steamId = body?.steamId;

    if (steamId) {
      await prisma.user.update({
        where: { steamId },
        data: {
          lastOnlineAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Données reçues",
    });
  } catch (error) {
    console.error("Erreur heartbeat client :", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Erreur réception données",
      },
      { status: 500 }
    );
  }
}