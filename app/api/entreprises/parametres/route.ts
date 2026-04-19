import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const ROLES_AUTORISES = ["DIRECTEUR", "SOUS_DIRECTEUR"];

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

    const webhookFields = [
      discordWebhookLivraison,
      discordWebhookAchatCamion,
      discordWebhookVenteCamion,
      discordWebhookRecrutement,
      discordWebhookDepart,
      discordWebhookMaintenance,
    ];

    for (const webhook of webhookFields) {
      if (!isValidDiscordWebhook(webhook)) {
        return NextResponse.json(
          {
            success: false,
            error: "Un des liens webhook Discord est invalide.",
          },
          { status: 400 }
        );
      }
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
        },
      },
    });

    if (!user || user.memberships.length === 0) {
      return NextResponse.json(
        { success: false, error: "Aucune entreprise trouvée." },
        { status: 404 }
      );
    }

    const membership = user.memberships[0];

    if (!ROLES_AUTORISES.includes(membership.role)) {
      return NextResponse.json(
        { success: false, error: "Accès refusé." },
        { status: 403 }
      );
    }

    const entrepriseId = membership.entrepriseId;

    await prisma.entreprise.update({
      where: { id: entrepriseId },
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
    console.error("Erreur paramètres entreprise :", error);

    return NextResponse.json(
      { success: false, error: "Erreur serveur." },
      { status: 500 }
    );
  }
}