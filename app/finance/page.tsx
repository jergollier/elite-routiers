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
    .filter((t) => t.montant > 0)
    .reduce((acc, t) => acc + t.montant, 0);

  const totalDepenses = transactions
    .filter((t) => t.montant < 0)
    .reduce((acc, t) => acc + Math.abs(t.montant), 0);

  const totalAmendes = transactions
    .filter((t) =>
      ["AMENDE_VITESSE", "AMENDE_FEU", "AUTRE_AMENDE"].includes(t.type)
    )
    .reduce((acc, t) => acc + Math.abs(t.montant), 0);

  const totalPeages = transactions
    .filter((t) => t.type === "TELEPEAGE")
    .reduce((acc, t) => acc + Math.abs(t.montant), 0);

  const totalEntretien = transactions
    .filter((t) =>
      ["ENTRETIEN", "CARBURANT", "VIDANGE", "MAINTENANCE", "REPARATION"].includes(
        t.type
      )
    )
    .reduce((acc, t) => acc + Math.abs(t.montant), 0);

  const totalCamions = transactions
    .filter((t) => t.type === "ACHAT_CAMION")
    .reduce((acc, t) => acc + Math.abs(t.montant), 0);

  const totalChargesLivraison = transactions
    .filter((t) => t.type === "CHARGES_LIVRAISON")
    .reduce((acc, t) => acc + Math.abs(t.montant), 0);

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundImage: "url('/truck.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "white",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <header style={headerStyle}>
          <h1 style={{ margin: 0 }}>Finance société</h1>
          <Link href="/societe" style={btnStyle}>
            ← Retour
          </Link>
        </header>

        <div style={containerStyle}>
          <div style={gridStyle}>
            <aside style={sidebarStyle}>
              <Box title="Résumé">
                <Line label="Solde" value={solde} green />
                <Line label="Gains" value={totalGains} green />
                <Line label="Dépenses" value={-totalDepenses} red />
              </Box>

              <Box title="Dépenses">
                <Line label="Amendes" value={-totalAmendes} red />
                <Line label="Télépéage" value={-totalPeages} red />
                <Line label="Entretien" value={-totalEntretien} red />
                <Line label="Charges livraison" value={-totalChargesLivraison} red />
                <Line label="Camions" value={-totalCamions} red />
              </Box>
            </aside>

            <section style={tableBox}>
              <h2 style={{ marginTop: 0 }}>Historique</h2>

              <div style={{ overflowX: "auto" }}>
                <table style={tableStyle}>
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
                        <td colSpan={5} style={emptyStyle}>
                          Aucune transaction pour le moment.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((t) => (
                        <tr key={t.id} style={rowStyle}>
                          <td style={tdStyle}>{formatDate(t.createdAt)}</td>
                          <td style={tdStyle}>
                            {t.chauffeur?.username || "Entreprise"}
                          </td>
                          <td style={tdStyle}>
                            <span style={badgeStyle(t.type)}>
                              {formatType(t.type)}
                            </span>
                          </td>
                          <td style={tdStyle}>{t.description}</td>
                          <td
                            style={{
                              ...tdStyle,
                              color: t.montant >= 0 ? "#22c55e" : "#ef4444",
                              fontWeight: "bold",
                            }}
                          >
                            {formatSignedMontant(t.montant)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ================= COMPONENTS ================= */

function Box({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={boxStyle}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {children}
    </div>
  );
}

function Line({
  label,
  value,
  green,
  red,
}: {
  label: string;
  value: number;
  green?: boolean;
  red?: boolean;
}) {
  return (
    <div style={lineStyle}>
      <span>{label}</span>
      <span
        style={{
          color: green ? "#22c55e" : red ? "#ef4444" : "white",
          fontWeight: "bold",
        }}
      >
        {formatSignedMontant(value)}
      </span>
    </div>
  );
}

/* ================= UTILS ================= */

function formatDate(date: Date | string) {
  return new Date(date).toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSignedMontant(v: number) {
  if (v > 0) return `+${v.toLocaleString("fr-FR")} €`;
  if (v < 0) return `${v.toLocaleString("fr-FR")} €`;
  return "0 €";
}

function formatType(type: string) {
  switch (type) {
    case "LIVRAISON":
      return "Livraison";
    case "PRIME":
      return "Prime";
    case "LIVRAISON_ENTREPRISE":
      return "Part société";
    case "SALAIRE_CHAUFFEUR":
      return "Salaire chauffeur";
    case "CHARGES_LIVRAISON":
      return "Charges livraison";
    case "CARBURANT":
      return "Carburant";
    case "TELEPEAGE":
      return "Télépéage";
    case "ENTRETIEN":
      return "Entretien";
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
    case "AMENDE_VITESSE":
    case "AMENDE_FEU":
    case "AUTRE_AMENDE":
      return "Amende";
    default:
      return type;
  }
}

function badgeStyle(type: string) {
  const baseStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "bold" as const,
    border: "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(4px)",
  };

  if (type === "LIVRAISON" || type === "PRIME") {
    return {
      ...baseStyle,
      background: "rgba(34,197,94,0.18)",
      color: "#4ade80",
      boxShadow: "0 0 8px rgba(34,197,94,0.25)",
    };
  }

  if (type === "LIVRAISON_ENTREPRISE") {
    return {
      ...baseStyle,
      background: "rgba(59,130,246,0.18)",
      color: "#60a5fa",
      boxShadow: "0 0 8px rgba(59,130,246,0.25)",
    };
  }

  if (type === "SALAIRE_CHAUFFEUR") {
    return {
      ...baseStyle,
      background: "rgba(168,85,247,0.18)",
      color: "#c084fc",
      boxShadow: "0 0 8px rgba(168,85,247,0.25)",
    };
  }

  if (type === "CHARGES_LIVRAISON") {
    return {
      ...baseStyle,
      background: "rgba(245,158,11,0.18)",
      color: "#fbbf24",
      boxShadow: "0 0 8px rgba(245,158,11,0.25)",
    };
  }

  if (type === "CARBURANT") {
    return {
      ...baseStyle,
      background: "rgba(239,68,68,0.18)",
      color: "#f87171",
      boxShadow: "0 0 8px rgba(239,68,68,0.25)",
    };
  }

  if (type === "TELEPEAGE") {
    return {
      ...baseStyle,
      background: "rgba(250,204,21,0.18)",
      color: "#fde047",
      boxShadow: "0 0 8px rgba(250,204,21,0.25)",
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
      boxShadow: "0 0 6px rgba(107,114,128,0.25)",
    };
  }

  if (
    type === "AMENDE_VITESSE" ||
    type === "AMENDE_FEU" ||
    type === "AUTRE_AMENDE"
  ) {
    return {
      ...baseStyle,
      background: "rgba(220,38,38,0.25)",
      color: "#f87171",
      boxShadow: "0 0 8px rgba(220,38,38,0.35)",
    };
  }

  if (type === "ACHAT_CAMION") {
    return {
      ...baseStyle,
      background: "rgba(249,115,22,0.18)",
      color: "#fb923c",
      boxShadow: "0 0 8px rgba(249,115,22,0.25)",
    };
  }

  if (type === "VENTE_CAMION") {
    return {
      ...baseStyle,
      background: "rgba(16,185,129,0.18)",
      color: "#34d399",
      boxShadow: "0 0 8px rgba(16,185,129,0.25)",
    };
  }

  if (type === "MODIFICATION_CAMION") {
    return {
      ...baseStyle,
      background: "rgba(59,130,246,0.18)",
      color: "#60a5fa",
      boxShadow: "0 0 8px rgba(59,130,246,0.25)",
    };
  }

  return {
    ...baseStyle,
    background: "rgba(255,255,255,0.08)",
    color: "#e5e7eb",
  };
}

/* ================= STYLES ================= */

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "20px 24px",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(0,0,0,0.35)",
  backdropFilter: "blur(6px)",
} as const;

const btnStyle = {
  background: "rgba(255,255,255,0.1)",
  padding: "10px 14px",
  borderRadius: "10px",
  textDecoration: "none",
  color: "white",
  fontWeight: "bold",
  border: "1px solid rgba(255,255,255,0.12)",
  display: "inline-flex",
  alignItems: "center",
} as const;

const containerStyle = {
  maxWidth: "1400px",
  margin: "0 auto",
  padding: "24px",
} as const;

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "300px 1fr",
  gap: "20px",
} as const;

const sidebarStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
} as const;

const boxStyle = {
  background: "rgba(0,0,0,0.4)",
  padding: "20px",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 0 20px rgba(0,0,0,0.25)",
} as const;

const tableBox = {
  background: "rgba(0,0,0,0.4)",
  padding: "20px",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 0 20px rgba(0,0,0,0.25)",
} as const;

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "900px",
} as const;

const rowStyle = {
  borderBottom: "1px solid rgba(255,255,255,0.08)",
} as const;

const thStyle = {
  textAlign: "left",
  padding: "12px",
  fontSize: "14px",
  borderBottom: "1px solid rgba(255,255,255,0.10)",
  opacity: 0.9,
} as const;

const tdStyle = {
  padding: "14px 12px",
  fontSize: "14px",
} as const;

const emptyStyle = {
  padding: "24px 12px",
  textAlign: "center",
  opacity: 0.8,
} as const;

const lineStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "10px 0",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
} as const;