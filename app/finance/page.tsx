import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

type Transaction = {
  id: number;
  date: string;
  chauffeur: string;
  type: string;
  description: string;
  montant: number;
};

export default async function FinancePage() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) {
    redirect("/");
  }

  const transactions: Transaction[] = [
    {
      id: 1,
      date: "03/04/2026 18:20",
      chauffeur: "RoutierMax",
      type: "LIVRAISON",
      description: "Livraison Lyon → Paris",
      montant: 12450,
    },
    {
      id: 2,
      date: "03/04/2026 18:32",
      chauffeur: "RoutierMax",
      type: "PEAGE",
      description: "Péage autoroute A6",
      montant: -24,
    },
    {
      id: 3,
      date: "03/04/2026 18:40",
      chauffeur: "Pierre_ETS2",
      type: "AMENDE_VITESSE",
      description: "Excès de vitesse",
      montant: -550,
    },
    {
      id: 4,
      date: "03/04/2026 18:51",
      chauffeur: "Pierre_ETS2",
      type: "AMENDE_FEU",
      description: "Feu rouge grillé",
      montant: -700,
    },
    {
      id: 5,
      date: "03/04/2026 19:10",
      chauffeur: "Camion59",
      type: "ENTRETIEN",
      description: "Entretien complet camion",
      montant: -1250,
    },
    {
      id: 6,
      date: "03/04/2026 19:22",
      chauffeur: "Camion59",
      type: "CARBURANT",
      description: "Plein station-service",
      montant: -860,
    },
    {
      id: 7,
      date: "03/04/2026 19:30",
      chauffeur: "Entreprise",
      type: "ACHAT_CAMION",
      description: "Achat Scania S",
      montant: -132000,
    },
    {
      id: 8,
      date: "03/04/2026 20:05",
      chauffeur: "ATS_Driver",
      type: "LIVRAISON",
      description: "Livraison Nice → Turin",
      montant: 9400,
    },
  ];

  const solde = transactions.reduce((acc, transaction) => acc + transaction.montant, 0);

  const totalGains = transactions
    .filter((transaction) => transaction.montant > 0)
    .reduce((acc, transaction) => acc + transaction.montant, 0);

  const totalDepenses = transactions
    .filter((transaction) => transaction.montant < 0)
    .reduce((acc, transaction) => acc + Math.abs(transaction.montant), 0);

  const totalAmendes = transactions
    .filter(
      (transaction) =>
        transaction.type === "AMENDE_VITESSE" || transaction.type === "AMENDE_FEU"
    )
    .reduce((acc, transaction) => acc + Math.abs(transaction.montant), 0);

  const totalPeages = transactions
    .filter((transaction) => transaction.type === "PEAGE")
    .reduce((acc, transaction) => acc + Math.abs(transaction.montant), 0);

  const totalEntretien = transactions
    .filter(
      (transaction) =>
        transaction.type === "ENTRETIEN" || transaction.type === "CARBURANT"
    )
    .reduce((acc, transaction) => acc + Math.abs(transaction.montant), 0);

  const totalCamions = transactions
    .filter((transaction) => transaction.type === "ACHAT_CAMION")
    .reduce((acc, transaction) => acc + Math.abs(transaction.montant), 0);

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

          <Link
            href="/mon-entreprise"
            style={{
              color: "white",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            ← Retour à mon entreprise
          </Link>
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
                backgroundImage: "url('/truck.jpg')",
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
                    Finance de la société
                  </h1>

                  <div
                    style={{
                      marginTop: "8px",
                      fontWeight: "bold",
                      opacity: 0.95,
                    }}
                  >
                    Suivi complet de tous les mouvements d’argent du jeu
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
                  Système financier actif
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
                    Résumé général
                  </h2>

                  <div style={infoLineStyle}>
                    <span style={labelStyle}>Solde actuel</span>
                    <span
                      style={{
                        ...valueStyle,
                        color: solde >= 0 ? "#22c55e" : "#ef4444",
                      }}
                    >
                      {formatMontant(solde)}
                    </span>
                  </div>

                  <div style={infoLineStyle}>
                    <span style={labelStyle}>Total gagné</span>
                    <span style={{ ...valueStyle, color: "#22c55e" }}>
                      {formatMontant(totalGains)}
                    </span>
                  </div>

                  <div style={infoLineStyle}>
                    <span style={labelStyle}>Total dépensé</span>
                    <span style={{ ...valueStyle, color: "#ef4444" }}>
                      -{formatMontant(totalDepenses)}
                    </span>
                  </div>
                </div>

                <div style={boxStyle}>
                  <h2 style={{ marginTop: 0, marginBottom: "14px" }}>
                    Dépenses détaillées
                  </h2>

                  <div style={infoLineStyle}>
                    <span style={labelStyle}>Amendes</span>
                    <span style={{ ...valueStyle, color: "#ef4444" }}>
                      -{formatMontant(totalAmendes)}
                    </span>
                  </div>

                  <div style={infoLineStyle}>
                    <span style={labelStyle}>Péages</span>
                    <span style={{ ...valueStyle, color: "#ef4444" }}>
                      -{formatMontant(totalPeages)}
                    </span>
                  </div>

                  <div style={infoLineStyle}>
                    <span style={labelStyle}>Entretien / carburant</span>
                    <span style={{ ...valueStyle, color: "#ef4444" }}>
                      -{formatMontant(totalEntretien)}
                    </span>
                  </div>

                  <div style={infoLineStyle}>
                    <span style={labelStyle}>Achat camions</span>
                    <span style={{ ...valueStyle, color: "#ef4444" }}>
                      -{formatMontant(totalCamions)}
                    </span>
                  </div>
                </div>

                <div style={boxStyle}>
                  <h2 style={{ marginTop: 0, marginBottom: "10px" }}>
                    Types suivis
                  </h2>

                  <p style={smallTextStyle}>
                    Livraisons, amendes, péages, carburant, entretien,
                    maintenance, achat camion et toutes les futures dépenses du
                    jeu.
                  </p>
                </div>
              </aside>

              <section style={boxStyle}>
                <h2 style={{ marginTop: 0, marginBottom: "8px" }}>
                  Historique financier
                </h2>

                <p
                  style={{
                    marginTop: 0,
                    marginBottom: "20px",
                    opacity: 0.85,
                    lineHeight: 1.6,
                  }}
                >
                  Toutes les actions financières réalisées en jeu apparaîtront ici.
                </p>

                <div
                  style={{
                    overflowX: "auto",
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      minWidth: "900px",
                    }}
                  >
                    <thead>
                      <tr>
                        <th style={thStyle}>Date</th>
                        <th style={thStyle}>Chauffeur</th>
                        <th style={thStyle}>Type</th>
                        <th style={thStyle}>Description</th>
                        <th style={thStyle}>Montant</th>
                      </tr>
                    </thead>

                    <tbody>
                      {transactions.map((transaction) => (
                        <tr
                          key={transaction.id}
                          style={{
                            borderBottom: "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          <td style={tdStyle}>{transaction.date}</td>
                          <td style={tdStyle}>{transaction.chauffeur}</td>
                          <td style={tdStyle}>
                            <span style={badgeStyle(transaction.type)}>
                              {formatType(transaction.type)}
                            </span>
                          </td>
                          <td style={tdStyle}>{transaction.description}</td>
                          <td
                            style={{
                              ...tdStyle,
                              fontWeight: "bold",
                              color:
                                transaction.montant >= 0 ? "#22c55e" : "#ef4444",
                            }}
                          >
                            {transaction.montant >= 0 ? "+" : ""}
                            {formatMontant(transaction.montant)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function formatMontant(montant: number) {
  return `${montant.toLocaleString("fr-FR")} €`;
}

function formatType(type: string) {
  switch (type) {
    case "LIVRAISON":
      return "Livraison";
    case "PEAGE":
      return "Péage";
    case "AMENDE_VITESSE":
      return "Amende vitesse";
    case "AMENDE_FEU":
      return "Amende feu rouge";
    case "ENTRETIEN":
      return "Entretien";
    case "CARBURANT":
      return "Carburant";
    case "ACHAT_CAMION":
      return "Achat camion";
    default:
      return type;
  }
}

function badgeStyle(type: string) {
  const baseStyle = {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "bold" as const,
    border: "1px solid rgba(255,255,255,0.12)",
  };

  if (type === "LIVRAISON") {
    return {
      ...baseStyle,
      background: "rgba(34,197,94,0.18)",
      color: "#86efac",
    };
  }

  return {
    ...baseStyle,
    background: "rgba(239,68,68,0.18)",
    color: "#fca5a5",
  };
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

const thStyle = {
  textAlign: "left" as const,
  padding: "12px",
  fontSize: "14px",
  borderBottom: "1px solid rgba(255,255,255,0.10)",
  opacity: 0.9,
};

const tdStyle = {
  padding: "14px 12px",
  fontSize: "14px",
};