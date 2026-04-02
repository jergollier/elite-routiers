import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function getBaseUrl() {
  return process.env.NODE_ENV === "production"
    ? "https://elite-routiers.vercel.app"
    : "http://localhost:3000";
}

export async function GET(request: NextRequest): Promise<Response> {
  const baseUrl = getBaseUrl();

  try {
    const url = new URL(request.url);
    const claimedId = url.searchParams.get("openid.claimed_id");

    if (!claimedId) {
      return NextResponse.redirect(`${baseUrl}?error=no_claimed_id`);
    }

    const params = new URLSearchParams();

    for (const [key, value] of url.searchParams.entries()) {
      params.append(key, value);
    }

    params.set("openid.mode", "check_authentication");

    const verifyResponse = await fetch("https://steamcommunity.com/openid/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const verifyText = await verifyResponse.text();

    if (!verifyText.includes("is_valid:true")) {
      return NextResponse.redirect(`${baseUrl}?error=auth_failed`);
    }

    const steamId = claimedId.split("/").pop();

    if (!steamId) {
      return NextResponse.redirect(`${baseUrl}?error=no_steamid`);
    }

    let username: string | null = null;
    let avatar: string | null = null;

    const steamApiKey = process.env.STEAM_API_KEY;

    if (steamApiKey) {
      try {
        const steamProfileResponse = await fetch(
          `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamApiKey}&steamids=${steamId}`,
          {
            cache: "no-store",
          }
        );

        if (steamProfileResponse.ok) {
          const steamProfileData = await steamProfileResponse.json();
          const player = steamProfileData?.response?.players?.[0];

          if (player) {
            username = player.personaname || null;
            avatar = player.avatarfull || player.avatarmedium || player.avatar || null;
          }
        }
      } catch (error) {
        console.error("Erreur récupération profil Steam :", error);
      }
    }

    const user = await prisma.user.upsert({
      where: { steamId },
      update: {
        username,
        avatar,
      },
      create: {
        steamId,
        username,
        avatar,
      },
    });

    const response = NextResponse.redirect(`${baseUrl}/societe`);

    response.cookies.set("steamId", steamId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    response.cookies.set("userId", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Erreur callback Steam :", error);
    return NextResponse.redirect(`${baseUrl}?error=server_error`);
  }
}