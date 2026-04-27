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
        backgroundImage: "url('/cece.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        color: "white",
      }}
    >
      {/* Overlay sombre */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
        }}
      />

      {/* Bloc principal */}
      <div
        style={{
          position: "relative",
          maxWidth: "700px",
          padding: "40px",
          borderRadius: "16px",
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.08)",
          textAlign: "center",
        }}
      >
        {/* Titre */}
        <h1 style={{ fontSize: "32px", marginBottom: "20px" }}>
  🚛 Elite Routiers
</h1>

<p style={{ fontSize: "16px", lineHeight: "1.6", marginBottom: "20px" }}>
  Bienvenue sur <strong>Elite Routiers</strong>, une plateforme immersive
  dédiée aux joueurs de <strong>Euro Truck Simulator 2</strong> et{" "}
  <strong>American Truck Simulator</strong>.
</p>

<p style={{ fontSize: "15px", lineHeight: "1.6", marginBottom: "20px" }}>
  Plonge dans une véritable expérience de gestion d’entreprise routière :
  crée ta société, recrute des chauffeurs, attribue des camions et développe
  ton activité comme dans la réalité.
</p>

<p style={{ fontSize: "15px", lineHeight: "1.6", marginBottom: "20px" }}>
  Chaque livraison, chaque trajet et chaque décision ont un impact sur ton
  évolution. Travaille en équipe, fais grandir ta société et impose-toi
  dans le monde du transport.
</p>

<p style={{ fontSize: "15px", lineHeight: "1.6", marginBottom: "30px" }}>
  Grâce à <strong>Tacky</strong>, tes trajets sont automatiquement suivis
  et synchronisés pour une immersion totale.
</p>

        {/* Bouton */}
        {!steamId ? (
          <Link href="/api/steam" style={buttonStyle}>
            🔐 Se connecter avec Steam
          </Link>
        ) : (
          <Link href="/societe" style={buttonStyle}>
            🚀 Accéder à ma société
          </Link>
        )}
      </div>
    </main>
  );
}

const buttonStyle = {
  padding: "18px 30px",
  background: "#171a21",
  borderRadius: "10px",
  color: "white",
  fontWeight: "bold",
  textDecoration: "none",
  fontSize: "18px",
  display: "inline-block",
};