import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

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

  if (!steamId) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { steamId },
  });

  if (!user) {
    redirect("/");
  }

  const membership = await prisma.entrepriseMembre.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (!membership) {
    redirect("/societe");
  }

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

  if (!entreprise) {
    notFound();
  }

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

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundImage: "url('/truck.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        position: "relative",
        color: "white",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0, 0, 0, 0.65)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header
          style={{
            height: "80px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            borderBottom: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>
            Elite Routiers
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/mon-entreprise" style={secondaryButtonStyle}>
              ← Retour entreprise
            </Link>
            <Link href="/societe" style={secondaryButtonStyle}>
              Société
            </Link>
          </div>
        </header>

        <div
          style={{
            maxWidth: "1400px",
            width: "100%",
            margin: "0 auto",
            padding: "24px",
          }}
        >
          <section
            style={{
              background: "rgba(0, 0, 0, 0.45)",
              borderRadius: "18px",
              overflow: "hidden",
              backdropFilter: "blur(6px)",
              boxShadow: "0 0 20px rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                height: "240px",
                backgroundImage: `url('${entreprise.banniere || "/truck.jpg"}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.88), rgba(0,0,0,0.20))",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  left: "24px",
                  bottom: "24px",
                  right: "24px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h1 style={{ margin: 0, fontSize: "36px" }}>
                    Classement interne
                  </h1>

                  <div
                    style={{
                      marginTop: "8px",
                      fontWeight: "bold",
                      opacity: 0.95,
                    }}
                  >
                    {entreprise.nom} [{entreprise.abreviation}] • {entreprise.jeu}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "rgba(255,255,255,0.10)",
                    padding: "10px 14px",
                    borderRadius: "999px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    fontWeight: "bold",
                  }}
                >
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      display: "inline-block",
                      background: "#22c55e",
                      boxShadow: "0 0 8px #22c55e",
                    }}
                  />
                  {entreprise._count.membres} membres • {entreprise._count.camions} camions
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "24px",
                display: "grid",
                gridTemplateColumns: "320px 1fr",
                gap: "20px",
              }}
            >
              <aside
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div style={boxStyle}>
                  <h2 style={{ marginTop: 0, marginBottom: "14px" }}>
                    Infos rapides
                  </h2>

                  <div style={infoLineStyle}>
                    <span style={labelStyle}>Entreprise</span>
                    <span style={valueStyle}>{entreprise.nom}</span>
                  </div>

                  <div style={infoLineStyle}>
                    <span style={labelStyle}>Directeur</span>
                    <span style={valueStyle}>
                      {entreprise.owner.username || "Utilisateur Steam"}
                    </span>
                  </div>

                  <div style={infoLineStyle}>
                    <span style={labelStyle}>Jeu</span>
                    <span style={valueStyle}>{entreprise.jeu}</span>
                  </div>

                  <div style={infoLineStyle}>
                    <span style={labelStyle}>Transport</span>
                    <span style={valueStyle}>{entreprise.typeTransport}</span>
                  </div>

                  <div style={infoLineStyle}>
                    <span style={labelStyle}>Membres</span>
                    <span style={valueStyle}>{entreprise._count.membres}</span>
                  </div>
                </div>

                <div style={boxStyle}>
                  <h2 style={{ marginTop: 0, marginBottom: "10px" }}>
                    Système de score
                  </h2>

                  <p style={smallTextStyle}>
                    Le classement général mélange l’argent gagné, les kilomètres,
                    les livraisons, puis retire des points pour les infractions
                    et les accidents.
                  </p>
                </div>

                {topGeneral[0] && (
                  <div style={boxStyle}>
                    <h2 style={{ marginTop: 0, marginBottom: "10px" }}>
                      Meilleur chauffeur
                    </h2>

                    <p style={{ ...smallTextStyle, marginBottom: "8px" }}>
                      <strong>{topGeneral[0].username}</strong>
                    </p>

                    <div style={infoLineStyle}>
                      <span style={labelStyle}>Score total</span>
                      <span style={valueStyle}>{topGeneral[0].scoreTotal}</span>
                    </div>

                    <div style={infoLineStyle}>
                      <span style={labelStyle}>Argent</span>
                      <span style={valueStyle}>
                        {formatMoney(topGeneral[0].argentGagne)}
                      </span>
                    </div>

                    <div style={infoLineStyle}>
                      <span style={labelStyle}>Kilomètres</span>
                      <span style={valueStyle}>
                        {formatKm(topGeneral[0].kilometres)}
                      </span>
                    </div>
                  </div>
                )}
              </aside>

              <section
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                <div style={boxStyle}>
                  <h2 style={{ marginTop: 0, marginBottom: "14px" }}>
                    Classement général
                  </h2>
                  <p style={{ marginTop: 0, marginBottom: "18px", opacity: 0.85 }}>
                    Le classement total de tous les chauffeurs de l’entreprise.
                  </p>

                  <div style={tableWrapperStyle}>
                    <table style={tableStyle}>
                      <thead>
                        <tr>
                          <th style={thStyle}>#</th>
                          <th style={thStyle}>Chauffeur</th>
                          <th style={thStyle}>Rôle</th>
                          <th style={thStyle}>Score total</th>
                          <th style={thStyle}>Argent</th>
                          <th style={thStyle}>Kilomètres</th>
                          <th style={thStyle}>Infractions</th>
                          <th style={thStyle}>Accidents</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topGeneral.length === 0 ? (
                          <tr>
                            <td colSpan={8} style={emptyTdStyle}>
                              Aucun chauffeur trouvé.
                            </td>
                          </tr>
                        ) : (
                          topGeneral.map((chauffeur, index) => (
                            <tr key={chauffeur.userId}>
                              <td style={tdStyle}>{index + 1}</td>
                              <td style={tdStyleStrong}>{chauffeur.username}</td>
                              <td style={tdStyle}>{formatRole(chauffeur.role)}</td>
                              <td style={tdStyle}>{chauffeur.scoreTotal}</td>
                              <td style={tdStyle}>{formatMoney(chauffeur.argentGagne)}</td>
                              <td style={tdStyle}>{formatKm(chauffeur.kilometres)}</td>
                              <td style={tdStyle}>{chauffeur.infractions}</td>
                              <td style={tdStyle}>{chauffeur.accidents}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={cardsGridStyle}>
                  <div style={boxStyle}>
                    <h2 style={{ marginTop: 0, marginBottom: "14px" }}>
                      Top argent gagné
                    </h2>
                    <RankingMiniTable
                      rows={topArgent}
                      valueKey="argentGagne"
                      formatValue={(value) => formatMoney(value)}
                    />
                  </div>

                  <div style={boxStyle}>
                    <h2 style={{ marginTop: 0, marginBottom: "14px" }}>
                      Top kilomètres
                    </h2>
                    <RankingMiniTable
                      rows={topKilometres}
                      valueKey="kilometres"
                      formatValue={(value) => formatKm(value)}
                    />
                  </div>

                  <div style={boxStyle}>
                    <h2 style={{ marginTop: 0, marginBottom: "14px" }}>
                      Plus d’infractions
                    </h2>
                    <RankingMiniTable
                      rows={topInfractions}
                      valueKey="infractions"
                      formatValue={(value) => String(value)}
                    />
                  </div>

                  <div style={boxStyle}>
                    <h2 style={{ marginTop: 0, marginBottom: "14px" }}>
                      Plus d’accidents
                    </h2>
                    <RankingMiniTable
                      rows={topAccidents}
                      valueKey="accidents"
                      formatValue={(value) => String(value)}
                    />
                  </div>
                </div>
              </section>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function RankingMiniTable({
  rows,
  valueKey,
  formatValue,
}: {
  rows: ClassementRow[];
  valueKey: "argentGagne" | "kilometres" | "infractions" | "accidents";
  formatValue: (value: number) => string;
}) {
  return (
    <div style={tableWrapperStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>#</th>
            <th style={thStyle}>Chauffeur</th>
            <th style={thStyle}>Rôle</th>
            <th style={thStyle}>Valeur</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} style={emptyTdStyle}>
                Aucun chauffeur trouvé.
              </td>
            </tr>
          ) : (
            rows.map((chauffeur, index) => (
              <tr key={`${valueKey}-${chauffeur.userId}`}>
                <td style={tdStyle}>{index + 1}</td>
                <td style={tdStyleStrong}>{chauffeur.username}</td>
                <td style={tdStyle}>{formatRole(chauffeur.role)}</td>
                <td style={tdStyle}>{formatValue(chauffeur[valueKey])}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const boxStyle = {
  background: "rgba(255,255,255,0.08)",
  borderRadius: "16px",
  padding: "20px",
  border: "1px solid rgba(255,255,255,0.08)",
};

const infoLineStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "10px 0",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};

const labelStyle = {
  opacity: 0.8,
};

const valueStyle = {
  fontWeight: "bold",
};

const smallTextStyle = {
  margin: 0,
  lineHeight: 1.6,
  opacity: 0.9,
};

const secondaryButtonStyle = {
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
};

const cardsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "20px",
};

const tableWrapperStyle = {
  overflowX: "auto" as const,
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.08)",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse" as const,
  minWidth: "760px",
  background: "rgba(255,255,255,0.03)",
};

const thStyle = {
  textAlign: "left" as const,
  padding: "14px 16px",
  background: "rgba(255,255,255,0.06)",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  fontSize: "14px",
};

const tdStyle = {
  padding: "14px 16px",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  fontSize: "14px",
  opacity: 0.95,
};

const tdStyleStrong = {
  padding: "14px 16px",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  fontSize: "14px",
  fontWeight: "bold",
};

const emptyTdStyle = {
  padding: "18px",
  textAlign: "center" as const,
  opacity: 0.8,
};