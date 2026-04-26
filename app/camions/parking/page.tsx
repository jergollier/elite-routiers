import type { CSSProperties } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
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
  const argentPerso = user.argentPerso ?? 0;

  const pourcentageParking =
    placesTotales > 0 ? Math.round((placesUtilisees / placesTotales) * 100) : 0;

  const peutAcheterPlace = placesTotales < 5 && argentPerso >= prixPlace;

  return (
    <main style={mainStyle}>
      <div style={overlayStyle} />

      <div style={topButtonsStyle}>
        <Link href="/profil" style={topButtonStyle}>
          👤 Profil
        </Link>

        <Link href="/societe" style={topButtonBlueStyle}>
          🏢 Société
        </Link>
      </div>

      <div style={layoutStyle}>
        <div style={contentStyle}>
          <section style={proHeaderStyle}>
            <div style={headerGlowStyle} />

            <div style={profileLeftStyle}>
              <div style={avatarFrameStyle}>
                <img
                  src={user.avatar || "/truck.jpg"}
                  alt={user.username || "Chauffeur"}
                  style={avatarStyle}
                />
              </div>

              <div>
                <div style={kickerStyle}>Elite Routiers • Parking privé</div>

                <h1 style={pseudoStyle}>{user.username || "Chauffeur"}</h1>

                <div style={identityRowStyle}>
                  <Badge>Garage chauffeur</Badge>
                  <Badge>{placesUtilisees} camion{placesUtilisees > 1 ? "s" : ""}</Badge>
                  <Badge>{placesTotales} / 5 places</Badge>
                </div>
              </div>
            </div>

            <div style={heroWalletStyle}>
              <span style={walletLabelStyle}>Argent perso</span>
              <strong style={walletValueStyle}>
                {argentPerso.toLocaleString("fr-FR")} €
              </strong>
              <span style={walletHintStyle}>Solde disponible chauffeur</span>
            </div>
          </section>

          <section style={quickActionsStyle}>
            <Link href="/chauffeur" style={actionButtonStyle}>
              ← Retour chauffeur
            </Link>

            <Link href="/finance-perso" style={actionButtonStyle}>
              💰 Finance perso
            </Link>

            <Link href="/camions/parking/atelier" style={actionButtonBlueStyle}>
              🛠 Atelier perso
            </Link>
          </section>

          <section style={statsGridStyle}>
            <BigStat
              title="Places achetées"
              value={`${placesTotales} / 5`}
              detail="Capacité totale du parking"
              color="#60a5fa"
              icon="🅿️"
            />

            <BigStat
              title="Places utilisées"
              value={placesUtilisees.toString()}
              detail="Camions personnels stockés"
              color="#f59e0b"
              icon="🚚"
            />

            <BigStat
              title="Places libres"
              value={placesLibres.toString()}
              detail="Disponible pour achat camion"
              color={placesLibres > 0 ? "#22c55e" : "#ef4444"}
              icon="✅"
            />

            <BigStat
              title="Remplissage"
              value={`${pourcentageParking}%`}
              detail="Occupation du garage privé"
              color={
                placesLibres <= 0
                  ? "#ef4444"
                  : placesLibres === 1
                  ? "#f59e0b"
                  : "#22c55e"
              }
              icon="📊"
            />
          </section>

          <section style={dashboardGridStyle}>
            <div style={{ minWidth: 0 }}>
              <article style={panelStyle}>
                <div style={panelHeaderStyle}>
                  <div>
                    <h2 style={panelTitleStyle}>🏭 Gestion du parking</h2>
                    <p style={panelSubtitleStyle}>
                      Prix d’une place : {prixPlace.toLocaleString("fr-FR")} €
                    </p>
                  </div>

                  {peutAcheterPlace && (
                    <form action="/api/parking/acheter" method="POST">
                      <button type="submit" style={greenButtonStyle}>
                        Acheter une place
                      </button>
                    </form>
                  )}
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

                {argentPerso < prixPlace && placesTotales < 5 && (
                  <p style={{ ...messageStyle, color: "#facc15" }}>
                    Tu n’as pas assez d’argent personnel pour acheter une place.
                  </p>
                )}

                {placesTotales === 0 && (
                  <p style={{ ...messageStyle, color: "#93c5fd" }}>
                    Achète ta première place pour commencer ton garage privé.
                  </p>
                )}
              </article>

              <article style={{ ...panelStyle, marginTop: "18px" }}>
                <div style={panelHeaderStyle}>
                  <div>
                    <h2 style={panelTitleStyle}>🚛 Mes camions personnels</h2>
                    <p style={panelSubtitleStyle}>
                      Garage privé du chauffeur, séparé de la société.
                    </p>
                  </div>

                  <Link href="/camions/parking/atelier" style={atelierTopButtonStyle}>
                    🛠 Atelier perso
                  </Link>
                </div>

                {user.camionsPerso.length === 0 ? (
                  <div style={emptyStyle}>Tu n’as encore aucun camion personnel.</div>
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
                            <div style={truckImageOverlayStyle} />
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
                            <Info label="Kilométrage">
                              {(camion.kilometrage ?? 0).toLocaleString("fr-FR")} km
                            </Info>

                            <Info label="État">{camion.etat ?? 0}%</Info>

                            <Info label="Carburant">{camion.carburant ?? 0}%</Info>

                            <Info label="Position">
                              {camion.positionActuelle || "Non définie"}
                            </Info>
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
                              Voir le camion
                            </Link>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </article>
            </div>

            <aside style={sideStyle}>
              <div style={sideCardStyle}>
                <h2 style={sideTitleStyle}>Infos parking</h2>

                <Info label="Prix d’une place">
                  {prixPlace.toLocaleString("fr-FR")} €
                </Info>

                <Info label="Maximum">5 places</Info>

                <Info label="Règle">1 place = 1 camion</Info>
              </div>

              <div style={sideCardStyle}>
                <h2 style={sideTitleStyle}>Atelier perso</h2>

                <p style={smallTextStyle}>
                  Répare tes camions personnels avec ton argent perso :
                  vidange, révision, pneus, freins et batterie.
                </p>

                <Link href="/camions/parking/atelier" style={atelierButtonStyle}>
                  Ouvrir l’atelier
                </Link>
              </div>

              <div style={sideCardStyle}>
                <h2 style={sideTitleStyle}>Résumé garage</h2>

                <p style={smallTextStyle}>
                  Le parking privé est séparé du garage société. Ces camions
                  appartiennent uniquement au chauffeur.
                </p>
              </div>
            </aside>
          </section>
        </div>
      </div>
    </main>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span style={badgeStyle}>{children}</span>;
}

function BigStat({
  title,
  value,
  detail,
  color,
  icon,
}: {
  title: string;
  value: string;
  detail: string;
  color: string;
  icon: string;
}) {
  return (
    <div style={bigStatStyle}>
      <div style={bigStatTopStyle}>
        <span style={bigIconStyle}>{icon}</span>
        <span style={bigStatTitleStyle}>{title}</span>
      </div>

      <strong style={{ ...bigStatValueStyle, color }}>{value}</strong>
      <span style={bigStatDetailStyle}>{detail}</span>
    </div>
  );
}

function Info({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={infoRowStyle}>
      <span style={labelStyle}>{label}</span>
      <span style={valueStyle}>{children}</span>
    </div>
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
  backgroundImage:
    "linear-gradient(120deg, rgba(0,0,0,0.84), rgba(0,0,0,0.62)), url('/truck.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  backgroundAttachment: "fixed",
  position: "relative",
  color: "white",
};

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background:
    "radial-gradient(circle at top right, rgba(245,158,11,0.16), transparent 34%), radial-gradient(circle at bottom left, rgba(37,99,235,0.16), transparent 38%)",
  pointerEvents: "none",
};

const topButtonsStyle: CSSProperties = {
  position: "fixed",
  top: "22px",
  right: "24px",
  zIndex: 20,
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const topButtonStyle: CSSProperties = {
  color: "white",
  textDecoration: "none",
  padding: "11px 15px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.14)",
  fontWeight: 900,
  backdropFilter: "blur(10px)",
  boxShadow: "0 12px 28px rgba(0,0,0,0.28)",
};

const topButtonBlueStyle: CSSProperties = {
  ...topButtonStyle,
  background:
    "linear-gradient(135deg, rgba(37,99,235,0.95), rgba(29,78,216,0.9))",
  border: "1px solid rgba(147,197,253,0.28)",
};

const layoutStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  minHeight: "100vh",
  display: "flex",
};

const contentStyle: CSSProperties = {
  flex: 1,
  padding: "78px 24px 24px",
  minWidth: 0,
  display: "grid",
  gap: "18px",
};

const proHeaderStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "stretch",
  gap: "20px",
  flexWrap: "wrap",
  padding: "28px",
  borderRadius: "28px",
  background:
    "linear-gradient(120deg, rgba(255,255,255,0.13), rgba(15,23,42,0.76) 46%, rgba(0,0,0,0.64))",
  border: "1px solid rgba(255,255,255,0.16)",
  boxShadow:
    "0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12)",
  backdropFilter: "blur(14px)",
};

const headerGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(circle at 18% 35%, rgba(255,255,255,0.16), transparent 24%), radial-gradient(circle at 82% 22%, rgba(245,158,11,0.16), transparent 30%)",
  pointerEvents: "none",
};

const profileLeftStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "flex",
  alignItems: "center",
  gap: "22px",
  minWidth: 0,
};

const avatarFrameStyle: CSSProperties = {
  width: "112px",
  height: "112px",
  borderRadius: "26px",
  padding: "4px",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.22))",
  boxShadow: "0 18px 40px rgba(0,0,0,0.42)",
  flex: "0 0 auto",
};

const avatarStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  borderRadius: "22px",
  objectFit: "cover",
  display: "block",
};

const kickerStyle: CSSProperties = {
  opacity: 0.82,
  fontSize: "13px",
  textTransform: "uppercase",
  letterSpacing: "0.18em",
  fontWeight: 900,
};

const pseudoStyle: CSSProperties = {
  margin: "8px 0 0",
  fontSize: "58px",
  lineHeight: 0.95,
  fontWeight: 950,
  letterSpacing: "-0.04em",
  textShadow: "0 8px 28px rgba(0,0,0,0.48)",
};

const identityRowStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "18px",
};

const badgeStyle: CSSProperties = {
  padding: "9px 14px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.16)",
  fontWeight: 900,
  fontSize: "13px",
  textTransform: "uppercase",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
};

const heroWalletStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  minWidth: "270px",
  borderRadius: "22px",
  padding: "20px",
  background:
    "linear-gradient(135deg, rgba(22,163,74,0.25), rgba(34,197,94,0.08))",
  border: "1px solid rgba(34,197,94,0.28)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  boxShadow: "0 0 24px rgba(34,197,94,0.18)",
};

