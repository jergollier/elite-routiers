import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const drivers = await prisma.$queryRaw`
  SELECT
    id,
    username,
    avatar,
    "lastMapX",
    "lastMapY",
    "lastHeading",
    "lastOnlineAt"
  FROM "User"
  WHERE "lastMapX" IS NOT NULL
    AND "lastMapY" IS NOT NULL
  ORDER BY "lastOnlineAt" DESC
  LIMIT 50
`;

    return NextResponse.json({ drivers });
  } catch (error) {
    console.error("❌ ERREUR LIVE LIST :", error);
    return NextResponse.json({ drivers: [] });
  }
}