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

  // 🔥 FAKE DATA
  const transactions: Transaction[] = [
    {
      id: 1,
      date: "03/04/2026 18:20",
      chauffeur: "RoutierMax",
      type: "LIVRAISON",
      description: "Lyon → Paris",
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
      type: "AMENDE",
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
      type: "ACHAT",
      description: "Scania S",
      montant: -132000,
    },
  ];

  const total = transactions.reduce((a, t) => a + t.montant, 0);
  const gains = transactions.filter(t => t.montant > 0).reduce((a, t) => a + t.montant, 0);
  const depenses = transactions.filter(t => t.montant < 0).reduce((a, t) => a + t.montant, 0);

  return (
    <>
      <Menu />

      <main style={{
        padding: "20px",
        color: "white"
      }}>
        <h1 style={{ marginBottom: "20px" }}>
          💰 Finance de la société
        </h1>

        {/* 🔥 TOP CARDS */}
        <div style={{
          display: "flex",
          gap: "20px",
          marginBottom: "30px"
        }}>
          <Card title="Solde" value={total} />
          <Card title="Gains" value={gains} />
          <Card title="Dépenses" value={depenses} />
        </div>

        <div style={{
          display: "flex",
          gap: "20px"
        }}>

          {/* 📋 TABLEAU */}
          <div style={{
            flex: 3,
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "20px",
            padding: "20px"
          }}>
            <h2 style={{ marginBottom: "15px" }}>
              Historique financier
            </h2>

            <table style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={th}>Date</th>
                  <th style={th}>Chauffeur</th>
                  <th style={th}>Type</th>
                  <th style={th}>Détail</th>
                  <th style={th}>Montant</th>
                </tr>
              </thead>

              <tbody>
                {transactions.map(t => (
                  <tr key={t.id}>
                    <td style={td}>{t.date}</td>
                    <td style={td}>{t.chauffeur}</td>
                    <td style={td}>{t.type}</td>
                    <td style={td}>{t.description}</td>
                    <td style={{
                      ...td,
                      color: t.montant >= 0 ? "#4caf50" : "#f44336",
                      fontWeight: "bold"
                    }}>
                      {t.montant >= 0 ? "+" : ""}{t.montant} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 📊 SIDE PANEL */}
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "20px"
          }}>

            <SideCard title="Amendes" value={-550} />
            <SideCard title="Péages" value={-24} />
            <SideCard title="Entretien" value={-1250} />
            <SideCard title="Camions" value={-132000} />

          </div>

        </div>
      </main>
    </>
  );
}

// 🔹 CARD TOP
function Card({ title, value }: any) {
  return (
    <div style={{
      background: "rgba(0,0,0,0.45)",
      backdropFilter: "blur(8px)",
      borderRadius: "15px",
      padding: "15px",
      minWidth: "150px"
    }}>
      <div style={{ color: "#aaa" }}>{title}</div>
      <div style={{
        fontSize: "1.5rem",
        fontWeight: "bold",
        color: value >= 0 ? "#4caf50" : "#f44336"
      }}>
        {value >= 0 ? "+" : ""}{value} €
      </div>
    </div>
  );
}

// 🔹 SIDE CARD
function SideCard({ title, value }: any) {
  return (
    <div style={{
      background: "rgba(0,0,0,0.45)",
      backdropFilter: "blur(8px)",
      borderRadius: "15px",
      padding: "15px"
    }}>
      <div>{title}</div>
      <div style={{
        fontWeight: "bold",
        color: "#f44336"
      }}>
        {value} €
      </div>
    </div>
  );
}

const th = {
  textAlign: "left" as const,
  padding: "10px",
};

const td = {
  padding: "10px",
};