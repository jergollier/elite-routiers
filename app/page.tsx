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
        flexDirection: "column", // 👈 important pour empiler les boutons
        gap: "20px",
        backgroundImage: "url('/truck.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {!steamId ? (
        <a
          href="/api/steam"
          style={buttonStyle}
        >
          Se connecter avec Steam
        </a>
      ) : (
        <Link href="/societe" style={buttonStyle}>
          Accéder au site
        </Link>
      )}

      {/* 🔥 NOUVEAU BOUTON CLASSEMENT GLOBAL */}
      <Link href="/societe/classement" style={buttonStyle}>
        Voir le classement
      </Link>
    </main>
  );
}

const buttonStyle = {
  padding: "20px 30px",
  background: "#171a21",
  borderRadius: "10px",
  color: "white",
  fontWeight: "bold",
  textDecoration: "none",
  fontSize: "20px",
};