export const dynamic = "force-dynamic";

import type { CSSProperties } from "react";
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
            select: { membres: true },
          },
        },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          username: true,
          avatar: true,
          lastOnlineAt: true,
        },
        take: 50,
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

  const entreprisesOuvertes = entreprises.filter((e) => e.recrutement).length;

  const totalChauffeursEntreprises = entreprises.reduce(
    (total, entreprise) => total + (entreprise._count?.membres ?? 0),
    0
  );

  const couleurCuveSite =
    cuveSite.pourcentage <= 20
      ? "#ef4444"
      : cuveSite.pourcentage <= 40
      ? "#f97316"
      : cuveSite.pourcentage <= 60
      ? "#f59e0b"
      : "#22c55e";

  return (
    <main style={mainStyle}>
      <div style={pageOverlayStyle} />

      <div style={pageStyle}>
        <div style={layoutStyle}>
          <aside style={leftMenuStyle}>
            <div style={menuHeaderStyle}>
              <div style={menuLogoStyle}>ER</div>
              <div>
                <div style={menuTitleStyle}>Elite Routiers</div>
                <div style={menuSubStyle}>Accueil société</div>
              </div>
            </div>

            <nav style={navStyle}>
              <MenuLink href="/societe" icon="🏠" label="Accueil" active />
              <MenuLink href="/profil" icon="👤" label="Profil" />
              <MenuLink href="/mon-entreprise" icon="🏢" label="Mon entreprise" />
              <MenuLink href="/parametres" icon="⚙️" label="Paramètres" />
              <MenuLink href="/telechargement" icon="📥" label="Télécharger Tacky" />
              <MenuLink
                href="/telechargement"
                icon="🔌"
                label="Télécharger Plugin"
              />
            </nav>

            <div style={menuBottomCardStyle}>
              <div style={menuTruckImageStyle} />
              <div style={menuBottomTitleStyle}>Sur la route</div>
              <div style={menuBottomTextStyle}>
                Rejoins une société, consulte les chauffeurs et lance ton aventure.
              </div>
            </div>
          </aside>

          <section style={centerStyle}>
            <section style={networkPanelStyle}>
              <div style={networkContentStyle}>
                <div style={networkLeftStyle}>
                  <div style={blueLabelStyle}>Réseau entreprise</div>

                  <h2 style={networkTitleStyle}>Entreprises du site</h2>

                  <p style={networkTextStyle}>
                    Découvre les sociétés actives, consulte leur recrutement et
                    choisis celle qui correspond à ton style de conduite.
                  </p>

                  <div style={networkButtonsStyle}>
                    <Link href="/societe/create" style={primaryButtonStyle}>
                      + Créer une entreprise
                    </Link>

                    <Link href="/societe/classement" style={secondaryButtonStyle}>
                      🏆 Classement
                    </Link>
                  </div>
                </div>

                <div style={networkRightStyle}>
                  <div style={steamBadgeLargeStyle}>
                    <span style={steamDotStyle} />
                    Connexion Steam OK
                  </div>
                </div>
              </div>

              <div style={networkStatsStyle}>
                <NetworkStat
                  icon="🏢"
                  value={entreprises.length}
                  label="Sociétés créées"
                  color="#3b82f6"
                />
                <NetworkStat
                  icon="👥"
                  value={entreprisesOuvertes}
                  label="Recrutement ouvert"
                  color="#22c55e"
                />
                <NetworkStat
                  icon="🚛"
                  value={totalChauffeursEntreprises}
                  label="Chauffeurs en société"
                  color="#a855f7"
                />
              </div>
            </section>

            <section style={companiesPanelStyle}>
              <div style={companiesHeaderStyle}>
                <div>
                  <div style={blueLabelStyle}>Liste des entreprises</div>
                  <h2 style={companiesTitleStyle}>Sociétés disponibles</h2>
                </div>

                <Link href="/societe/create" style={smallCreateButtonStyle}>
                  + Nouvelle société
                </Link>
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
                        <div style={companyTagStyle}>
                          {entreprise.abreviation}
                        </div>
                      </div>

                      <div style={companyBodyStyle}>
                        <h3 style={companyNameStyle}>{entreprise.nom}</h3>

                        <div
                          style={{
                            ...companyStatusStyle,
                            color: entreprise.recrutement
                              ? "#4ade80"
                              : "#f87171",
                          }}
                        >
                          <span
                            style={{
                              width: "9px",
                              height: "9px",
                              borderRadius: "50%",
                              background: entreprise.recrutement
                                ? "#22c55e"
                                : "#ef4444",
                              boxShadow: entreprise.recrutement
                                ? "0 0 10px #22c55e"
                                : "0 0 10px #ef4444",
                            }}
                          />
                          Recrutement{" "}
                          {entreprise.recrutement ? "ouvert" : "fermé"}
                        </div>

                        <div style={companyMembersStyle}>
                          🚛 {entreprise._count?.membres ?? 0} chauffeurs
                        </div>

                        <div style={companyActionsStyle}>
                          <Link
                            href={`/entreprise/${entreprise.id}`}
                            style={viewButtonStyle}
                          >
                            Voir
                          </Link>

                          {entreprise.recrutement ? (
                            <Link
                              href={`/entreprise/${entreprise.id}/postuler`}
                              style={applyButtonStyle}
                            >
                              Postuler
                            </Link>
                          ) : (
                            <div style={closedButtonStyle}>Fermé</div>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}

                  {entreprises.length === 0 && (
                    <div style={emptyStyle}>Aucune entreprise pour le moment.</div>
                  )}
                </div>
              )}

              <div style={createBannerStyle}>
                <div style={createIconStyle}>🏢</div>

                <div style={{ flex: 1 }}>
                  <div style={createTitleStyle}>
                    Tu souhaites créer ta propre société ?
                  </div>
                  <div style={createTextStyle}>
                    Lance ton entreprise, recrute des chauffeurs et construis ta
                    flotte.
                  </div>
                </div>

                <Link href="/societe/create" style={primaryButtonStyle}>
                  Créer
                </Link>
              </div>
            </section>
          </section>

          <aside style={rightColumnStyle}>
            <section style={rightPanelStyle}>
              <div style={rightHeaderStyle}>
                <div style={blueLabelStyle}>Communauté</div>
                <h2 style={rightTitleStyle}>Chauffeurs du site</h2>
              </div>

              <div style={driversListStyle}>
                {chauffeurs.map((chauffeur) => {
                  const nomAffiche =
                    chauffeur.username?.trim() || "Chauffeur sans pseudo";

                  const connecteAuJeu =
                    chauffeur.lastOnlineAt &&
                    Date.now() - new Date(chauffeur.lastOnlineAt).getTime() < 2 * 60 * 1000;

                  return (
                    <div key={chauffeur.id} style={driverCardStyle}>
                      <div style={avatarWrapStyle}>
                        <img
                          src={chauffeur.avatar || "/truck.jpg"}
                          alt={nomAffiche}
                          style={driverAvatarStyle}
                        />
                        <span
                          style={{
                            ...onlineDotStyle,
                            background: connecteAuJeu ? "#22c55e" : "#ef4444",
                            boxShadow: connecteAuJeu
                              ? "0 0 9px #22c55e"
                              : "0 0 9px #ef4444",
                          }}
                        />
                      </div>

                      <div style={driverInfoStyle}>
                        <strong>{nomAffiche}</strong>
                        <span>
                          {connecteAuJeu
                            ? "Connecté au jeu"
                            : "Non connecté au jeu"}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {chauffeurs.length === 0 && (
                  <div style={emptyDriverStyle}>Aucun chauffeur inscrit.</div>
                )}
              </div>

              <Link href="/chauffeurs" style={allDriversButtonStyle}>
                Voir tous les chauffeurs
              </Link>
            </section>

            <section style={fuelSmallPanelStyle}>
              <div style={blueLabelStyle}>Cuve du site</div>
              <h2 style={fuelSmallTitleStyle}>Carburant central</h2>

              <div style={fuelSmallPriceStyle}>
                {cuveSite.prixActuelLitre.toFixed(2)} €/L
              </div>

              <div style={fuelSmallInfoGridStyle}>
                <div style={fuelSmallInfoStyle}>
                  <span>Stock</span>
                  <strong>{cuveSite.stockActuel.toLocaleString("fr-FR")} L</strong>
                </div>

                <div style={fuelSmallInfoStyle}>
                  <span>Capacité</span>
                  <strong>{cuveSite.capaciteMax.toLocaleString("fr-FR")} L</strong>
                </div>
              </div>

              <div style={fuelSmallBarBgStyle}>
                <div
                  style={{
                    width: `${cuveSite.pourcentage}%`,
                    height: "100%",
                    borderRadius: "999px",
                    background: couleurCuveSite,
                    boxShadow: `0 0 18px ${couleurCuveSite}`,
                  }}
                />
              </div>

              <div style={fuelSmallFooterStyle}>
                <span style={{ color: couleurCuveSite }}>●</span>{" "}
                {cuveSite.pourcentage}% rempli
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function MenuLink({
  href,
  icon,
  label,
  active = false,
}: {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link href={href} style={active ? navActiveStyle : navItemStyle}>
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function NetworkStat({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div style={networkStatStyle}>
      <div
        style={{
          ...networkIconStyle,
          border: `1px solid ${color}`,
          color,
          boxShadow: `0 0 18px ${color}44`,
        }}
      >
        {icon}
      </div>

      <div>
        <strong style={networkStatNumberStyle}>{value}</strong>
        <span style={networkStatLabelStyle}>{label}</span>
      </div>
    </div>
  );
}

const mainStyle: CSSProperties = {
  minHeight: "100vh",
  color: "white",
  backgroundImage:
    "linear-gradient(180deg, rgba(3,7,18,0.04), rgba(3,7,18,0.84) 520px), url('/truck.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center top",
  backgroundAttachment: "fixed",
  fontFamily: "Arial, sans-serif",
};

const pageOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  pointerEvents: "none",
  background:
    "radial-gradient(circle at 52% 0%, rgba(245,158,11,0.16), transparent 34%), radial-gradient(circle at 80% 18%, rgba(37,99,235,0.12), transparent 25%)",
};

const pageStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  maxWidth: "1780px",
  margin: "0 auto",
  padding: "24px 24px 54px",
};

const layoutStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "250px minmax(0, 1fr) 300px",
  gap: "22px",
  alignItems: "start",
};

const leftMenuStyle: CSSProperties = {
  borderRadius: "28px",
  padding: "18px",
  background: "rgba(8,13,28,0.56)",
  border: "1px solid rgba(148,163,184,0.24)",
  boxShadow: "0 28px 90px rgba(0,0,0,0.42)",
  backdropFilter: "blur(18px)",
};

const menuHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "8px 8px 18px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  marginBottom: "14px",
};

const menuLogoStyle: CSSProperties = {
  width: "46px",
  height: "46px",
  display: "grid",
  placeItems: "center",
  borderRadius: "14px",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  fontWeight: 950,
  boxShadow: "0 0 24px rgba(37,99,235,0.45)",
};

const menuTitleStyle: CSSProperties = {
  fontWeight: 950,
  fontSize: "1rem",
};

const menuSubStyle: CSSProperties = {
  color: "rgba(255,255,255,0.52)",
  fontSize: "0.76rem",
  fontWeight: 800,
};

const navStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
};

const navItemStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "11px 12px",
  borderRadius: "14px",
  color: "rgba(255,255,255,0.74)",
  textDecoration: "none",
  fontWeight: 850,
  fontSize: "0.92rem",
};