const walletLabelStyle: CSSProperties = {
  opacity: 0.78,
  fontSize: "13px",
  textTransform: "uppercase",
  letterSpacing: "0.12em",
};

const walletValueStyle: CSSProperties = {
  fontSize: "34px",
  color: "#22c55e",
  marginTop: "8px",
};

const walletHintStyle: CSSProperties = {
  opacity: 0.7,
  fontSize: "13px",
  marginTop: "6px",
};

const quickActionsStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const actionButtonStyle: CSSProperties = {
  color: "white",
  textDecoration: "none",
  padding: "12px 16px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.1)",
  fontWeight: 800,
};

const actionButtonBlueStyle: CSSProperties = {
  ...actionButtonStyle,
  background: "linear-gradient(135deg, #f59e0b, #ef4444)",
};

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: "14px",
};

const bigStatStyle: CSSProperties = {
  padding: "18px",
  borderRadius: "20px",
  background: "rgba(0,0,0,0.5)",
  border: "1px solid rgba(255,255,255,0.09)",
  boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
};

const bigStatTopStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "12px",
};

const bigIconStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.08)",
};

const bigStatTitleStyle: CSSProperties = {
  opacity: 0.75,
  fontWeight: 800,
};

const bigStatValueStyle: CSSProperties = {
  display: "block",
  fontSize: "25px",
  marginBottom: "6px",
};

const bigStatDetailStyle: CSSProperties = {
  opacity: 0.62,
  fontSize: "13px",
};

const dashboardGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 320px",
  gap: "18px",
  alignItems: "start",
};

const panelStyle: CSSProperties = {
  background: "rgba(0,0,0,0.52)",
  borderRadius: "22px",
  padding: "20px",
  backdropFilter: "blur(8px)",
  border: "1px solid rgba(255,255,255,0.09)",
  boxShadow: "0 18px 50px rgba(0,0,0,0.34)",
};

const panelHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "flex-start",
  marginBottom: "16px",
  flexWrap: "wrap",
};

const panelTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "22px",
};

const panelSubtitleStyle: CSSProperties = {
  margin: "6px 0 0",
  opacity: 0.68,
  fontSize: "14px",
};

const progressTrackStyle: CSSProperties = {
  width: "100%",
  height: "15px",
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

const messageStyle: CSSProperties = {
  marginTop: "16px",
  marginBottom: 0,
  fontWeight: 800,
};

const truckGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: "18px",
};

const truckCardStyle: CSSProperties = {
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(15,15,15,0.78))",
  borderRadius: "20px",
  padding: "16px",
  border: "1px solid rgba(255,255,255,0.1)",
  backdropFilter: "blur(6px)",
  boxShadow: "0 18px 40px rgba(0,0,0,0.34)",
};

const truckImageWrapStyle: CSSProperties = {
  position: "relative",
  height: "170px",
  borderRadius: "16px",
  overflow: "hidden",
  marginBottom: "14px",
  border: "1px solid rgba(255,255,255,0.1)",
};

const truckImageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const truckImageOverlayStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.72))",
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
  fontWeight: 900,
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
  fontWeight: 900,
  fontSize: "14px",
  textAlign: "right",
};

const smallTextStyle: CSSProperties = {
  margin: 0,
  lineHeight: 1.6,
  opacity: 0.86,
};

const barHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  marginBottom: "8px",
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

const sideCardStyle: CSSProperties = {
  background: "rgba(0,0,0,0.52)",
  borderRadius: "22px",
  padding: "20px",
  backdropFilter: "blur(8px)",
  border: "1px solid rgba(255,255,255,0.09)",
  boxShadow: "0 18px 50px rgba(0,0,0,0.34)",
};

const sideTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: "14px",
  fontSize: "20px",
};

const emptyStyle: CSSProperties = {
  padding: "26px",
  borderRadius: "18px",
  textAlign: "center",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  opacity: 0.78,
};

const greenButtonStyle: CSSProperties = {
  padding: "12px 18px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 12px 30px rgba(34,197,94,0.24)",
};

const blueButtonFullStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 16px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const atelierButtonStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  marginTop: "14px",
  padding: "12px 16px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(135deg, #f59e0b, #ef4444)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const atelierTopButtonStyle: CSSProperties = {
  padding: "11px 15px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(135deg, #f59e0b, #ef4444)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};