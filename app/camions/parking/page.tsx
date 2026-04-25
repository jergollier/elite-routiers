import type { CSSProperties } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Menu from "@/app/components/Menu";
import { prisma } from "@/lib/prisma";

export default async function ParkingPage() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) redirect("/");

  const user = await prisma.user.findUnique({
    where: { steamId },
    include: {
      camionsPerso: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) redirect("/");

  const prixPlace = 100000;
  const placesTotales = user.parkingPlaces ?? 0;
  const placesUtilisees = user.camionsPerso.length;
  const placesLibres = Math.max(0, placesTotales - placesUtilisees);
  const pourcentageParking =
    placesTotales > 0 ? Math.round((placesUtilisees / placesTotales) * 100) : 0;

  return (
    <main style={mainStyle}>
      <div style={overlayStyle} />

      <div style={layoutStyle}>
        <Menu />

        <div style={contentStyle}>
          <section style={panelStyle}>
            <div style={headerStyle}>
              <div>
                <h1 style={titleStyle}>Parking chauffeur</h1>
                <p style={subtitleStyle}>
                  Tes camions personnels, tes places privées et ton atelier perso.
                </p>
              </div>

              <Link href="/profil" style={secondaryButtonStyle}>
                ← Retour profil
              </Link>
            </div>

            <div style={bodyGridStyle}>
              <section style={{ minWidth: 0 }}>
                <div style={heroCardStyle}>
                  <div>
                    <div style={eyebrowStyle}>Garage privé</div>
                    <h2 style={{ margin: "6px 0 8px", fontSize: "28px" }}>
                      {placesUtilisees} camion{placesUtilisees > 1 ? "s" : ""} personnel
                      {placesUtilisees > 1 ? "s" : ""}
                    </h2>
                    <p style={smallTextStyle}>
                      Chaque place achetée permet de stocker un camion personnel.
                      Les réparations se font avec ton argent perso.
                    </p>
                  </div>

                  <div style={moneyBoxStyle}>
                    <div style={statLabelStyle}>Argent perso</div>
                    <div style={moneyValueStyle}>
                      {(user.argentPerso ?? 0).toLocaleString("fr-FR")} €
                    </div>
                  </div>
                </div>

                <div style={statsGridStyle}>
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

                  <div style={statBoxStyle}>
                    <div style={statLabelStyle}>Remplissage</div>
                    <div style={statValueStyle}>{pourcentageParking}%</div>
                  </div>
                </div>

                <div style={cardStyle}>
                  <div style={parkingTopStyle}>
                    <div>
                      <h2 style={{ margin: 0 }}>Gestion du parking</h2>
                      <p style={{ ...smallTextStyle, marginTop: "6px" }}>
                        Prix d’une place : {prixPlace.toLocaleString("fr-FR")} €
                      </p>
                    </div>

                    <div style={actionsStyle}>
  {placesTotales < 5 && user.argentPerso >= prixPlace && (
    <form action="/api/parking/acheter" method="POST">
      <button type="submit" style={greenButtonStyle}>
        Acheter une place
      </button>
    </form>
  )}

  <form action="/api/parking/acheter" method="POST">
    <button type="submit" style={orangeButtonStyle}>
      Acheter place parking
    </button>
  </form>
</div>
                  </div>

                  <div style={progressTrackStyle}>
                    <div
                      style={{
                        ...progressFillStyle,
                        width: `${Math.min(100, pourcentageParking)}%`,
                        background:
                          placesLibres <= 0
                            ? "#ef4444"
                            : placesLibres === 1
                            ? "#f59e0b"
                            : "#22c55e",
                      }}
                    />
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
                  <div style={sectionTitleRowStyle}>
                    <div>
                      <h2 style={{ margin: 0 }}>Mes camions personnels</h2>
                      <p style={{ ...smallTextStyle, marginTop: "6px" }}>
                        Garage privé du chauffeur.
                      </p>
                    </div>

                    <Link href="/camions/parking/atelier" style={atelierTopButtonStyle}>
                      🛠 Atelier perso
                    </Link>
                  </div>

                  {user.camionsPerso.length === 0 ? (
                    <div style={emptyStyle}>
                      Tu n’as encore aucun camion personnel.
                    </div>
                  ) : (
                    <div style={truckGridStyle}>
                      {user.camionsPerso.map((camion) => {
                        const statut = getStatutConfig(camion.statut);
                        const vidangePourcent = Math.max(
                          0,
                          Math.min(100, ((camion.vidangeRestante ?? 0) / 60000) * 100)
                        );
                        const revisionPourcent = Math.max(
                          0,
                          Math.min(100, ((camion.revisionRestante ?? 0) / 120000) * 100)
                        );

                        return (
                          <article key={camion.id} style={truckCardStyle}>
                            <div style={truckImageWrapStyle}>
                              <img
                                src={camion.image || "/truck.jpg"}
                                alt={`${formatMarque(camion.marque)} ${camion.modele}`}
                                style={truckImageStyle}
                              />
                            </div>

                            <div style={truckHeaderStyle}>
                              <div>
                                <h3 style={truckTitleStyle}>
                                  {formatMarque(camion.marque)}
                                </h3>
                                <div style={truckModelStyle}>{camion.modele}</div>
                              </div>

                              <div style={statusBadgeStyle}>
                                <span
                                  style={{
                                    ...statusDotStyle,
                                    background: statut.color,
                                    boxShadow: statut.glow,
                                  }}
                                />
                                {statut.label}
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
                                  {(camion.vidangeRestante ?? 0).toLocaleString("fr-FR")} km
                                </span>
                              </div>

                              <div style={miniTrackStyle}>
                                <div
                                  style={{
                                    ...miniFillStyle,
                                    width: `${vidangePourcent}%`,
                                    background: getBarColor(vidangePourcent),
                                  }}
                                />
                              </div>
                            </div>

                            <div style={{ marginTop: "12px" }}>
                              <div style={barHeaderStyle}>
                                <span style={labelStyle}>Révision</span>
                                <span style={valueStyle}>
                                  {(camion.revisionRestante ?? 0).toLocaleString("fr-FR")} km
                                </span>
                              </div>

                              <div style={miniTrackStyle}>
                                <div
                                  style={{
                                    ...miniFillStyle,
                                    width: `${revisionPourcent}%`,
                                    background: getBarColor(revisionPourcent),
                                  }}
                                />
                              </div>
                            </div>

                            <div style={truckActionsStyle}>
                              <Link href={`/camions/${camion.id}`} style={blueButtonFullStyle}>
                                Voir
                              </Link>

                              
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>

              <aside style={sideStyle}>
                <div style={sideCardStyle}>
                  <h2 style={{ marginTop: 0 }}>Infos parking</h2>

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
                  <h2 style={{ marginTop: 0 }}>Atelier perso</h2>
                  <p style={smallTextStyle}>
                    Répare tes camions personnels avec ton argent perso :
                    vidange, révision, pneus, freins et batterie.
                  </p>

                  <Link href="/camions/parking/atelier" style={atelierButtonStyle}>
                    Ouvrir l’atelier
                  </Link>
                </div>

                <div style={sideCardStyle}>
                  <h2 style={{ marginTop: 0 }}>Résumé</h2>
                  <p style={smallTextStyle}>
                    Le parking privé est séparé du garage société. Ces camions
                    appartiennent au chauffeur.
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

const mainStyle: CSSProperties = {
  minHeight: "100vh",
  backgroundImage: "url('/truck.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  backgroundAttachment: "fixed",
  position: "relative",
  color: "white",
};

const overlayStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,0.68)",
};

const layoutStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  minHeight: "100vh",
  display: "flex",
};

const contentStyle: CSSProperties = {
  flex: 1,
  padding: "24px",
  minWidth: 0,
};

const panelStyle: CSSProperties = {
  background: "rgba(0,0,0,0.45)",
  borderRadius: "18px",
  overflow: "hidden",
  backdropFilter: "blur(6px)",
  boxShadow: "0 0 20px rgba(0,0,0,0.4)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const headerStyle: CSSProperties = {
  padding: "24px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "34px",
};

const subtitleStyle: CSSProperties = {
  marginTop: "8px",
  marginBottom: 0,
  opacity: 0.85,
  lineHeight: 1.5,
};

const bodyGridStyle: CSSProperties = {
  padding: "24px",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 320px",
  gap: "20px",
  alignItems: "start",
};

const heroCardStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "18px",
  flexWrap: "wrap",
  alignItems: "center",
  background:
    "linear-gradient(135deg, rgba(37,99,235,0.22), rgba(245,158,11,0.16))",
  borderRadius: "18px",
  padding: "22px",
  border: "1px solid rgba(255,255,255,0.1)",
  boxShadow: "0 0 22px rgba(0,0,0,0.32)",
  marginBottom: "18px",
};

const eyebrowStyle: CSSProperties = {
  fontSize: "13px",
  opacity: 0.75,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontWeight: "bold",
};

const moneyBoxStyle: CSSProperties = {
  minWidth: "190px",
  background: "rgba(0,0,0,0.32)",
  borderRadius: "16px",
  padding: "16px",
  border: "1px solid rgba(255,255,255,0.1)",
};

const moneyValueStyle: CSSProperties = {
  fontSize: "26px",
  fontWeight: "bold",
  color: "#22c55e",
};

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "14px",
  marginBottom: "20px",
};

const cardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  borderRadius: "16px",
  padding: "20px",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(4px)",
  boxShadow: "0 0 18px rgba(0,0,0,0.28)",
};

const sideCardStyle: CSSProperties = {
  ...cardStyle,
};

const statBoxStyle: CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  borderRadius: "14px",
  padding: "16px",
  border: "1px solid rgba(255,255,255,0.08)",
};

const statLabelStyle: CSSProperties = {
  opacity: 0.78,
  fontSize: "14px",
  marginBottom: "8px",
};

const statValueStyle: CSSProperties = {
  fontWeight: "bold",
  fontSize: "24px",
};

const parkingTopStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "14px",
  flexWrap: "wrap",
  marginBottom: "16px",
};

const actionsStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const sectionTitleRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "18px",
};

const truckGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: "18px",
};

const truckCardStyle: CSSProperties = {
  background: "rgba(15,15,15,0.78)",
  borderRadius: "16px",
  padding: "16px",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(4px)",
  boxShadow: "0 0 18px rgba(0,0,0,0.28)",
};

const truckImageWrapStyle: CSSProperties = {
  height: "165px",
  borderRadius: "14px",
  overflow: "hidden",
  marginBottom: "14px",
  border: "1px solid rgba(255,255,255,0.08)",
};

const truckImageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const truckHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  marginBottom: "12px",
};

const truckTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "21px",
  lineHeight: 1.2,
};

const truckModelStyle: CSSProperties = {
  marginTop: "4px",
  opacity: 0.82,
  fontSize: "14px",
};

const statusBadgeStyle: CSSProperties = {
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
};

const statusDotStyle: CSSProperties = {
  width: "10px",
  height: "10px",
  borderRadius: "50%",
  display: "inline-block",
};

const infoListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const infoRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "8px 0",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};

const labelStyle: CSSProperties = {
  opacity: 0.82,
  fontSize: "14px",
};

const valueStyle: CSSProperties = {
  fontWeight: "bold",
  fontSize: "14px",
  textAlign: "right",
};

const smallTextStyle: CSSProperties = {
  margin: 0,
  lineHeight: 1.6,
  opacity: 0.9,
};

