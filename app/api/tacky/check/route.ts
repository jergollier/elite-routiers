// test redeploy
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = body?.token;

    if (!token) {
      return NextResponse.json(
        { error: "Token manquant" },
        { status: 400 }
      );
    }

    const session = await prisma.tackySession.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || !session.isActive) {
      return NextResponse.json({ valid: false });
    }

    if (!session.user) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({
      valid: true,
      user: {
        id: session.user.id,
        steamId: session.user.steamId,
        pseudo: session.user.username ?? null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}