const navActiveStyle: CSSProperties = {
  ...navItemStyle,
  color: "white",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  boxShadow: "0 0 24px rgba(37,99,235,0.32)",
};

const menuBottomCardStyle: CSSProperties = {
  marginTop: "18px",
  padding: "14px",
  borderRadius: "22px",
  background: "rgba(15,23,42,0.48)",
  border: "1px solid rgba(255,255,255,0.1)",
};

const menuTruckImageStyle: CSSProperties = {
  height: "86px",
  borderRadius: "16px",
  backgroundImage:
    "linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.62)), url('/truck.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  marginBottom: "12px",
};

const menuBottomTitleStyle: CSSProperties = {
  fontWeight: 950,
};

const menuBottomTextStyle: CSSProperties = {
  marginTop: "5px",
  color: "rgba(255,255,255,0.66)",
  fontSize: "0.78rem",
  lineHeight: 1.45,
  fontWeight: 700,
};

const centerStyle: CSSProperties = {
  display: "grid",
  gap: "20px",
};

const networkPanelStyle: CSSProperties = {
  minHeight: "420px",
  padding: "28px",
  borderRadius: "30px",
  backgroundImage:
    "linear-gradient(90deg, rgba(3,7,18,0.44), rgba(3,7,18,0.06), rgba(3,7,18,0.34)), url('/societe.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  border: "1px solid rgba(147,197,253,0.3)",
  boxShadow: "0 30px 90px rgba(0,0,0,0.46)",
};

const networkContentStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
};

const networkLeftStyle: CSSProperties = {
  maxWidth: "560px",
};

const blueLabelStyle: CSSProperties = {
  color: "#60a5fa",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontSize: "0.78rem",
  fontWeight: 950,
  textShadow: "0 4px 14px rgba(0,0,0,0.9)",
};

const networkTitleStyle: CSSProperties = {
  margin: "12px 0 12px",
  fontSize: "3.25rem",
  lineHeight: 0.95,
  fontWeight: 950,
  letterSpacing: "-0.06em",
  textShadow: "0 6px 24px rgba(0,0,0,0.95)",
};

const networkTextStyle: CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.92)",
  fontSize: "1.02rem",
  lineHeight: 1.55,
  fontWeight: 800,
  textShadow: "0 5px 16px rgba(0,0,0,0.95)",
};

const networkButtonsStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  marginTop: "20px",
  flexWrap: "wrap",
};

const networkRightStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
};

const steamBadgeStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "14px 18px",
  borderRadius: "999px",
  background: "rgba(22,163,74,0.38)",
  border: "1px solid rgba(74,222,128,0.54)",
  color: "#dcfce7",
  fontWeight: 950,
  boxShadow: "0 0 30px rgba(34,197,94,0.24)",
  backdropFilter: "blur(12px)",
};

