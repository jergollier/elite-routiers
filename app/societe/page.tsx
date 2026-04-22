export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SocietePage() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) {
    redirect("/");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.72)), url('/truck.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "white",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div
          style={{
            background: "rgba(0,0,0,0.45)",
            borderRadius: "16px",
            padding: "24px",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(6px)",
          }}
        >
          <h1 style={{ marginTop: 0, fontSize: "36px" }}>Elite Routiers</h1>
          <p style={{ color: "rgba(255,255,255,0.8)" }}>
            Page société temporaire en mode secours.
          </p>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              marginTop: "20px",
            }}
          >
            <Link
              href="/societe/classement"
              style={{
                padding: "10px 16px",
                background: "#2563eb",
                borderRadius: "10px",
                color: "white",
                textDecoration: "none",
                fontWeight: "bold",
              }}
            >
              Classement
            </Link>

            <Link
              href="/societe/create"
              style={{
                padding: "10px 16px",
                background: "#171a21",
                borderRadius: "10px",
                color: "white",
                textDecoration: "none",
                fontWeight: "bold",
              }}
            >
              + Créer une entreprise
            </Link>

            <a
              href="/api/logout"
              style={{
                padding: "10px 16px",
                background: "rgba(255,80,80,0.2)",
                borderRadius: "10px",
                color: "#ff4d4d",
                textDecoration: "none",
                fontWeight: "bold",
              }}
            >
              Déconnexion
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}