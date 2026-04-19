import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { RoleEntreprise } from "@prisma/client";

const ROLES_AUTORISES: RoleEntreprise[] = [
  RoleEntreprise.DIRECTEUR,
  RoleEntreprise.SOUS_DIRECTEUR,
];

function cleanValue(value: unknown) {
  const text = String(value ?? "").trim();
  return text === "" ? null : text;
}

function isValidDiscordWebhook(url: string | null) {
  if (!url) return true;

  return (
    url.startsWith("https://discord.com/api/webhooks/") ||
    url.startsWith("https://canary.discord.com/api/webhooks/") ||
    url.startsWith("https://ptb.discord.com/api/webhooks/")
  );
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const steamId = cookieStore.get("steamId")?.value;

    if (!steamId) {
      return NextResponse.json(
        { success: false, error: "Non connecté." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const discordUrl = cleanValue(body.discordUrl);
    const discordWebhookLivraison = cleanValue(body.discordWebhookLivraison);
    const discordWebhookAchatCamion = cleanValue(body.discordWebhookAchatCamion);
    const discordWebhookVenteCamion = cleanValue(body.discordWebhookVenteCamion);
    const discordWebhookRecrutement = cleanValue(body.discordWebhookRecrutement);
    const discordWebhookDepart = cleanValue(body.discordWebhookDepart);
    const discordWebhookMaintenance = cleanValue(body.discordWebhookMaintenance);

    const webhooks = [
      discordWebhookLivraison,
      discordWebhookAchatCamion,
      discordWebhookVenteCamion,
      discordWebhookRecrutement,
      discordWebhookDepart,
      discordWebhookMaintenance,
    ];

    for (const webhook of webhooks) {
      if (!isValidDiscordWebhook(webhook)) {
        return NextResponse.json(
          { success: false, error: "Un lien webhook Discord est invalide." },
          { status: 400 }
        );
      }
    }

    const membership = await prisma.entrepriseMembre.findFirst({
      where: {
        user: {
          steamId,
        },
      },
      include: {
        entreprise: true,
      },
    });

    if (!membership || !membership.entreprise) {
      return NextResponse.json(
        { success: false, error: "Aucune entreprise trouvée." },
        { status: 404 }
      );
    }

    if (!ROLES_AUTORISES.includes(membership.role)) {
      return NextResponse.json(
        { success: false, error: "Accès refusé." },
        { status: 403 }
      );
    }

    await prisma.entreprise.update({
      where: {
        id: membership.entreprise.id,
      },
      data: {
        discordUrl,
        discordWebhookLivraison,
        discordWebhookAchatCamion,
        discordWebhookVenteCamion,
        discordWebhookRecrutement,
        discordWebhookDepart,
        discordWebhookMaintenance,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Paramètres enregistrés avec succès.",
    });
  } catch (error) {
    console.error("Erreur route /api/entreprise/parametres :", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur.",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}