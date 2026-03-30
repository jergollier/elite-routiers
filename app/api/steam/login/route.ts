import { RelyingParty } from "openid";
import { NextResponse } from "next/server";

const realm = "https://elite-routiers.vercel.app";
const returnUrl = `${realm}/api/steam/callback`;

export async function GET() {
  const rp = new RelyingParty(returnUrl, realm, true, false, []);
  return new Promise((resolve) => {
    rp.authenticate("https://steamcommunity.com/openid", false, (err: any, authUrl: any) => {
      if (err || !authUrl) resolve(NextResponse.json({ error: "Impossible de lancer Steam" }, { status: 500 }));
      else resolve(NextResponse.redirect(authUrl));
    });
  });
}