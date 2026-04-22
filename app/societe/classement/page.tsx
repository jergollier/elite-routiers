export const dynamic = "force-dynamic";

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
  const totalArgent = entreprises.reduce((sum, entreprise) => sum + entreprise.argent, 0);
  const totalCamions = entreprises.reduce(
    (sum, entreprise) => sum + entreprise._count.camions,
    0
  );
  const totalMembres = entreprises.reduce(
    (sum, entreprise) => sum + entreprise._count.membres,
    0
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.72)), url('/truck.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "white",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
        <div style={{ marginBottom: "30px" }}>
          <h1
            style={{
              fontSize: "46px",
              fontWeight: 800,
              marginBottom: "10px",
              textShadow: "0 4px 18px rgba(0,0,0,0.35)",
            }}
          >
            Classement des entreprises
          </h1>

          <p
            style={{
              fontSize: "16px",
              color: "rgba(255,255,255,0.82)",
              maxWidth: "780px",
              lineHeight: 1.6,
            }}
          >
            Retrouve les meilleures sociétés d’Elite Routiers selon leur argent,
            leur taille et leur flotte.
          </p>
        </div>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "18px",
            marginBottom: "30px",
          }}
        >
          <div style={statCard}>
            <div style={statLabel}>Entreprises</div>
            <div style={statValue}>{totalEntreprises}</div>
          </div>

          <div style={statCard}>
            <div style={statLabel}>Argent cumulé</div>
            <div style={statValue}>{formatMoney(totalArgent)}</div>
          </div>

          <div style={statCard}>
            <div style={statLabel}>Camions enregistrés</div>
            <div style={statValue}>{totalCamions}</div>
          </div>

          <div style={statCard}>
            <div style={statLabel}>Membres totaux</div>
            <div style={statValue}>{totalMembres}</div>
          </div>
        </section>

        {topThree.length > 0 && (
          <section style={{ marginBottom: "34px" }}>
            <h2
              style={{
                fontSize: "28px",
                fontWeight: 700,
                marginBottom: "18px",
                textShadow: "0 3px 12px rgba(0,0,0,0.3)",
              }}
            >
              Podium des meilleures entreprises
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "18px",
              }}
            >
              {topThree.map((entreprise, index) => {
                const rank = index + 1;
                const accent = getRankColor(rank);

                return (
                  <div
                    key={entreprise.id}
                    style={{
                      background: "rgba(0,0,0,0.46)",
                      border: `1px solid ${accent}55`,
                      borderRadius: "20px",
                      padding: "22px",
                      backdropFilter: "blur(8px)",
                      boxShadow: "0 12px 30px rgba(0,0,0,0.28)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "4px",
                        background: accent,
                      }}
                    />

                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "46px",
                        height: "46px",
                        borderRadius: "999px",
                        background: `${accent}22`,
                        border: `1px solid ${accent}66`,
                        color: accent,
                        fontWeight: 800,
                        fontSize: "20px",
                        marginBottom: "16px",
                      }}
                    >
                      {rank}
                    </div>

                    <div
                      style={{
                        fontSize: "26px",
                        fontWeight: 800,
                        marginBottom: "8px",
                        lineHeight: 1.2,
                      }}
                    >
                      {entreprise.nom}
                    </div>

                    <div
                      style={{
                        fontSize: "24px",
                        fontWeight: 700,
                        color: "#86efac",
                        marginBottom: "16px",
                      }}
                    >
                      {formatMoney(entreprise.argent)}
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                        gap: "12px",
                      }}
                    >
                      <div style={miniStatBox}>
                        <div style={miniStatLabel}>Membres</div>
                        <div style={miniStatValue}>{entreprise._count.membres}</div>
                      </div>

                      <div style={miniStatBox}>
                        <div style={miniStatLabel}>Camions</div>
                        <div style={miniStatValue}>{entreprise._count.camions}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section
          style={{
            background: "rgba(0,0,0,0.45)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "20px",
            backdropFilter: "blur(8px)",
            overflow: "hidden",
            boxShadow: "0 15px 35px rgba(0,0,0,0.28)",
          }}
        >
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <h2
              style={{
                fontSize: "26px",
                fontWeight: 700,
                margin: 0,
              }}
            >
              Classement général
            </h2>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "980px",
              }}
            >
              <colgroup>
                <col style={{ width: "90px" }} />
                <col style={{ width: "auto" }} />
                <col style={{ width: "220px" }} />
                <col style={{ width: "150px" }} />
                <col style={{ width: "150px" }} />
              </colgroup>

              <thead>
                <tr style={{ background: "rgba(255,255,255,0.03)" }}>
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
                    <td
                      colSpan={5}
                      style={{
                        padding: "28px",
                        textAlign: "center",
                        color: "rgba(255,255,255,0.7)",
                      }}
                    >
                      Aucune entreprise trouvée.
                    </td>
                  </tr>
                ) : (
                  entreprises.map((entreprise, index) => {
                    const rank = index + 1;
                    const rankColor = getRankColor(rank);

                    return (
                      <tr
                        key={entreprise.id}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <td
                          style={{
                            ...tdStyle,
                            textAlign: "center",
                            fontWeight: 800,
                            color: rank <= 3 ? rankColor : "white",
                            fontSize: "18px",
                          }}
                        >
                          {rank}
                        </td>

                        <td style={tdStyle}>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "18px",
                                fontWeight: 700,
                              }}
                            >
                              {entreprise.nom}
                            </span>

                            <span
                              style={{
                                fontSize: "13px",
                                color: "rgba(255,255,255,0.62)",
                              }}
                            >
                              Société Elite Routiers
                            </span>
                          </div>
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            textAlign: "center",
                            fontWeight: 700,
                            color: "#86efac",
                          }}
                        >
                          {formatMoney(entreprise.argent)}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            textAlign: "center",
                            fontWeight: 600,
                          }}
                        >
                          {entreprise._count.membres}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            textAlign: "center",
                            fontWeight: 600,
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

const statCard: React.CSSProperties = {
  background: "rgba(0,0,0,0.42)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "18px",
  padding: "20px",
  backdropFilter: "blur(8px)",
  boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
};

const statLabel: React.CSSProperties = {
  fontSize: "14px",
  color: "rgba(255,255,255,0.72)",
  marginBottom: "10px",
};

const statValue: React.CSSProperties = {
  fontSize: "30px",
  fontWeight: 800,
  lineHeight: 1.2,
};

const miniStatBox: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "14px",
  padding: "14px",
};

const miniStatLabel: React.CSSProperties = {
  fontSize: "13px",
  color: "rgba(255,255,255,0.7)",
  marginBottom: "6px",
};

const miniStatValue: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 800,
};

const thStyle: React.CSSProperties = {
  padding: "18px 20px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.88)",
  fontSize: "15px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "18px 20px",
  verticalAlign: "middle",
};