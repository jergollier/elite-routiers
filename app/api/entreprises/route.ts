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

    const nom = String(formData.get("nom") || "").trim();
    const abreviation = String(formData.get("abreviation") || "")
      .trim()
      .toUpperCase();
    const villeETS2 = String(formData.get("villeETS2") || "").trim();
    const villeATS = String(formData.get("villeATS") || "").trim();
    const jeu = String(formData.get("jeu") || "").trim();
    const typeTransport = String(formData.get("typeTransport") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const banniere = String(formData.get("banniere") || "").trim();
    const recrutementValue = String(
      formData.get("recrutement") || "ouvert"
    ).trim();

    const recrutement = recrutementValue === "ouvert";

    if (!nom || !abreviation || !jeu || !typeTransport || !description) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être remplis." },
        { status: 400 }
      );
    }

    if (!villeETS2 && !villeATS) {
      return NextResponse.json(
        { error: "Tu dois choisir au moins une maison mère ETS2 ou ATS." },
        { status: 400 }
      );
    }

    if (abreviation.length !== 3) {
      return NextResponse.json(
        { error: "L'abréviation doit contenir exactement 3 lettres." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { steamId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable." },
        { status: 404 }
      );
    }

    const dejaUneEntreprise = await prisma.entreprise.findFirst({
      where: { ownerSteamId: steamId },
    });

    if (dejaUneEntreprise) {
      return NextResponse.json(
        { error: "Tu as déjà créé une entreprise." },
        { status: 400 }
      );
    }

    await prisma.entreprise.create({
      data: {
        nom,
        abreviation,
        villeETS2: villeETS2 || null,
        villeATS: villeATS || null,
        jeu,
        typeTransport,
        description,
        recrutement,
        banniere: banniere || null,
        ownerSteamId: steamId,
      },
    });

    return NextResponse.redirect(new URL("/societe", request.url));
  } catch (error) {
    console.error("POST /api/entreprises error:", error);

    return NextResponse.json(
      { error: "Erreur serveur pendant la création de l'entreprise." },
      { status: 500 }
    );
  }
}