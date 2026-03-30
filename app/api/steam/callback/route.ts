import { RelyingParty } from "openid";
import { NextRequest, NextResponse } from "next/server";

const realm =
  process.env.NODE_ENV === "production"
    ? "https://elite-routiers.vercel.app"
    : "http://localhost:3000";

const returnUrl = `${realm}/api/steam/callback`;

export async function GET(request: NextRequest) {
  const relyingParty = new RelyingParty(returnUrl, realm, true, false, []);

  return await new Promise<Response>((resolve) => {
    relyingParty.verifyAssertion(
      request.url,
      (err: any, result: any) => {
        if (err || !result?.authenticated || !result?.claimedIdentifier) {
          resolve(NextResponse.redirect(new URL("/", request.url)));
          return;
        }

        const steamId = result.claimedIdentifier.split("/").pop();

        if (!steamId) {
          resolve(NextResponse.redirect(new URL("/", request.url)));
          return;
        }

        const response = NextResponse.redirect(new URL("/", request.url));

        response.cookies.set("steamId", steamId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });

        resolve(response);
      }
    );
  });
}