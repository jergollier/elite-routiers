import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const ROLES_AUTORISES = ["DIRECTEUR", "SOUS_DIRECTEUR", "CHEF_ATELIER"];

function normaliserVille(value?: string | null) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const steamId = cookieStore.get("steamId")?.value;

    if (!steamId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = (await request.json()) as {
      camionId?: number;
      remorqueId?: number;
      vehiculeType?: "CAMION" | "REMORQUE";
    };

    const camionId = Number(body.camionId || 0);
    const remorqueId = Number(body.remorqueId || 0);
    const vehiculeType =
      body.vehiculeType || (remorqueId ? "REMORQUE" : "CAMION");

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

    if (!user || !user.memberships?.entreprise) {
      return NextResponse.json(
        { error: "Utilisateur ou société introuvable" },
        { status: 404 }
      );
    }

    const membership = user.memberships;
    const entreprise = membership.entreprise;

    if (!ROLES_AUTORISES.includes(membership.role)) {
      return NextResponse.json(
        { error: "Action non autorisée" },
        { status: 403 }
      );
    }

    if (vehiculeType === "REMORQUE") {
      if (!remorqueId || Number.isNaN(remorqueId)) {
        return NextResponse.json({ error: "Remorque invalide" }, { status: 400 });
      }

      const remorque = await prisma.remorque.findFirst({
        where: {
          id: remorqueId,
          entrepriseId: entreprise.id,
        },
        select: {
          id: true,
          degatsChassis: true,
          degatsRoues: true,
          degatsCaisse: true,
          degatsCargaison: true,
        },
      });

      if (!remorque) {
        return NextResponse.json(
          { error: "Remorque introuvable" },
          { status: 404 }
        );
      }

      const totalDegats =
        (remorque.degatsChassis ?? 0) +
        (remorque.degatsRoues ?? 0) +
        (remorque.degatsCaisse ?? 0) +
        (remorque.degatsCargaison ?? 0);

      if (totalDegats <= 0) {
        return NextResponse.json(
          { error: "Aucun dégât à réparer" },
          { status: 400 }
        );
      }

      const prixFinal = totalDegats * 800;

      if ((entreprise.argent ?? 0) < prixFinal) {
        return NextResponse.json(
          { error: "Pas assez d'argent dans la société" },
          { status: 400 }
        );
      }

      await prisma.$transaction([
        prisma.remorque.update({
          where: { id: remorque.id },
          data: {
            degatsChassis: 0,
            degatsRoues: 0,
            degatsCaisse: 0,
            degatsCargaison: 0,
            pneusUsure: 0,
            pneusRestantsKm: 100000,
          },
        }),

        prisma.entreprise.update({
          where: { id: entreprise.id },
          data: {
            argent: {
              decrement: prixFinal,
            },
          },
        }),

        prisma.remorqueEntretien.create({
          data: {
            remorqueId: remorque.id,
            entrepriseId: entreprise.id,
            userId: user.id,
            type: "REPARATION_GENERALE",
            prix: prixFinal,
            commentaire: "Réparation complète des dégâts de la remorque",
          },
        }),

        prisma.finance.create({
          data: {
            entrepriseId: entreprise.id,
            chauffeurId: user.id,
            type: "REPARATION_REMORQUE",
            description: `Réparation dégâts remorque #${remorque.id}`,
            montant: -prixFinal,
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: "Dégâts de la remorque réparés",
        prixBase: prixFinal,
        majoration: 0,
        prix: prixFinal,
        estMaisonMere: true,
      });
    }

    if (!camionId || Number.isNaN(camionId)) {
      return NextResponse.json({ error: "Camion invalide" }, { status: 400 });
    }

    const camion = await prisma.camion.findFirst({
      where: {
        id: camionId,
        entrepriseId: entreprise.id,
      },
      select: {
        id: true,
        positionActuelle: true,
        degatsMoteur: true,
        degatsCarrosserie: true,
        degatsChassis: true,
        degatsRoues: true,
      },
    });

    if (!camion) {
      return NextResponse.json({ error: "Camion introuvable" }, { status: 404 });
    }

    const totalDegats =
      (camion.degatsMoteur ?? 0) +
      (camion.degatsCarrosserie ?? 0) +
      (camion.degatsChassis ?? 0) +
      (camion.degatsRoues ?? 0);

    if (totalDegats <= 0) {
      return NextResponse.json(
        { error: "Aucun dégât à réparer" },
        { status: 400 }
      );
    }

    const villeCamion = normaliserVille(camion.positionActuelle);
    const villeMaisonETS2 = normaliserVille(entreprise.villeETS2);
    const villeMaisonATS = normaliserVille(entreprise.villeATS);

    const estMaisonMere =
      villeCamion &&
      (villeCamion === villeMaisonETS2 || villeCamion === villeMaisonATS);

    const prixBase = totalDegats * 1000;
    const majoration = estMaisonMere ? 0 : Math.round(prixBase * 0.2);
    const prixFinal = prixBase + majoration;

    if ((entreprise.argent ?? 0) < prixFinal) {
      return NextResponse.json(
        { error: "Pas assez d'argent dans la société" },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.camion.update({
        where: { id: camion.id },
        data: {
          degatsMoteur: 0,
          degatsCarrosserie: 0,
          degatsChassis: 0,
          degatsRoues: 0,
        },
      }),

      prisma.entreprise.update({
        where: { id: entreprise.id },
        data: {
          argent: {
            decrement: prixFinal,
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: estMaisonMere
        ? "Dégâts réparés à la maison mère"
        : "Dégâts réparés hors maison mère avec majoration de 20%",
      prixBase,
      majoration,
      prix: prixFinal,
      estMaisonMere,
    });
  } catch (error) {
    console.error("Erreur réparation dégâts atelier :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}