import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { RoleEntreprise } from "@prisma/client";
import { put } from "@vercel/blob";

const MAX_FILE_SIZE = 4 * 1024 * 1024;
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

function redirect303(path: string, request: Request) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const steamId = cookieStore.get("steamId")?.value;

    if (!steamId) {
      return redirect303("/", request);
    }

    const user = await prisma.user.findUnique({
      where: { steamId },
      include: {
        memberships: true,
        entreprisesCreees: true,
      },
    });

    if (!user) {
      return redirect303("/", request);
    }

    if (user.entreprisesCreees) {
      return redirect303("/societe?error=deja-proprietaire", request);
    }

    if (user.memberships) {
      return redirect303("/societe?error=deja-dans-une-societe", request);
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
      return redirect303("/entreprise/creer?error=champs-obligatoires", request);
    }

    if (abreviation.length !== 3) {
      return redirect303("/entreprise/creer?error=abreviation", request);
    }

    if (!villeETS2 && !villeATS) {
      return redirect303("/entreprise/creer?error=ville", request);
    }

    let banniereUrl: string | null = null;

    const banniereFile = formData.get("banniereFile");

    if (banniereFile && banniereFile instanceof File && banniereFile.size > 0) {
      if (!ALLOWED_TYPES.includes(banniereFile.type)) {
        return redirect303("/entreprise/creer?error=format-banniere", request);
      }

      if (banniereFile.size > MAX_FILE_SIZE) {
        return redirect303("/entreprise/creer?error=taille-banniere", request);
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

    return redirect303("/monentreprise", request);
  } catch (error) {
    console.error("POST /api/entreprise error:", error);
    return redirect303("/entreprise/creer?error=server", request);
  }
}