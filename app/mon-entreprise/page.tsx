import type { CSSProperties } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatJeu(jeu: string) {
  if (jeu === "LES_DEUX") return "Les deux";
  return jeu;
}

function formatTypeTransport(type: string) {
  switch (type) {
    case "GENERAL":
      return "Général";
    case "CITERNE":
      return "Citerne";
    case "CONVOI_EXCEPTIONNEL":
      return "Convoi exceptionnel";
    case "FRIGO":
      return "Frigo";
    case "BENNE":
      return "Benne";
    case "PLATEAU":
      return "Plateau";
    case "LIVESTOCK":
      return "Bétail";
    default:
      return type;
  }
}

function formatRole(role: string) {
  switch (role) {
    case "DIRECTEUR":
      return "Directeur";
    case "SOUS_DIRECTEUR":
      return "Sous-directeur";
    case "CHEF_EQUIPE":
      return "Chef d’équipe";
    case "CHEF_ATELIER":
      return "Chef d’atelier";
    default:
      return "Chauffeur";
  }
}

function formatStatutLivraison(status: string | null | undefined) {
  if (status === "TERMINEE") return "Terminée";
  if (status === "EN_COURS") return "En cours";
  if (status === "ANNULEE") return "Annulée";
  return status || "Inconnue";
}

