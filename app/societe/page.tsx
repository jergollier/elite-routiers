import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Menu from "@/app/components/Menu";

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
    include: {
      _count: {
        select: {
          membres: true,
        },
      },
    },
  });

  const chauffeurs = [
    { id: 1, nom: "RoutierMax", statut: "connecté" },
    { id: 2, nom: "Pierre_ETS2", statut: "déconnecté" },
    { id: 3, nom: "Camion59", statut: "connecté" },
    { id: 4, nom: "TruckMan", statut: "déconnecté" },
    { id: 5, nom: "BossDuBitume", statut: "connecté" },
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
              gap: "18px",
              fontWeight: "bold",
              flexWrap: "wrap",
            }}
          >
            <div>Entreprises : {entreprises.length}</div>

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
          <Menu />

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

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: "16px",
              }}
            >
              {entreprises.map((entreprise) => (
                <div
                  key={entreprise.id}
                  style={{
                    background: "rgba(15,15,15,0.78)",
                    borderRadius: "14px",
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: "255px",
                  }}
                >
                  <div
                    style={{
                      height: "95px",
                      backgroundImage: `url('${entreprise.banniere || "/truck.jpg"}')`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />

                  <div
                    style={{
                      padding: "12px",
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "17px",
                        marginBottom: "4px",
                      }}
                    >
                      {entreprise.nom}
                    </div>

                    <div
                      style={{
                        fontSize: "12px",
                        opacity: 0.85,
                        marginBottom: "10px",
                      }}
                    >
                      [{entreprise.abreviation}]
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "13px",
                        fontWeight: "bold",
                        marginBottom: "8px",
                      }}
                    >
                      <span
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          display: "inline-block",
                          background: entreprise.recrutement
                            ? "#22c55e"
                            : "#ef4444",
                          boxShadow: entreprise.recrutement
                            ? "0 0 8px #22c55e"
                            : "0 0 8px #ef4444",
                        }}
                      />
                      <span>
                        Recrutement :{" "}
                        {entreprise.recrutement ? "Ouvert" : "Fermé"}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: "13px",
                        opacity: 0.9,
                        marginBottom: "14px",
                      }}
                    >
                      🚛 Chauffeurs : {entreprise._count.membres}
                    </div>

                    <div
                      style={{
                        marginTop: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <Link
                        href={`/entreprise/${entreprise.id}`}
                        style={{
                          display: "block",
                          textAlign: "center",
                          padding: "9px",
                          background: "#171a21",
                          borderRadius: "8px",
                          color: "white",
                          textDecoration: "none",
                          fontWeight: "bold",
                          fontSize: "13px",
                        }}
                      >
                        Voir
                      </Link>

                      {entreprise.recrutement ? (
                        <Link
                          href={`/entreprise/${entreprise.id}/postuler`}
                          style={{
                            display: "block",
                            textAlign: "center",
                            padding: "9px",
                            background: "#2563eb",
                            borderRadius: "8px",
                            color: "white",
                            textDecoration: "none",
                            fontWeight: "bold",
                            fontSize: "13px",
                          }}
                        >
                          Postuler
                        </Link>
                      ) : (
                        <div
                          style={{
                            display: "block",
                            textAlign: "center",
                            padding: "9px",
                            background: "rgba(255,255,255,0.12)",
                            borderRadius: "8px",
                            color: "rgba(255,255,255,0.7)",
                            fontWeight: "bold",
                            fontSize: "13px",
                            cursor: "not-allowed",
                          }}
                        >
                          Recrutement fermé
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {entreprises.length === 0 && (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    textAlign: "center",
                    padding: "20px",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "12px",
                  }}
                >
                  Aucune entreprise pour le moment.
                </div>
              )}
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
            <h2 style={{ marginTop: 0, marginBottom: "18px" }}>Chauffeurs</h2>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {chauffeurs.map((chauffeur) => {
                const isConnected = chauffeur.statut === "connecté";

                return (
                  <div
                    key={chauffeur.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                      padding: "12px",
                      borderRadius: "10px",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div style={{ fontWeight: "bold" }}>{chauffeur.nom}</div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "13px",
                        fontWeight: "bold",
                      }}
                    >
                      <span
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          display: "inline-block",
                          background: isConnected ? "#22c55e" : "#ef4444",
                          boxShadow: isConnected
                            ? "0 0 8px #22c55e"
                            : "0 0 8px #ef4444",
                        }}
                      />
                      <span>{chauffeur.statut}</span>
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