import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { RoleEntreprise } from "@prisma/client";

const ROLES_AUTORISES = [
  RoleEntreprise.DIRECTEUR,
  RoleEntreprise.SOUS_DIRECTEUR,
];

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const steamId = cookieStore.get("steamId")?.value;

    if (!steamId) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const formData = await request.formData();

    const marque = String(formData.get("marque") || "");
    const modele = String(formData.get("modele") || "");
    const type = String(formData.get("type") || "");
    const prix = Number(formData.get("prix") || 0);
    const image = String(formData.get("image") || "/truck.jpg");

    if (!marque || !modele || !type || !prix) {
      return NextResponse.redirect(new URL("/remorques/acheter", request.url));
    }

    const user = await prisma.user.findUnique({
      where: { steamId },
      include: {
        memberships: {
          include: {
            entreprise: true,
          },
        },
      },
    });

    if (!user || !user.memberships || !user.memberships.entreprise) {
      return NextResponse.redirect(new URL("/societe", request.url));
    }

    const role = user.memberships?.role;

    if (role !== "DIRECTEUR" && role !== "SOUS_DIRECTEUR") {
      return NextResponse.redirect(new URL("/remorques/acheter", request.url));
    }
    

    const entreprise = user.memberships.entreprise;

    if (entreprise.argent < prix) {
      return NextResponse.redirect(new URL("/remorques/acheter", request.url));
    }

    await prisma.$transaction([
      prisma.remorque.create({
        data: {
          entrepriseId: entreprise.id,
          marque: marque as any,
          modele,
          type: type as any,
          jeu: entreprise.jeu,
          image,
          prixAchat: prix,
          statut: "DISPONIBLE",
        },
      }),

      prisma.entreprise.update({
        where: { id: entreprise.id },
        data: {
          argent: {
            decrement: prix,
          },
        },
      }),

      prisma.finance.create({
        data: {
          entrepriseId: entreprise.id,
          chauffeurId: user.id,
          type: "ACHAT_REMORQUE",
          description: `Achat remorque ${marque} ${modele}`,
          montant: -prix,
        },
      }),
    ]);

    return NextResponse.redirect(new URL("/remorques", request.url));
  } catch (error) {
    console.error("Erreur achat remorque:", error);
    return NextResponse.redirect(new URL("/remorques/acheter", request.url));
  }
}