import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { calculerPrixLitreCuveSite } from "@/lib/fuel-market";

type BuyFuelBody = {
  litres?: number;
};

const PRIX_MAJORE_LITRE = 2.5;

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const steamId = cookieStore.get("steamId")?.value;

    if (!steamId) {
      return NextResponse.json(
        { ok: false, error: "Utilisateur non connecté." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as BuyFuelBody;
    const litresDemandes =
      typeof body.litres === "number" && Number.isFinite(body.litres)
        ? Math.max(0, Math.round(body.litres))
        : 0;

    if (litresDemandes <= 0) {
      return NextResponse.json(
        { ok: false, error: "Quantité invalide." },
        { status: 400 }
      );
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

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Utilisateur introuvable." },
        { status: 404 }
      );
    }

    const membership = user.memberships;
    const entreprise = membership?.entreprise ?? null;

    if (!membership || !entreprise) {
      return NextResponse.json(
        { ok: false, error: "Aucune entreprise trouvée." },
        { status: 404 }
      );
    }

    const placeDisponible = Math.max(
      0,
      (entreprise.cuveMax ?? 0) - (entreprise.cuveActuelle ?? 0)
    );

    if (placeDisponible <= 0) {
      return NextResponse.json(
        { ok: false, error: "La cuve de la société est déjà pleine." },
        { status: 400 }
      );
    }

    const litresAchetes = Math.min(litresDemandes, placeDisponible);

    if (litresAchetes <= 0) {
      return NextResponse.json(
        { ok: false, error: "Aucun litre ne peut être ajouté." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const freshEntreprise = await tx.entreprise.findUnique({
        where: { id: entreprise.id },
      });

      if (!freshEntreprise) {
        throw new Error("Entreprise introuvable dans la transaction.");
      }

      const freshPlaceDisponible = Math.max(
        0,
        (freshEntreprise.cuveMax ?? 0) - (freshEntreprise.cuveActuelle ?? 0)
      );

      if (freshPlaceDisponible <= 0) {
        throw new Error("La cuve de la société est déjà pleine.");
      }

      const litresFinal = Math.min(litresAchetes, freshPlaceDisponible);

      let cuveSite = await tx.cuveSite.findUnique({
        where: { id: 1 },
      });

      if (!cuveSite) {
        cuveSite = await tx.cuveSite.create({
          data: {
            id: 1,
            stockActuel: 0,
            capaciteMax: 300000,
            prixActuelLitre: 1.95,
          },
        });
      }

      const stockSiteAvant = cuveSite.stockActuel;
      const prixNormal = Number(cuveSite.prixActuelLitre);

      const litresDepuisSite = Math.min(stockSiteAvant, litresFinal);
      const litresMajores = litresFinal - litresDepuisSite;

      const montantDepuisSite = litresDepuisSite * prixNormal;
      const montantMajore = litresMajores * PRIX_MAJORE_LITRE;
      const montantTotal = montantDepuisSite + montantMajore;

      if ((freshEntreprise.argent ?? 0) < montantTotal) {
        throw new Error(
          `Fonds insuffisants. Montant nécessaire : ${montantTotal.toFixed(2)} €.`
        );
      }

      const stockSiteApres = stockSiteAvant - litresDepuisSite;
      const cuveEntrepriseAvant = freshEntreprise.cuveActuelle ?? 0;
      const cuveEntrepriseApres = cuveEntrepriseAvant + litresFinal;

      const nouveauPrixCuveSite = calculerPrixLitreCuveSite(
        stockSiteApres,
        cuveSite.capaciteMax
      );

      await tx.entreprise.update({
        where: { id: freshEntreprise.id },
        data: {
          argent: {
            decrement: Math.round(montantTotal),
          },
          cuveActuelle: cuveEntrepriseApres,
          prixLitreCuve: prixNormal,
          prixLitreHorsCuve: PRIX_MAJORE_LITRE,
        },
      });

      await tx.cuveSite.update({
        where: { id: cuveSite.id },
        data: {
          stockActuel: stockSiteApres,
          prixActuelLitre: nouveauPrixCuveSite,
        },
      });

      const achat = await tx.achatCarburantSite.create({
        data: {
          cuveSiteId: cuveSite.id,
          entrepriseId: freshEntreprise.id,
          litresAchetes: litresFinal,
          prixLitre: prixNormal,
          montantTotal,
          stockSiteAvant,
          stockSiteApres,
          cuveEntrepriseAvant,
          cuveEntrepriseApres,
        },
      });

      await tx.mouvementCuveSite.create({
        data: {
          cuveSiteId: cuveSite.id,
          type: "ACHAT_SOCIETE",
          litres: -litresDepuisSite,
          stockAvant: stockSiteAvant,
          stockApres: stockSiteApres,
          prixLitreAuMoment: nouveauPrixCuveSite,
          description: `Achat carburant par ${freshEntreprise.nom} - ${litresDepuisSite} L cuve site, ${litresMajores} L majorés`,
          achatCarburantSiteId: achat.id,
        },
      });

      await tx.finance.create({
        data: {
          entrepriseId: freshEntreprise.id,
          chauffeurId: user.id,
          type: "ACHAT_CARBURANT_SITE",
          description: `Achat carburant société (${litresDepuisSite} L cuve site, ${litresMajores} L hors stock à 2,50 €/L)`,
          montant: -Math.round(montantTotal),
        },
      });

      return {
        entrepriseNom: freshEntreprise.nom,
        litresDemandes,
        litresAchetes: litresFinal,
        litresDepuisSite,
        litresMajores,
        prixNormal,
        prixMajore: PRIX_MAJORE_LITRE,
        montantDepuisSite: Number(montantDepuisSite.toFixed(2)),
        montantMajore: Number(montantMajore.toFixed(2)),
        montantTotal: Number(montantTotal.toFixed(2)),
        stockSiteAvant,
        stockSiteApres,
        cuveEntrepriseAvant,
        cuveEntrepriseApres,
        nouveauPrixCuveSite: Number(nouveauPrixCuveSite.toFixed(2)),
      };
    });

    return NextResponse.json({
      ok: true,
      message: "Achat de carburant effectué avec succès.",
      ...result,
    });
  } catch (error) {
    console.error("Erreur achat fuel market:", error);

    const message =
      error instanceof Error ? error.message : "Erreur serveur achat carburant.";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}