import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const steamId = cookieStore.get("steamId")?.value;

    if (!steamId) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const formData = await request.formData();
    const camionId = Number(formData.get("camionId"));

    if (!Number.isInteger(camionId) || camionId <= 0) {
      return NextResponse.redirect(new URL("/marche-occasion", request.url));
    }

    const user = await prisma.user.findUnique({
      where: { steamId },
    });

    if (!user) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const camion = await prisma.camion.findFirst({
      where: {
        id: camionId,
        aVendre: true,
        actif: true,
      },
    });

    if (!camion || !camion.entrepriseId || !camion.prixVente) {
      return NextResponse.redirect(new URL("/marche-occasion", request.url));
    }

    if ((user.argentPerso ?? 0) < camion.prixVente) {
      return NextResponse.redirect(new URL("/marche-occasion", request.url));
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          argentPerso: {
            decrement: camion.prixVente,
          },
        },
      }),

      prisma.entreprise.update({
        where: { id: camion.entrepriseId },
        data: {
          argent: {
            increment: camion.prixVente,
          },
        },
      }),

      prisma.camion.update({
        where: { id: camion.id },
        data: {
          entrepriseId: null,
          proprietaireId: user.id,
          chauffeurAttribueId: null,
          aVendre: false,
          prixVente: null,
          misEnVenteAt: null,
          venduAt: new Date(),
          statut: "DISPONIBLE",
        },
      }),

      prisma.venteCamion.create({
        data: {
          camionId: camion.id,
          entrepriseId: camion.entrepriseId,
          acheteurId: user.id,
          prixVente: camion.prixVente,
          kilometrage: camion.kilometrage,
        },
      }),
    ]);

    return NextResponse.redirect(new URL("/camions/parking", request.url));
  } catch (error) {
    console.error("Erreur achat camion occasion :", error);
    return NextResponse.redirect(new URL("/marche-occasion", request.url));
  }
}