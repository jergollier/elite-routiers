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
        backgroundImage: "url('/truck.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {!steamId ? (
        <a
          href="/api/steam"
          style={{
            padding: "20px 30px",
            background: "#171a21",
            borderRadius: "10px",
            color: "white",
            fontWeight: "bold",
            textDecoration: "none",
            fontSize: "20px",
          }}
        >
          Connexion avec Steam
        </a>
      ) : (
        <Link
          href="/societe"
          style={{
            padding: "20px 30px",
            background: "#171a21",
            borderRadius: "10px",
            color: "white",
            fontWeight: "bold",
            textDecoration: "none",
            fontSize: "20px",
          }}
        >
          Accéder au site
        </Link>
      )}
    </main>
  );
}