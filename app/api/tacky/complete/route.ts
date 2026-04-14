import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { steamId },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const body = await request.json();
  const { requestId, code } = body;

  if (!requestId || !code) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  const session = await prisma.tackySession.findUnique({
    where: { requestId },
  });

  if (!session) {
    return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  }

  if (session.deviceCode !== code) {
    return NextResponse.json({ error: "Code invalide" }, { status: 400 });
  }

  const token = randomUUID();

  await prisma.tackySession.update({
    where: { requestId },
    data: {
      userId: user.id,
      token,
      isLinked: true,
      isActive: true,
    },
  });

  return NextResponse.json({ success: true });
}