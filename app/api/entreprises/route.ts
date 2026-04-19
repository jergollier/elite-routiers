import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { RoleEntreprise } from "@prisma/client";
import { put } from "@vercel/blob";

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 Mo max pour rester sous la limite Vercel
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const steamId = cookieStore.get("steamId")?.value;

    if (!steamId) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const user = await prisma.user.findUnique({
      where: { steamId },
      include: {
        memberships: true,
        entreprisesCreees: true,
      },
    });

    if (!user) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (user.entreprisesCreees.length > 0) {
      return NextResponse.redirect(
        new URL("/societe?error=deja-proprietaire", request.url)
      );
    }

    if (user.memberships.length > 0) {
      return NextResponse.redirect(
        new URL("/societe?error=deja-dans-une-societe", request.url)
      );
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
    const recrutementValue = String(
      formData.get("recrutement") || "ouvert"
    ).trim();

    const recrutement = recrutementValue === "ouvert";

    if (!nom || !abreviation || !jeu || !typeTransport || !description) {
      return NextResponse.redirect(
        new URL("/entreprise/creer?error=champs-obligatoires", request.url)
      );
    }

    if (abreviation.length !== 3) {
      return NextResponse.redirect(
        new URL("/entreprise/creer?error=abreviation", request.url)
      );
    }

    if (!villeETS2 && !villeATS) {
      return NextResponse.redirect(
        new URL("/entreprise/creer?error=ville", request.url)
      );
    }

    let banniereUrl: string | null = null;

    const banniereFile = formData.get("banniereFile");

    if (banniereFile && banniereFile instanceof File && banniereFile.size > 0) {
      if (!ALLOWED_TYPES.includes(banniereFile.type)) {
        return NextResponse.redirect(
          new URL("/entreprise/creer?error=format-banniere", request.url)
        );
      }

      if (banniereFile.size > MAX_FILE_SIZE) {
        return NextResponse.redirect(
          new URL("/entreprise/creer?error=taille-banniere", request.url)
        );
      }

      const extension =
        banniereFile.type === "image/png"
          ? "png"
          : banniereFile.type === "image/webp"
          ? "webp"
          : "jpg";

      const safeNom = slugify(nom) || "societe";
      const fileName = `entreprises/${safeNom}-${Date.now()}.${extension}`;

      const blob = await put(fileName, banniereFile, {
        access: "public",
      });

      banniereUrl = blob.url;
    }

    const entreprise = await prisma.entreprise.create({
      data: {
        nom,
        abreviation,
        villeETS2: villeETS2 || null,
        villeATS: villeATS || null,
        jeu,
        typeTransport,
        description,
        recrutement,
        banniere: banniereUrl,
        ownerSteamId: steamId,
      },
    });

    await prisma.entrepriseMembre.create({
      data: {
        entrepriseId: entreprise.id,
        userId: user.id,
        role: RoleEntreprise.DIRECTEUR,
      },
    });

    return NextResponse.redirect(new URL("/monentreprise", request.url));
  } catch (error) {
    console.error("POST /api/entreprises error:", error);

    return NextResponse.redirect(
      new URL("/entreprise/creer?error=server", request.url)
    );
  }
}