const steamBadgeLargeStyle: CSSProperties = {
  ...steamBadgeStyle,
};

const steamDotStyle: CSSProperties = {
  width: "11px",
  height: "11px",
  borderRadius: "50%",
  background: "#22c55e",
  boxShadow: "0 0 12px #22c55e",
};

const networkStatsStyle: CSSProperties = {
  marginTop: "76px",
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "15px",
};

const networkStatStyle: CSSProperties = {
  minHeight: "92px",
  display: "flex",
  alignItems: "center",
  gap: "14px",
  padding: "17px",
  borderRadius: "20px",
  background: "rgba(8,13,28,0.5)",
  border: "1px solid rgba(255,255,255,0.14)",
  backdropFilter: "blur(12px)",
};

const networkIconStyle: CSSProperties = {
  width: "50px",
  height: "50px",
  display: "grid",
  placeItems: "center",
  borderRadius: "15px",
  background: "rgba(255,255,255,0.08)",
  fontSize: "1.28rem",
  flexShrink: 0,
};

const networkStatNumberStyle: CSSProperties = {
  display: "block",
  fontSize: "1.75rem",
  lineHeight: 1,
  fontWeight: 950,
};

const networkStatLabelStyle: CSSProperties = {
  display: "block",
  marginTop: "5px",
  color: "rgba(255,255,255,0.72)",
  fontSize: "0.78rem",
  fontWeight: 800,
};

