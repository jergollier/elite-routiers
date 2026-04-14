import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const { requestId } = body;

  if (!requestId) {
    return NextResponse.json({ error: "requestId manquant" }, { status: 400 });
  }

  const session = await prisma.tackySession.findUnique({
    where: { requestId },
    include: { user: true },
  });

  if (!session) {
    return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  }

  if (!session.isLinked || !session.token || !session.user) {
    return NextResponse.json({ linked: false });
  }

  return NextResponse.json({
    linked: true,
    token: session.token,
    user: {
      id: session.user.id,
      steamId: session.user.steamId,
      pseudo: session.user.username ?? null,
    },
  });
}