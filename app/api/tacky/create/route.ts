import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";

export async function POST() {
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

  const token = randomUUID();

  await prisma.tackySession.create({
    data: {
      userId: user.id,
      token,
      deviceName: "Tacky PC",
    },
  });

  return NextResponse.json({ token });
}