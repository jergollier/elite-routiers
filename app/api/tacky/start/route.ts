import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

function makeCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }

  return result;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const deviceName = body?.deviceName ?? "Tacky PC";

    const requestId = randomUUID();
    const deviceCode = makeCode(6);

    await prisma.tackySession.create({
      data: {
        requestId,
        deviceCode,
        deviceName,
        isLinked: false,
        isActive: true,
      },
    });

    return NextResponse.json({
      requestId,
      deviceCode,
      connectUrl: `https://elite-routiers.vercel.app/tacky/connect2?requestId=${requestId}&code=${deviceCode}`,
    });
  } catch (error) {
    console.error("Erreur /api/tacky/start :", error);

    return NextResponse.json(
      { error: "Erreur serveur start tacky" },
      { status: 500 }
    );
  }
}