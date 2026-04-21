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
    });

    if (!user) {
      return NextResponse.redirect(new URL("/societe", baseUrl), 303);
    }

    const membership = await prisma.entrepriseMembre.findUnique({
      where: {
        userId: user.id,
      },
      include: {
        entreprise: true,
      },
    });

    if (!membership) {
      return NextResponse.redirect(new URL("/societe", baseUrl), 303);
    }

    const entreprise = membership.entreprise;

    if (!entreprise) {
      return NextResponse.redirect(new URL("/societe", baseUrl), 303);
    }

    if (membership.role === "DIRECTEUR") {
      return NextResponse.redirect(new URL("/mon-entreprise", baseUrl), 303);
    }

    await prisma.$transaction([
      prisma.livraison.updateMany({
        where: {
          steamId,
          entrepriseId: entreprise.id,
        },
        data: {
          entrepriseId: null,
        },
      }),

      prisma.pleinCarburant.updateMany({
        where: {
          steamId,
          entrepriseId: entreprise.id,
        },
        data: {
          entrepriseId: null,
        },
      }),

      prisma.camion.updateMany({
        where: {
          entrepriseId: entreprise.id,
          chauffeurAttribueId: user.id,
        },
        data: {
          chauffeurAttribueId: null,
          statut: "DISPONIBLE",
        },
      }),

      prisma.chauffeurStat.deleteMany({
        where: {
          userId: user.id,
          entrepriseId: entreprise.id,
        },
      }),

      prisma.entrepriseMembre.delete({
        where: {
          id: membership.id,
        },
      }),
    ]);

    return NextResponse.redirect(new URL("/societe", baseUrl), 303);
  } catch (error) {
    console.error("Erreur démission entreprise :", error);

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    return NextResponse.redirect(new URL("/mon-entreprise", baseUrl), 303);
  }
}