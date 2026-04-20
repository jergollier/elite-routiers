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
      ["ENTRETIEN", "CARBURANT", "VIDANGE", "MAINTENANCE", "REPARATION"].includes(t.type)
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
          <h1>Finance société</h1>
          <Link href="/societe" style={btnStyle}>
            ← Retour
          </Link>
        </header>

        <div style={containerStyle}>
          <div style={gridStyle}>
            {/* LEFT */}
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

            {/* TABLE */}
            <section style={tableBox}>
              <h2>Historique</h2>

              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Chauffeur</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Montant</th>
                  </tr>
                </thead>

                <tbody>
                  {transactions.map((t) => (
                    <tr
                      key={t.id}
                      style={rowStyle}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "rgba(255,255,255,0.05)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <td>{formatDate(t.createdAt)}</td>
                      <td>{t.chauffeur?.username || "Entreprise"}</td>
                      <td>
                        <span style={badgeStyle(t.type)}>
                          {formatType(t.type)}
                        </span>
                      </td>
                      <td>{t.description}</td>
                      <td
                        style={{
                          color: t.montant >= 0 ? "#22c55e" : "#ef4444",
                          fontWeight: "bold",
                        }}
                      >
                        {formatSignedMontant(t.montant)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ================= UI ================= */

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  padding: "20px",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
};

const btnStyle = {
  background: "rgba(255,255,255,0.1)",
  padding: "10px",
  borderRadius: "10px",
  textDecoration: "none",
  color: "white",
};

const containerStyle = {
  maxWidth: "1400px",
  margin: "auto",
  padding: "20px",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "300px 1fr",
  gap: "20px",
};

const sidebarStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
};

const tableBox = {
  background: "rgba(0,0,0,0.4)",
  padding: "20px",
  borderRadius: "16px",
};

const tableStyle = {
  width: "100%",
};

const rowStyle = {
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  transition: "0.2s",
};

/* ================= COMPONENTS ================= */

function Box({ title, children }: any) {
  return (
    <div style={{ background: "rgba(0,0,0,0.4)", padding: "20px", borderRadius: "16px" }}>
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function Line({ label, value, green, red }: any) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
      <span>{label}</span>
      <span style={{ color: green ? "#22c55e" : red ? "#ef4444" : "white" }}>
        {formatSignedMontant(value)}
      </span>
    </div>
  );
}

/* ================= UTILS ================= */

function formatDate(date: any) {
  return new Date(date).toLocaleString("fr-FR");
}

function formatSignedMontant(v: number) {
  return v > 0 ? "+" + v + " €" : v + " €";
}

function formatType(type: string) {
  switch (type) {
    case "LIVRAISON":
      return "Livraison";
    case "TELEPEAGE":
      return "Télépéage";
    case "CARBURANT":
      return "Carburant";
    case "ACHAT_CAMION":
      return "Achat camion";
    case "VENTE_CAMION":
      return "Vente camion";
    case "SALAIRE_CHAUFFEUR":
      return "Salaire chauffeur";
    case "LIVRAISON_ENTREPRISE":
      return "Part société";
    default:
      return type;
  }
}

function badgeStyle(type: string) {
  return {
    padding: "5px 10px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.1)",
  };
}