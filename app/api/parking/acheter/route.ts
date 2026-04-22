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

    const user = await prisma.user.findUnique({
      where: { steamId },
      select: {
        id: true,
        argentPerso: true,
        parkingPlaces: true,
      },
    });

    if (!user) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const prixPlace = 100000;
    const placesActuelles = user.parkingPlaces ?? 0;
    const argentPerso = user.argentPerso ?? 0;

    if (placesActuelles >= 5) {
      return NextResponse.redirect(new URL("/camions/parking", request.url));
    }

    if (argentPerso < prixPlace) {
      return NextResponse.redirect(new URL("/camions/parking", request.url));
    }

    await prisma.user.update({
      where: { steamId },
      data: {
        argentPerso: {
          decrement: prixPlace,
        },
        parkingPlaces: {
          increment: 1,
        },
      },
    });

    return NextResponse.redirect(new URL("/camions/parking", request.url));
  } catch (error) {
    console.error("Erreur achat place parking :", error);
    return NextResponse.redirect(new URL("/camions/parking", request.url));
  }
}