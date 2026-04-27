import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const steamId = String(body.steamId || "").trim();
    const mapX = Number(body.x);
    const mapY = Number(body.y);
    const mapHeading = Number(body.heading);

    if (!steamId) {
      return NextResponse.json({ error: "steamId manquant" }, { status: 400 });
    }

    const result = await prisma.$executeRaw`
      UPDATE "User"
      SET
        "lastOnlineAt" = NOW(),
        "lastMapX" = ${Number.isFinite(mapX) ? mapX : null},
        "lastMapY" = ${Number.isFinite(mapY) ? mapY : null},
        "lastHeading" = ${Number.isFinite(mapHeading) ? mapHeading : null}
      WHERE "steamId" = ${steamId}
    `;

    return NextResponse.json({ ok: true, updated: Number(result) });
  } catch (error) {
    console.error("❌ ERREUR LIVE :", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: String(error) },
      { status: 500 }
    );
  }
}