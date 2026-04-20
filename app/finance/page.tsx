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
  const solde = entreprise.argent ?? 0;

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
    .filter((transaction) => transaction.type === "TELEPEAGE")
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

  const totalChargesLivraison = transactions
    .filter((transaction) => transaction.type === "CHARGES_LIVRAISON")
    .reduce((acc, transaction) => acc + Math.abs(transaction.montant), 0);

  const livraisonsTerminees = await prisma.livraison.findMany({
    where: {
      entrepriseId: entreprise.id,
      status: "TERMINEE",
    },
    select: {
      income: true,
    },
  });

  const totalBrutLivraisons = livraisonsTerminees.reduce(
    (acc, livraison) => acc + (livraison.income ?? 0),
    0
  );

  const totalPartSociete = livraisonsTerminees.reduce(
    (acc, livraison) => acc + Math.round((livraison.income ?? 0) * 0.15),
    0
  );

  const totalPartChauffeurs = livraisonsTerminees.reduce(
    (acc, livraison) => acc + Math.round((livraison.income ?? 0) * 0.2),
    0
  );

  const totalCharges =
    totalBrutLivraisons - totalPartSociete - totalPartChauffeurs;

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
                    {entreprise.nom} • suivi complet de tous les mouvements
                    d’argent
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
                  {transactions.length} transaction
                  {transactions.length > 1 ? "s" : ""}
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
                  flexDirection: "column" as const,
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
                    Répartition des livraisons
                  </h2>

                  <div style={infoLineStyle}>
                    <span style={labelStyle}>Brut livraisons</span>
                    <span style={{ ...valueStyle, color: "#22c55e" }}>
                      {formatMontant(totalBrutLivraisons)}
                    </span>
                  </div>

                  <div style={infoLineStyle}>
                    <span style={labelStyle}>Part société (15%)</span>
                    <span style={{ ...valueStyle, color: "#22c55e" }}>
                      {formatMontant(totalPartSociete)}
                    </span>
                  </div>

                  <div style={infoLineStyle}>
                    <span style={labelStyle}>Part chauffeurs (20%)</span>
                    <span style={{ ...valueStyle, color: "#60a5fa" }}>
                      {formatMontant(totalPartChauffeurs)}
                    </span>
                  </div>

                  <div style={infoLineStyle}>
                    <span style={labelStyle}>Charges sociales</span>
                    <span style={{ ...valueStyle, color: "#f59e0b" }}>
                      {formatMontant(totalCharges)}
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
                    <span style={labelStyle}>Télépéage</span>
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
                    <span style={labelStyle}>Charges livraison</span>
                    <span style={{ ...valueStyle, color: "#ef4444" }}>
                      -{formatMontant(totalChargesLivraison)}
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
                    Livraisons, charges livraison, amendes, télépéage,
                    carburant, entretien, vidange, maintenance, réparation,
                    achat camion, vente camion, modification camion, salaire
                    chauffeur.
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
                  Toutes les actions financières réalisées en jeu apparaissent
                  ici.
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
                              {formatDate(transaction.createdAt)}
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
                                  transaction.montant >= 0
                                    ? "#22c55e"
                                    : "#ef4444",
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

function formatDate(date: Date | string) {
  return new Date(date).toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
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
    case "CHARGES_LIVRAISON":
      return "Charges livraison";
    case "PRIME":
      return "Prime";
    case "LIVRAISON_ENTREPRISE":
      return "Part société";
    case "SALAIRE_CHAUFFEUR":
      return "Salaire chauffeur";
    case "TELEPEAGE":
      return "Télépéage";
    case "AMENDE_VITESSE":
    case "AMENDE_FEU":
    case "AUTRE_AMENDE":
      return "Amende";
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
    case "VENTE_CAMION":
      return "Vente camion";
    case "MODIFICATION_CAMION":
      return "Modification camion";
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
      color: "#4ade80",
      boxShadow: "0 0 8px rgba(34,197,94,0.18)",
    };
  }

  if (type === "LIVRAISON_ENTREPRISE") {
    return {
      ...baseStyle,
      background: "rgba(59,130,246,0.18)",
      color: "#60a5fa",
      boxShadow: "0 0 8px rgba(59,130,246,0.18)",
    };
  }

  if (type === "SALAIRE_CHAUFFEUR") {
    return {
      ...baseStyle,
      background: "rgba(168,85,247,0.18)",
      color: "#c084fc",
      boxShadow: "0 0 8px rgba(168,85,247,0.18)",
    };
  }

  if (type === "CHARGES_LIVRAISON") {
    return {
      ...baseStyle,
      background: "rgba(245,158,11,0.18)",
      color: "#fbbf24",
      boxShadow: "0 0 8px rgba(245,158,11,0.18)",
    };
  }

  if (type === "CARBURANT") {
    return {
      ...baseStyle,
      background: "rgba(239,68,68,0.18)",
      color: "#f87171",
      boxShadow: "0 0 8px rgba(239,68,68,0.18)",
    };
  }

  if (type === "TELEPEAGE") {
    return {
      ...baseStyle,
      background: "rgba(250,204,21,0.18)",
      color: "#fde047",
      boxShadow: "0 0 8px rgba(250,204,21,0.18)",
    };
  }

  if (
    type === "ENTRETIEN" ||
    type === "VIDANGE" ||
    type === "MAINTENANCE" ||
    type === "REPARATION"
  ) {
    return {
      ...baseStyle,
      background: "rgba(107,114,128,0.18)",
      color: "#d1d5db",
      boxShadow: "0 0 8px rgba(107,114,128,0.18)",
    };
  }

  if (
    type === "AMENDE_VITESSE" ||
    type === "AMENDE_FEU" ||
    type === "AUTRE_AMENDE"
  ) {
    return {
      ...baseStyle,
      background: "rgba(220,38,38,0.22)",
      color: "#f87171",
      boxShadow: "0 0 8px rgba(220,38,38,0.18)",
    };
  }

  if (type === "ACHAT_CAMION") {
    return {
      ...baseStyle,
      background: "rgba(249,115,22,0.18)",
      color: "#fb923c",
      boxShadow: "0 0 8px rgba(249,115,22,0.18)",
    };
  }

  if (type === "VENTE_CAMION") {
    return {
      ...baseStyle,
      background: "rgba(16,185,129,0.18)",
      color: "#34d399",
      boxShadow: "0 0 8px rgba(16,185,129,0.18)",
    };
  }

  if (type === "MODIFICATION_CAMION") {
    return {
      ...baseStyle,
      background: "rgba(59,130,246,0.18)",
      color: "#60a5fa",
      boxShadow: "0 0 8px rgba(59,130,246,0.18)",
    };
  }

  return {
    ...baseStyle,
    background: "rgba(255,255,255,0.08)",
    color: "#e5e7eb",
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