const primaryButtonStyle: CSSProperties = {
  padding: "12px 16px",
  borderRadius: "13px",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "white",
  textDecoration: "none",
  fontWeight: 950,
  border: "1px solid rgba(147,197,253,0.45)",
  boxShadow: "0 0 24px rgba(37,99,235,0.34)",
};

const secondaryButtonStyle: CSSProperties = {
  padding: "12px 16px",
  borderRadius: "13px",
  background: "rgba(255,255,255,0.12)",
  color: "white",
  textDecoration: "none",
  fontWeight: 950,
  border: "1px solid rgba(255,255,255,0.16)",
  backdropFilter: "blur(10px)",
};

const companiesPanelStyle: CSSProperties = {
  padding: "24px",
  borderRadius: "26px",
  background: "rgba(8,13,28,0.56)",
  border: "1px solid rgba(148,163,184,0.22)",
  boxShadow: "0 24px 70px rgba(0,0,0,0.38)",
  backdropFilter: "blur(18px)",
};

const companiesHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "14px",
  marginBottom: "16px",
};

const companiesTitleStyle: CSSProperties = {
  margin: "7px 0 0",
  fontSize: "1.8rem",
  fontWeight: 950,
};

const smallCreateButtonStyle: CSSProperties = {
  padding: "11px 14px",
  borderRadius: "12px",
  background: "rgba(37,99,235,0.16)",
  border: "1px solid rgba(96,165,250,0.28)",
  color: "#dbeafe",
  textDecoration: "none",
  fontWeight: 950,
};

const companyGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "14px",
};

const companyCardStyle: CSSProperties = {
  overflow: "hidden",
  borderRadius: "18px",
  background: "rgba(15,23,42,0.62)",
  border: "1px solid rgba(148,163,184,0.22)",
};

const companyImageStyle: CSSProperties = {
  height: "135px",
  backgroundSize: "cover",
  backgroundPosition: "center",
  position: "relative",
};

const companyTagStyle: CSSProperties = {
  position: "absolute",
  left: "12px",
  bottom: "12px",
  padding: "6px 10px",
  borderRadius: "999px",
  background: "rgba(37,99,235,0.7)",
  border: "1px solid rgba(147,197,253,0.4)",
  fontWeight: 950,
  fontSize: "0.72rem",
};

const companyBodyStyle: CSSProperties = {
  padding: "14px",
};

const companyNameStyle: CSSProperties = {
  margin: "0 0 10px",
  fontSize: "1.02rem",
  lineHeight: 1.15,
  fontWeight: 950,
};

const companyStatusStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  fontSize: "0.78rem",
  fontWeight: 900,
};

const companyMembersStyle: CSSProperties = {
  marginTop: "9px",
  color: "rgba(255,255,255,0.74)",
  fontSize: "0.82rem",
  fontWeight: 800,
};

const companyActionsStyle: CSSProperties = {
  marginTop: "14px",
  display: "grid",
  gridTemplateColumns: "1fr 1.25fr",
  gap: "8px",
};

const viewButtonStyle: CSSProperties = {
  textAlign: "center",
  padding: "9px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "white",
  textDecoration: "none",
  fontWeight: 900,
};

const applyButtonStyle: CSSProperties = {
  textAlign: "center",
  padding: "9px",
  borderRadius: "10px",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "white",
  textDecoration: "none",
  fontWeight: 900,
};

const closedButtonStyle: CSSProperties = {
  textAlign: "center",
  padding: "9px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "rgba(255,255,255,0.45)",
  fontWeight: 900,
};

const createBannerStyle: CSSProperties = {
  marginTop: "22px",
  display: "flex",
  alignItems: "center",
  gap: "16px",
  padding: "16px",
  borderRadius: "18px",
  background: "rgba(15,23,42,0.52)",
  border: "1px solid rgba(148,163,184,0.18)",
};

const createIconStyle: CSSProperties = {
  width: "46px",
  height: "46px",
  display: "grid",
  placeItems: "center",
  borderRadius: "14px",
  background: "rgba(37,99,235,0.16)",
  color: "#60a5fa",
  fontSize: "1.4rem",
};

