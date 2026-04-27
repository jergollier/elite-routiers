import type { CSSProperties, ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

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

function formatMoney(value: number | null | undefined) {
  return `${(value ?? 0).toLocaleString("fr-FR")} €`;
}

export default async function EntreprisePage({ params }: PageProps) {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) redirect("/");

  const { id } = await params;
  const entrepriseId = Number(id);

  if (!entrepriseId || Number.isNaN(entrepriseId)) notFound();

  const entreprise = await prisma.entreprise.findUnique({
    where: { id: entrepriseId },
    include: {
      owner: true,
      membres: {
        include: { user: true },
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: { membres: true },
      },
    },
  });

  if (!entreprise) notFound();

  const directeurs = entreprise.membres.filter(
    (membre) => membre.role === "DIRECTEUR"
  ).length;

  const sousDirecteurs = entreprise.membres.filter(
    (membre) => membre.role === "SOUS_DIRECTEUR"
  ).length;

  const chefsEquipe = entreprise.membres.filter(
    (membre) => membre.role === "CHEF_EQUIPE"
  ).length;

  const chefsAtelier = entreprise.membres.filter(
    (membre) => membre.role === "CHEF_ATELIER"
  ).length;

  const chauffeurs = entreprise.membres.filter(
    (membre) => membre.role === "CHAUFFEUR"
  ).length;

  const argentSociete = entreprise.argent ?? 0;

  return (
    <main style={mainStyle}>
      <div style={overlayStyle} />
      <div style={radialOverlayStyle} />

      <div style={pageStyle}>
        <div style={topButtonRowStyle}>
          <Link href="/societe" style={profileButtonStyle}>
            ← Retour
          </Link>

          {entreprise.recrutement ? (
            <Link
              href={`/entreprise/${entreprise.id}/postuler`}
              style={greenButtonStyle}
            >
              Postuler
            </Link>
          ) : (
            <span style={closedButtonStyle}>Recrutement fermé</span>
          )}
        </div>

        <section style={heroStyle}>
          <div style={heroLeftStyle}>
            <img
              src={entreprise.banniere || "/truck.jpg"}
              alt="Bannière entreprise"
              style={companyImageStyle}
            />

            <div>
              <div style={kickerStyle}>Elite Routiers • Fiche société</div>

              <h1 style={titleStyle}>{entreprise.nom}</h1>

              <p style={subtitleStyle}>
                [{entreprise.abreviation}] •{" "}
                {entreprise.jeu || "Jeu non renseigné"} •{" "}
                {entreprise.typeTransport || "Transport non renseigné"}
              </p>

              <div style={tagRowStyle}>
                <Tag>{entreprise._count.membres} membre(s)</Tag>
                <Tag>{entreprise.owner?.username || "Directeur inconnu"}</Tag>
                <Tag>
                  {entreprise.recrutement
                    ? "Recrutement ouvert"
                    : "Recrutement fermé"}
                </Tag>
              </div>
            </div>
          </div>

          <div
            style={{
              ...walletStyle,
              background: entreprise.recrutement
                ? "linear-gradient(135deg, rgba(34,197,94,0.20), rgba(34,197,94,0.07))"
                : "linear-gradient(135deg, rgba(239,68,68,0.20), rgba(239,68,68,0.07))",
              border: entreprise.recrutement
                ? "1px solid rgba(34,197,94,0.28)"
                : "1px solid rgba(239,68,68,0.28)",
              boxShadow: entreprise.recrutement
                ? "0 0 24px rgba(34,197,94,0.18)"
                : "0 0 24px rgba(239,68,68,0.18)",
            }}
          >
            <span style={walletLabelStyle}>Recrutement</span>
            <strong
              style={{
                ...walletValueStyle,
                color: entreprise.recrutement ? "#22c55e" : "#ef4444",
              }}
            >
              {entreprise.recrutement ? "Ouvert" : "Fermé"}
            </strong>
            <span style={walletHintStyle}>Candidatures société</span>
          </div>
        </section>

        <section style={panelStyle}>
          <div style={statsGridStyle}>
            <BigStat
              title="Argent société"
              value={formatMoney(argentSociete)}
              detail="Capital actuel"
              color="#22c55e"
              icon="💶"
            />

            <BigStat
              title="Membres"
              value={entreprise._count.membres.toString()}
              detail="Chauffeurs inscrits"
              color="#60a5fa"
              icon="👥"
            />

            <BigStat
              title="Directeur"
              value={entreprise.owner?.username || "Inconnu"}
              detail="Fondateur / responsable"
              color="#93c5fd"
              icon="👑"
            />

            <BigStat
              title="Transport"
              value={entreprise.typeTransport || "Non renseigné"}
              detail="Spécialité"
              color="#f59e0b"
              icon="🚚"
            />
          </div>
        </section>

        <section style={mainGridStyle}>
          <section style={contentColumnStyle}>
            <Panel title="📄 Présentation de la société">
              <p style={descriptionStyle}>
                {entreprise.description?.trim()
                  ? entreprise.description
                  : "Cette société n’a pas encore ajouté de présentation."}
              </p>
            </Panel>

            <Panel title="🪪 Répartition des rôles">
              <div style={rolesGridStyle}>
                <RoleStat label="Directeurs" value={directeurs} />
                <RoleStat label="Sous-directeurs" value={sousDirecteurs} />
                <RoleStat label="Chefs d’équipe" value={chefsEquipe} />
                <RoleStat label="Chefs d’atelier" value={chefsAtelier} />
                <RoleStat label="Chauffeurs" value={chauffeurs} />
              </div>
            </Panel>

            <Panel title="👥 Membres de la société">
              {entreprise.membres.length > 0 ? (
                <div style={membersGridStyle}>
                  {entreprise.membres.map((membre) => (
                    <div key={membre.id} style={memberCardStyle}>
                      <div style={memberLeftStyle}>
                        <img
                          src={membre.user.avatar || "/truck.jpg"}
                          alt={membre.user.username || "Chauffeur"}
                          style={avatarStyle}
                        />

                        <div style={{ minWidth: 0 }}>
                          <div style={memberNameStyle}>
                            {membre.user.username || "Chauffeur sans pseudo"}
                          </div>

                          <div style={memberRoleSmallStyle}>
                            {formatRole(membre.role)}
                          </div>
                        </div>
                      </div>

                      <span style={roleBadgeStyle}>
                        {formatRole(membre.role)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty>Aucun membre dans cette société pour le moment.</Empty>
              )}
            </Panel>
          </section>

          <aside style={sideColumnStyle}>
            <Panel title="ℹ️ Infos rapides">
              <InfoLine label="Nom" value={entreprise.nom} />
              <InfoLine label="Abréviation" value={`[${entreprise.abreviation}]`} />
              <InfoLine
                label="Directeur"
                value={entreprise.owner?.username || "Utilisateur Steam"}
              />
              <InfoLine
                label="Ville ETS2"
                value={entreprise.villeETS2 || "Non renseignée"}
              />
              <InfoLine
                label="Ville ATS"
                value={entreprise.villeATS || "Non renseignée"}
              />
              <InfoLine label="Jeu" value={entreprise.jeu || "Non renseigné"} />
              <InfoLine
                label="Recrutement"
                value={entreprise.recrutement ? "Ouvert" : "Fermé"}
                color={entreprise.recrutement ? "#22c55e" : "#ef4444"}
              />
            </Panel>

            <Panel title="🚛 Rejoindre cette société">
              <p style={smallTextStyle}>
                Regarde rapidement l’argent, les membres, le style de transport
                et les infos générales avant d’envoyer ta candidature.
              </p>

              <div style={{ marginTop: "16px" }}>
                {entreprise.recrutement ? (
                  <Link
                    href={`/entreprise/${entreprise.id}/postuler`}
                    style={greenFullButtonStyle}
                  >
                    Postuler maintenant
                  </Link>
                ) : (
                  <div style={closedFullButtonStyle}>Recrutement fermé</div>
                )}
              </div>
            </Panel>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return <span style={tagStyle}>{children}</span>;
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={panelStyle}>
      <h2 style={sectionTitleStyle}>{title}</h2>
      {children}
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <div style={emptyStyle}>{children}</div>;
}

function RoleStat({ label, value }: { label: string; value: number }) {
  return (
    <div style={roleStatStyle}>
      <strong style={roleStatNumberStyle}>{value}</strong>
      <span style={roleStatLabelStyle}>{label}</span>
    </div>
  );
}

function InfoLine({
  label,
  value,
  color = "white",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div style={infoLineStyle}>
      <span style={infoLabelStyle}>{label}</span>
      <strong style={{ ...infoValueStyle, color }}>{value}</strong>
    </div>
  );
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

const greenButtonStyle: CSSProperties = {
  ...profileButtonStyle,
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  border: "1px solid rgba(74,222,128,0.45)",
  boxShadow: "0 0 24px rgba(34,197,94,0.28)",
};

const closedButtonStyle: CSSProperties = {
  color: "rgba(255,255,255,0.72)",
  fontWeight: 950,
  padding: "12px 18px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.18)",
  backdropFilter: "blur(12px)",
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
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
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
  marginTop: "8px",
};

const walletHintStyle: CSSProperties = {
  opacity: 0.7,
  fontSize: "13px",
  marginTop: "6px",
  fontWeight: 800,
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
  gridTemplateColumns: "minmax(0, 1fr) 330px",
  gap: "22px",
  alignItems: "start",
};

const contentColumnStyle: CSSProperties = {
  display: "grid",
  gap: "22px",
};

const sideColumnStyle: CSSProperties = {
  display: "grid",
  gap: "22px",
};

const sectionTitleStyle: CSSProperties = {
  margin: "0 0 18px",
  fontSize: "1.35rem",
  fontWeight: 950,
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  lineHeight: 1.8,
  color: "rgba(255,255,255,0.86)",
  whiteSpace: "pre-wrap",
  fontWeight: 750,
};

const rolesGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "14px",
};

const roleStatStyle: CSSProperties = {
  background: "rgba(255,255,255,0.075)",
  borderRadius: "16px",
  padding: "18px 14px",
  border: "1px solid rgba(255,255,255,0.10)",
  textAlign: "center",
};

const roleStatNumberStyle: CSSProperties = {
  display: "block",
  fontSize: "28px",
  fontWeight: 950,
  marginBottom: "8px",
};

const roleStatLabelStyle: CSSProperties = {
  fontSize: "13px",
  color: "rgba(255,255,255,0.72)",
  fontWeight: 800,
};

const membersGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))",
  gap: "14px",
};

const memberCardStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  padding: "14px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.075)",
  border: "1px solid rgba(255,255,255,0.10)",
};

const memberLeftStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  minWidth: 0,
  flex: 1,
};

