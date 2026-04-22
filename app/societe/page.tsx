export const dynamic = "force-dynamic";

import Link from "next/link";

export default function SocietePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundImage: "url('/truck.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        position: "relative",
        color: "white",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0, 0, 0, 0.55)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header
          style={{
            height: "80px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            borderBottom: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>
            Elite Routiers
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "18px",
              fontWeight: "bold",
              flexWrap: "wrap",
            }}
          >
            <div>Entreprises : 0</div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(255,255,255,0.08)",
                padding: "8px 14px",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#22c55e",
                  display: "inline-block",
                  boxShadow: "0 0 8px #22c55e",
                }}
              />
              <span>Connexion Steam OK</span>
            </div>
          </div>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "260px 1fr 280px",
            gap: "20px",
            padding: "20px",
            flex: 1,
          }}
        >
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

              <Link href="/societe/classement" style={menuLinkStyle}>
                Classement
              </Link>

              <Link href="/societe/create" style={menuLinkStyle}>
                Créer une entreprise
              </Link>

              <a href="/api/logout" style={logoutStyle}>
                Déconnexion
              </a>
            </nav>
          </aside>

          <section
            style={{
              background: "rgba(0, 0, 0, 0.45)",
              borderRadius: "16px",
              padding: "20px",
              backdropFilter: "blur(6px)",
              boxShadow: "0 0 20px rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "32px" }}>Entreprises</h2>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
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
              </div>
            </div>

            <div
              style={{
                textAlign: "center",
                padding: "40px",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "12px",
              }}
            >
              Liste des entreprises à remettre juste après.
            </div>
          </section>

          <aside
            style={{
              background: "rgba(0, 0, 0, 0.45)",
              borderRadius: "16px",
              padding: "20px",
              backdropFilter: "blur(6px)",
              boxShadow: "0 0 20px rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: "18px" }}>
              Chauffeurs du site
            </h2>

            <div
              style={{
                textAlign: "center",
                padding: "14px",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "10px",
              }}
            >
              Liste des chauffeurs à remettre juste après.
            </div>
          </aside>
        </div>
      </div>
    </main>
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