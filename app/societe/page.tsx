export const dynamic = "force-dynamic";

import type { CSSProperties } from "react";
import Menu from "@/app/components/Menu";
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
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              membres: true,
            },
          },
        },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
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
          ? Math.round(
              (cuveSiteData.stockActuel / cuveSiteData.capaciteMax) * 100
            )
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

  const entreprisesOuvertes = entreprises.filter((e) => e.recrutement).length;

  return (
    <main style={mainStyle}>
      <div style={backgroundGlowStyle} />

      <div style={pageStyle}>
        <header style={headerStyle}>
          <div>
            <div style={brandStyle}>🚛 ELITE ROUTIERS</div>
            <h1 style={heroTitleStyle}>Accueil des sociétés</h1>
            <p style={heroTextStyle}>
              Trouve une entreprise, suis l’activité du réseau et prends la route
              avec ta flotte.
            </p>
          </div>

          <div style={headerRightStyle}>
            <div style={topStatStyle}>
              <strong>{entreprises.length}</strong>
              <span>Entreprises</span>
            </div>

            <div style={topStatStyle}>
              <strong>{entreprisesOuvertes}</strong>
              <span>Recrutent</span>
            </div>

            <div style={topStatStyle}>
              <strong>{chauffeurs.length}</strong>
              <span>Chauffeurs</span>
            </div>

            <div style={steamBadgeStyle}>
              <span style={steamDotStyle} />
              Connexion Steam OK
            </div>
          </div>
        </header>

        <div style={layoutStyle}>
          <Menu />

          <section style={centerPanelStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <div style={smallTitleStyle}>Réseau Elite Routiers</div>
                <h2 style={sectionTitleStyle}>Entreprises</h2>
              </div>

              <div style={buttonGroupStyle}>
                <Link href="/societe/classement" style={buttonBlue}>
                  🏆 Classement
                </Link>

                <Link href="/societe/create" style={buttonDark}>
                  + Créer une entreprise
                </Link>
              </div>
            </div>

            <div style={fuelPanelStyle}>
              <div style={fuelHeaderStyle}>
                <div>
                  <div style={fuelTitleStyle}>⛽ Cuve Elite Routiers</div>
                  <div style={fuelSubtitleStyle}>
                    Réserve centrale du site pour alimenter les sociétés
                  </div>
                </div>

                <div style={fuelPriceStyle}>
                  Tarif actuel :{" "}
                  <span style={{ color: "#22c55e" }}>
                    {cuveSite.prixActuelLitre.toFixed(2)} €/L
                  </span>
                </div>
              </div>

              <div style={fuelInfoGridStyle}>
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

              <div style={fuelProgressStyle}>
                <div
                  style={{
                    width: `${cuveSite.pourcentage}%`,
                    height: "100%",
                    borderRadius: "999px",
                    background: `linear-gradient(90deg, ${couleurCuveSite}, ${couleurCuveSite})`,
                    boxShadow: `0 0 18px ${couleurCuveSite}`,
                    transition: "width 0.3s ease",
                  }}
                />
              </div>

              <div style={fuelMessageStyle}>
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
              <div style={errorStyle}>{erreurChargement}</div>
            ) : (
              <div style={companyGridStyle}>
                {entreprises.map((entreprise) => (
                  <article key={entreprise.id} style={companyCardStyle}>
                    <div
                      style={{
                        ...companyImageStyle,
                        backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.78)), url('${
                          entreprise.banniere || "/truck.jpg"
                        }')`,
                      }}
                    >
                      <div style={companyAbbrStyle}>
                        [{entreprise.abreviation}]
                      </div>
                    </div>

                    <div style={companyContentStyle}>
                      <div>
                        <h3 style={companyNameStyle}>{entreprise.nom}</h3>

                        <div style={companyStatusStyle}>
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
                                ? "0 0 10px #22c55e"
                                : "0 0 10px #ef4444",
                            }}
                          />
                          <span>
                            Recrutement :{" "}
                            {entreprise.recrutement ? "Ouvert" : "Fermé"}
                          </span>
                        </div>

                        <div style={companyMembersStyle}>
                          🚛 Chauffeurs : {entreprise._count?.membres ?? 0}
                        </div>
                      </div>

                      <div style={companyActionsStyle}>
                        <Link
                          href={`/entreprise/${entreprise.id}`}
                          style={companyViewButtonStyle}
                        >
                          Voir
                        </Link>

                        {entreprise.recrutement ? (
                          <Link
                            href={`/entreprise/${entreprise.id}/postuler`}
                            style={companyApplyButtonStyle}
                          >
                            Postuler
                          </Link>
                        ) : (
                          <div style={companyClosedButtonStyle}>
                            Recrutement fermé
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                ))}

                {entreprises.length === 0 && (
                  <div style={emptyCompanyStyle}>
                    Aucune entreprise pour le moment.
                  </div>
                )}
              </div>
            )}
          </section>

          <aside style={rightPanelStyle}>
            <div style={rightHeaderStyle}>
              <div style={smallTitleStyle}>Communauté</div>
              <h2 style={driversTitleStyle}>Chauffeurs du site</h2>
            </div>

            <div style={driversListStyle}>
              {chauffeurs.map((chauffeur) => {
                const nomAffiche =
                  chauffeur.username?.trim() || "Chauffeur sans pseudo";

                return (
                  <div key={chauffeur.id} style={driverCardStyle}>
                    <img
                      src={chauffeur.avatar || "/truck.jpg"}
                      alt={nomAffiche}
                      style={driverAvatarStyle}
                    />

                    <div style={driverInfoStyle}>
                      <div style={driverNameStyle}>{nomAffiche}</div>
                      <div style={driverSubStyle}>Chauffeur Elite Routiers</div>
                    </div>
                  </div>
                );
              })}

              {chauffeurs.length === 0 && (
                <div style={emptyDriverStyle}>
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

const mainStyle: CSSProperties = {
  minHeight: "100vh",
  position: "relative",
  color: "white",
  backgroundImage:
    "linear-gradient(90deg, rgba(0,0,0,0.88), rgba(0,0,0,0.55), rgba(0,0,0,0.88)), url('/truck.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundAttachment: "fixed",
};

const backgroundGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,0.2)",
};

const pageStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  minHeight: "100vh",
  padding: "24px",
};

const headerStyle: CSSProperties = {
  maxWidth: "1720px",
  margin: "0 auto 24px",
  minHeight: "145px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "24px",
  padding: "30px",
  borderRadius: "30px",
  background:
    "linear-gradient(135deg, rgba(15,23,42,0.88), rgba(15,23,42,0.58))",
  border: "1px solid rgba(255,255,255,0.18)",
  backdropFilter: "blur(16px)",
  boxShadow: "0 26px 90px rgba(0,0,0,0.6)",
};

const brandStyle: CSSProperties = {
  color: "#93c5fd",
  fontSize: "1rem",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  fontWeight: 900,
};

const heroTitleStyle: CSSProperties = {
  margin: "10px 0 8px",
  fontSize: "3.4rem",
  lineHeight: 1,
  fontWeight: 900,
  textShadow: "0 5px 25px rgba(0,0,0,0.65)",
};

const heroTextStyle: CSSProperties = {
  margin: 0,
  maxWidth: "650px",
  color: "rgba(255,255,255,0.72)",
  fontSize: "1rem",
  fontWeight: 600,
};

const headerRightStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
};

const topStatStyle: CSSProperties = {
  width: "112px",
  minHeight: "82px",
  display: "grid",
  placeItems: "center",
  borderRadius: "20px",
  background: "rgba(0,0,0,0.42)",
  border: "1px solid rgba(255,255,255,0.14)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
  fontWeight: 900,
};

const steamBadgeStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "9px",
  padding: "12px 16px",
  borderRadius: "999px",
  background: "rgba(34,197,94,0.13)",
  border: "1px solid rgba(34,197,94,0.32)",
  color: "#bbf7d0",
  fontWeight: 900,
};

