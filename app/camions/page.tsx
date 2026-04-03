import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Menu from "@/app/components/Menu";
import { prisma } from "@/lib/prisma";

function getStatutConfig(statut: string) {
  switch (statut) {
    case "DISPONIBLE":
      return {
        label: "Disponible",
        color: "#22c55e",
        glow: "0 0 10px rgba(34,197,94,0.85)",
      };
    case "EN_MISSION":
      return {
        label: "En mission",
        color: "#f59e0b",
        glow: "0 0 10px rgba(245,158,11,0.85)",
      };
    case "EN_MAINTENANCE":
      return {
        label: "En maintenance",
        color: "#ef4444",
        glow: "0 0 10px rgba(239,68,68,0.85)",
      };
    default:
      return {
        label: "Inconnu",
        color: "#9ca3af",
        glow: "0 0 10px rgba(156,163,175,0.85)",
      };
    }
  }


function getBarColor(value: number) {
  if (value > 60) return "#22c55e";
  if (value > 30) return "#f59e0b";
  return "#ef4444";
}

function formatMarque(marque: string) {
  switch (marque) {
    case "RENAULT":
      return "Renault";
    case "SCANIA":
      return "Scania";
    case "VOLVO":
      return "Volvo";
    case "MAN":
      return "MAN";
    case "DAF":
      return "DAF";
    case "MERCEDES":
      return "Mercedes-Benz";
    case "IVECO":
      return "Iveco";
    case "KENWORTH":
      return "Kenworth";
    case "PETERBILT":
      return "Peterbilt";
    case "FREIGHTLINER":
      return "Freightliner";
    case "INTERNATIONAL":
      return "International";
    case "MACK":
      return "Mack";
    case "WESTERN_STAR":
      return "Western Star";
    default:
      return marque;
  }
}

