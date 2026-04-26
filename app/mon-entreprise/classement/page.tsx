import type { CSSProperties } from "react";
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

export default async function ClassementInternePage() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) redirect("/");

  const user = await prisma.user.findUnique({
    where: { steamId },
  });

  if (!user) redirect("/");

  const membership = await prisma.entrepriseMembre.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (!membership) redirect("/societe");

  const entreprise = await prisma.entreprise.findUnique({
    where: {
      id: membership.entrepriseId,
    },
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

      <div style={pageStyle}>
        <header style={topBarStyle}>
          <div>
            <div style={topLabelStyle}>Elite Routiers</div>
            <h1 style={topTitleStyle}>Classement société</h1>
          </div>

          <div style={topActionsStyle}>
            <Link href="/mon-entreprise" style={secondaryButtonStyle}>
              ← Retour entreprise
            </Link>

            <Link href="/societe" style={secondaryButtonStyle}>
              🏠 Accueil
            </Link>
          </div>
        </header>

        <section style={heroStyle}>
          <img
            src={entreprise.banniere || "/truck.jpg"}
            alt="Bannière entreprise"
            style={heroImageStyle}
          />

          <div style={heroGradientStyle} />

          <div style={heroContentStyle}>
            <div>
              <div style={badgeStyle}>Classement interne</div>

              <h2 style={heroTitleStyle}>
                {entreprise.nom}{" "}
                <span style={abbrStyle}>[{entreprise.abreviation}]</span>
              </h2>

              <p style={heroSubtitleStyle}>
                {formatJeu(entreprise.jeu)} •{" "}
                {formatTypeTransport(entreprise.typeTransport)} • Directeur :{" "}
                {entreprise.owner.username || "Utilisateur Steam"}
              </p>
            </div>

            <div style={heroStatsStyle}>
              <HeroStat label="Membres" value={entreprise._count.membres.toString()} />
              <HeroStat label="Camions" value={entreprise._count.camions.toString()} />
              <HeroStat label="Livraisons" value={totalLivraisons.toString()} />
              <HeroStat label="Kilomètres" value={formatKm(totalKm)} />
            </div>
          </div>
        </section>

        <section style={statsGridStyle}>
          <StatCard label="Argent total gagné" value={formatMoney(totalArgent)} detail="par les chauffeurs" />
          <StatCard label="Distance totale" value={formatKm(totalKm)} detail="parcourue en mission" />
          <StatCard label="Livraisons terminées" value={totalLivraisons.toString()} detail="toutes périodes" />
          <StatCard label="Meilleur score" value={topGeneral[0]?.scoreTotal.toString() || "0"} detail={topGeneral[0]?.username || "Aucun chauffeur"} />
        </section>

        <section style={podiumBoxStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Podium des chauffeurs</h2>
              <p style={sectionTextStyle}>
                Les meilleurs chauffeurs selon le score global de la société.
              </p>
            </div>
          </div>

          <div style={podiumGridStyle}>
            {podium.length > 0 ? (
              podium.map((chauffeur, index) => (
                <PodiumCard key={chauffeur.userId} chauffeur={chauffeur} rank={index + 1} />
              ))
            ) : (
              <div style={emptyCardStyle}>Aucun chauffeur à afficher.</div>
            )}
          </div>
        </section>

        <section style={mainGridStyle}>
          <div style={bigBoxStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <h2 style={sectionTitleStyle}>Classement général</h2>
                <p style={sectionTextStyle}>
                  Score calculé avec argent, kilomètres, livraisons, infractions et accidents.
                </p>
              </div>
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
                      <tr key={chauffeur.userId}>
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
                        <td style={tdMoneyStyle}>{formatMoney(chauffeur.argentGagne)}</td>
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
          </div>

          <aside style={sideColumnStyle}>
            <InfoPanel entreprise={entreprise} />

            {topGeneral[0] && (
              <div style={boxStyle}>
                <h2 style={sectionTitleSmallStyle}>Meilleur chauffeur</h2>

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

                <div style={infoLineStyle}>
                  <span style={labelStyle}>Score</span>
                  <strong>{topGeneral[0].scoreTotal}</strong>
                </div>

                <div style={infoLineStyle}>
                  <span style={labelStyle}>Argent</span>
                  <strong>{formatMoney(topGeneral[0].argentGagne)}</strong>
                </div>

                <div style={infoLineStyle}>
                  <span style={labelStyle}>Kilomètres</span>
                  <strong>{formatKm(topGeneral[0].kilometres)}</strong>
                </div>
              </div>
            )}
          </aside>
        </section>

        <section style={cardsGridStyle}>
          <RankingMiniTable
            title="Top argent gagné"
            rows={topArgent}
            valueKey="argentGagne"
            formatValue={formatMoney}
          />

          <RankingMiniTable
            title="Top kilomètres"
            rows={topKilometres}
            valueKey="kilometres"
            formatValue={formatKm}
          />

          <RankingMiniTable
            title="Plus d’infractions"
            rows={topInfractions}
            valueKey="infractions"
            formatValue={(value) => String(value)}
          />

          <RankingMiniTable
            title="Plus d’accidents"
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

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={heroStatStyle}>
      <span style={labelStyle}>{label}</span>
      <strong style={heroStatValueStyle}>{value}</strong>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div style={statCardStyle}>
      <span style={labelStyle}>{label}</span>
      <strong style={statCardValueStyle}>{value}</strong>
      <small style={smallTextStyle}>{detail}</small>
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

function InfoPanel({ entreprise }: { entreprise: any }) {
  return (
    <div style={boxStyle}>
      <h2 style={sectionTitleSmallStyle}>Infos rapides</h2>

      <div style={infoLineStyle}>
        <span style={labelStyle}>Entreprise</span>
        <strong>{entreprise.nom}</strong>
      </div>

      <div style={infoLineStyle}>
        <span style={labelStyle}>Directeur</span>
        <strong>{entreprise.owner.username || "Utilisateur Steam"}</strong>
      </div>

      <div style={infoLineStyle}>
        <span style={labelStyle}>Jeu</span>
        <strong>{formatJeu(entreprise.jeu)}</strong>
      </div>

      <div style={infoLineStyle}>
        <span style={labelStyle}>Transport</span>
        <strong>{formatTypeTransport(entreprise.typeTransport)}</strong>
      </div>

      <div style={infoLineStyle}>
        <span style={labelStyle}>Membres</span>
        <strong>{entreprise._count.membres}</strong>
      </div>
    </div>
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
    <div style={boxStyle}>
      <h2 style={sectionTitleSmallStyle}>{title}</h2>

      <div style={miniRankingListStyle}>
        {rows.length === 0 ? (
          <div style={emptyCardStyle}>Aucun chauffeur trouvé.</div>
        ) : (
          rows.slice(0, 5).map((chauffeur, index) => (
            <div key={`${valueKey}-${chauffeur.userId}`} style={miniRankingRowStyle}>
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

const overlayStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(circle at top left, rgba(37,99,235,0.22), transparent 34%), radial-gradient(circle at top right, rgba(245,158,11,0.12), transparent 28%), rgba(0,0,0,0.72)",
};

const pageStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  minHeight: "100vh",
  padding: "22px",
  display: "flex",
  flexDirection: "column",
  gap: "20px",
};

const topBarStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
};

const topLabelStyle: CSSProperties = {
  fontSize: "12px",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  opacity: 0.72,
};

const topTitleStyle: CSSProperties = {
  margin: "4px 0 0",
  fontSize: "30px",
  lineHeight: 1,
};

const topActionsStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const secondaryButtonStyle: CSSProperties = {
  padding: "12px 16px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.13)",
  background: "rgba(255,255,255,0.09)",
  color: "white",
  fontWeight: 900,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  backdropFilter: "blur(8px)",
};

const heroStyle: CSSProperties = {
  position: "relative",
  minHeight: "290px",
  borderRadius: "24px",
  overflow: "hidden",
  background: "rgba(0,0,0,0.55)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 24px 80px rgba(0,0,0,0.48)",
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
    "linear-gradient(90deg, rgba(0,0,0,0.90), rgba(0,0,0,0.48), rgba(0,0,0,0.14)), linear-gradient(to top, rgba(0,0,0,0.90), transparent)",
};

const heroContentStyle: CSSProperties = {
  position: "relative",
  zIndex: 2,
  minHeight: "290px",
  padding: "28px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  gap: "22px",
};

const badgeStyle: CSSProperties = {
  width: "fit-content",
  padding: "8px 13px",
  borderRadius: "999px",
  background: "rgba(245,158,11,0.16)",
  border: "1px solid rgba(245,158,11,0.40)",
  color: "#fcd34d",
  fontSize: "12px",
  fontWeight: 900,
};

const heroTitleStyle: CSSProperties = {
  margin: "14px 0 8px",
  fontSize: "42px",
  lineHeight: 1,
  fontWeight: 950,
};

const abbrStyle: CSSProperties = {
  color: "#93c5fd",
};

const heroSubtitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "15px",
  opacity: 0.9,
};

const heroStatsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "12px",
  maxWidth: "920px",
};

const heroStatStyle: CSSProperties = {
  padding: "14px",
  borderRadius: "16px",
  background: "rgba(0,0,0,0.48)",
  border: "1px solid rgba(255,255,255,0.10)",
  backdropFilter: "blur(8px)",
};

const heroStatValueStyle: CSSProperties = {
  display: "block",
  fontSize: "20px",
};

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "16px",
};

const statCardStyle: CSSProperties = {
  padding: "18px",
  borderRadius: "18px",
  background: "rgba(0,0,0,0.46)",
  border: "1px solid rgba(255,255,255,0.09)",
  backdropFilter: "blur(7px)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.26)",
};

const statCardValueStyle: CSSProperties = {
  display: "block",
  margin: "6px 0 4px",
  fontSize: "24px",
};

const podiumBoxStyle: CSSProperties = {
  ...statCardStyle,
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  alignItems: "flex-start",
  marginBottom: "16px",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "24px",
  fontWeight: 950,
};

const sectionTitleSmallStyle: CSSProperties = {
  margin: "0 0 14px",
  fontSize: "20px",
  fontWeight: 950,
};

const sectionTextStyle: CSSProperties = {
  margin: "6px 0 0",
  fontSize: "13px",
  opacity: 0.76,
};

const podiumGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "16px",
  alignItems: "stretch",
};

const podiumCardStyle: CSSProperties = {
  padding: "20px",
  borderRadius: "20px",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.11), rgba(255,255,255,0.045))",
  border: "1px solid rgba(255,255,255,0.11)",
  textAlign: "center",
  boxShadow: "0 20px 55px rgba(0,0,0,0.30)",
};

const podiumRankStyle: CSSProperties = {
  fontSize: "34px",
  marginBottom: "8px",
};

const podiumNameStyle: CSSProperties = {
  margin: "12px 0 4px",
  fontSize: "19px",
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
  opacity: 0.85,
};

const mainGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 330px",
  gap: "20px",
  alignItems: "start",
};

