import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export default async function Menu() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  let hasEntreprise = false;

  if (steamId) {
    const membership = await prisma.entrepriseMembre.findFirst({
      where: { user: { steamId } },
    });

    hasEntreprise = !!membership;
  }

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

        {/* 🔥 visible seulement si entreprise */}
        {hasEntreprise && (
          <>
            <Link href="/mon-entreprise" style={menuLinkStyle}>
              Mon entreprise
            </Link>

            <Link href="/finance" style={menuLinkStyle}>
              Finance
            </Link>

            <Link href="/camions" style={menuLinkStyle}>
              Camions
            </Link>

            <Link href="/parametres" style={menuLinkStyle}>
              Paramètres
            </Link>
          </>
        )}

        {/* ✅ visible pour tout le monde */}
        <Link href="/societe/classement" style={menuLinkStyle}>
          Classement
        </Link>

        {/* 🔥 NOUVEAU : Télécharger le Tacky */}
        <a
          href="https://evsucubtev4fgabq.public.blob.vercel-storage.com/Elite%20Routier%20Tacky%20Setup%201.0.1.exe"
          style={downloadStyle}
        >
          ⬇ Télécharger le Tacky
        </a>

                {/* 🔥 Télécharger le Tacky */}
        <a
          href="https://evsucubtev4fgabq.public.blob.vercel-storage.com/Elite%20Routier%20Tacky%20Setup%201.0.1.exe"
          style={downloadStyle}
        >
          ⬇ Télécharger le Tacky
        </a>

        {/* 🔥 NOUVEAU : Télécharger le Plugin */}
        <a
          href="https://evsucubtev4fgabq.public.blob.vercel-storage.com/Tacky-Elite-Routiers.zip"
          style={pluginStyle}
        >
          🔌 Télécharger le Plugin
        </a>

        <a href="/api/logout" style={logoutStyle}>
          Déconnexion
        </a>
      </nav>
    </aside>
  );
}

const menuLinkStyle = {
  padding: "12px 14px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  fontWeight: "bold",
  textDecoration: "none",
  display: "block",
};

const downloadStyle = {
  padding: "12px 14px",
  borderRadius: "10px",
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  color: "white",
  fontWeight: "bold",
  textDecoration: "none",
  display: "block",
  textAlign: "center" as const,
  boxShadow: "0 0 10px rgba(34,197,94,0.5)",
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

const pluginStyle = {
  padding: "12px 14px",
  borderRadius: "10px",
  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
  color: "white",
  fontWeight: "bold",
  textDecoration: "none",
  display: "block",
  textAlign: "center" as const,
  boxShadow: "0 0 10px rgba(59,130,246,0.5)",
};