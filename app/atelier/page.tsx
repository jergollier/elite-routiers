import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Menu from "@/app/components/Menu";
import { prisma } from "@/lib/prisma";

function getDamageConfig(value?: number | null) {
  const safeValue = value ?? 0;

  if (safeValue >= 30) {
    return {
      color: "#ef4444",
      glow: "0 0 10px rgba(239,68,68,0.65)",
      label: `${safeValue}%`,
    };
  }

  if (safeValue >= 10) {
    return {
      color: "#f59e0b",
      glow: "0 0 10px rgba(245,158,11,0.55)",
      label: `${safeValue}%`,
    };
  }

  return {
    color: "#22c55e",
    glow: "0 0 10px rgba(34,197,94,0.45)",
    label: `${safeValue}%`,
  };
}

function getKmConfig(value?: number | null) {
  const safeValue = value ?? 0;

  if (safeValue <= 0) {
    return {
      color: "#ef4444",
      glow: "0 0 10px rgba(239,68,68,0.65)",
      label: "Urgent",
    };
  }

  if (safeValue <= 5000) {
    return {
      color: "#f59e0b",
      glow: "0 0 10px rgba(245,158,11,0.55)",
      label: "À prévoir",
    };
  }

  return {
    color: "#22c55e",
    glow: "0 0 10px rgba(34,197,94,0.45)",
    label: "OK",
  };
}

function getEtatGeneral(camion: {
  degatsMoteur?: number | null;
  degatsCarrosserie?: number | null;
  degatsChassis?: number | null;
  degatsRoues?: number | null;
  vidangeRestante?: number | null;
  revisionRestante?: number | null;
}) {
  const vidangeRestante = camion.vidangeRestante ?? 0;
  const revisionRestante = camion.revisionRestante ?? 0;

  const totalDegats =
    (camion.degatsMoteur ?? 0) +
    (camion.degatsCarrosserie ?? 0) +
    (camion.degatsChassis ?? 0) +
    (camion.degatsRoues ?? 0);

  if (vidangeRestante <= 0 || revisionRestante <= 0 || totalDegats >= 80) {
    return {
      label: "Critique",
      color: "#ef4444",
      glow: "0 0 14px rgba(239,68,68,0.75)",
    };
  }

  if (vidangeRestante <= 5000 || revisionRestante <= 10000 || totalDegats >= 25) {
    return {
      label: "À surveiller",
      color: "#f59e0b",
      glow: "0 0 14px rgba(245,158,11,0.65)",
    };
  }

  return {
    label: "Bon état",
    color: "#22c55e",
    glow: "0 0 14px rgba(34,197,94,0.55)",
  };
}

function getStatutCamionConfig(statut?: string | null) {
  switch (statut) {
    case "DISPONIBLE":
      return {
        label: "Disponible",
        color: "#22c55e",
        glow: "0 0 10px rgba(34,197,94,0.75)",
      };
    case "EN_MISSION":
      return {
        label: "En mission",
        color: "#f59e0b",
        glow: "0 0 10px rgba(245,158,11,0.75)",
      };
    case "EN_MAINTENANCE":
      return {
        label: "En maintenance",
        color: "#ef4444",
        glow: "0 0 10px rgba(239,68,68,0.75)",
      };
    default:
      return {
        label: "Inconnu",
        color: "#94a3b8",
        glow: "0 0 8px rgba(148,163,184,0.55)",
      };
  }
}

