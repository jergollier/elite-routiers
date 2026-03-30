import { RelyingParty } from "openid";
import { NextRequest, NextResponse } from "next/server";

const realm = "https://elite-routiers.vercel.app";
const returnUrl = `${realm}/api/steam/callback`;

export async function GET(request: NextRequest) {
  const rp = new RelyingParty(returnUrl, realm, true, false, []);
  return new Promise((resolve) => {
    rp.verifyAssertion(request.url, (err: any, result: any) => {
      if (err || !result?.authenticated || !result?.claimedIdentifier)
        resolve(NextResponse.redirect(new URL("/", request.url)));
      else {
        const steamId = result.claimedIdentifier.split("/").pop();
        const response = NextResponse.redirect(new URL("/", request.url));
        response.cookies.set("steamId", steamId, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60*60*24*7 });
        resolve(response);
      }
    });
  });
}