const createTitleStyle: CSSProperties = {
  fontWeight: 950,
};

const createTextStyle: CSSProperties = {
  marginTop: "4px",
  color: "rgba(255,255,255,0.66)",
  fontSize: "0.84rem",
  fontWeight: 750,
};

const rightColumnStyle: CSSProperties = {
  display: "grid",
  gap: "16px",
};

const rightPanelStyle: CSSProperties = {
  padding: "20px",
  borderRadius: "28px",
  background: "rgba(8,13,28,0.56)",
  border: "1px solid rgba(148,163,184,0.22)",
  boxShadow: "0 28px 90px rgba(0,0,0,0.42)",
  backdropFilter: "blur(18px)",
};

const rightHeaderStyle: CSSProperties = {
  marginBottom: "18px",
};

const rightTitleStyle: CSSProperties = {
  margin: "7px 0 0",
  fontSize: "1.35rem",
  fontWeight: 950,
};

const driversListStyle: CSSProperties = {
  display: "grid",
  gap: "13px",
  maxHeight: "244px",
  overflowY: "auto",
  paddingRight: "4px",
};

const driverCardStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "9px",
  borderRadius: "15px",
  background: "rgba(255,255,255,0.065)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const avatarWrapStyle: CSSProperties = {
  position: "relative",
  width: "44px",
  height: "44px",
  flexShrink: 0,
};

const driverAvatarStyle: CSSProperties = {
  width: "44px",
  height: "44px",
  borderRadius: "50%",
  objectFit: "cover",
  border: "1px solid rgba(255,255,255,0.18)",
};

const onlineDotStyle: CSSProperties = {
  position: "absolute",
  right: 0,
  bottom: "2px",
  width: "11px",
  height: "11px",
  borderRadius: "50%",
};

const driverInfoStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
  minWidth: 0,
  fontSize: "0.84rem",
};

const allDriversButtonStyle: CSSProperties = {
  display: "block",
  textAlign: "center",
  marginTop: "18px",
  padding: "12px",
  borderRadius: "13px",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "white",
  textDecoration: "none",
  fontWeight: 950,
};

const fuelSmallPanelStyle: CSSProperties = {
  padding: "20px",
  borderRadius: "28px",
  background: "rgba(8,13,28,0.56)",
  border: "1px solid rgba(148,163,184,0.22)",
  boxShadow: "0 28px 90px rgba(0,0,0,0.42)",
  backdropFilter: "blur(18px)",
};

const fuelSmallTitleStyle: CSSProperties = {
  margin: "7px 0 10px",
  fontSize: "1.25rem",
  fontWeight: 950,
};

const fuelSmallPriceStyle: CSSProperties = {
  display: "inline-flex",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(37,99,235,0.18)",
  border: "1px solid rgba(96,165,250,0.28)",
  color: "#dbeafe",
  fontWeight: 950,
  marginBottom: "14px",
};

const fuelSmallInfoGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "8px",
  marginBottom: "14px",
};

const fuelSmallInfoStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "8px",
  padding: "10px",
  borderRadius: "13px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  fontSize: "0.82rem",
};

const fuelSmallBarBgStyle: CSSProperties = {
  height: "15px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  overflow: "hidden",
};

const fuelSmallFooterStyle: CSSProperties = {
  marginTop: "10px",
  fontWeight: 900,
  color: "rgba(255,255,255,0.78)",
  fontSize: "0.85rem",
};

const errorStyle: CSSProperties = {
  padding: "18px",
  borderRadius: "14px",
  background: "rgba(239,68,68,0.15)",
  border: "1px solid rgba(239,68,68,0.35)",
  color: "#fecaca",
  fontWeight: 900,
};

const emptyStyle: CSSProperties = {
  gridColumn: "1 / -1",
  padding: "22px",
  textAlign: "center",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.06)",
};

const emptyDriverStyle: CSSProperties = {
  padding: "16px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.06)",
  textAlign: "center",
};