export default async function CamionsPage() {
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
      },
    },
  });

  if (!user) {
    redirect("/");
  }

  const monMembership = user.memberships[0];

  if (!monMembership) {
    redirect("/societe");
  }

  const entrepriseId = monMembership.entrepriseId;

  const entreprise = await prisma.entreprise.findUnique({
    where: { id: entrepriseId },
  });

  if (!entreprise) {
    redirect("/societe");
  }

  const camions = await prisma.camion.findMany({
    where: {
      entrepriseId,
      actif: true,
    },
    include: {
      chauffeur: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalDisponibles = camions.filter(
    (camion) => camion.statut === "DISPONIBLE"
  ).length;

  const totalMission = camions.filter(
    (camion) => camion.statut === "EN_MISSION"
  ).length;

  const totalMaintenance = camions.filter(
    (camion) => camion.statut === "EN_MAINTENANCE"
  ).length;

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
          background: "rgba(0, 0, 0, 0.68)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
        }}
      >
        <Menu />

        <div
          style={{
            flex: 1,
            padding: "24px",
            minWidth: 0,
          }}
        >
          <section
            style={{
              background: "rgba(0, 0, 0, 0.45)",
              borderRadius: "18px",
              overflow: "hidden",
              backdropFilter: "blur(6px)",
              boxShadow: "0 0 20px rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                padding: "24px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <h1 style={{ margin: 0, fontSize: "34px" }}>Gestion des camions</h1>
                <p
                  style={{
                    marginTop: "8px",
                    marginBottom: 0,
                    opacity: 0.88,
                    lineHeight: 1.5,
                  }}
                >
                  Parc camion de l’entreprise {entreprise.nom}
                </p>
              </div>

              <Link href="/societe" style={secondaryButtonStyle}>
                ← Retour société
              </Link>
            </div>

            <div
              style={{
                padding: "24px",
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) 300px",
                gap: "20px",
                alignItems: "start",
              }}
            >
              <section style={{ minWidth: 0 }}>
                {camions.length === 0 ? (
                  <div style={boxStyle}>
                    <h2 style={{ marginTop: 0 }}>Aucun camion</h2>
                    <p style={smallTextStyle}>
                      Ton entreprise n’a encore aucun camion. Tu peux en ajouter
                      avec le bouton à droite.
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                      gap: "18px",
                    }}
                  >
                    {camions.map((camion) => {
                      const statut = getStatutConfig(camion.statut);
                      const vidangePourcent = Math.max(
                        0,
                        Math.min(100, (camion.vidangeRestante / 60000) * 100)
                      );
                      const revisionPourcent = Math.max(
                        0,
                        Math.min(100, (camion.revisionRestante / 120000) * 100)
                      );

                      return (
                        <article key={camion.id} style={truckCardStyle}>
                          <div
                            style={{
                              height: "170px",
                              borderRadius: "14px",
                              overflow: "hidden",
                              marginBottom: "14px",
                              border: "1px solid rgba(255,255,255,0.08)",
                            }}
                          >
                            <img
                              src={camion.image || "/truck.jpg"}
                              alt={`${formatMarque(camion.marque)} ${camion.modele}`}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "10px",
                              marginBottom: "12px",
                            }}
                          >
                            <div>
                              <h2
                                style={{
                                  margin: 0,
                                  fontSize: "20px",
                                  lineHeight: 1.2,
                                }}
                              >
                                {formatMarque(camion.marque)}
                              </h2>
                              <div
                                style={{
                                  marginTop: "4px",
                                  opacity: 0.82,
                                  fontSize: "14px",
                                }}
                              >
                                {camion.modele}
                              </div>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: "999px",
                                padding: "8px 12px",
                                fontSize: "13px",
                                fontWeight: "bold",
                                whiteSpace: "nowrap",
                              }}
                            >
                              <span
                                style={{
                                  width: "10px",
                                  height: "10px",
                                  borderRadius: "50%",
                                  background: statut.color,
                                  boxShadow: statut.glow,
                                  display: "inline-block",
                                }}
                              />
                              {statut.label}
                            </div>
                          </div>

                          <div style={infoListStyle}>
                            <div style={infoRowStyle}>
                              <span style={labelStyle}>Chauffeur</span>
                              <span style={valueStyle}>
                                {camion.chauffeur?.username || "Non attribué"}
                              </span>
                            </div>

                            <div style={infoRowStyle}>
                              <span style={labelStyle}>Kilométrage</span>
                              <span style={valueStyle}>
                                {camion.kilometrage.toLocaleString("fr-FR")} km
                              </span>
                            </div>

                            <div style={infoRowStyle}>
                              <span style={labelStyle}>État</span>
                              <span style={valueStyle}>{camion.etat}%</span>
                            </div>

                            <div style={infoRowStyle}>
                              <span style={labelStyle}>Carburant</span>
                              <span style={valueStyle}>{camion.carburant}%</span>
                            </div>

                            <div style={infoRowStyle}>
                              <span style={labelStyle}>Position</span>
                              <span style={valueStyle}>
                                {camion.positionActuelle || "Non définie"}
                              </span>
                            </div>
                          </div>

                          <div style={{ marginTop: "16px" }}>
                            <div style={barHeaderStyle}>
                              <span style={labelStyle}>Vidange</span>
                              <span style={valueStyle}>
                                {camion.vidangeRestante.toLocaleString("fr-FR")} km
                              </span>
                            </div>

                            <div style={progressTrackStyle}>
                              <div
                                style={{
                                  ...progressFillStyle,
                                  width: `${vidangePourcent}%`,
                                  background: getBarColor(vidangePourcent),
                                }}
                              />
                            </div>
                          </div>

                          <div style={{ marginTop: "14px" }}>
                            <div style={barHeaderStyle}>
                              <span style={labelStyle}>Révision</span>
                              <span style={valueStyle}>
                                {camion.revisionRestante.toLocaleString("fr-FR")} km
                              </span>
                            </div>

                            <div style={progressTrackStyle}>
                              <div
                                style={{
                                  ...progressFillStyle,
                                  width: `${revisionPourcent}%`,
                                  background: getBarColor(revisionPourcent),
                                }}
                              />
                            </div>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              gap: "10px",
                              marginTop: "18px",
                              flexWrap: "wrap",
                            }}
                          >
                            <Link
                              href={`/camions/${camion.id}`}
                              style={smallMainButtonLinkStyle}
                            >
                              Voir
                            </Link>

                            <Link
                              href={`/camions/${camion.id}/modifier`}
                              style={smallSecondaryButtonLinkStyle}
                            >
                              Modifier
                            </Link>

                            <button style={smallSecondaryActionButtonStyle}>
                              Attribuer
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>

              <aside
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div style={boxStyle}>
                  <h2 style={{ marginTop: 0, marginBottom: "10px" }}>
                    Acheter un camion
                  </h2>

                  <p style={smallTextStyle}>
                    Ajoute un nouveau camion à ton entreprise pour agrandir ton parc.
                  </p>

                  <Link
                    href="/camions/acheter"
                    style={{
                      ...mainButtonStyle,
                      width: "100%",
                      marginTop: "12px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    + Acheter un camion
                  </Link>
                </div>

                <div style={boxStyle}>
                  <h2 style={{ marginTop: 0, marginBottom: "12px" }}>
                    Résumé du parc
                  </h2>

                  <div style={infoRowStyle}>
                    <span style={labelStyle}>Total camions</span>
                    <span style={valueStyle}>{camions.length}</span>
                  </div>

                  <div style={infoRowStyle}>
                    <span style={labelStyle}>Disponibles</span>
                    <span style={valueStyle}>{totalDisponibles}</span>
                  </div>

                  <div style={infoRowStyle}>
                    <span style={labelStyle}>En mission</span>
                    <span style={valueStyle}>{totalMission}</span>
                  </div>

                  <div style={infoRowStyle}>
                    <span style={labelStyle}>Maintenance</span>
                    <span style={valueStyle}>{totalMaintenance}</span>
                  </div>
                </div>

                <div style={boxStyle}>
                  <h2 style={{ marginTop: 0, marginBottom: "12px" }}>
                    Voyants
                  </h2>

                  <div style={legendRowStyle}>
                    <span
                      style={{
                        ...legendDotStyle,
                        background: "#22c55e",
                        boxShadow: "0 0 10px rgba(34,197,94,0.85)",
                      }}
                    />
                    Disponible
                  </div>

                  <div style={legendRowStyle}>
                    <span
                      style={{
                        ...legendDotStyle,
                        background: "#f59e0b",
                        boxShadow: "0 0 10px rgba(245,158,11,0.85)",
                      }}
                    />
                    En mission
                  </div>

                  <div style={legendRowStyle}>
                    <span
                      style={{
                        ...legendDotStyle,
                        background: "#ef4444",
                        boxShadow: "0 0 10px rgba(239,68,68,0.85)",
                      }}
                    />
                    En maintenance
                  </div>
                </div>
              </aside>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

const boxStyle = {
  background: "rgba(255,255,255,0.08)",
  borderRadius: "16px",
  padding: "20px",
  border: "1px solid rgba(255,255,255,0.08)",
};

const truckCardStyle = {
  background: "rgba(255,255,255,0.08)",
  borderRadius: "16px",
  padding: "16px",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(4px)",
  boxShadow: "0 0 18px rgba(0,0,0,0.28)",
};

const infoListStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
};

const infoRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "8px 0",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};

