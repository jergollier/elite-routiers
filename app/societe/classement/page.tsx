export const dynamic = "force-dynamic";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

function formatMoney(value: number) {
  return `${value.toLocaleString("fr-FR")} €`;
}

function getRankColor(rank: number) {
  if (rank === 1) return "#facc15";
  if (rank === 2) return "#cbd5e1";
  if (rank === 3) return "#d97706";
  return "#ffffff";
}

export default async function ClassementGlobalPage() {
  const entreprises = await prisma.entreprise.findMany({
    include: {
      _count: {
        select: {
          membres: true,
          camions: true,
        },
      },
    },
    orderBy: {
      argent: "desc",
    },
  });

  const topThree = entreprises.slice(0, 3);

  const totalEntreprises = entreprises.length;
  const totalArgent = entreprises.reduce(
    (sum, entreprise) => sum + entreprise.argent,
    0
  );
  const totalCamions = entreprises.reduce(
    (sum, entreprise) => sum + entreprise._count.camions,
    0
  );
  const totalMembres = entreprises.reduce(
    (sum, entreprise) => sum + entreprise._count.membres,
    0
  );

  return (
    <main style={mainStyle}>
      <div style={overlayStyle} />
      <div style={radialOverlayStyle} />

      <div style={pageStyle}>
        <div style={topButtonRowStyle}>
          <Link href="/societe" style={profileButtonStyle}>
            ← Retour aux sociétés
          </Link>
        </div>

        <section style={heroStyle}>
          <div>
            <div style={kickerStyle}>Elite Routiers • Classement</div>

            <h1 style={titleStyle}>Classement des entreprises</h1>

            <p style={subtitleStyle}>
              Retrouve les meilleures sociétés selon leur argent, leur taille
              et leur flotte.
            </p>

            <div style={tagRowStyle}>
              <Tag>{totalEntreprises} entreprise{totalEntreprises > 1 ? "s" : ""}</Tag>
              <Tag>{totalCamions} camion{totalCamions > 1 ? "s" : ""}</Tag>
              <Tag>{totalMembres} membre{totalMembres > 1 ? "s" : ""}</Tag>
            </div>
          </div>

          <div style={walletStyle}>
            <span style={walletLabelStyle}>Argent cumulé</span>
            <strong style={walletValueStyle}>{formatMoney(totalArgent)}</strong>
            <span style={walletHintStyle}>Toutes sociétés confondues</span>
          </div>
        </section>

        <section style={panelStyle}>
          <div style={statsGridStyle}>
            <BigStat
              title="Entreprises"
              value={totalEntreprises.toString()}
              detail="Sociétés inscrites"
              color="#60a5fa"
              icon="🏢"
            />

            <BigStat
              title="Argent cumulé"
              value={formatMoney(totalArgent)}
              detail="Total global"
              color="#22c55e"
              icon="💰"
            />

            <BigStat
              title="Camions enregistrés"
              value={totalCamions.toString()}
              detail="Flotte totale"
              color="#f59e0b"
              icon="🚚"
            />

            <BigStat
              title="Membres totaux"
              value={totalMembres.toString()}
              detail="Chauffeurs inscrits"
              color="#93c5fd"
              icon="👥"
            />
          </div>
        </section>

        {topThree.length > 0 && (
          <section style={panelStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <h2 style={sectionTitleStyle}>🏆 Podium des meilleures entreprises</h2>
                <p style={sectionSubtitleStyle}>
                  Les trois sociétés les mieux classées par argent.
                </p>
              </div>
            </div>

            <div style={podiumGridStyle}>
              {topThree.map((entreprise, index) => {
                const rank = index + 1;
                const accent = getRankColor(rank);

                return (
                  <article
                    key={entreprise.id}
                    style={{
                      ...podiumCardStyle,
                      border: `1px solid ${accent}55`,
                    }}
                  >
                    <div style={{ ...podiumLineStyle, background: accent }} />

                    <div
                      style={{
                        ...rankBadgeStyle,
                        background: `${accent}22`,
                        border: `1px solid ${accent}66`,
                        color: accent,
                      }}
                    >
                      {rank}
                    </div>

                    <h3 style={podiumNameStyle}>{entreprise.nom}</h3>

                    <div style={podiumMoneyStyle}>
                      {formatMoney(entreprise.argent)}
                    </div>

                    <div style={miniGridStyle}>
                      <MiniBox label="Membres" value={entreprise._count.membres.toString()} />
                      <MiniBox label="Camions" value={entreprise._count.camions.toString()} />
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <section style={panelStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>📋 Classement général</h2>
              <p style={sectionSubtitleStyle}>
                Tableau complet des sociétés Elite Routiers.
              </p>
            </div>

            <span style={countStyle}>{entreprises.length} ligne(s)</span>
          </div>

          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <colgroup>
                <col style={{ width: "90px" }} />
                <col style={{ width: "auto" }} />
                <col style={{ width: "220px" }} />
                <col style={{ width: "150px" }} />
                <col style={{ width: "150px" }} />
              </colgroup>

              <thead>
                <tr>
                  <th style={{ ...thStyle, textAlign: "center" }}>#</th>
                  <th style={{ ...thStyle, textAlign: "left" }}>Entreprise</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Argent</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Membres</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Camions</th>
                </tr>
              </thead>

              <tbody>
                {entreprises.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={emptyTableStyle}>
                      Aucune entreprise trouvée.
                    </td>
                  </tr>
                ) : (
                  entreprises.map((entreprise, index) => {
                    const rank = index + 1;
                    const rankColor = getRankColor(rank);

                    return (
                      <tr key={entreprise.id} style={trStyle}>
                        <td
                          style={{
                            ...tdStyle,
                            textAlign: "center",
                            fontWeight: 950,
                            color: rank <= 3 ? rankColor : "white",
                            fontSize: "18px",
                          }}
                        >
                          {rank}
                        </td>

                        <td style={tdStyle}>
                          <div style={companyCellStyle}>
                            <strong style={companyNameStyle}>
                              {entreprise.nom}
                            </strong>

                            <span style={companySubStyle}>
                              Société Elite Routiers
                            </span>
                          </div>
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            textAlign: "center",
                            fontWeight: 950,
                            color: "#86efac",
                          }}
                        >
                          {formatMoney(entreprise.argent)}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            textAlign: "center",
                            fontWeight: 850,
                          }}
                        >
                          {entreprise._count.membres}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            textAlign: "center",
                            fontWeight: 850,
                          }}
                        >
                          {entreprise._count.camions}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return <span style={tagStyle}>{children}</span>;
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

function MiniBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={miniBoxStyle}>
      <span style={miniLabelStyle}>{label}</span>
      <strong style={miniValueStyle}>{value}</strong>
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
  maxWidth: "1250px",
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
  maxWidth: "760px",
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

const podiumGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "18px",
};

const podiumCardStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  padding: "22px",
  borderRadius: "20px",
  background: "rgba(255,255,255,0.055)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.22)",
};

const podiumLineStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "4px",
};

const rankBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "46px",
  height: "46px",
  borderRadius: "999px",
  fontWeight: 950,
  fontSize: "20px",
  marginBottom: "16px",
};

const podiumNameStyle: CSSProperties = {
  margin: "0 0 8px",
  fontSize: "1.6rem",
  fontWeight: 950,
  lineHeight: 1.2,
};

const podiumMoneyStyle: CSSProperties = {
  fontSize: "1.5rem",
  fontWeight: 950,
  color: "#86efac",
  marginBottom: "16px",
};

const miniGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "12px",
};

const miniBoxStyle: CSSProperties = {
  padding: "14px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.075)",
  border: "1px solid rgba(255,255,255,0.10)",
};

const miniLabelStyle: CSSProperties = {
  display: "block",
  fontSize: "13px",
  color: "rgba(255,255,255,0.66)",
  marginBottom: "6px",
  fontWeight: 800,
};

const miniValueStyle: CSSProperties = {
  fontSize: "20px",
  fontWeight: 950,
};

const tableWrapperStyle: CSSProperties = {
  overflowX: "auto",
  borderRadius: "18px",
  border: "1px solid rgba(255,255,255,0.10)",
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "980px",
  background: "rgba(255,255,255,0.035)",
};

const thStyle: CSSProperties = {
  padding: "14px 12px",
  fontSize: "14px",
  borderBottom: "1px solid rgba(255,255,255,0.12)",
  color: "rgba(255,255,255,0.78)",
  fontWeight: 950,
  whiteSpace: "nowrap",
};

const tdStyle: CSSProperties = {
  padding: "14px 12px",
  verticalAlign: "middle",
  color: "rgba(255,255,255,0.86)",
};

const trStyle: CSSProperties = {
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const companyCellStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const companyNameStyle: CSSProperties = {
  fontSize: "18px",
  fontWeight: 950,
};

const companySubStyle: CSSProperties = {
  fontSize: "13px",
  color: "rgba(255,255,255,0.62)",
  fontWeight: 750,
};

const emptyTableStyle: CSSProperties = {
  padding: "28px",
  textAlign: "center",
  color: "rgba(255,255,255,0.72)",
  fontWeight: 850,
};