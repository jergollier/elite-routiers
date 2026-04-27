import type { CSSProperties, ReactNode } from "react";
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

  if (!steamId) redirect("/");

  const user = await prisma.user.findUnique({
    where: { steamId },
    include: {
      memberships: {
        include: {
          entreprise: {
            include: {
              owner: true,
              membres: {
                include: { user: true },
                orderBy: { createdAt: "asc" },
              },
              livraisons: {
                include: { user: true },
                orderBy: { createdAt: "desc" },
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
      <div style={overlayStyle} />
      <div style={radialOverlayStyle} />

      <div style={pageStyle}>
        <div style={topButtonRowStyle}>
          <Link href="/societe" style={profileButtonStyle}>
            🏠 Accueil
          </Link>

          <Link href="/profil" style={secondaryTopButtonStyle}>
            👤 Profil
          </Link>
        </div>

        <section style={heroStyle}>
          <div style={heroLeftStyle}>
            <img
              src={entreprise.banniere || "/truck.jpg"}
              alt="Photo de la société"
              style={companyImageStyle}
            />

            <div>
              <div style={kickerStyle}>Elite Routiers • Société active</div>

              <h1 style={titleStyle}>{entreprise.nom}</h1>

              <p style={subtitleStyle}>
                [{entreprise.abreviation}] • {formatJeu(entreprise.jeu)} •{" "}
                {formatTypeTransport(entreprise.typeTransport)}
              </p>

              <div style={tagRowStyle}>
                <Tag>{formatRole(membership.role)}</Tag>
                <Tag>{entreprise.membres.length} chauffeur(s)</Tag>
                <Tag>{entreprise.livraisons.length} livraison(s)</Tag>
              </div>
            </div>
          </div>

          <div style={walletStyle}>
            <span style={walletLabelStyle}>Capital société</span>
            <strong style={walletValueStyle}>
              {(entreprise.argent ?? 0).toLocaleString("fr-FR")} €
            </strong>
            <span style={walletHintStyle}>Argent disponible</span>
          </div>
        </section>

        <section style={actionsStyle}>
          <Link href="/camions" style={cancelButtonStyle}>
            🚛 Camions
          </Link>

          <Link href="/remorques" style={cancelButtonStyle}>
            🚚 Remorques
          </Link>

          <Link href="/atelier" style={cancelButtonStyle}>
            🔧 Atelier
          </Link>

          <Link href="/livraisons" style={cancelButtonStyle}>
            📋 Livraisons
          </Link>

          <Link href="/finance" style={blueButtonStyle}>
            💶 Finance
          </Link>

          <Link href="/mon-entreprise/classement" style={cancelButtonStyle}>
            🏆 Classement
          </Link>

          {peutVoirBureau && (
            <Link
              href={`/entreprise/${entreprise.id}/gestion`}
              style={greenButtonStyle}
            >
              🏢 Ouvrir le bureau
            </Link>
          )}
        </section>

        <section style={panelStyle}>
          <div style={statsGridStyle}>
            <BigStat
              title="Capital société"
              value={`${(entreprise.argent ?? 0).toLocaleString("fr-FR")} €`}
              detail="Solde actuel"
              color="#22c55e"
              icon="💶"
            />

            <BigStat
              title="Chauffeurs"
              value={entreprise.membres.length.toString()}
              detail="Membres dans la société"
              color="#60a5fa"
              icon="👥"
            />

            <BigStat
              title="Livraisons récentes"
              value={entreprise.livraisons.length.toString()}
              detail="Dernières lignes affichées"
              color="#f59e0b"
              icon="📦"
            />

            <BigStat
              title="Terminées"
              value={livraisonsTerminees.toString()}
              detail="Sur les livraisons récentes"
              color="#86efac"
              icon="✅"
            />

            <BigStat
              title="Gains affichés"
              value={`${totalGainsLivraisons.toLocaleString("fr-FR")} €`}
              detail="Sur les 12 dernières lignes"
              color="#22c55e"
              icon="📈"
            />

            <BigStat
              title="Votre rôle"
              value={formatRole(membership.role)}
              detail="Accès dans la société"
              color="#93c5fd"
              icon="🪪"
            />
          </div>
        </section>

        <section style={mainGridStyle}>
          <aside style={panelStyle}>
            <Card title="🏢 Infos société">
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
            </Card>
          </aside>

          <section style={panelStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <h2 style={sectionTitleStyle}>🚚 Livraisons des chauffeurs</h2>
                <p style={sectionSubtitleStyle}>
                  Activité récente de la société.
                </p>
              </div>

              <span style={countStyle}>
                {entreprise.livraisons.length} ligne(s)
              </span>
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
              <Empty>Aucune livraison affichée pour le moment.</Empty>
            )}
          </section>

          <aside style={panelStyle}>
            <Card title="👥 Chauffeurs">
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
                        <div style={driverRoleStyle}>
                          {formatRole(membre.role)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <Empty>Aucun chauffeur dans la société.</Empty>
                )}
              </div>
            </Card>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={cardStyle}>
      <h3 style={cardTitleStyle}>{title}</h3>
      {children}
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return <span style={tagStyle}>{children}</span>;
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={infoCardStyle}>
      <span style={labelStyle}>{label}</span>
      <strong style={valueStyle}>{value}</strong>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <div style={emptyCardStyle}>{children}</div>;
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

const mainStyle: CSSProperties = {
  minHeight: "100vh",
  backgroundImage:
    "linear-gradient(180deg, rgba(3,7,18,0.15), rgba(3,7,18,0.55) 520px), url('/truck.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center top",
  backgroundAttachment: "fixed",
  color: "white",
  padding: "22px",
  position: "relative",
  fontFamily: "Arial, sans-serif",
};

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  pointerEvents: "none",
  background:
    "linear-gradient(135deg, rgba(3,7,18,0.25), rgba(8,13,28,0.20), rgba(3,7,18,0.35))",
  zIndex: 0,
};

const radialOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  pointerEvents: "none",
  background:
    "radial-gradient(circle at 52% 0%, rgba(245,158,11,0.16), transparent 34%), radial-gradient(circle at 80% 18%, rgba(37,99,235,0.12), transparent 25%)",
  zIndex: 0,
};

const pageStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  maxWidth: "1450px",
  margin: "0 auto",
  display: "grid",
  gap: "22px",
};

const topButtonRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
  flexWrap: "wrap",
};

const profileButtonStyle: CSSProperties = {
  color: "white",
  textDecoration: "none",
  fontWeight: 950,
  padding: "12px 18px",
  borderRadius: "999px",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  border: "1px solid rgba(147,197,253,0.45)",
  boxShadow: "0 0 24px rgba(37,99,235,0.34)",
  backdropFilter: "blur(12px)",
};

const secondaryTopButtonStyle: CSSProperties = {
  ...profileButtonStyle,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.18)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.25)",
};

const heroStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "25px",
  padding: "32px",
  borderRadius: "30px",
  background: "rgba(8,13,28,0.22)",
  border: "1px solid rgba(255,255,255,0.18)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.25)",
};

const heroLeftStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "22px",
  flexWrap: "wrap",
};

const companyImageStyle: CSSProperties = {
  width: "180px",
  height: "112px",
  borderRadius: "26px",
  objectFit: "cover",
  border: "1px solid rgba(147,197,253,0.26)",
  boxShadow: "0 0 30px rgba(37,99,235,0.22)",
  background: "rgba(255,255,255,0.08)",
};

const kickerStyle: CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  fontSize: "0.82rem",
  fontWeight: 950,
  color: "#60a5fa",
  textShadow: "0 4px 14px rgba(0,0,0,0.9)",
};

const titleStyle: CSSProperties = {
  margin: "8px 0 6px",
  fontSize: "3rem",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.05em",
  textShadow: "0 6px 24px rgba(0,0,0,0.95)",
};

const subtitleStyle: CSSProperties = {
  margin: "0 0 16px",
  color: "rgba(255,255,255,0.82)",
  fontWeight: 700,
};

const tagRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
};

const tagStyle: CSSProperties = {
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(37,99,235,0.16)",
  border: "1px solid rgba(96,165,250,0.28)",
  color: "#dbeafe",
  fontWeight: 900,
  fontSize: "0.85rem",
};

const walletStyle: CSSProperties = {
  minWidth: "270px",
  borderRadius: "22px",
  padding: "20px",
  background:
    "linear-gradient(135deg, rgba(34,197,94,0.20), rgba(34,197,94,0.07))",
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
  fontWeight: 900,
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
  fontWeight: 800,
};

const actionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "14px",
  padding: "18px",
  borderRadius: "20px",
  background: "rgba(8,13,28,0.25)",
  border: "1px solid rgba(255,255,255,0.18)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.25)",
  flexWrap: "wrap",
};

