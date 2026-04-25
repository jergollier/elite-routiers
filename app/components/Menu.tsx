import Link from "next/link";

export default function Menu() {
  return (
    <aside style={menuBoxStyle}>
      <h2 style={{ marginTop: 0, marginBottom: "20px", fontSize: "26px" }}>
        Menu
      </h2>

      <nav style={navStyle}>
        <Link href="/societe" style={menuLinkStyle}>
          Accueil
        </Link>

        <Link href="/profil" style={menuLinkStyle}>
          Mon profil
        </Link>

        <Link href="/marche-occasion" style={orangeStyle}>
          🚛 Marché occasion
        </Link>

        <Link href="/mon-entreprise" style={menuLinkStyle}>
          Mon entreprise
        </Link>

        <Link href="/parametres" style={menuLinkStyle}>
          Paramètres
        </Link>

        <Link href="/telecharger-tacky" style={greenStyle}>
          ⬇ Télécharger le Tacky
        </Link>

        <Link href="/telecharger-plugin" style={blueStyle}>
          🔌 Télécharger le Plugin
        </Link>

        <a href="/api/logout" style={logoutStyle}>
          Déconnexion
        </a>
      </nav>
    </aside>
  );
}

const menuBoxStyle: React.CSSProperties = {
  width: "260px",
  minWidth: "260px",
  background: "rgba(0, 0, 0, 0.45)",
  borderRadius: "16px",
  padding: "20px",
  backdropFilter: "blur(6px)",
  boxShadow: "0 0 20px rgba(0,0,0,0.4)",
  height: "fit-content",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "white",
};

const navStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const menuLinkStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  fontWeight: "bold",
  textDecoration: "none",
  display: "block",
};

const orangeStyle: React.CSSProperties = {
  ...menuLinkStyle,
  background: "linear-gradient(135deg, #ff9f1c, #ef4444)",
  boxShadow: "0 0 16px rgba(255,159,28,0.45)",
};

const greenStyle: React.CSSProperties = {
  ...menuLinkStyle,
  background: "#22c55e",
  textAlign: "center",
};

const blueStyle: React.CSSProperties = {
  ...menuLinkStyle,
  background: "#3b82f6",
  textAlign: "center",
};

const logoutStyle: React.CSSProperties = {
  ...menuLinkStyle,
  background: "rgba(255,80,80,0.2)",
  color: "#ff4d4d",
  marginTop: "10px",
};