import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Menu from "@/app/components/Menu";

export default async function MonEntreprisePage() {
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
          entreprise: {
            include: {
              membres: {
                include: {
                  user: true,
                },
                orderBy: {
                  createdAt: "asc",
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user || user.memberships.length === 0) {
    redirect("/societe");
  }

  const membership = user.memberships[0];
  const entreprise = membership.entreprise as any;

  const argentSociete = 125000;
  const cuveMax = 10000;
  const cuveActuelle = 6200;
  const cuvePourcent = Math.max(
    0,
    Math.min(100, (cuveActuelle / cuveMax) * 100)
  );

  const livraisons = [
    {
      id: 1,
      chauffeur: "RoutierMax",
      trajet: "Lyon → Marseille",
      gain: "12 500 €",
      statut: "Terminée",
    },
    {
      id: 2,
      chauffeur: "Pierre_ETS2",
      trajet: "Paris → Lille",
      gain: "8 200 €",
      statut: "En cours",
    },
    {
      id: 3,
      chauffeur: "Camion59",
      trajet: "Bordeaux → Toulouse",
      gain: "6 900 €",
      statut: "Terminée",
    },
    {
      id: 4,
      chauffeur: "ATS_Driver",
      trajet: "Nice → Turin",
      gain: "9 400 €",
      statut: "En attente",
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
            }}
          >
            <span>Entreprise : {entreprise.nom}</span>
            <span>Rôle : {membership.role.replaceAll("_", " ")}</span>
            <span>Connecté</span>
          </div>
        </header>

        <div
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            flex: 1,
          }}
        >
          <section
            style={{
              background: "rgba(0, 0, 0, 0.45)",
              borderRadius: "16px",
              overflow: "hidden",
              backdropFilter: "blur(6px)",
              boxShadow: "0 0 20px rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                height: "220px",
                backgroundImage: `url('${entreprise.banniere || "/truck.jpg"}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.88), rgba(0,0,0,0.18))",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  left: "24px",
                  bottom: "24px",
                  right: "24px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "end",
                  gap: "20px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h1 style={{ margin: 0, fontSize: "36px" }}>
                    {entreprise.nom}
                  </h1>
                  <div
                    style={{
                      marginTop: "8px",
                      fontWeight: "bold",
                      opacity: 0.95,
                    }}
                  >
                    [{entreprise.abreviation}] • {entreprise.jeu}
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(0,0,0,0.45)",
                    padding: "14px 18px",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    minWidth: "220px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      opacity: 0.85,
                      marginBottom: "6px",
                    }}
                  >
                    Argent de la société
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: "bold" }}>
                    {argentSociete.toLocaleString("fr-FR")} €
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "260px 1fr 320px",
              gap: "20px",
              flex: 1,
            }}
          >
            <Menu />

            <section
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              <div
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
                  Livraisons des chauffeurs
                </h2>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    maxHeight: "540px",
                    overflowY: "auto",
                    paddingRight: "6px",
                  }}
                >
                  {livraisons.map((livraison) => (
                    <div
                      key={livraison.id}
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        borderRadius: "12px",
                        padding: "14px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        display: "grid",
                        gridTemplateColumns: "1.1fr 1.3fr 0.8fr 0.8fr",
                        gap: "12px",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "13px", opacity: 0.8 }}>
                          Chauffeur
                        </div>
                        <div style={{ fontWeight: "bold" }}>
                          {livraison.chauffeur}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "13px", opacity: 0.8 }}>
                          Trajet
                        </div>
                        <div style={{ fontWeight: "bold" }}>
                          {livraison.trajet}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "13px", opacity: 0.8 }}>
                          Gain
                        </div>
                        <div style={{ fontWeight: "bold" }}>
                          {livraison.gain}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "13px", opacity: 0.8 }}>
                          Statut
                        </div>
                        <div style={{ fontWeight: "bold" }}>
                          {livraison.statut}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <aside
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              <div
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
                  Chauffeurs de la société
                </h2>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    maxHeight: "320px",
                    overflowY: "auto",
                    paddingRight: "6px",
                  }}
                >
                  {entreprise.membres?.length > 0 ? (
                    entreprise.membres.map((membre: any) => (
                      <div
                        key={membre.id}
                        style={{
                          background: "rgba(255,255,255,0.08)",
                          borderRadius: "12px",
                          padding: "14px",
                          border: "1px solid rgba(255,255,255,0.08)",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <div
                          style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "999px",
                            overflow: "hidden",
                            background: "rgba(255,255,255,0.08)",
                            flexShrink: 0,
                            border: "1px solid rgba(255,255,255,0.12)",
                          }}
                        >
                          {membre.user?.avatar ? (
                            <img
                              src={membre.user.avatar}
                              alt="Avatar Steam"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "12px",
                                opacity: 0.7,
                              }}
                            >
                              ?
                            </div>
                          )}
                        </div>

                        <div>
                          <div
                            style={{ fontWeight: "bold", marginBottom: "4px" }}
                          >
                            {membre.user?.username || "Utilisateur Steam"}
                          </div>
                          <div style={{ opacity: 0.85 }}>
                            {membre.role.replaceAll("_", " ")}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        borderRadius: "12px",
                        padding: "14px",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      Aucun chauffeur dans la société.
                    </div>
                  )}
                </div>
              </div>

              <div
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
                  Cuve de la société
                </h2>

                <div
                  style={{
                    fontSize: "14px",
                    opacity: 0.9,
                    marginBottom: "10px",
                  }}
                >
                  {cuveActuelle.toLocaleString("fr-FR")} L /{" "}
                  {cuveMax.toLocaleString("fr-FR")} L
                </div>

                <div
                  style={{
                    width: "100%",
                    height: "24px",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.10)",
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    style={{
                      width: `${cuvePourcent}%`,
                      height: "100%",
                      background:
                        "linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #22c55e 100%)",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "8px",
                    fontSize: "13px",
                    opacity: 0.8,
                  }}
                >
                  <span>0</span>
                  <span>10000</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}