const bigBoxStyle: CSSProperties = {
  ...statCardStyle,
  minWidth: 0,
};

const sideColumnStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const boxStyle: CSSProperties = {
  background: "rgba(0,0,0,0.46)",
  borderRadius: "18px",
  padding: "18px",
  border: "1px solid rgba(255,255,255,0.09)",
  backdropFilter: "blur(7px)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.24)",
};

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: "12px",
  opacity: 0.72,
  marginBottom: "5px",
};

const smallTextStyle: CSSProperties = {
  margin: 0,
  fontSize: "12px",
  opacity: 0.72,
};

const infoLineStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "11px 0",
  borderBottom: "1px solid rgba(255,255,255,0.07)",
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
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.08)",
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "980px",
  background: "rgba(255,255,255,0.035)",
};

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "14px 16px",
  background: "rgba(255,255,255,0.07)",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  fontSize: "13px",
  whiteSpace: "nowrap",
};

const tdStyle: CSSProperties = {
  padding: "14px 16px",
  borderBottom: "1px solid rgba(255,255,255,0.065)",
  fontSize: "14px",
  opacity: 0.95,
  whiteSpace: "nowrap",
};

const tdScoreStyle: CSSProperties = {
  ...tdStyle,
  color: "#fcd34d",
  fontWeight: 950,
};

const tdMoneyStyle: CSSProperties = {
  ...tdStyle,
  color: "#86efac",
  fontWeight: 900,
};

const tdWarningStyle: CSSProperties = {
  ...tdStyle,
  color: "#fcd34d",
  fontWeight: 900,
};

const tdDangerStyle: CSSProperties = {
  ...tdStyle,
  color: "#fca5a5",
  fontWeight: 900,
};

const driverCellStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const emptyTdStyle: CSSProperties = {
  padding: "20px",
  textAlign: "center",
  opacity: 0.75,
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
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const miniRankStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "999px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.08)",
  fontWeight: 950,
  flexShrink: 0,
};

const miniDriverNameStyle: CSSProperties = {
  fontWeight: 900,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const miniValueStyle: CSSProperties = {
  whiteSpace: "nowrap",
  color: "#93c5fd",
};

const emptyCardStyle: CSSProperties = {
  padding: "16px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.08)",
  opacity: 0.85,
};