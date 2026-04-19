import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type InfractionBody = {
  steamId?: string;
  amount?: number;
  reason?: string;
  truck?: string;
  livraisonId?: string | null;
  sourceCity?: string;
  destinationCity?: string;
  cargo?: string;
  occuredAt?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as InfractionBody;

    const steamId = String(body.steamId || "").trim();

    const amount =
      typeof body.amount === "number" && Number.isFinite(body.amount)
        ? Math.max(0, Math.round(body.amount))
        : 0;

    const reason =
      String(body.reason || "").trim() || "depassement_temps_conduite";

    const truck = String(body.truck || "").trim();
    const livraisonId = String(body.livraisonId || "").trim() || null;
    const sourceCity = String(body.sourceCity || "").trim();
    const destinationCity = String(body.destinationCity || "").trim();
    const cargo = String(body.cargo || "").trim();

    if (!steamId) {
      return NextResponse.json({ error: "steamId manquant" }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "amount invalide" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { steamId },
      include: {
        memberships: {
          include: {
            entreprise: true,
          },
          orderBy: {
            createdAt: "asc",
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "chauffeur introuvable" },
        { status: 404 }
      );
    }

    const membership = user.memberships[0];

    if (!membership) {
      return NextResponse.json(
        { error: "aucune entreprise trouvée pour ce chauffeur" },
        { status: 404 }
      );
    }

    const entreprise = membership.entreprise;

    const chauffeurNom = user.username || "Chauffeur";

    const description = `Amende dépassement conduite - ${chauffeurNom}`;

    const finance = await prisma.finance.create({
      data: {
        entrepriseId: entreprise.id,
        chauffeurId: user.id,
        type: "AMENDE",
        description,
        montant: amount,
      },
    });

    await prisma.entreprise.update({
      where: { id: entreprise.id },
      data: {
        argent: {
          decrement: amount,
        },
      },
    });

    await prisma.chauffeurStat.upsert({
      where: {
        userId_entrepriseId: {
          userId: user.id,
          entrepriseId: entreprise.id,
        },
      },
      update: {
        infractions: {
          increment: 1,
        },
      },
      create: {
        userId: user.id,
        entrepriseId: entreprise.id,
        infractions: 1,
      },
    });

    return NextResponse.json({
      ok: true,
      financeId: finance.id,
      entrepriseId: entreprise.id,
      chauffeurId: user.id,
      montant: amount,
    });
  } catch (error) {
    console.error("Erreur /api/client/infraction :", error);

    return NextResponse.json({ error: "erreur serveur" }, { status: 500 });
  }
}