const steamDotStyle: CSSProperties = {
  width: "10px",
  height: "10px",
  borderRadius: "50%",
  background: "#22c55e",
  boxShadow: "0 0 12px #22c55e",
};

const layoutStyle: CSSProperties = {
  maxWidth: "1720px",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "260px minmax(0, 1fr) 310px",
  gap: "22px",
  alignItems: "start",
};

const centerPanelStyle: CSSProperties = {
  borderRadius: "30px",
  padding: "24px",
  background: "rgba(0,0,0,0.42)",
  border: "1px solid rgba(255,255,255,0.15)",
  backdropFilter: "blur(16px)",
  boxShadow: "0 26px 90px rgba(0,0,0,0.58)",
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",background:
  "linear-gradient(135deg, rgba(0,0,0,0.42), rgba(255,255,255,0.08))",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
  marginBottom: "22px",
};

const smallTitleStyle: CSSProperties = {
  color: "#93c5fd",
  textTransform: "uppercase",
  letterSpacing: "0.13em",
  fontSize: "0.76rem",
  fontWeight: 900,
};

const sectionTitleStyle: CSSProperties = {
  margin: "6px 0 0",
  fontSize: "2.2rem",
  lineHeight: 1,
};

const buttonGroupStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const fuelPanelStyle: CSSProperties = {
  marginBottom: "24px",
  padding: "22px",
  borderRadius: "24px",
  background:
    "linear-gradient(135deg, rgba(0,0,0,0.42), rgba(0,0,0,0.24))",
  border: "1px solid rgba(255,255,255,0.14)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
};

const fuelHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "14px",
  flexWrap: "wrap",
  marginBottom: "16px",
};

const fuelTitleStyle: CSSProperties = {
  fontSize: "1.55rem",
  fontWeight: 900,
};

const fuelSubtitleStyle: CSSProperties = {
  marginTop: "4px",
  fontSize: "0.9rem",
  color: "rgba(255,255,255,0.66)",
  fontWeight: 700,
};

const fuelPriceStyle: CSSProperties = {
  padding: "12px 16px",
  borderRadius: "15px",
  background: "rgba(255,255,255,0.075)",
  border: "1px solid rgba(255,255,255,0.12)",
  fontWeight: 900,
};

const fuelInfoGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "12px",
  marginBottom: "15px",
};

const fuelInfoCard: CSSProperties = {
  background: "rgba(255,255,255,0.065)",
  borderRadius: "16px",
  padding: "15px",
  border: "1px solid rgba(255,255,255,0.10)",
};

const fuelInfoLabel: CSSProperties = {
  fontSize: "0.75rem",
  color: "rgba(255,255,255,0.62)",
  marginBottom: "7px",
  fontWeight: 800,
};

const fuelInfoValue: CSSProperties = {
  fontSize: "1.25rem",
  fontWeight: 900,
};

const fuelProgressStyle: CSSProperties = {
  width: "100%",
  height: "17px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.10)",
};

const fuelMessageStyle: CSSProperties = {
  marginTop: "11px",
  color: "rgba(255,255,255,0.75)",
  fontSize: "0.9rem",
  fontWeight: 700,
};

const companyGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "17px",
};

const companyCardStyle: CSSProperties = {
  minHeight: "318px",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  borderRadius: "22px",
  background: "rgba(8,13,24,0.86)",
  border: "1px solid rgba(255,255,255,0.13)",
  boxShadow: "0 20px 52px rgba(0,0,0,0.42)",
};

const companyImageStyle: CSSProperties = {
  height: "128px",
  backgroundSize: "cover",
  backgroundPosition: "center",
  position: "relative",
};

const companyAbbrStyle: CSSProperties = {
  position: "absolute",
  left: "13px",
  bottom: "13px",
  padding: "6px 11px",
  borderRadius: "999px",
  background: "rgba(0,0,0,0.6)",
  border: "1px solid rgba(255,255,255,0.18)",
  fontWeight: 900,
  fontSize: "0.78rem",
};

