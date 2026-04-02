import { NextResponse } from "next/server";
import { RelyingParty } from "openid";

export const runtime = "nodejs";

function getBaseUrl() {
  return process.env.NODE_ENV === "production"
    ? "https://elite-routiers.vercel.app"
    : "http://localhost:3000";
}

export async function GET(): Promise<Response> {
  const baseUrl = getBaseUrl();
  const returnUrl = `${baseUrl}/api/steam/callback`;

  const relyingParty = new RelyingParty(
    returnUrl,
    baseUrl,
    true,
    false,
    []
  );

  return new Promise<Response>((resolve) => {
    relyingParty.authenticate(
      "https://steamcommunity.com/openid",
      false,
      (error, authUrl) => {
        if (error || !authUrl) {
          resolve(
            NextResponse.redirect(`${baseUrl}?error=steam_start_failed`)
          );
          return;
        }

        resolve(NextResponse.redirect(authUrl));
      }
    );
  });
}