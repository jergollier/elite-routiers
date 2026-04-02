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

  let user = await prisma.user.findUnique({
    where: { steamId },
  });

  if (!user) {
    user = await prisma.user.create({
      data: { steamId },
    });
  }

  const response = NextResponse.redirect(`${baseUrl}/societe`);

  response.cookies.set("steamId", steamId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return response;
}