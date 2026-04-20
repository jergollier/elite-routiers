import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const steamId = cookieStore.get("steamId")?.value;

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (!steamId) {
      return NextResponse.redirect(new URL("/", baseUrl), 303);
    }

    const user = await prisma.user.findUnique({
      where: { steamId },
      include: {
        memberships: true,
      },
    });

    if (!user || user.memberships.length === 0) {
      return NextResponse.redirect(new URL("/societe", baseUrl), 303);
    }

    const membership = user.memberships[0];

    await prisma.entrepriseMembre.delete({
      where: {
        id: membership.id,
      },
    });

    return NextResponse.redirect(new URL("/societe", baseUrl), 303);
  } catch (error) {
    console.error("Erreur démission entreprise :", error);

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    return NextResponse.redirect(new URL("/mon-entreprise", baseUrl), 303);
  }
}