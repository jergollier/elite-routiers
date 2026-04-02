import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ProfilPage() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { steamId },
    include: {
      memberships: {
        include: {
          entreprise: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!user) {
    redirect("/");
  }

  const profil = user as any;
  const membership = user.memberships?.[0];
  const entreprise = membership?.entreprise ?? null;

  const nomCompte =
    profil.pseudo ||
    profil.username ||
    profil.nom ||
    profil.name ||
    profil.steamName ||
    `Steam ${steamId}`;

  const avatar =
    profil.avatar ||
    profil.avatarUrl ||
    profil.photo ||
    profil.image ||
    "https://steamcommunity.com/public/images/avatars/ee/ee0f5c0d3f0f1b1f5f9a6a2d6e3f7f1f5b0d6c6f_full.jpg";

  const role =
    membership?.role ||
    (entreprise && entreprise.ownerSteamId === steamId ? "Directeur" : "Chauffeur");

  const stats = [
    {
      label: "Livraisons effectuées",
      value: profil.livraisonsEffectuees ?? profil.livraisons ?? 0,
    },
    {
      label: "Kilomètres parcourus",
      value: profil.kilometresParcourus ?? profil.kilometres ?? 0,
    },
    {
      label: "Infractions",
      value: profil.infractions ?? 0,
    },
    {
      label: "Accidents",
      value: profil.accidents ?? 0,
    },
    {
      label: "Contrats réussis",
      value: profil.contratsReussis ?? profil.contrats ?? 0,
    },
    {
      label: "Revenus générés",
      value: profil.revenusGeneres ?? profil.argentGenere ?? 0,
    },
  ];

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
          background: "rgba(0, 0, 0, 0.60)",
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
            Mon profil
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
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: "#22c55e",
                  display: "inline-block",
                  boxShadow: "0 0 8px rgba(34,197,94,0.8)",
                }}
              />
              Steam connecté
            </span>
          </div>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "320px 1fr 260px",
            gap: "20px",
            padding: "20px",
            flex: 1,
          }}
        >
          <section
            style={{
              background: "rgba(0, 0, 0, 0.45)",
              borderRadius: "18px",
              padding: "24px",
              backdropFilter: "blur(6px)",
              boxShadow: "0 0 20px rgba(0,0,0,0.4)",
              height: "fit-content",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <img
                src={avatar}
                alt="Photo de profil Steam"
                style={{
                  width: "150px",
                  height: "150px",
                  objectFit: "cover",
                  borderRadius: "50%",
                  border: "4px solid rgba(255,255,255,0.20)",
                  boxShadow: "0 0 20px rgba(0,0,0,0.45)",
                  marginBottom: "18px",
                }}
              />

              <h1
                style={{
                  margin: 0,
                  fontSize: "30px",
                  lineHeight: 1.2,
                }}
              >
                {nomCompte}
              </h1>

              <div
                style={{
                  marginTop: "10px",
                  padding: "8px 14px",
                  borderRadius: "999px",
                  background: "rgba(34,197,94,0.18)",
                  color: "#86efac",
                  fontWeight: "bold",
                  border: "1px solid rgba(34,197,94,0.35)",
                }}
              >
                {role}
              </div>
            </div>

            <div
              style={{
                marginTop: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div style={infoCardStyle}>
                <div style={infoLabelStyle}>Compte Steam</div>
                <div style={infoValueStyle}>{nomCompte}</div>
              </div>

              <div style={infoCardStyle}>
                <div style={infoLabelStyle}>Steam ID</div>
                <div style={infoValueStyle}>{steamId}</div>
              </div>

              <div style={infoCardStyle}>
                <div style={infoLabelStyle}>Société</div>
                <div style={infoValueStyle}>
                  {entreprise ? entreprise.nom : "Aucune société"}
                </div>
              </div>

              <div style={infoCardStyle}>
                <div style={infoLabelStyle}>Rôle</div>
                <div style={infoValueStyle}>{role}</div>
              </div>
            </div>
          </section>

          <section
            style={{
              background: "rgba(0, 0, 0, 0.45)",
              borderRadius: "18px",
              padding: "24px",
              backdropFilter: "blur(6px)",
              boxShadow: "0 0 20px rgba(0,0,0,0.4)",
            }}
          >
            <div
              style={{
                marginBottom: "22px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "30px",
                }}
              >
                Statistiques du chauffeur
              </h2>

              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  fontWeight: "bold",
                }}
              >
                {entreprise ? `Entreprise : ${entreprise.nom}` : "Sans entreprise"}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "16px",
              }}
            >
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: "16px",
                    padding: "22px",
                    border: "1px solid rgba(255,255,255,0.10)",
                    minHeight: "120px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "15px",
                      opacity: 0.85,
                      marginBottom: "10px",
                    }}
                  >
                    {stat.label}
                  </div>

                  <div
                    style={{
                      fontSize: "34px",
                      fontWeight: "bold",
                      lineHeight: 1.1,
                    }}
                  >
                    {typeof stat.value === "number"
                      ? stat.value.toLocaleString("fr-FR")
                      : stat.value}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: "20px",
                background: "rgba(255,255,255,0.08)",
                borderRadius: "16px",
                padding: "20px",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: "14px" }}>
                Résumé du chauffeur
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: "14px",
                }}
              >
                <div style={smallInfoCardStyle}>
                  <div style={smallInfoLabelStyle}>Nom</div>
                  <div style={smallInfoValueStyle}>{nomCompte}</div>
                </div>

                <div style={smallInfoCardStyle}>
                  <div style={smallInfoLabelStyle}>Société</div>
                  <div style={smallInfoValueStyle}>
                    {entreprise ? entreprise.nom : "Aucune"}
                  </div>
                </div>

                <div style={smallInfoCardStyle}>
                  <div style={smallInfoLabelStyle}>Rôle</div>
                  <div style={smallInfoValueStyle}>{role}</div>
                </div>
              </div>
            </div>
          </section>

          <aside
            style={{
              background: "rgba(0, 0, 0, 0.45)",
              borderRadius: "16px",
              padding: "20px",
              backdropFilter: "blur(6px)",
              boxShadow: "0 0 20px rgba(0,0,0,0.4)",
              height: "fit-content",
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
              <Link
                href="/societe"
                style={{
                  ...menuButtonStyle,
                  textDecoration: "none",
                  display: "block",
                }}
              >
                Accueil
              </Link>

              <Link
                href="/profil"
                style={{
                  ...menuActiveStyle,
                  textDecoration: "none",
                  display: "block",
                }}
              >
                Mon profil
              </Link>

              {entreprise ? (
                <Link
                  href="/mon-entreprise"
                  style={{
                    ...menuButtonStyle,
                    textDecoration: "none",
                    display: "block",
                  }}
                >
                  Mon entreprise
                </Link>
              ) : (
                <button
                  style={{
                    ...menuButtonStyle,
                    opacity: 0.5,
                    cursor: "not-allowed",
                  }}
                  disabled
                >
                  Mon entreprise
                </button>
              )}

              <Link
                href="/societe/create"
                style={{
                  ...menuButtonStyle,
                  textDecoration: "none",
                  display: "block",
                }}
              >
                Créer une entreprise
              </Link>

              <button style={menuButtonStyle}>Classement</button>
              <button style={menuButtonStyle}>Paramètres</button>

              <Link
                href="/api/logout"
                style={{
                  ...logoutButtonStyle,
                  textDecoration: "none",
                  display: "block",
                }}
              >
                Déconnexion
              </Link>
            </nav>
          </aside>
        </div>
      </div>
    </main>
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

const menuActiveStyle = {
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid rgba(34,197,94,0.35)",
  background: "rgba(34,197,94,0.18)",
  color: "#86efac",
  textAlign: "left" as const,
  fontWeight: "bold",
  cursor: "pointer",
};

const logoutButtonStyle = {
  padding: "12px 14px",
  borderRadius: "10px",
  border: "none",
  background: "rgba(180, 35, 35, 0.35)",
  color: "#ff6b6b",
  textAlign: "left" as const,
  fontWeight: "bold",
  cursor: "pointer",
};

const infoCardStyle = {
  background: "rgba(255,255,255,0.08)",
  borderRadius: "14px",
  padding: "16px",
  border: "1px solid rgba(255,255,255,0.10)",
};

const infoLabelStyle = {
  fontSize: "13px",
  opacity: 0.8,
  marginBottom: "8px",
};

const infoValueStyle = {
  fontSize: "18px",
  fontWeight: "bold",
  wordBreak: "break-word" as const,
};

const smallInfoCardStyle = {
  background: "rgba(255,255,255,0.06)",
  borderRadius: "12px",
  padding: "14px",
  border: "1px solid rgba(255,255,255,0.08)",
};

const smallInfoLabelStyle = {
  fontSize: "12px",
  opacity: 0.75,
  marginBottom: "6px",
};

const smallInfoValueStyle = {
  fontWeight: "bold",
  fontSize: "16px",
  wordBreak: "break-word" as const,
};