const labelStyle = {
  opacity: 0.82,
  fontSize: "14px",
};

const valueStyle = {
  fontWeight: "bold",
  fontSize: "14px",
  textAlign: "right" as const,
};

const smallTextStyle = {
  margin: 0,
  lineHeight: 1.6,
  opacity: 0.9,
};

const progressTrackStyle = {
  width: "100%",
  height: "10px",
  background: "rgba(255,255,255,0.10)",
  borderRadius: "999px",
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.06)",
};

const progressFillStyle = {
  height: "100%",
  borderRadius: "999px",
  transition: "width 0.3s ease",
};

const barHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  marginBottom: "8px",
};

const mainButtonStyle = {
  padding: "12px 18px",
  borderRadius: "10px",
  border: "none",
  background: "#2563eb",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
  textDecoration: "none",
};

const smallMainButtonLinkStyle = {
  padding: "10px 16px",
  borderRadius: "10px",
  border: "none",
  background: "#2563eb",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "80px",
};

const smallSecondaryButtonLinkStyle = {
  padding: "10px 16px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "90px",
};

const secondaryButtonStyle = {
  padding: "12px 18px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
};

const smallSecondaryActionButtonStyle = {
  padding: "10px 16px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
  minWidth: "90px",
};

const legendRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "8px 0",
};

const legendDotStyle = {
  width: "12px",
  height: "12px",
  borderRadius: "50%",
  display: "inline-block",
};