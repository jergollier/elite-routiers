import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const steamId = cookieStore.get("steamId")?.value;

    if (!steamId) {
      return NextResponse.json(
        { ok: false, message: "Non authentifié" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const livraisonId = body?.livraisonId;

    if (!livraisonId) {
      return NextResponse.json(
        { ok: false, message: "Livraison introuvable" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { steamId },
      include: {
        memberships: true,
      },
    });

    if (!user || !user.memberships) {
      return NextResponse.json(
        { ok: false, message: "Aucune entreprise trouvée" },
        { status: 403 }
      );
    }

    const membership = user.memberships;

    const rolesAutorises = [
      "DIRECTEUR",
      "SOUS_DIRECTEUR",
      "CHEF_EQUIPE",
      "CHEF_ATELIER",
    ];

    if (!rolesAutorises.includes(membership.role)) {
      return NextResponse.json(
        { ok: false, message: "Permission refusée" },
        { status: 403 }
      );
    }

    await prisma.livraison.delete({
      where: {
        id: livraisonId,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Livraison supprimée",
    });
  } catch (error) {
    console.error("Erreur suppression livraison :", error);

    return NextResponse.json(
      { ok: false, message: "Erreur suppression livraison" },
      { status: 500 }
    );
  }
}