import { RelyingParty } from "openid";
import { NextResponse } from "next/server";

const realm = "https://elite-routiers.vercel.app";
const returnUrl = `${realm}/api/steam/callback`;

export async function GET() {
  const relyingParty = new RelyingParty(returnUrl, realm, true, false, []);
  const steamOpenIdUrl = "https://steamcommunity.com/openid";

  return await new Promise<Response>((resolve) => {
    relyingParty.authenticate(
      steamOpenIdUrl,
      false,
      (err: any, authUrl: any) => {
        if (err || !authUrl) {
          resolve(
            NextResponse.json(
              { error: "Impossible de lancer la connexion Steam." },
              { status: 500 }
            )
          );
          return;
        }
        resolve(NextResponse.redirect(authUrl));
      }
    );
  });
}