function getStatusStyle(status: string | null | undefined): CSSProperties {
  if (status === "TERMINEE") {
    return {
      background: "rgba(34,197,94,0.18)",
      border: "1px solid rgba(34,197,94,0.45)",
      color: "#86efac",
    };
  }

  if (status === "ANNULEE") {
    return {
      background: "rgba(239,68,68,0.18)",
      border: "1px solid rgba(239,68,68,0.45)",
      color: "#fca5a5",
    };
  }

  return {
    background: "rgba(245,158,11,0.18)",
    border: "1px solid rgba(245,158,11,0.45)",
    color: "#fcd34d",
  };
}

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
              owner: true,
              membres: {
                include: {
                  user: true,
                },
                orderBy: {
                  createdAt: "asc",
                },
              },
              livraisons: {
                include: {
                  user: true,
                },
                orderBy: {
                  createdAt: "desc",
                },
                take: 12,
              },
            },
          },
        },
      },
    },
  });

  if (!user || !user.memberships || !user.memberships.entreprise) {
    redirect("/societe");
  }

  const membership = user.memberships;
  const entreprise = membership.entreprise;

  const rolesAutorisesBureau = [
    "DIRECTEUR",
    "SOUS_DIRECTEUR",
    "CHEF_EQUIPE",
    "CHEF_ATELIER",
  ];

  const peutVoirBureau = rolesAutorisesBureau.includes(membership.role);

  const livraisonsTerminees = entreprise.livraisons.filter(
    (livraison) => livraison.status === "TERMINEE"
  ).length;

  const totalGainsLivraisons = entreprise.livraisons.reduce(
    (total, livraison) => total + (livraison.income ?? 0),
    0
  );

  return (
    <main style={mainStyle}>
      <div style={backgroundOverlayStyle} />

      <div style={pageStyle}>
        <section style={heroStyle}>
          <img
            src={entreprise.banniere || "/truck.jpg"}
            alt="Photo de la société"
            style={heroImageStyle}
          />

          <div style={heroGradientStyle} />

          <div style={heroContentStyle}>
            <div style={heroTopLineStyle}>
              <div>
                <div style={badgeStyle}>Société active</div>

                <h1 style={heroTitleStyle}>{entreprise.nom}</h1>

                <p style={heroSubtitleStyle}>
                  [{entreprise.abreviation}] • {formatJeu(entreprise.jeu)} •{" "}
                  {formatTypeTransport(entreprise.typeTransport)}
                </p>
              </div>

              <div style={heroRightActionsStyle}>
                <Link href="/societe" style={homeButtonStyle}>
                  🏠 Accueil
                </Link>

                <Link href="/profil" style={userBoxStyle}>
                  <div style={userAvatarStyle}>
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt="Avatar utilisateur"
                        style={avatarImageStyle}
                      />
                    ) : (
                      <span>?</span>
                    )}
                  </div>

                  <div style={userInfoStyle}>
                    <span style={userLabelStyle}>Connecté</span>
                    <strong style={userNameStyle}>
                      {user.username || "Utilisateur Steam"}
                    </strong>
                  </div>
                </Link>
              </div>
            </div>

            <div style={heroStatsStyle}>
              <div style={heroStatCardStyle}>
                <span style={statLabelStyle}>Capital société</span>
                <strong style={statValueStyle}>
                  {(entreprise.argent ?? 0).toLocaleString("fr-FR")} €
                </strong>
              </div>

              <div style={heroStatCardStyle}>
                <span style={statLabelStyle}>Chauffeurs</span>
                <strong style={statValueStyle}>{entreprise.membres.length}</strong>
              </div>

              <div style={heroStatCardStyle}>
                <span style={statLabelStyle}>Livraisons récentes</span>
                <strong style={statValueStyle}>
                  {entreprise.livraisons.length}
                </strong>
              </div>
            </div>
          </div>
        </section>

        <div style={layoutStyle}>
          <aside style={boxStyle}>
            <h2 style={boxTitleStyle}>Infos société</h2>

            <div style={infoListStyle}>
              <InfoCard label="Nom" value={entreprise.nom} />
              <InfoCard label="Abréviation" value={entreprise.abreviation} />
              <InfoCard label="Jeu principal" value={formatJeu(entreprise.jeu)} />
              <InfoCard
                label="Transport"
                value={formatTypeTransport(entreprise.typeTransport)}
              />
              <InfoCard label="Votre rôle" value={formatRole(membership.role)} />
              <InfoCard
                label="Argent société"
                value={`${(entreprise.argent ?? 0).toLocaleString("fr-FR")} €`}
              />
              <InfoCard
                label="Membres"
                value={entreprise.membres.length.toString()}
              />
            </div>

            {peutVoirBureau && (
              <Link
                href={`/entreprise/${entreprise.id}/gestion`}
                style={buttonBlueStyle}
              >
                🏢 Ouvrir le bureau
              </Link>
            )}
          </aside>

          <section style={boxStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <h2 style={boxTitleStyle}>Livraisons des chauffeurs</h2>
                <p style={sectionTextStyle}>Activité récente de la société.</p>
              </div>

              <div style={quickActionsStyle}>
                <Link href="/camions" style={buttonStyle}>
                  🚛 Camions
                </Link>

                <Link href="/remorques" style={buttonStyle}>
                  🚚 Remorques
                </Link>

                <Link href="/atelier" style={buttonStyle}>
                  🔧 Atelier
                </Link>

                <Link href="/livraisons" style={buttonStyle}>
                  📋 Livraisons
                </Link>

                <Link href="/finance" style={buttonStyle}>
                  💶 Finance
                </Link>

                <Link href="/mon-entreprise/classement" style={buttonStyle}>
                  🏆 Classement société
                </Link>
              </div>
            </div>

            <div style={statsGridStyle}>
              <MiniStat
                label="Terminées"
                value={livraisonsTerminees.toString()}
                detail="sur les dernières livraisons"
              />

              <MiniStat
                label="Gains affichés"
                value={`${totalGainsLivraisons.toLocaleString("fr-FR")} €`}
                detail="sur les 12 dernières lignes"
              />

              <MiniStat
                label="Effectif"
                value={entreprise.membres.length.toString()}
                detail="chauffeurs dans la société"
              />
            </div>

            {entreprise.livraisons.length > 0 ? (
              <div style={deliveriesListStyle}>
                {entreprise.livraisons.map((livraison) => (
                  <article key={livraison.id} style={deliveryCardStyle}>
                    <div style={deliveryTopStyle}>
                      <div style={driverLineStyle}>
                        <div style={smallAvatarStyle}>
                          {livraison.user?.avatar ? (
                            <img
                              src={livraison.user.avatar}
                              alt="Avatar chauffeur"
                              style={avatarImageStyle}
                            />
                          ) : (
                            <span>?</span>
                          )}
                        </div>

                        <div>
                          <strong style={driverNameStyle}>
                            {livraison.user?.username || "Chauffeur inconnu"}
                          </strong>
                          <div style={miniTextStyle}>
                            Livraison #{livraison.id.slice(0, 8)}
                          </div>
                        </div>
                      </div>

                      <span
                        style={{
                          ...deliveryStatusStyle,
                          ...getStatusStyle(livraison.status),
                        }}
                      >
                        {formatStatutLivraison(livraison.status)}
                      </span>
                    </div>

                    <div style={routeStyle}>
                      <div>
                        <span style={labelStyle}>Départ</span>
                        <strong>{livraison.sourceCity || "?"}</strong>
                      </div>

                      <div style={routeArrowStyle}>→</div>

                      <div>
                        <span style={labelStyle}>Arrivée</span>
                        <strong>{livraison.destinationCity || "?"}</strong>
                      </div>
                    </div>

                    <div style={deliveryBottomStyle}>
                      <div>
                        <span style={labelStyle}>Cargaison</span>
                        <strong>{livraison.cargo || "Non renseignée"}</strong>
                      </div>

                      <div>
                        <span style={labelStyle}>Gain</span>
                        <strong style={moneyStyle}>
                          {(livraison.income ?? 0).toLocaleString("fr-FR")} €
                        </strong>
                      </div>
                    </div>

                    <div style={deliveryActionStyle}>
                      <Link
                        href={`/livraisons/${livraison.id}`}
                        style={smallButtonStyle}
                      >
                        Voir feuille de route
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div style={emptyCardStyle}>
                Aucune livraison affichée pour le moment.
              </div>
            )}
          </section>

          <aside style={boxStyle}>
            <h2 style={boxTitleStyle}>Chauffeurs</h2>

            <div style={driversListStyle}>
              {entreprise.membres.length > 0 ? (
                entreprise.membres.map((membre) => (
                  <div key={membre.id} style={driverCardStyle}>
                    <div style={avatarStyle}>
                      {membre.user?.avatar ? (
                        <img
                          src={membre.user.avatar}
                          alt="Avatar"
                          style={avatarImageStyle}
                        />
                      ) : (
                        <span>?</span>
                      )}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={driverNameEllipsisStyle}>
                        {membre.user?.username || "Utilisateur Steam"}
                      </div>
                      <div style={driverRoleStyle}>{formatRole(membre.role)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={emptyCardStyle}>Aucun chauffeur dans la société.</div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={infoCardStyle}>
      <span style={labelStyle}>{label}</span>
      <strong style={valueStyle}>{value}</strong>
    </div>
  );
}

function MiniStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div style={miniStatStyle}>
      <span style={labelStyle}>{label}</span>
      <strong style={miniStatValueStyle}>{value}</strong>
      <small style={miniStatDetailStyle}>{detail}</small>
    </div>
  );
}

const mainStyle: CSSProperties = {
  minHeight: "100vh",
  backgroundImage: "url('/truck.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  position: "relative",
  color: "white",
};

const backgroundOverlayStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(circle at top, rgba(37,99,235,0.18), transparent 34%), rgba(0,0,0,0.68)",
};

const pageStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  minHeight: "100vh",
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "20px",
};

const heroStyle: CSSProperties = {
  position: "relative",
  minHeight: "280px",
  borderRadius: "22px",
  overflow: "hidden",
  background: "rgba(0,0,0,0.55)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 22px 70px rgba(0,0,0,0.45)",
};

const heroImageStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const heroGradientStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(90deg, rgba(0,0,0,0.88), rgba(0,0,0,0.46), rgba(0,0,0,0.18)), linear-gradient(to top, rgba(0,0,0,0.90), transparent)",
};

const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 2,
  minHeight: "280px",
  padding: "26px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  gap: "20px",
};

const heroTopLineStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  flexWrap: "wrap",
};

const heroRightActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
};

const badgeStyle: CSSProperties = {
  display: "inline-flex",
  width: "fit-content",
  padding: "7px 12px",
  borderRadius: "999px",
  background: "rgba(34,197,94,0.14)",
  border: "1px solid rgba(34,197,94,0.38)",
  color: "#86efac",
  fontSize: "12px",
  fontWeight: "bold",
};

const heroTitleStyle: CSSProperties = {
  margin: "14px 0 6px",
  fontSize: "38px",
  lineHeight: 1,
  fontWeight: 900,
};

const heroSubtitleStyle: CSSProperties = {
  margin: 0,
  opacity: 0.9,
  fontSize: "15px",
};

const homeButtonStyle: CSSProperties = {
  padding: "12px 16px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.10)",
  color: "white",
  fontWeight: "bold",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,0.14)",
  backdropFilter: "blur(8px)",
  boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
};

const userBoxStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "8px 12px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.10)",
  border: "1px solid rgba(255,255,255,0.14)",
  backdropFilter: "blur(8px)",
  boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
  color: "white",
  textDecoration: "none",
};

const userAvatarStyle: CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "999px",
  overflow: "hidden",
  background: "rgba(255,255,255,0.10)",
  border: "1px solid rgba(255,255,255,0.16)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const userInfoStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
};

const userLabelStyle: CSSProperties = {
  fontSize: "11px",
  opacity: 0.7,
  lineHeight: 1.1,
};

const userNameStyle: CSSProperties = {
  fontSize: "14px",
  lineHeight: 1.2,
  maxWidth: "160px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const heroStatsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "12px",
  maxWidth: "760px",
};

const heroStatCardStyle: CSSProperties = {
  padding: "14px",
  borderRadius: "16px",
  background: "rgba(0,0,0,0.46)",
  border: "1px solid rgba(255,255,255,0.10)",
  backdropFilter: "blur(8px)",
};

