import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Menu from "@/app/components/Menu";
import { prisma } from "@/lib/prisma";

export default async function ParkingPage() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { steamId },
    include: {
      camionsPerso: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!user) {
    redirect("/");
  }

  const prixPlace = 100000;
  const placesTotales = user.parkingPlaces ?? 0;
  const placesUtilisees = user.camionsPerso.length;
  const placesLibres = Math.max(0, placesTotales - placesUtilisees);

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundImage: "url('/truck.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        position: "relative",
        color: "white",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.68)",
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
              background: "rgba(0,0,0,0.45)",
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
                <h1 style={{ margin: 0, fontSize: "34px" }}>
                  Parking chauffeur
                </h1>
                <p
                  style={{
                    marginTop: "8px",
                    marginBottom: 0,
                    opacity: 0.85,
                    lineHeight: 1.5,
                  }}
                >
                  Gère tes places de parking et tes camions personnels.
                </p>
              </div>

              <Link href="/chauffeur" style={secondaryButtonStyle}>
                ← Retour chauffeur
              </Link>
            </div>

            <div
              style={{
                padding: "24px",
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) 320px",
                gap: "20px",
                alignItems: "start",
              }}
            >
              <section style={{ minWidth: 0 }}>
                <div style={cardStyle}>
                  <h2 style={{ marginTop: 0, marginBottom: "18px" }}>
                    État du parking
                  </h2>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: "14px",
                    }}
                  >
                    <div style={statBoxStyle}>
                      <div style={statLabelStyle}>Argent perso</div>
                      <div style={statValueStyle}>
                        {(user.argentPerso ?? 0).toLocaleString("fr-FR")} €
                      </div>
                    </div>

                    <div style={statBoxStyle}>
                      <div style={statLabelStyle}>Places achetées</div>
                      <div style={statValueStyle}>{placesTotales} / 5</div>
                    </div>

                    <div style={statBoxStyle}>
                      <div style={statLabelStyle}>Places utilisées</div>
                      <div style={statValueStyle}>{placesUtilisees}</div>
                    </div>

                    <div style={statBoxStyle}>
                      <div style={statLabelStyle}>Places libres</div>
                      <div style={statValueStyle}>{placesLibres}</div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: "20px",
                      display: "flex",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    {placesTotales < 5 && user.argentPerso >= prixPlace && (
                      <form action="/api/parking/acheter" method="POST">
                        <button type="submit" style={mainButtonStyle}>
                          Acheter une place ({prixPlace.toLocaleString("fr-FR")} €)
                        </button>
                      </form>
                    )}

                    <Link href="/camions/acheter" style={blueButtonStyle}>
                      Aller acheter un camion
                    </Link>
                  </div>

                  {placesTotales >= 5 && (
                    <p style={{ ...messageStyle, color: "#f87171" }}>
                      Tu as atteint le maximum de 5 places.
                    </p>
                  )}

                  {user.argentPerso < prixPlace && placesTotales < 5 && (
                    <p style={{ ...messageStyle, color: "#facc15" }}>
                      Tu n’as pas assez d’argent personnel pour acheter une place.
                    </p>
                  )}
                </div>

                <div style={{ ...cardStyle, marginTop: "20px" }}>
                  <h2 style={{ marginTop: 0, marginBottom: "18px" }}>
                    Mes camions personnels
                  </h2>

                  {user.camionsPerso.length === 0 ? (
                    <p style={{ margin: 0, opacity: 0.85 }}>
                      Tu n’as encore aucun camion personnel.
                    </p>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(260px, 1fr))",
                        gap: "16px",
                      }}
                    >
                      {user.camionsPerso.map((camion) => (
                        <article key={camion.id} style={truckCardStyle}>
                          <div
                            style={{
                              height: "160px",
                              borderRadius: "14px",
                              overflow: "hidden",
                              marginBottom: "14px",
                              border: "1px solid rgba(255,255,255,0.08)",
                            }}
                          >
                            <img
                              src={camion.image || "/truck.jpg"}
                              alt={`${camion.marque} ${camion.modele}`}
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
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: "10px",
                              marginBottom: "12px",
                            }}
                          >
                            <div>
                              <h3
                                style={{
                                  margin: 0,
                                  fontSize: "20px",
                                  lineHeight: 1.2,
                                }}
                              >
                                {formatMarque(camion.marque)}
                              </h3>
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

                            <div style={getStatusBadgeStyle(camion.statut)}>
                              {camion.statut === "DISPONIBLE"
                                ? "Disponible"
                                : camion.statut === "EN_MISSION"
                                ? "En mission"
                                : "En maintenance"}
                            </div>
                          </div>

                          <div style={infoListStyle}>
                            <div style={infoRowStyle}>
                              <span style={labelStyle}>Kilométrage</span>
                              <span style={valueStyle}>
                                {(camion.kilometrage ?? 0).toLocaleString("fr-FR")} km
                              </span>
                            </div>

                            <div style={infoRowStyle}>
                              <span style={labelStyle}>État</span>
                              <span style={valueStyle}>{camion.etat ?? 0}%</span>
                            </div>

                            <div style={infoRowStyle}>
                              <span style={labelStyle}>Carburant</span>
                              <span style={valueStyle}>{camion.carburant ?? 0}%</span>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <aside
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div style={sideCardStyle}>
                  <h2 style={{ marginTop: 0, marginBottom: "12px" }}>
                    Infos parking
                  </h2>

                  <div style={infoRowStyle}>
                    <span style={labelStyle}>Prix d’une place</span>
                    <span style={valueStyle}>
                      {prixPlace.toLocaleString("fr-FR")} €
                    </span>
                  </div>

                  <div style={infoRowStyle}>
                    <span style={labelStyle}>Maximum</span>
                    <span style={valueStyle}>5 places</span>
                  </div>

                  <div style={infoRowStyle}>
                    <span style={labelStyle}>Règle</span>
                    <span style={valueStyle}>1 place = 1 camion</span>
                  </div>
                </div>

                <div style={sideCardStyle}>
                  <h2 style={{ marginTop: 0, marginBottom: "12px" }}>
                    Résumé
                  </h2>

                  <p style={smallTextStyle}>
                    Achète des places pour agrandir ton parking personnel et
                    stocker tes propres camions.
                  </p>
                </div>
              </aside>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
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

function getStatusBadgeStyle(statut: string): React.CSSProperties {
  const background =
    statut === "DISPONIBLE"
      ? "rgba(34,197,94,0.18)"
      : statut === "EN_MISSION"
      ? "rgba(245,158,11,0.18)"
      : "rgba(239,68,68,0.18)";

  const color =
    statut === "DISPONIBLE"
      ? "#22c55e"
      : statut === "EN_MISSION"
      ? "#f59e0b"
      : "#ef4444";

  return {
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "bold",
    background,
    color,
    border: "1px solid rgba(255,255,255,0.08)",
    whiteSpace: "nowrap",
  };
}

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  borderRadius: "16px",
  padding: "20px",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(4px)",
  boxShadow: "0 0 18px rgba(0,0,0,0.28)",
};

const sideCardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  borderRadius: "16px",
  padding: "20px",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(4px)",
  boxShadow: "0 0 18px rgba(0,0,0,0.28)",
};

const statBoxStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  borderRadius: "14px",
  padding: "16px",
  border: "1px solid rgba(255,255,255,0.08)",
};

const statLabelStyle: React.CSSProperties = {
  opacity: 0.78,
  fontSize: "14px",
  marginBottom: "8px",
};

const statValueStyle: React.CSSProperties = {
  fontWeight: "bold",
  fontSize: "22px",
};

const truckCardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  borderRadius: "16px",
  padding: "16px",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(4px)",
};

const infoListStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const infoRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "8px 0",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};

const labelStyle: React.CSSProperties = {
  opacity: 0.82,
  fontSize: "14px",
};

const valueStyle: React.CSSProperties = {
  fontWeight: "bold",
  fontSize: "14px",
  textAlign: "right",
};

const smallTextStyle: React.CSSProperties = {
  margin: 0,
  lineHeight: 1.6,
  opacity: 0.9,
};

const messageStyle: React.CSSProperties = {
  marginTop: "16px",
  marginBottom: 0,
  fontWeight: "bold",
};

const mainButtonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: "10px",
  border: "none",
  background: "#22c55e",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
  textDecoration: "none",
};

const blueButtonStyle: React.CSSProperties = {
  padding: "12px 18px",
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
};

const secondaryButtonStyle: React.CSSProperties = {
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
  justifyContent: "center",
};