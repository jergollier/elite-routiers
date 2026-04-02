import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function SocietePage() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) {
    redirect("/");
  }

  const entreprises = await prisma.entreprise.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  const monEntreprise = await prisma.entreprise.findFirst({
    where: {
      ownerSteamId: steamId,
    },
  });

  const chauffeurs = [
    { id: 1, nom: "RoutierMax", statut: "En ligne" },
    { id: 2, nom: "Pierre_ETS2", statut: "Hors ligne" },
    { id: 3, nom: "Camion59", statut: "En ligne" },
    { id: 4, nom: "ATS_Driver", statut: "En ligne" },
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
              gap: "20px",
              fontWeight: "bold",
              flexWrap: "wrap",
            }}
          >
            <span>Entreprises : {entreprises.length}</span>
            <span>Chauffeurs : {chauffeurs.length}</span>

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
              <button style={menuButtonStyle}>Accueil</button>
              <button style={menuButtonStyle}>Mon profil</button>

              {monEntreprise ? (
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

          <section
            style={{
              background: "rgba(0, 0, 0, 0.45)",
              borderRadius: "16px",
              padding: "20px",
              backdropFilter: "blur(6px)",
              boxShadow: "0 0 20px rgba(0,0,0,0.4)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <h2 style={{ margin: 0 }}>Entreprises du site</h2>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <input
                  type="text"
                  placeholder="Rechercher une entreprise..."
                  style={inputStyle}
                />
                <select style={inputStyle}>
                  <option>Toutes</option>
                  <option>Recrute</option>
                  <option>Ne recrute pas</option>
                </select>
              </div>
            </div>

            {entreprises.length === 0 ? (
              <div
                style={{
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: "14px",
                  padding: "20px",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                Aucune entreprise créée pour le moment.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  gap: "14px",
                }}
              >
                {entreprises.map((entreprise) => (
                  <div
                    key={entreprise.id}
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      borderRadius: "14px",
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.1)",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      style={{
                        height: "100px",
                        backgroundImage: `url('${entreprise.banniere || "/truck.jpg"}')`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />

                    <div style={{ padding: "14px" }}>
                      <h3
                        style={{
                          marginTop: 0,
                          marginBottom: "10px",
                          fontSize: "22px",
                        }}
                      >
                        {entreprise.nom}
                      </h3>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "8px",
                          fontWeight: "bold",
                          fontSize: "14px",
                        }}
                      >
                        <span
                          style={{
                            width: "10px",
                            height: "10px",
                            borderRadius: "50%",
                            backgroundColor: entreprise.recrutement
                              ? "#22c55e"
                              : "#ef4444",
                            display: "inline-block",
                          }}
                        />
                        {entreprise.recrutement ? "Recrute" : "Ne recrute pas"}
                      </div>

                      <div style={{ marginBottom: "6px", opacity: 0.9, fontSize: "14px" }}>
                        Abréviation : {entreprise.abreviation}
                      </div>

                      <div style={{ marginBottom: "6px", opacity: 0.9, fontSize: "14px" }}>
                        Jeu : {entreprise.jeu}
                      </div>

                      <div style={{ marginBottom: "14px", opacity: 0.9, fontSize: "14px" }}>
                        Transport : {entreprise.typeTransport}
                      </div>

                      <Link
                        href={`/entreprise/${entreprise.id}`}
                        style={{
                          ...applyButtonStyle,
                          display: "block",
                          textDecoration: "none",
                          textAlign: "center",
                        }}
                      >
                        Voir l’entreprise
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            <h2 style={{ marginTop: 0, marginBottom: "20px" }}>
              Chauffeurs du site
            </h2>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {chauffeurs.map((chauffeur) => {
                const enLigne = chauffeur.statut === "En ligne";

                return (
                  <div
                    key={chauffeur.id}
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                      padding: "14px",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
                      {chauffeur.nom}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        opacity: 0.95,
                        fontWeight: "bold",
                      }}
                    >
                      <span
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          backgroundColor: enLigne ? "#22c55e" : "#ef4444",
                          display: "inline-block",
                          boxShadow: enLigne
                            ? "0 0 8px rgba(34,197,94,0.8)"
                            : "0 0 8px rgba(239,68,68,0.8)",
                        }}
                      />
                      {chauffeur.statut}
                    </div>
                  </div>
                );
              })}
            </div>
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

const logoutButtonStyle = {
  padding: "12px 14px",
  borderRadius: "10px",
  border: "none",
  background: "rgba(180, 35, 35, 0.35)",
  color: "#ff4d4d",
  textAlign: "left" as const,
  fontWeight: "bold",
  cursor: "pointer",
};

const inputStyle = {
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
};

const applyButtonStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  background: "#171a21",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
};