const avatarStyle: CSSProperties = {
  width: "48px",
  height: "48px",
  borderRadius: "50%",
  objectFit: "cover",
  border: "1px solid rgba(255,255,255,0.15)",
  flexShrink: 0,
};

const memberNameStyle: CSSProperties = {
  fontWeight: 950,
  fontSize: "15px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const memberRoleSmallStyle: CSSProperties = {
  fontSize: "13px",
  color: "rgba(255,255,255,0.72)",
  marginTop: "4px",
  fontWeight: 750,
};

const roleBadgeStyle: CSSProperties = {
  padding: "7px 10px",
  borderRadius: "999px",
  background: "rgba(37,99,235,0.16)",
  border: "1px solid rgba(96,165,250,0.25)",
  color: "#dbeafe",
  fontSize: "12px",
  fontWeight: 950,
  flexShrink: 0,
};

const infoLineStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "11px 0",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const infoLabelStyle: CSSProperties = {
  color: "rgba(255,255,255,0.68)",
  fontWeight: 800,
};

const infoValueStyle: CSSProperties = {
  fontWeight: 950,
  textAlign: "right",
};

const smallTextStyle: CSSProperties = {
  margin: 0,
  lineHeight: 1.6,
  color: "rgba(255,255,255,0.82)",
  fontWeight: 750,
};

const greenFullButtonStyle: CSSProperties = {
  display: "block",
  textAlign: "center",
  padding: "13px",
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  border: "1px solid rgba(74,222,128,0.45)",
  boxShadow: "0 0 24px rgba(34,197,94,0.28)",
  borderRadius: "12px",
  color: "white",
  textDecoration: "none",
  fontWeight: 950,
};

const closedFullButtonStyle: CSSProperties = {
  display: "block",
  textAlign: "center",
  padding: "13px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: "12px",
  color: "rgba(255,255,255,0.72)",
  fontWeight: 950,
};

const emptyStyle: CSSProperties = {
  padding: "26px",
  borderRadius: "18px",
  textAlign: "center",
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "rgba(255,255,255,0.72)",
  fontWeight: 800,
  lineHeight: 1.6,
};