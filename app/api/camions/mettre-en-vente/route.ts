import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const ROLES_AUTORISES = ["DIRECTEUR", "SOUS_DIRECTEUR"];

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const steamId = cookieStore.get("steamId")?.value;

    if (!steamId) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const formData = await request.formData();

    const camionId = Number(formData.get("camionId"));
    const prix = Number(formData.get("prix"));

    if (!Number.isInteger(camionId) || camionId <= 0 || !Number.isInteger(prix) || prix <= 0) {
      return NextResponse.redirect(new URL("/camions", request.url));
    }

    const user = await prisma.user.findUnique({
      where: { steamId },
      include: {
        memberships: true,
      },
    });

    if (!user || !user.memberships) {
      return NextResponse.redirect(new URL("/societe", request.url));
    }

    const membre = user.memberships;

    if (!ROLES_AUTORISES.includes(membre.role)) {
      return NextResponse.redirect(new URL("/camions", request.url));
    }

    const camion = await prisma.camion.findFirst({
      where: {
        id: camionId,
        entrepriseId: membre.entrepriseId,
        actif: true,
      },
    });

    if (!camion) {
      return NextResponse.redirect(new URL("/camions", request.url));
    }

    if (camion.aVendre) {
      return NextResponse.redirect(new URL("/camions", request.url));
    }

    await prisma.camion.update({
      where: { id: camion.id },
      data: {
        aVendre: true,
        prixVente: prix,
        misEnVenteAt: new Date(),
      },
    });

    return NextResponse.redirect(new URL("/camions", request.url));
  } catch (error) {
    console.error("Erreur mise en vente camion :", error);
    return NextResponse.redirect(new URL("/camions", request.url));
  }
}