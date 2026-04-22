import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const cookieStore = await cookies();
    const steamId = cookieStore.get("steamId")?.value;

    if (!steamId) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const { id } = await params;
    const entrepriseId = Number(id);

    if (!entrepriseId || Number.isNaN(entrepriseId)) {
      return NextResponse.redirect(new URL("/societe", request.url));
    }

    const formData = await request.formData();

    const ageValue = formData.get("age");
    const region = String(formData.get("region") || "").trim();
    const jeuPrincipal = String(formData.get("jeuPrincipal") || "").trim();
    const experience = String(formData.get("experience") || "").trim();
    const microValue = String(formData.get("micro") || "NON").trim();
    const disponibilites = String(formData.get("disponibilites") || "").trim();
    const motivation = String(formData.get("motivation") || "").trim();
    const message = String(formData.get("message") || "").trim();

    const age =
      ageValue && String(ageValue).trim() !== ""
        ? Number(ageValue)
        : null;

    const micro = microValue === "OUI";

    if (!motivation) {
      return NextResponse.redirect(
        new URL(`/entreprise/${entrepriseId}/postuler`, request.url)
      );
    }

    const [user, entreprise] = await Promise.all([
      prisma.user.findUnique({
        where: { steamId },
        include: {
          entreprisesCreees: true,
        },
      }),
      prisma.entreprise.findUnique({
        where: { id: entrepriseId },
      }),
    ]);

    if (!user || !entreprise) {
      return NextResponse.redirect(new URL("/societe", request.url));
    }

    const membershipActif = await prisma.entrepriseMembre.findUnique({
      where: {
        userId: user.id,
      },
    });

    const candidatureExistante = await prisma.entrepriseCandidature.findFirst({
      where: {
        userId: user.id,
        entrepriseId,
        statut: "EN_ATTENTE",
      },
    });

    const estSaPropreSociete = entreprise.ownerSteamId === steamId;
    const estDejaDansUneSociete = Boolean(membershipActif);
    const estProprietaireSociete = Boolean(user.entreprisesCreees);
    const recrutementFerme = !entreprise.recrutement;
    const candidatureDejaEnvoyee = Boolean(candidatureExistante);

    if (
      estSaPropreSociete ||
      estDejaDansUneSociete ||
      estProprietaireSociete ||
      recrutementFerme ||
      candidatureDejaEnvoyee
    ) {
      return NextResponse.redirect(
        new URL(`/entreprise/${entrepriseId}`, request.url)
      );
    }

    await prisma.entrepriseCandidature.create({
      data: {
        userId: user.id,
        entrepriseId,
        age,
        region,
        jeuPrincipal,
        experience,
        micro,
        disponibilites,
        motivation,
        message,
        statut: "EN_ATTENTE",
      },
    });

    return NextResponse.redirect(
      new URL(`/entreprise/${entrepriseId}`, request.url)
    );
  } catch (error) {
    console.error("Erreur candidature entreprise :", error);
    return NextResponse.redirect(new URL("/societe", request.url));
  }
}