const statLabelStyle: CSSProperties = {
  display: "block",
  fontSize: "12px",
  opacity: 0.72,
  marginBottom: "6px",
};

const statValueStyle: CSSProperties = {
  fontSize: "20px",
};

const layoutStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "280px minmax(0, 1fr) 300px",
  gap: "20px",
  alignItems: "start",
};

const boxStyle: CSSProperties = {
  background: "rgba(0, 0, 0, 0.45)",
  borderRadius: "16px",
  padding: "20px",
  backdropFilter: "blur(6px)",
  boxShadow: "0 0 20px rgba(0,0,0,0.4)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const boxTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "21px",
  fontWeight: 900,
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "16px",
  marginBottom: "18px",
  flexWrap: "wrap",
};

const sectionTextStyle: CSSProperties = {
  margin: "6px 0 0",
  fontSize: "13px",
  opacity: 0.72,
};

const quickActionsStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const infoListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  marginTop: "18px",
};

const infoCardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  borderRadius: "12px",
  padding: "12px",
  border: "1px solid rgba(255,255,255,0.08)",
};

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: "12px",
  opacity: 0.75,
  marginBottom: "5px",
};

const valueStyle: CSSProperties = {
  fontSize: "15px",
};

const buttonStyle: CSSProperties = {
  padding: "10px 12px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  fontWeight: "bold",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid rgba(255,255,255,0.08)",
};

const buttonBlueStyle: CSSProperties = {
  marginTop: "16px",
  padding: "12px 14px",
  borderRadius: "10px",
  background: "#2563eb",
  color: "white",
  fontWeight: "bold",
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "12px",
  marginBottom: "16px",
};

const miniStatStyle: CSSProperties = {
  padding: "14px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const miniStatValueStyle: CSSProperties = {
  display: "block",
  fontSize: "20px",
  marginBottom: "4px",
};

const miniStatDetailStyle: CSSProperties = {
  opacity: 0.65,
};

const deliveriesListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const deliveryCardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  borderRadius: "14px",
  padding: "16px",
  border: "1px solid rgba(255,255,255,0.08)",
};

const deliveryTopStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "center",
  marginBottom: "14px",
};

const driverLineStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  minWidth: 0,
};

const smallAvatarStyle: CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "999px",
  overflow: "hidden",
  background: "rgba(255,255,255,0.10)",
  border: "1px solid rgba(255,255,255,0.14)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const avatarStyle: CSSProperties = {
  width: "44px",
  height: "44px",
  borderRadius: "999px",
  overflow: "hidden",
  background: "rgba(255,255,255,0.10)",
  border: "1px solid rgba(255,255,255,0.14)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const avatarImageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const driverNameStyle: CSSProperties = {
  fontSize: "15px",
};

const miniTextStyle: CSSProperties = {
  fontSize: "12px",
  opacity: 0.68,
  marginTop: "2px",
};

const deliveryStatusStyle: CSSProperties = {
  fontSize: "12px",
  fontWeight: 900,
  padding: "7px 11px",
  borderRadius: "999px",
  whiteSpace: "nowrap",
};

const routeStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 34px 1fr",
  gap: "10px",
  alignItems: "center",
  padding: "12px",
  borderRadius: "14px",
  background: "rgba(0,0,0,0.24)",
  border: "1px solid rgba(255,255,255,0.07)",
  marginBottom: "12px",
};

const routeArrowStyle: CSSProperties = {
  textAlign: "center",
  fontSize: "20px",
  opacity: 0.75,
};

const deliveryBottomStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: "12px",
  alignItems: "end",
};

const deliveryActionStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  marginTop: "12px",
};

const smallButtonStyle: CSSProperties = {
  padding: "9px 12px",
  borderRadius: "10px",
  background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
  color: "black",
  fontWeight: 900,
  textDecoration: "none",
  fontSize: "13px",
};

const moneyStyle: CSSProperties = {
  color: "#86efac",
  fontSize: "16px",
};

const driversListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  maxHeight: "520px",
  overflowY: "auto",
  paddingRight: "4px",
  marginTop: "18px",
};

const driverCardStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "11px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const driverNameEllipsisStyle: CSSProperties = {
  fontWeight: 900,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const driverRoleStyle: CSSProperties = {
  fontSize: "12px",
  opacity: 0.72,
  marginTop: "3px",
};

const emptyCardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  borderRadius: "12px",
  padding: "14px",
  border: "1px solid rgba(255,255,255,0.08)",
  lineHeight: 1.6,
  opacity: 0.9,
};