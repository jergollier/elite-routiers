import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

function cleanValue(value: unknown) {
  return String(value ?? "").trim();
}


function isValidDiscordWebhook(url: string) {
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
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Utilisateur introuvable." },
        { status: 404 }
      );
    }

    const membership = await prisma.entrepriseMembre.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "Aucune entreprise trouvée." },
        { status: 404 }
      );
    }

    if (
      membership.role !== "DIRECTEUR" &&
      membership.role !== "SOUS_DIRECTEUR"
    ) {
      return NextResponse.json(
        { success: false, error: "Accès refusé." },
        { status: 403 }
      );
    }

    const updated = await prisma.entreprise.update({
      where: {
        id: membership.entrepriseId,
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
      entrepriseId: updated.id,
    });
  } catch (error: any) {
    console.error("ERREUR /api/entreprise/parametres :", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur.",
        details:
          error?.message ||
          error?.toString() ||
          "Erreur inconnue dans la route paramètres.",
      },
      { status: 500 }
    );
  }
}