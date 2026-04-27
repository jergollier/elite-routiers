import type { CSSProperties, ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

function formatMoney(value: number) {
  return `${value.toLocaleString("fr-FR")} €`;
}

function formatKm(value: number) {
  return `${value.toLocaleString("fr-FR")} km`;
}

type ClassementRow = {
  userId: string;
  username: string;
  avatar: string | null;
  role: string;
  argentGagne: number;
  kilometres: number;
  infractions: number;
  accidents: number;
  livraisons: number;
  scoreTotal: number;
};

type InfoPanelEntreprise = {
  nom: string;
  jeu: string;
  typeTransport: string;
  owner: {
    username: string | null;
  };
  _count: {
    membres: number;
  };
};

export default async function ClassementInternePage() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) redirect("/");

  const user = await prisma.user.findUnique({
    where: { steamId },
  });

  if (!user) redirect("/");

  const membership = await prisma.entrepriseMembre.findUnique({
    where: { userId: user.id },
  });

  if (!membership) redirect("/societe");

  const entreprise = await prisma.entreprise.findUnique({
    where: { id: membership.entrepriseId },
    include: {
      owner: true,
      _count: {
        select: {
          membres: true,
          camions: true,
        },
      },
      membres: {
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      chauffeurStats: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!entreprise) notFound();

  const classement: ClassementRow[] = entreprise.membres.map((membre) => {
    const stats = entreprise.chauffeurStats.find(
      (stat) => stat.userId === membre.userId
    );

    const argentGagne = stats?.argentGagne ?? 0;
    const kilometres = stats?.kilometres ?? 0;
    const infractions = stats?.infractions ?? 0;
    const accidents = stats?.accidents ?? 0;
    const livraisons = stats?.livraisons ?? 0;

    const scoreTotal =
      Math.floor(argentGagne / 1000) +
      Math.floor(kilometres / 100) +
      livraisons * 50 -
      infractions * 20 -
      accidents * 50;

    return {
      userId: membre.userId,
      username: membre.user.username || "Utilisateur Steam",
      avatar: membre.user.avatar || null,
      role: membre.role,
      argentGagne,
      kilometres,
      infractions,
      accidents,
      livraisons,
      scoreTotal,
    };
  });

  const topGeneral = [...classement].sort((a, b) => b.scoreTotal - a.scoreTotal);
  const topArgent = [...classement].sort((a, b) => b.argentGagne - a.argentGagne);
  const topKilometres = [...classement].sort((a, b) => b.kilometres - a.kilometres);
  const topInfractions = [...classement].sort((a, b) => b.infractions - a.infractions);
  const topAccidents = [...classement].sort((a, b) => b.accidents - a.accidents);

  const totalArgent = classement.reduce((sum, row) => sum + row.argentGagne, 0);
  const totalKm = classement.reduce((sum, row) => sum + row.kilometres, 0);
  const totalLivraisons = classement.reduce((sum, row) => sum + row.livraisons, 0);

  const podium = topGeneral.slice(0, 3);

  return (
    <main style={mainStyle}>
      <div style={overlayStyle} />
      <div style={radialOverlayStyle} />

      <div style={pageStyle}>
        <div style={topButtonRowStyle}>
          <Link href="/mon-entreprise" style={profileButtonStyle}>
            ← Retour entreprise
          </Link>

          <Link href="/societe" style={secondaryTopButtonStyle}>
            🏠 Accueil
          </Link>
        </div>

        <section style={heroStyle}>
          <div style={heroLeftStyle}>
            <img
              src={entreprise.banniere || "/truck.jpg"}
              alt="Bannière entreprise"
              style={companyImageStyle}
            />

            <div>
              <div style={kickerStyle}>Elite Routiers • Classement interne</div>

              <h1 style={titleStyle}>
                {entreprise.nom}{" "}
                <span style={abbrStyle}>[{entreprise.abreviation}]</span>
              </h1>

              <p style={subtitleStyle}>
                {formatJeu(entreprise.jeu)} •{" "}
                {formatTypeTransport(entreprise.typeTransport)} • Directeur :{" "}
                {entreprise.owner.username || "Utilisateur Steam"}
              </p>

              <div style={tagRowStyle}>
                <Tag>{entreprise._count.membres} membre(s)</Tag>
                <Tag>{entreprise._count.camions} camion(s)</Tag>
                <Tag>{totalLivraisons} livraison(s)</Tag>
              </div>
            </div>
          </div>

          <div style={walletStyle}>
            <span style={walletLabelStyle}>Meilleur score</span>
            <strong style={walletValueStyle}>
              {topGeneral[0]?.scoreTotal.toString() || "0"}
            </strong>
            <span style={walletHintStyle}>
              {topGeneral[0]?.username || "Aucun chauffeur"}
            </span>
          </div>
        </section>

        <section style={panelStyle}>
          <div style={statsGridStyle}>
            <BigStat
              title="Argent total gagné"
              value={formatMoney(totalArgent)}
              detail="Par les chauffeurs"
              color="#22c55e"
              icon="💶"
            />

            <BigStat
              title="Distance totale"
              value={formatKm(totalKm)}
              detail="Parcourue en mission"
              color="#60a5fa"
              icon="🛣️"
            />

            <BigStat
              title="Livraisons terminées"
              value={totalLivraisons.toString()}
              detail="Toutes périodes"
              color="#f59e0b"
              icon="📦"
            />

            <BigStat
              title="Meilleur score"
              value={topGeneral[0]?.scoreTotal.toString() || "0"}
              detail={topGeneral[0]?.username || "Aucun chauffeur"}
              color="#fcd34d"
              icon="🏆"
            />
          </div>
        </section>

        <section style={panelStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>🏆 Podium des chauffeurs</h2>
              <p style={sectionSubtitleStyle}>
                Les meilleurs chauffeurs selon le score global de la société.
              </p>
            </div>

            <span style={countStyle}>{podium.length} chauffeur(s)</span>
          </div>

          <div style={podiumGridStyle}>
            {podium.length > 0 ? (
              podium.map((chauffeur, index) => (
                <PodiumCard
                  key={chauffeur.userId}
                  chauffeur={chauffeur}
                  rank={index + 1}
                />
              ))
            ) : (
              <Empty>Aucun chauffeur à afficher.</Empty>
            )}
          </div>
        </section>

        <section style={mainGridStyle}>
          <section style={panelStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <h2 style={sectionTitleStyle}>📋 Classement général</h2>
                <p style={sectionSubtitleStyle}>
                  Score calculé avec argent, kilomètres, livraisons,
                  infractions et accidents.
                </p>
              </div>

              <span style={countStyle}>{topGeneral.length} ligne(s)</span>
            </div>

            <div style={tableWrapperStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Rang</th>
                    <th style={thStyle}>Chauffeur</th>
                    <th style={thStyle}>Rôle</th>
                    <th style={thStyle}>Score</th>
                    <th style={thStyle}>Argent</th>
                    <th style={thStyle}>Km</th>
                    <th style={thStyle}>Livraisons</th>
                    <th style={thStyle}>Infractions</th>
                    <th style={thStyle}>Accidents</th>
                  </tr>
                </thead>

                <tbody>
                  {topGeneral.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={emptyTdStyle}>
                        Aucun chauffeur trouvé.
                      </td>
                    </tr>
                  ) : (
                    topGeneral.map((chauffeur, index) => (
                      <tr key={chauffeur.userId} style={trStyle}>
                        <td style={tdStyle}>
                          <strong>#{index + 1}</strong>
                        </td>

                        <td style={tdStyle}>
                          <div style={driverCellStyle}>
                            <Avatar src={chauffeur.avatar} />
                            <strong>{chauffeur.username}</strong>
                          </div>
                        </td>

                        <td style={tdStyle}>{formatRole(chauffeur.role)}</td>
                        <td style={tdScoreStyle}>{chauffeur.scoreTotal}</td>
                        <td style={tdMoneyStyle}>
                          {formatMoney(chauffeur.argentGagne)}
                        </td>
                        <td style={tdStyle}>{formatKm(chauffeur.kilometres)}</td>
                        <td style={tdStyle}>{chauffeur.livraisons}</td>
                        <td style={tdWarningStyle}>{chauffeur.infractions}</td>
                        <td style={tdDangerStyle}>{chauffeur.accidents}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <aside style={sideColumnStyle}>
            <InfoPanel entreprise={entreprise} />

            {topGeneral[0] && (
              <Card title="⭐ Meilleur chauffeur">
                <div style={bestDriverStyle}>
                  <Avatar src={topGeneral[0].avatar} size={58} />

                  <div>
                    <strong style={{ fontSize: "17px" }}>
                      {topGeneral[0].username}
                    </strong>
                    <div style={smallTextStyle}>
                      {formatRole(topGeneral[0].role)}
                    </div>
                  </div>
                </div>

                <InfoLine label="Score" value={topGeneral[0].scoreTotal.toString()} />
                <InfoLine label="Argent" value={formatMoney(topGeneral[0].argentGagne)} />
                <InfoLine label="Kilomètres" value={formatKm(topGeneral[0].kilometres)} />
              </Card>
            )}
          </aside>
        </section>

        <section style={cardsGridStyle}>
          <RankingMiniTable
            title="💶 Top argent gagné"
            rows={topArgent}
            valueKey="argentGagne"
            formatValue={formatMoney}
          />

          <RankingMiniTable
            title="🛣️ Top kilomètres"
            rows={topKilometres}
            valueKey="kilometres"
            formatValue={formatKm}
          />

          <RankingMiniTable
            title="⚠️ Plus d’infractions"
            rows={topInfractions}
            valueKey="infractions"
            formatValue={(value) => String(value)}
          />

          <RankingMiniTable
            title="💥 Plus d’accidents"
            rows={topAccidents}
            valueKey="accidents"
            formatValue={(value) => String(value)}
          />
        </section>
      </div>
    </main>
  );
}

function Avatar({ src, size = 40 }: { src: string | null; size?: number }) {
  return (
    <div
      style={{
        ...avatarStyle,
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      {src ? (
        <img src={src} alt="Avatar chauffeur" style={avatarImageStyle} />
      ) : (
        <span>?</span>
      )}
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return <span style={tagStyle}>{children}</span>;
}

function Empty({ children }: { children: ReactNode }) {
  return <div style={emptyCardStyle}>{children}</div>;
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={cardStyle}>
      <h3 style={cardTitleStyle}>{title}</h3>
      {children}
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={infoLineStyle}>
      <span style={labelStyle}>{label}</span>
      <strong>{value}</strong>
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

function PodiumCard({
  chauffeur,
  rank,
}: {
  chauffeur: ClassementRow;
  rank: number;
}) {
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";

  return (
    <article
      style={{
        ...podiumCardStyle,
        transform: rank === 1 ? "translateY(-8px)" : "none",
      }}
    >
      <div style={podiumRankStyle}>{medal}</div>

      <Avatar src={chauffeur.avatar} size={64} />

      <h3 style={podiumNameStyle}>{chauffeur.username}</h3>

      <div style={smallTextStyle}>{formatRole(chauffeur.role)}</div>

      <div style={podiumScoreStyle}>{chauffeur.scoreTotal}</div>

      <div style={smallTextStyle}>points</div>

      <div style={podiumDetailsStyle}>
        <span>{formatMoney(chauffeur.argentGagne)}</span>
        <span>{formatKm(chauffeur.kilometres)}</span>
      </div>
    </article>
  );
}

function InfoPanel({ entreprise }: { entreprise: InfoPanelEntreprise }) {
  return (
    <Card title="ℹ️ Infos rapides">
      <InfoLine label="Entreprise" value={entreprise.nom} />
      <InfoLine
        label="Directeur"
        value={entreprise.owner.username || "Utilisateur Steam"}
      />
      <InfoLine label="Jeu" value={formatJeu(entreprise.jeu)} />
      <InfoLine label="Transport" value={formatTypeTransport(entreprise.typeTransport)} />
      <InfoLine label="Membres" value={entreprise._count.membres.toString()} />
    </Card>
  );
}

function RankingMiniTable({
  title,
  rows,
  valueKey,
  formatValue,
}: {
  title: string;
  rows: ClassementRow[];
  valueKey: "argentGagne" | "kilometres" | "infractions" | "accidents";
  formatValue: (value: number) => string;
}) {
  return (
    <section style={panelStyle}>
      <Card title={title}>
        <div style={miniRankingListStyle}>
          {rows.length === 0 ? (
            <Empty>Aucun chauffeur trouvé.</Empty>
          ) : (
            rows.slice(0, 5).map((chauffeur, index) => (
              <div
                key={`${valueKey}-${chauffeur.userId}`}
                style={miniRankingRowStyle}
              >
                <div style={miniRankStyle}>#{index + 1}</div>

                <Avatar src={chauffeur.avatar} size={36} />

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={miniDriverNameStyle}>{chauffeur.username}</div>
                  <div style={smallTextStyle}>{formatRole(chauffeur.role)}</div>
                </div>

                <strong style={miniValueStyle}>
                  {formatValue(chauffeur[valueKey])}
                </strong>
              </div>
            ))
          )}
        </div>
      </Card>
    </section>
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

const abbrStyle: CSSProperties = {
  color: "#93c5fd",
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
    "linear-gradient(135deg, rgba(245,158,11,0.20), rgba(245,158,11,0.07))",
  border: "1px solid rgba(245,158,11,0.28)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  boxShadow: "0 0 24px rgba(245,158,11,0.18)",
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
  color: "#fcd34d",
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
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "16px",
};

const podiumCardStyle: CSSProperties = {
  padding: "20px",
  borderRadius: "20px",
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.12)",
  textAlign: "center",
  boxShadow: "0 18px 45px rgba(0,0,0,0.22)",
};

const podiumRankStyle: CSSProperties = {
  fontSize: "34px",
  marginBottom: "8px",
};

const podiumNameStyle: CSSProperties = {
  margin: "12px 0 4px",
  fontSize: "19px",
  fontWeight: 950,
};

const podiumScoreStyle: CSSProperties = {
  marginTop: "12px",
  fontSize: "34px",
  fontWeight: 950,
  color: "#fcd34d",
};

const podiumDetailsStyle: CSSProperties = {
  marginTop: "14px",
  display: "flex",
  justifyContent: "center",
  gap: "10px",
  flexWrap: "wrap",
  fontSize: "12px",
  color: "rgba(255,255,255,0.78)",
};

const mainGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 330px",
  gap: "22px",
  alignItems: "start",
};

const sideColumnStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const cardStyle: CSSProperties = {
  padding: "20px",
  borderRadius: "20px",
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.12)",
};

const cardTitleStyle: CSSProperties = {
  margin: "0 0 18px",
  fontSize: "1.18rem",
  fontWeight: 950,
};

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: "12px",
  color: "rgba(255,255,255,0.68)",
  marginBottom: "5px",
  fontWeight: 800,
};

const smallTextStyle: CSSProperties = {
  margin: 0,
  fontSize: "12px",
  color: "rgba(255,255,255,0.68)",
  fontWeight: 750,
};

const infoLineStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "11px 0",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const bestDriverStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  marginBottom: "12px",
};

const avatarStyle: CSSProperties = {
  borderRadius: "999px",
  overflow: "hidden",
  background: "rgba(255,255,255,0.10)",
  border: "1px solid rgba(255,255,255,0.16)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  color: "rgba(255,255,255,0.75)",
  fontWeight: 900,
};

const avatarImageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
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
  textAlign: "left",
  padding: "14px 12px",
  fontSize: "14px",
  borderBottom: "1px solid rgba(255,255,255,0.12)",
  color: "rgba(255,255,255,0.78)",
  fontWeight: 950,
  whiteSpace: "nowrap",
};

const tdStyle: CSSProperties = {
  padding: "14px 12px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  fontSize: "14px",
  color: "rgba(255,255,255,0.86)",
  fontWeight: 750,
  whiteSpace: "nowrap",
};

const trStyle: CSSProperties = {
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const tdScoreStyle: CSSProperties = {
  ...tdStyle,
  color: "#fcd34d",
  fontWeight: 950,
};

const tdMoneyStyle: CSSProperties = {
  ...tdStyle,
  color: "#86efac",
  fontWeight: 950,
};

const tdWarningStyle: CSSProperties = {
  ...tdStyle,
  color: "#fcd34d",
  fontWeight: 950,
};

const tdDangerStyle: CSSProperties = {
  ...tdStyle,
  color: "#fca5a5",
  fontWeight: 950,
};

const driverCellStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const emptyTdStyle: CSSProperties = {
  padding: "26px",
  textAlign: "center",
  color: "rgba(255,255,255,0.72)",
  fontWeight: 850,
};

const cardsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "16px",
};

const miniRankingListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const miniRankingRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "10px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.075)",
  border: "1px solid rgba(255,255,255,0.10)",
};

const miniRankStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(37,99,235,0.16)",
  border: "1px solid rgba(96,165,250,0.25)",
  fontWeight: 950,
  flexShrink: 0,
};

const miniDriverNameStyle: CSSProperties = {
  fontWeight: 950,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const miniValueStyle: CSSProperties = {
  whiteSpace: "nowrap",
  color: "#93c5fd",
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