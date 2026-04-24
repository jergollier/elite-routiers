export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getOrCreateCuveSite, recalculerPrixCuveSite } from "@/lib/fuel-market";

export default async function SocietePage() {
  let entreprises: any[] = [];
  let chauffeurs: any[] = [];
  let erreurChargement = "";

  let cuveSite = {
    stockActuel: 0,
    capaciteMax: 300000,
    prixActuelLitre: 1.95,
    pourcentage: 0,
  };

  try {
    const [entreprisesData, chauffeursData] = await Promise.all([
      prisma.entreprise.findMany({
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
      }),
      prisma.user.findMany({
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          username: true,
          avatar: true,
        },
        take: 12,
      }),
    ]);

    entreprises = entreprisesData;
    chauffeurs = chauffeursData;

    await getOrCreateCuveSite();
    const cuveSiteData = await recalculerPrixCuveSite();

    cuveSite = {
      stockActuel: cuveSiteData.stockActuel,
      capaciteMax: cuveSiteData.capaciteMax,
      prixActuelLitre: Number(cuveSiteData.prixActuelLitre),
      pourcentage:
        cuveSiteData.capaciteMax > 0
          ? Math.round((cuveSiteData.stockActuel / cuveSiteData.capaciteMax) * 100)
          : 0,
    };
  } catch (error) {
    console.error("Erreur chargement /societe :", error);
    erreurChargement = "Impossible de charger les sociétés depuis la base.";
  }

  const couleurCuveSite =
    cuveSite.pourcentage <= 20
      ? "#ef4444"
      : cuveSite.pourcentage <= 40
      ? "#f97316"
      : cuveSite.pourcentage <= 60
      ? "#f59e0b"
      : cuveSite.pourcentage <= 80
      ? "#22c55e"
      : "#16a34a";

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
            <div>Chauffeurs : {chauffeurs.length}</div>

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

              <Link
                href="/marche-occasion"
                style={{
                  ...menuLinkStyle,
                  background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                  boxShadow: "0 0 10px rgba(245,158,11,0.6)",
                }}
              >
                🚛 Marché occasion
              </Link>

              <Link href="/mon-entreprise" style={menuLinkStyle}>
                Mon entreprise
              </Link>

              <Link href="/parametres" style={menuLinkStyle}>
                Paramètres
              </Link>

              <a
                href="https://evsucubtev4fgabq.public.blob.vercel-storage.com/tacky/Elite%20Routier%20Tacky%20Setup%201.0.3.exe"
                style={downloadStyle}
              >
                ⬇ Télécharger le Tacky
              </a>

              <a href="/downloads/Plugin-Elite-Routiers.zip" style={pluginStyle}>
                🔌 Télécharger le Plugin
              </a>

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
                <Link href="/societe/classement" style={buttonBlue}>
                  Classement
                </Link>

                <Link href="/societe/create" style={buttonDark}>
                  + Créer une entreprise
                </Link>
              </div>
            </div>

            <div
              style={{
                marginBottom: "20px",
                background:
                  "linear-gradient(135deg, rgba(24,24,27,0.95), rgba(10,10,10,0.88))",
                borderRadius: "16px",
                padding: "18px",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 0 20px rgba(0,0,0,0.25)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginBottom: "14px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "22px",
                      fontWeight: "bold",
                      marginBottom: "4px",
                    }}
                  >
                    Cuve Elite Routiers
                  </div>

                  <div
                    style={{
                      fontSize: "13px",
                      opacity: 0.82,
                    }}
                  >
                    Réserve centrale du site pour alimenter les sociétés
                  </div>
                </div>

                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    fontWeight: "bold",
                    fontSize: "15px",
                  }}
                >
                  Tarif actuel :{" "}
                  <span style={{ color: "#22c55e" }}>
                    {cuveSite.prixActuelLitre.toFixed(2)} €/L
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: "12px",
                  marginBottom: "14px",
                }}
              >
                <div style={fuelInfoCard}>
                  <div style={fuelInfoLabel}>Stock actuel</div>
                  <div style={fuelInfoValue}>
                    {cuveSite.stockActuel.toLocaleString("fr-FR")} L
                  </div>
                </div>

                <div style={fuelInfoCard}>
                  <div style={fuelInfoLabel}>Capacité max</div>
                  <div style={fuelInfoValue}>
                    {cuveSite.capaciteMax.toLocaleString("fr-FR")} L
                  </div>
                </div>

                <div style={fuelInfoCard}>
                  <div style={fuelInfoLabel}>Remplissage</div>
                  <div style={fuelInfoValue}>{cuveSite.pourcentage}%</div>
                </div>
              </div>

              <div
                style={{
                  width: "100%",
                  height: "16px",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.08)",
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div
                  style={{
                    width: `${cuveSite.pourcentage}%`,
                    height: "100%",
                    background: `linear-gradient(90deg, ${couleurCuveSite}, ${couleurCuveSite})`,
                    boxShadow: `0 0 12px ${couleurCuveSite}`,
                    transition: "width 0.3s ease",
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: "10px",
                  fontSize: "13px",
                  opacity: 0.85,
                }}
              >
                {cuveSite.pourcentage <= 20
                  ? "Stock critique : le prix du litre est au plus haut."
                  : cuveSite.pourcentage <= 40
                  ? "Stock bas : le carburant reste cher."
                  : cuveSite.pourcentage <= 60
                  ? "Stock moyen : tarif équilibré."
                  : cuveSite.pourcentage <= 80
                  ? "Bon niveau de stock : tarif avantageux."
                  : "Cuve presque pleine : tarif au plus bas."}
              </div>
            </div>

            {erreurChargement ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px",
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.35)",
                  borderRadius: "12px",
                  color: "#fecaca",
                }}
              >
                {erreurChargement}
              </div>
            ) : (
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
                        🚛 Chauffeurs : {entreprise._count?.membres ?? 0}
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
            )}
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
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {chauffeurs.map((chauffeur) => {
                const nomAffiche =
                  chauffeur.username?.trim() || "Chauffeur sans pseudo";

                return (
                  <div
                    key={chauffeur.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "12px",
                      borderRadius: "10px",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <img
                      src={chauffeur.avatar || "/truck.jpg"}
                      alt={nomAffiche}
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "1px solid rgba(255,255,255,0.15)",
                        flexShrink: 0,
                      }}
                    />

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: "bold",
                          fontSize: "14px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {nomAffiche}
                      </div>
                    </div>
                  </div>
                );
              })}

              {chauffeurs.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "14px",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "10px",
                  }}
                >
                  Aucun chauffeur inscrit pour le moment.
                </div>
              )}
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

const buttonBlue = {
  padding: "10px 16px",
  background: "#2563eb",
  borderRadius: "10px",
  color: "white",
  textDecoration: "none",
  fontWeight: "bold",
};

const buttonDark = {
  padding: "10px 16px",
  background: "#171a21",
  borderRadius: "10px",
  color: "white",
  textDecoration: "none",
  fontWeight: "bold",
};

const fuelInfoCard = {
  background: "rgba(255,255,255,0.05)",
  borderRadius: "12px",
  padding: "14px",
  border: "1px solid rgba(255,255,255,0.08)",
};

const fuelInfoLabel = {
  fontSize: "12px",
  opacity: 0.75,
  marginBottom: "6px",
};

const fuelInfoValue = {
  fontSize: "20px",
  fontWeight: "bold",
};