const cancelButtonStyle: CSSProperties = {
  textAlign: "center",
  padding: "13px 18px",
  borderRadius: "12px",
  color: "white",
  textDecoration: "none",
  fontWeight: 950,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.18)",
};

const blueButtonStyle: CSSProperties = {
  ...cancelButtonStyle,
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  border: "1px solid rgba(147,197,253,0.45)",
  boxShadow: "0 0 24px rgba(37,99,235,0.34)",
};

const greenButtonStyle: CSSProperties = {
  ...cancelButtonStyle,
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  border: "1px solid rgba(74,222,128,0.45)",
  boxShadow: "0 0 24px rgba(34,197,94,0.28)",
};

const panelStyle: CSSProperties = {
  padding: "18px",
  borderRadius: "26px",
  background: "rgba(8,13,28,0.25)",
  border: "1px solid rgba(255,255,255,0.18)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.25)",
};

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: "14px",
};

const bigStatStyle: CSSProperties = {
  padding: "18px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.22)",
};

const bigStatTopStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "12px",
};

const bigIconStyle: CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "13px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(37,99,235,0.16)",
  border: "1px solid rgba(96,165,250,0.25)",
};

const bigStatTitleStyle: CSSProperties = {
  color: "rgba(255,255,255,0.72)",
  fontWeight: 850,
};

const bigStatValueStyle: CSSProperties = {
  display: "block",
  fontSize: "25px",
  marginBottom: "6px",
  fontWeight: 950,
};

const bigStatDetailStyle: CSSProperties = {
  color: "rgba(255,255,255,0.62)",
  fontSize: "13px",
  fontWeight: 750,
};

const mainGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "290px minmax(0, 1fr) 310px",
  gap: "22px",
  alignItems: "start",
};

const cardStyle: CSSProperties = {
  padding: "20px",
  borderRadius: "20px",
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.12)",
};

const cardTitleStyle: CSSProperties = {
  margin: "0 0 18px",
  fontSize: "1.28rem",
  fontWeight: 950,
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
  alignItems: "flex-start",
  marginBottom: "18px",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "1.35rem",
  fontWeight: 950,
};

const sectionSubtitleStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "rgba(255,255,255,0.68)",
  fontWeight: 750,
};

const countStyle: CSSProperties = {
  color: "rgba(255,255,255,0.72)",
  fontSize: "13px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "999px",
  padding: "8px 12px",
  fontWeight: 900,
};

const infoCardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.075)",
  borderRadius: "12px",
  padding: "12px",
  border: "1px solid rgba(255,255,255,0.10)",
  marginBottom: "12px",
};

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: "12px",
  color: "rgba(255,255,255,0.68)",
  marginBottom: "5px",
  fontWeight: 800,
};

const valueStyle: CSSProperties = {
  fontSize: "15px",
  fontWeight: 950,
};

const deliveriesListStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
};

const deliveryCardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.055)",
  borderRadius: "18px",
  padding: "16px",
  border: "1px solid rgba(255,255,255,0.12)",
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
  fontWeight: 950,
};

const miniTextStyle: CSSProperties = {
  fontSize: "12px",
  color: "rgba(255,255,255,0.62)",
  marginTop: "2px",
  fontWeight: 750,
};

const deliveryStatusStyle: CSSProperties = {
  fontSize: "12px",
  fontWeight: 950,
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
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.09)",
  marginBottom: "12px",
};

const routeArrowStyle: CSSProperties = {
  textAlign: "center",
  fontSize: "20px",
  color: "rgba(255,255,255,0.75)",
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
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "white",
  fontWeight: 950,
  textDecoration: "none",
  fontSize: "13px",
  border: "1px solid rgba(147,197,253,0.45)",
};

const moneyStyle: CSSProperties = {
  color: "#86efac",
  fontSize: "16px",
  fontWeight: 950,
};

const driversListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  maxHeight: "620px",
  overflowY: "auto",
  paddingRight: "4px",
};

const driverCardStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "11px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.075)",
  border: "1px solid rgba(255,255,255,0.10)",
};

const driverNameEllipsisStyle: CSSProperties = {
  fontWeight: 950,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const driverRoleStyle: CSSProperties = {
  fontSize: "12px",
  color: "rgba(255,255,255,0.68)",
  marginTop: "3px",
  fontWeight: 750,
};

const emptyCardStyle: CSSProperties = {
  padding: "26px",
  borderRadius: "18px",
  textAlign: "center",
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "rgba(255,255,255,0.72)",
  fontWeight: 800,
  lineHeight: 1.6,
};