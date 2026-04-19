import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type FuelBody = {
  steamId?: string;
  litresAjoutes?: number;
  fuelBefore?: number;
  fuelAfter?: number;
  moteurEteint?: boolean;
  camionId?: number;
  livraisonId?: string;
  game?: string;
  sessionId?: string;
  deviceId?: string;
  truck?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as FuelBody;

    const {
      steamId,
      litresAjoutes,
      fuelBefore,
      fuelAfter,
      moteurEteint,
      camionId,
      livraisonId,
      game,
      sessionId,
      deviceId,
      truck,
    } = body;

    // 🔒 Vérifs de base
    if (!steamId) {
      return NextResponse.json({ error: "steamId manquant" }, { status: 400 });
    }

    if (
      typeof litresAjoutes !== "number" ||
      litresAjoutes <= 0 ||
      !Number.isFinite(litresAjoutes)
    ) {
      return NextResponse.json({ error: "litres invalides" }, { status: 400 });
    }

    // 🔒 sécurité anti faux plein
    if (!moteurEteint) {
      return NextResponse.json(
        { error: "plein refusé (moteur allumé)" },
        { status: 400 }
      );
    }

    // 🔎 utilisateur + entreprise
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

    if (!user || user.memberships.length === 0) {
      return NextResponse.json({ error: "chauffeur sans entreprise" }, { status: 404 });
    }

    const entreprise = user.memberships[0].entreprise;

    if (!entreprise) {
      return NextResponse.json({ error: "entreprise introuvable" }, { status: 404 });
    }

    const cuveAvant = entreprise.cuveActuelle;

    // 🧠 calcul carburant
    const litres = Math.round(litresAjoutes);

    const litresPrisCuve = Math.min(litres, cuveAvant);
    const litresHorsCuve = Math.max(0, litres - cuveAvant);

    const nouveauStock = Math.max(0, cuveAvant - litresPrisCuve);

    const prixHorsCuve = Number(entreprise.prixLitreHorsCuve);
    const montantHorsCuve = Math.round(litresHorsCuve * prixHorsCuve);

    // 🔁 transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. update cuve
      await tx.entreprise.update({
        where: { id: entreprise.id },
        data: {
          cuveActuelle: nouveauStock,
        },
      });

      // 2. créer plein
      const plein = await tx.pleinCarburant.create({
        data: {
          steamId,
          entrepriseId: entreprise.id,
          camionId,
          livraisonId,
          game,
          sessionId,
          deviceId,
          truck,
          fuelBefore: fuelBefore ?? 0,
          fuelAfter: fuelAfter ?? 0,
          litresAjoutes: litres,

          moteurEteint: true,
          litresPrisCuve,
          litresHorsCuve,
          prixLitreHorsCuve: prixHorsCuve,
          montantHorsCuve,

          cuveAvant,
          cuveApres: nouveauStock,
        },
      });

      // 3. mouvement cuve
      if (litresPrisCuve > 0) {
        await tx.mouvementCuve.create({
          data: {
            entrepriseId: entreprise.id,
            pleinId: plein.id,
            chauffeurId: user.id,
            type: "SORTIE",
            litres: litresPrisCuve,
            cuveAvant,
            cuveApres: nouveauStock,
            description: `Plein chauffeur (${litresPrisCuve} L)`,
          },
        });
      }

      // 4. charge hors cuve
      if (litresHorsCuve > 0) {
        await tx.finance.create({
          data: {
            entrepriseId: entreprise.id,
            chauffeurId: user.id,
            pleinId: plein.id,
            type: "CARBURANT_HORS_CUVE",
            description: `Carburant hors cuve (${litresHorsCuve} L à ${prixHorsCuve}€/L)`,
            montant: montantHorsCuve,
          },
        });
      }

      return plein;
    });

    return NextResponse.json({
      success: true,
      plein: result,
      resume: {
        litres,
        prisCuve: litresPrisCuve,
        horsCuve: litresHorsCuve,
        montant: montantHorsCuve,
      },
    });
  } catch (error) {
    console.error("Erreur /api/fuel :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}