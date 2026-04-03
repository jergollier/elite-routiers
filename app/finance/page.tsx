import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function FinancePage() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { steamId },
    select: {
      id: true,
      steamId: true,
      username: true,
    },
  });

  if (!user) {
    redirect("/");
  }

  const entreprise = await prisma.entreprise.findFirst({
    where: {
      OR: [
        { ownerSteamId: steamId },
        {
          membres: {
            some: {
              userId: user.id,
            },
          },
        },
      ],
    },
    include: {
      finances: {
        include: {
          chauffeur: {
            select: {
              id: true,
              username: true,
              steamId: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!entreprise) {
    redirect("/societe");
  }

  const transactions = entreprise.finances;

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
        transaction.type === "AMENDE_VITESSE" ||
        transaction.type === "AMENDE_FEU" ||
        transaction.type === "AUTRE_AMENDE"
    )
    .reduce((acc, transaction) => acc + Math.abs(transaction.montant), 0);

  const totalPeages = transactions
    .filter((transaction) => transaction.type === "PEAGE")
    .reduce((acc, transaction) => acc + Math.abs(transaction.montant), 0);

  const totalEntretien = transactions
    .filter(
      (transaction) =>
        transaction.type === "ENTRETIEN" ||
        transaction.type === "CARBURANT" ||
        transaction.type === "VIDANGE" ||
        transaction.type === "MAINTENANCE" ||
        transaction.type === "REPARATION"
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
            href="/societe"
            style={{
              color: "white",
              textDecoration: "none",
              fontWeight: "bold",
              padding: "10px 16px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.08)",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            ← Retour à société
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
                    {entreprise.nom} • suivi complet de tous les mouvements d’argent
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
                  {transactions.length} transaction{transactions.length > 1 ? "s" : ""}
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
                      {formatSignedMontant(solde)}
                    </span>
                  </div>

                  <div style={infoLineStyle}>
                    <span style={labelStyle}>Total gagné</span>
                    <span style={{ ...valueStyle, color: "#22c55e" }}>
                      +{formatMontant(totalGains)}
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
                    Livraisons, amendes, péages, carburant, entretien, vidange,
                    maintenance, réparation, achat camion.
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
                  Toutes les actions financières réalisées en jeu apparaissent ici.
                </p>

                <div style={{ overflowX: "auto" }}>
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
                      {transactions.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            style={{
                              padding: "24px 12px",
                              textAlign: "center",
                              opacity: 0.8,
                            }}
                          >
                            Aucune transaction pour le moment.
                          </td>
                        </tr>
                      ) : (
                        transactions.map((transaction) => (
                          <tr
                            key={transaction.id}
                            style={{
                              borderBottom: "1px solid rgba(255,255,255,0.08)",
                            }}
                          >
                            <td style={tdStyle}>
                              {new Date(transaction.createdAt).toLocaleString("fr-FR")}
                            </td>
                            <td style={tdStyle}>
                              {transaction.chauffeur?.username || "Entreprise"}
                            </td>
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
                              {formatSignedMontant(transaction.montant)}
                            </td>
                          </tr>
                        ))
                      )}
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
  return Math.abs(montant).toLocaleString("fr-FR") + " €";
}

function formatSignedMontant(montant: number) {
  if (montant > 0) {
    return "+" + montant.toLocaleString("fr-FR") + " €";
  }

  if (montant < 0) {
    return montant.toLocaleString("fr-FR") + " €";
  }

  return "0 €";
}

function formatType(type: string) {
  switch (type) {
    case "LIVRAISON":
      return "Livraison";
    case "PRIME":
      return "Prime";
    case "PEAGE":
      return "Péage";
    case "AMENDE_VITESSE":
      return "Amende vitesse";
    case "AMENDE_FEU":
      return "Amende feu rouge";
    case "AUTRE_AMENDE":
      return "Autre amende";
    case "ENTRETIEN":
      return "Entretien";
    case "CARBURANT":
      return "Carburant";
    case "VIDANGE":
      return "Vidange";
    case "MAINTENANCE":
      return "Maintenance";
    case "REPARATION":
      return "Réparation";
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

  if (type === "LIVRAISON" || type === "PRIME") {
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