export default async function AtelierPage() {
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

  if (!user.memberships?.entreprise) {
    redirect("/societe");
  }

  const entreprise = user.memberships.entreprise;

  const camions = await prisma.camion.findMany({
    where: {
      entrepriseId: entreprise.id,
    },
    select: {
      id: true,
      marque: true,
      modele: true,
      statut: true,
      positionActuelle: true,
      vidangeRestante: true,
      revisionRestante: true,
      degatsMoteur: true,
      degatsCarrosserie: true,
      degatsChassis: true,
      degatsRoues: true,
      chauffeurAttribue: {
        select: {
          username: true,
        },
      },
    },
    orderBy: {
      id: "desc",
    },
  });

  const totalCamions = camions.length;

  const totalCritiques = camions.filter((camion) => {
    return getEtatGeneral(camion).label === "Critique";
  }).length;

  const totalASurveiller = camions.filter((camion) => {
    return getEtatGeneral(camion).label === "À surveiller";
  }).length;

  const totalOk = camions.filter((camion) => {
    return getEtatGeneral(camion).label === "Bon état";
  }).length;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0b0f19" }}>
      <Menu />

      <div
        style={{
          flex: 1,
          minHeight: "100vh",
          backgroundImage:
            "linear-gradient(rgba(6,10,18,0.72), rgba(6,10,18,0.82)), url('/truck.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div style={{ padding: "32px" }}>
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(0,0,0,0.55), rgba(0,0,0,0.32))",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "24px",
              padding: "28px",
              backdropFilter: "blur(8px)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
              marginBottom: "26px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: "34px",
                    fontWeight: 800,
                    color: "#ffffff",
                    margin: 0,
                    marginBottom: "10px",
                    textShadow: "0 0 18px rgba(255,255,255,0.08)",
                  }}
                >
                  🔧 Atelier de la société
                </h1>

                <p
                  style={{
                    margin: 0,
                    color: "rgba(255,255,255,0.72)",
                    fontSize: "15px",
                  }}
                >
                  Suivi des entretiens, révisions et dégâts de la flotte de{" "}
                  <strong style={{ color: "#ffffff" }}>{entreprise.nom}</strong>
                </p>
              </div>

              <div
                style={{
                  padding: "10px 16px",
                  borderRadius: "999px",
                  background: "rgba(34,197,94,0.12)",
                  border: "1px solid rgba(34,197,94,0.28)",
                  color: "#86efac",
                  fontWeight: 700,
                  boxShadow: "0 0 12px rgba(34,197,94,0.18)",
                }}
              >
                Visible pour tous les membres
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "18px",
              marginBottom: "28px",
            }}
          >
            {[
              {
                label: "Camions de la société",
                value: totalCamions,
                color: "#60a5fa",
                glow: "0 0 14px rgba(96,165,250,0.35)",
              },
              {
                label: "En bon état",
                value: totalOk,
                color: "#22c55e",
                glow: "0 0 14px rgba(34,197,94,0.35)",
              },
              {
                label: "À surveiller",
                value: totalASurveiller,
                color: "#f59e0b",
                glow: "0 0 14px rgba(245,158,11,0.35)",
              },
              {
                label: "Critiques",
                value: totalCritiques,
                color: "#ef4444",
                glow: "0 0 14px rgba(239,68,68,0.35)",
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: "rgba(0,0,0,0.42)",
                  borderRadius: "20px",
                  padding: "20px",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.28)",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    color: "rgba(255,255,255,0.68)",
                    marginBottom: "10px",
                  }}
                >
                  {item.label}
                </div>

                <div
                  style={{
                    fontSize: "32px",
                    fontWeight: 800,
                    color: item.color,
                    textShadow: item.glow,
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {camions.length === 0 ? (
            <div
              style={{
                background: "rgba(0,0,0,0.42)",
                borderRadius: "22px",
                padding: "26px",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.82)",
              }}
            >
              Aucun camion dans la société pour le moment.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "22px",
              }}
            >
              {camions.map((camion) => {
                const vidangeRestante = camion.vidangeRestante ?? 0;
                const revisionRestante = camion.revisionRestante ?? 0;

                const vidangeConfig = getKmConfig(vidangeRestante);
                const revisionConfig = getKmConfig(revisionRestante);

                const moteurConfig = getDamageConfig(camion.degatsMoteur);
                const carrosserieConfig = getDamageConfig(camion.degatsCarrosserie);
                const chassisConfig = getDamageConfig(camion.degatsChassis);
                const rouesConfig = getDamageConfig(camion.degatsRoues);

                const etatGeneral = getEtatGeneral(camion);
                const statutConfig = getStatutCamionConfig(camion.statut);

                return (
                  <div
                    key={camion.id}
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(0,0,0,0.48), rgba(0,0,0,0.38))",
                      borderRadius: "22px",
                      padding: "22px",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      boxShadow: "0 10px 26px rgba(0,0,0,0.34)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "12px",
                        marginBottom: "14px",
                      }}
                    >
                      <div>
                        <h2
                          style={{
                            margin: 0,
                            color: "#ffffff",
                            fontSize: "22px",
                            fontWeight: 800,
                          }}
                        >
                          {camion.marque} {camion.modele}
                        </h2>

                        <p
                          style={{
                            margin: "8px 0 0 0",
                            color: "rgba(255,255,255,0.68)",
                            fontSize: "14px",
                          }}
                        >
                          Chauffeur :{" "}
                          <strong style={{ color: "#ffffff" }}>
                            {camion.chauffeurAttribue?.username ?? "Non attribué"}
                          </strong>
                        </p>

                        <p
                          style={{
                            margin: "8px 0 0 0",
                            color: "rgba(255,255,255,0.68)",
                            fontSize: "14px",
                          }}
                        >
                          Position :{" "}
                          <strong style={{ color: "#ffffff" }}>
                            {camion.positionActuelle ?? "Inconnue"}
                          </strong>
                        </p>
                      </div>

                      <div
                        style={{
                          padding: "8px 12px",
                          borderRadius: "999px",
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: statutConfig.color,
                          fontWeight: 700,
                          fontSize: "13px",
                          textShadow: statutConfig.glow,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {statutConfig.label}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 12px",
                        borderRadius: "999px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: etatGeneral.color,
                        fontWeight: 800,
                        marginBottom: "18px",
                        textShadow: etatGeneral.glow,
                      }}
                    >
                      État général : {etatGeneral.label}
                    </div>

                    <div
                      style={{
                        marginBottom: "18px",
                        padding: "14px",
                        borderRadius: "16px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "rgba(255,255,255,0.56)",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          marginBottom: "12px",
                        }}
                      >
                        Entretien
                      </div>

                      <div style={{ marginBottom: "14px" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "8px",
                            gap: "8px",
                            color: "#ffffff",
                            fontSize: "14px",
                          }}
                        >
                          <span>🔧 Vidange</span>
                          <span
                            style={{
                              color: vidangeConfig.color,
                              textShadow: vidangeConfig.glow,
                            }}
                          >
                            {Math.max(0, vidangeRestante)} km • {vidangeConfig.label}
                          </span>
                        </div>

                        <div
                          style={{
                            height: "8px",
                            background: "rgba(255,255,255,0.08)",
                            borderRadius: "999px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.max(
                                0,
                                Math.min(100, (vidangeRestante / 60000) * 100)
                              )}%`,
                              height: "100%",
                              background: vidangeConfig.color,
                              boxShadow: vidangeConfig.glow,
                              borderRadius: "999px",
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "8px",
                            gap: "8px",
                            color: "#ffffff",
                            fontSize: "14px",
                          }}
                        >
                          <span>🔩 Révision</span>
                          <span
                            style={{
                              color: revisionConfig.color,
                              textShadow: revisionConfig.glow,
                            }}
                          >
                            {Math.max(0, revisionRestante)} km • {revisionConfig.label}
                          </span>
                        </div>

                        <div
                          style={{
                            height: "8px",
                            background: "rgba(255,255,255,0.08)",
                            borderRadius: "999px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.max(
                                0,
                                Math.min(100, (revisionRestante / 120000) * 100)
                              )}%`,
                              height: "100%",
                              background: revisionConfig.color,
                              boxShadow: revisionConfig.glow,
                              borderRadius: "999px",
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "14px",
                        borderRadius: "16px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          color: "rgba(255,255,255,0.56)",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          marginBottom: "12px",
                        }}
                      >
                        Dégâts
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "10px 14px",
                        }}
                      >
                        <div style={{ color: "#ffffff", fontSize: "14px" }}>
                          💥 Moteur :{" "}
                          <span
                            style={{
                              color: moteurConfig.color,
                              textShadow: moteurConfig.glow,
                              fontWeight: 800,
                            }}
                          >
                            {moteurConfig.label}
                          </span>
                        </div>

                        <div style={{ color: "#ffffff", fontSize: "14px" }}>
                          🚪 Carrosserie :{" "}
                          <span
                            style={{
                              color: carrosserieConfig.color,
                              textShadow: carrosserieConfig.glow,
                              fontWeight: 800,
                            }}
                          >
                            {carrosserieConfig.label}
                          </span>
                        </div>

                        <div style={{ color: "#ffffff", fontSize: "14px" }}>
                          🧱 Châssis :{" "}
                          <span
                            style={{
                              color: chassisConfig.color,
                              textShadow: chassisConfig.glow,
                              fontWeight: 800,
                            }}
                          >
                            {chassisConfig.label}
                          </span>
                        </div>

                        <div style={{ color: "#ffffff", fontSize: "14px" }}>
                          🛞 Roues :{" "}
                          <span
                            style={{
                              color: rouesConfig.color,
                              textShadow: rouesConfig.glow,
                              fontWeight: 800,
                            }}
                          >
                            {rouesConfig.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}