const companyContentStyle: CSSProperties = {
  padding: "15px",
  display: "flex",
  flexDirection: "column",
  flex: 1,
};

const companyNameStyle: CSSProperties = {
  margin: "0 0 10px",
  fontSize: "1.17rem",
  lineHeight: 1.15,
};

const companyStatusStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "0.86rem",
  fontWeight: 900,
  marginBottom: "9px",
};

const companyMembersStyle: CSSProperties = {
  color: "rgba(255,255,255,0.76)",
  fontSize: "0.9rem",
  fontWeight: 700,
};

const companyActionsStyle: CSSProperties = {
  marginTop: "auto",
  display: "grid",
  gap: "8px",
};

const companyViewButtonStyle: CSSProperties = {
  textAlign: "center",
  padding: "10px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "white",
  textDecoration: "none",
  fontWeight: 900,
};

const companyApplyButtonStyle: CSSProperties = {
  textAlign: "center",
  padding: "10px",
  borderRadius: "12px",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  border: "1px solid rgba(147,197,253,0.55)",
  color: "white",
  textDecoration: "none",
  fontWeight: 900,
  boxShadow: "0 0 20px rgba(37,99,235,0.34)",
};

const companyClosedButtonStyle: CSSProperties = {
  textAlign: "center",
  padding: "10px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "rgba(255,255,255,0.6)",
  fontWeight: 900,
  cursor: "not-allowed",
};

const rightPanelStyle: CSSProperties = {
  borderRadius: "30px",
  padding: "21px",
  background: "rgba(2,6,23,0.74)",
  border: "1px solid rgba(255,255,255,0.15)",
  backdropFilter: "blur(16px)",
  boxShadow: "0 26px 90px rgba(0,0,0,0.58)",
};

const rightHeaderStyle: CSSProperties = {
  marginBottom: "16px",
};

const driversTitleStyle: CSSProperties = {
  margin: "6px 0 0",
  fontSize: "1.45rem",
};

const driversListStyle: CSSProperties = {
  display: "grid",
  gap: "11px",
};

const driverCardStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "11px",
  padding: "11px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.065)",
  border: "1px solid rgba(255,255,255,0.10)",
};

const driverAvatarStyle: CSSProperties = {
  width: "46px",
  height: "46px",
  borderRadius: "50%",
  objectFit: "cover",
  border: "1px solid rgba(255,255,255,0.18)",
  flexShrink: 0,
};

const driverInfoStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
};

const driverNameStyle: CSSProperties = {
  fontWeight: 900,
  fontSize: "0.92rem",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const driverSubStyle: CSSProperties = {
  color: "rgba(255,255,255,0.56)",
  fontSize: "0.76rem",
  fontWeight: 700,
};

const errorStyle: CSSProperties = {
  textAlign: "center",
  padding: "22px",
  background: "rgba(239,68,68,0.15)",
  border: "1px solid rgba(239,68,68,0.35)",
  borderRadius: "16px",
  color: "#fecaca",
  fontWeight: 900,
};

const emptyCompanyStyle: CSSProperties = {
  gridColumn: "1 / -1",
  textAlign: "center",
  padding: "24px",
  background: "rgba(255,255,255,0.06)",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.10)",
};

const emptyDriverStyle: CSSProperties = {
  textAlign: "center",
  padding: "16px",
  background: "rgba(255,255,255,0.06)",
  borderRadius: "14px",
};

const buttonBlue: CSSProperties = {
  padding: "11px 16px",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  borderRadius: "13px",
  color: "white",
  textDecoration: "none",
  fontWeight: 900,
  border: "1px solid rgba(147,197,253,0.55)",
  boxShadow: "0 0 18px rgba(37,99,235,0.3)",
};

const buttonDark: CSSProperties = {
  padding: "11px 16px",
  background: "rgba(255,255,255,0.08)",
  borderRadius: "13px",
  color: "white",
  textDecoration: "none",
  fontWeight: 900,
  border: "1px solid rgba(255,255,255,0.14)",
};