import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Menu from "@/app/components/Menu";

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

  // 🔥 FAKE DATA (on remplacera par la base après)
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
      description: "Autoroute A6",
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
      date: "03/04/2026 19:10",
      chauffeur: "Camion59",
      type: "ENTRETIEN",
      description: "Maintenance camion",
      montant: -1250,
    },
    {
      id: 5,
      date: "03/04/2026 19:30",
      chauffeur: "Entreprise",
      type: "ACHAT_CAMION",
      description: "Scania S",
      montant: -132000,
    },
  ];

  // 📊 Calculs
  const total = transactions.reduce((acc, t) => acc + t.montant, 0);
  const gains = transactions
    .filter((t) => t.montant > 0)
    .reduce((acc, t) => acc + t.montant, 0);
  const depenses = transactions
    .filter((t) => t.montant < 0)
    .reduce((acc, t) => acc + t.montant, 0);

  return (
    <>
      <Menu />

      <main style={{ padding: "20px", color: "white" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "20px" }}>
          💰 Finance de l’entreprise
        </h1>

        {/* 🔥 CARTES */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
          <Card title="Solde" value={total} />
          <Card title="Gains" value={gains} />
          <Card title="Dépenses" value={depenses} />
        </div>

        {/* 📋 TABLEAU */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#111" }}>
                <th style={th}>Date</th>
                <th style={th}>Chauffeur</th>
                <th style={th}>Type</th>
                <th style={th}>Description</th>
                <th style={th}>Montant</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} style={{ borderBottom: "1px solid #333" }}>
                  <td style={td}>{t.date}</td>
                  <td style={td}>{t.chauffeur}</td>
                  <td style={td}>{t.type}</td>
                  <td style={td}>{t.description}</td>
                  <td
                    style={{
                      ...td,
                      color: t.montant >= 0 ? "#4caf50" : "#f44336",
                      fontWeight: "bold",
                    }}
                  >
                    {t.montant >= 0 ? "+" : ""}
                    {t.montant} €
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}

// 🔹 COMPONENT CARTE
function Card({ title, value }: { title: string; value: number }) {
  return (
    <div
      style={{
        background: "#111",
        padding: "20px",
        borderRadius: "10px",
        minWidth: "150px",
      }}
    >
      <div style={{ fontSize: "0.9rem", color: "#aaa" }}>{title}</div>
      <div
        style={{
          fontSize: "1.5rem",
          fontWeight: "bold",
          color: value >= 0 ? "#4caf50" : "#f44336",
        }}
      >
        {value >= 0 ? "+" : ""}
        {value} €
      </div>
    </div>
  );
}

// 🔹 STYLES
const th = {
  padding: "10px",
  textAlign: "left" as const,
};

const td = {
  padding: "10px",
};