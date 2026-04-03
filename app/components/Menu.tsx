import Link from "next/link";

export default function Menu() {
  return (
    <aside
      style={{
        background: "rgba(0, 0, 0, 0.45)",
        borderRadius: "16px",
        padding: "20px",
        backdropFilter: "blur(6px)",
        boxShadow: "0 0 20px rgba(0,0,0,0.4)",
        height: "fit-content",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Menu</h2>

      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <Link href="/societe" style={menuLinkStyle}>
          Accueil
        </Link>

        <Link href="/profil" style={menuLinkStyle}>
          Mon profil
        </Link>

        <Link href="/mon-entreprise" style={menuLinkStyle}>
          Mon entreprise
        </Link>

        <Link href="/finance" style={menuLinkStyle}>
          Finance
        </Link>

        <Link href="/camions" style={menuLinkStyle}>
          Camion
        </Link>

        <button style={menuButtonStyle} type="button">
          Classement
        </button>

        <button style={menuButtonStyle} type="button">
          Paramètres
        </button>

        <a href="/api/logout" style={logoutStyle}>
          Déconnexion
        </a>
      </nav>
    </aside>
  );
}

const menuButtonStyle = {
  padding: "12px 14px",
  borderRadius: "10px",
  border: "none",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  textAlign: "left" as const,
  fontWeight: "bold",
  cursor: "pointer",
};

const menuLinkStyle = {
  padding: "12px 14px",
  borderRadius: "10px",
  border: "none",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  textAlign: "left" as const,
  fontWeight: "bold",
  textDecoration: "none",
  display: "block",
};

const logoutStyle = {
  padding: "12px 14px",
  borderRadius: "10px",
  background: "rgba(255,80,80,0.2)",
  color: "#ff4d4d",
  fontWeight: "bold",
  textDecoration: "none",
  display: "block",
  marginTop: "10px",
};