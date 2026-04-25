import { cookies } from "next/headers";
import Link from "next/link";

export default async function Home() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  return (
    <main
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.85)), url('/truck.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        style={{
          textAlign: "center",
          backdropFilter: "blur(6px)",
          padding: "40px",
          borderRadius: "16px",
          background: "rgba(0,0,0,0.45)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <h1 style={{ marginBottom: "20px", fontSize: "32px" }}>
          Elite Routiers
        </h1>

        {!steamId ? (
          <a
            href="/api/steam"
            style={{
              display: "inline-block",
              padding: "16px 26px",
              background: "#171a21",
              borderRadius: "10px",
              color: "white",
              fontWeight: "bold",
              textDecoration: "none",
              fontSize: "18px",
              boxShadow: "0 0 15px rgba(0,0,0,0.4)",
            }}
          >
            Se connecter avec Steam
          </a>
        ) : (
          <Link
            href="/societe"
            style={{
              display: "inline-block",
              padding: "16px 26px",
              background: "#2563eb",
              borderRadius: "10px",
              color: "white",
              fontWeight: "bold",
              textDecoration: "none",
              fontSize: "18px",
              boxShadow: "0 0 15px rgba(37,99,235,0.4)",
            }}
          >
            Accéder au site
          </Link>
        )}
      </div>
    </main>
  );
}