const messageStyle: CSSProperties = {
  marginTop: "16px",
  marginBottom: 0,
  fontWeight: "bold",
};

const progressTrackStyle: CSSProperties = {
  width: "100%",
  height: "14px",
  background: "rgba(255,255,255,0.10)",
  borderRadius: "999px",
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.06)",
};

const progressFillStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  transition: "width 0.3s ease",
};

const miniTrackStyle: CSSProperties = {
  width: "100%",
  height: "10px",
  background: "rgba(255,255,255,0.10)",
  borderRadius: "999px",
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.06)",
};

const miniFillStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  transition: "width 0.3s ease",
};

const barHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  marginBottom: "8px",
};

const truckActionsStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  marginTop: "18px",
};

const sideStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const emptyStyle: CSSProperties = {
  padding: "24px",
  textAlign: "center",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  opacity: 0.85,
};

const greenButtonStyle: CSSProperties = {
  padding: "12px 18px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
};

const orangeButtonStyle: CSSProperties = {
  padding: "12px 18px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #f59e0b, #ef4444)",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const blueButtonFullStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 16px",
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

const orangeButtonFullStyle: CSSProperties = {
  ...orangeButtonStyle,
  width: "100%",
  boxSizing: "border-box",
};

const atelierButtonStyle: CSSProperties = {
  ...orangeButtonStyle,
  width: "100%",
  boxSizing: "border-box",
  marginTop: "14px",
};

const atelierTopButtonStyle: CSSProperties = {
  ...orangeButtonStyle,
  padding: "10px 14px",
};

const secondaryButtonStyle: CSSProperties = {
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