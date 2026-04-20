import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const ROLES_AUTORISES = ["DIRECTEUR", "SOUS_DIRECTEUR"];

const LABELS: Record<string, string> = {
  discordWebhookLivraison: "livraisons",
  discordWebhookAchatCamion: "achat camion",
  discordWebhookVenteCamion: "vente camion",
  discordWebhookRecrutement: "recrutement",
  discordWebhookDepart: "départ chauffeur",
  discordWebhookMaintenance: "maintenance",
};

function isValidDiscordWebhook(url: string) {
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
    const webhookUrl = String(body.webhookUrl ?? "").trim();
    const webhookType = String(body.webhookType ?? "").trim();

    if (!webhookUrl) {
      return NextResponse.json(
        { success: false, error: "Webhook vide." },
        { status: 400 }
      );
    }

    if (!isValidDiscordWebhook(webhookUrl)) {
      return NextResponse.json(
        { success: false, error: "Lien webhook Discord invalide." },
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

    const entreprise = membership.entreprise;
    const label = LABELS[webhookType] || "webhook";

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: `✅ Test webhook **${label}** - **${entreprise.nom}** - Elite Routiers`,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "Discord a refusé le webhook." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Webhook ${label} testé avec succès.`,
    });
  } catch (error) {
    console.error("Erreur test webhook :", error);

    return NextResponse.json(
      { success: false, error: "Erreur serveur." },
      { status: 500 }
    );
  }
}