import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) redirect("/");

  const user = await prisma.user.findUnique({
    where: { steamId },
    select: {
      id: true,
      steamId: true,
      username: true,
    },
  });

  if (!user) redirect("/");

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

  if (!entreprise) redirect("/societe");

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
    <main style={mainStyle}>
      <div style={overlayStyle} />
      <div style={radialOverlayStyle} />

      <div style={pageStyle}>
        <div style={topButtonRowStyle}>
          <Link href="/societe" style={profileButtonStyle}>
            ← Retour société
          </Link>
        </div>

        <section style={heroStyle}>
          <div>
            <div style={kickerStyle}>Elite Routiers • Finance société</div>

            <h1 style={titleStyle}>Finance de la société</h1>

            <p style={subtitleStyle}>
              {entreprise.nom} • suivi complet de tous les mouvements d’argent.
            </p>

            <div style={tagRowStyle}>
              <Tag>{transactions.length} transaction{transactions.length > 1 ? "s" : ""}</Tag>
              <Tag>{livraisonsTerminees.length} livraison{livraisonsTerminees.length > 1 ? "s" : ""} terminée{livraisonsTerminees.length > 1 ? "s" : ""}</Tag>
              <Tag>{user.username || "Chauffeur"}</Tag>
            </div>
          </div>

          <div style={walletStyle}>
            <span style={walletLabelStyle}>Solde actuel</span>
            <strong
              style={{
                ...walletValueStyle,
                color: solde >= 0 ? "#22c55e" : "#ef4444",
              }}
            >
              {formatSignedMontant(solde)}
            </strong>
            <span style={walletHintStyle}>Argent de la société</span>
          </div>
        </section>

        <section style={panelStyle}>
          <div style={statsGridStyle}>
            <BigStat
              title="Total gagné"
              value={`+ ${formatMontant(totalGains)}`}
              detail="Entrées positives"
              color="#22c55e"
              icon="📈"
            />

            <BigStat
              title="Total dépensé"
              value={`- ${formatMontant(totalDepenses)}`}
              detail="Toutes les sorties"
              color="#ef4444"
              icon="📉"
            />

            <BigStat
              title="Brut livraisons"
              value={formatMontant(totalBrutLivraisons)}
              detail="Revenus bruts terminés"
              color="#22c55e"
              icon="📦"
            />

            <BigStat
              title="Part société"
              value={formatMontant(totalPartSociete)}
              detail="15% des livraisons"
              color="#60a5fa"
              icon="🏢"
            />

            <BigStat
              title="Part chauffeurs"
              value={formatMontant(totalPartChauffeurs)}
              detail="20% des livraisons"
              color="#93c5fd"
              icon="👤"
            />

            <BigStat
              title="Charges sociales"
              value={formatMontant(totalCharges)}
              detail="Reste calculé"
              color="#f59e0b"
              icon="⚖️"
            />
          </div>
        </section>

        <section style={panelStyle}>
          <div style={splitStyle}>
            <Card title="📊 Résumé général">
              <InfoRow
                label="Solde actuel"
                value={formatSignedMontant(solde)}
                color={solde >= 0 ? "#22c55e" : "#ef4444"}
              />
              <InfoRow label="Total gagné" value={`+ ${formatMontant(totalGains)}`} color="#22c55e" />
              <InfoRow label="Total dépensé" value={`- ${formatMontant(totalDepenses)}`} color="#ef4444" />
              <InfoRow label="Transactions" value={transactions.length.toString()} />
            </Card>

            <Card title="🚛 Dépenses détaillées">
              <InfoRow label="Amendes" value={`- ${formatMontant(totalAmendes)}`} color="#ef4444" />
              <InfoRow label="Télépéage" value={`- ${formatMontant(totalPeages)}`} color="#ef4444" />
              <InfoRow label="Entretien / carburant" value={`- ${formatMontant(totalEntretien)}`} color="#ef4444" />
              <InfoRow label="Charges livraison" value={`- ${formatMontant(totalChargesLivraison)}`} color="#ef4444" />
              <InfoRow label="Achat camions" value={`- ${formatMontant(totalCamions)}`} color="#ef4444" />
            </Card>
          </div>
        </section>

        <section style={panelStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>🧾 Historique financier</h2>
              <p style={sectionSubtitleStyle}>
                Toutes les actions financières réalisées en jeu apparaissent ici.
              </p>
            </div>

            <span style={countStyle}>{transactions.length} ligne(s)</span>
          </div>

          <div style={tableWrapperStyle}>
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
                    <td colSpan={5} style={emptyTableStyle}>
                      Aucune transaction pour le moment.
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} style={trStyle}>
                      <td style={tdStyle}>{formatDate(transaction.createdAt)}</td>

                      <td style={tdStyle}>
                        {transaction.chauffeur?.username || "Entreprise"}
                      </td>

                      <td style={tdStyle}>
                        <span style={badgeStyle(transaction.type)}>
                          {formatType(transaction.type)}
                        </span>
                      </td>

                      <td style={tdStyle}>
                        {transaction.description || "Aucune description"}
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          fontWeight: 950,
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
    </main>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={cardStyle}>
      <h3 style={cardTitleStyle}>{title}</h3>
      {children}
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return <span style={tagStyle}>{children}</span>;
}

function InfoRow({
  label,
  value,
  color = "white",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div style={infoRowStyle}>
      <span style={infoLabelStyle}>{label}</span>
      <strong style={{ ...infoValueStyle, color }}>{value}</strong>
    </div>
  );
}

function BigStat({
  title,
  value,
  detail,
  color,
  icon,
}: {
  title: string;
  value: string;
  detail: string;
  color: string;
  icon: string;
}) {
  return (
    <div style={bigStatStyle}>
      <div style={bigStatTopStyle}>
        <span style={bigIconStyle}>{icon}</span>
        <span style={bigStatTitleStyle}>{title}</span>
      </div>

      <strong style={{ ...bigStatValueStyle, color }}>{value}</strong>
      <span style={bigStatDetailStyle}>{detail}</span>
    </div>
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
  if (montant > 0) return "+" + montant.toLocaleString("fr-FR") + " €";
  if (montant < 0) return montant.toLocaleString("fr-FR") + " €";
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

function badgeStyle(type: string): CSSProperties {
  const baseStyle: CSSProperties = {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 950,
    border: "1px solid rgba(255,255,255,0.12)",
  };

  if (type === "LIVRAISON" || type === "PRIME") {
    return {
      ...baseStyle,
      background: "rgba(34,197,94,0.18)",
      color: "#4ade80",
    };
  }

  if (type === "LIVRAISON_ENTREPRISE" || type === "MODIFICATION_CAMION") {
    return {
      ...baseStyle,
      background: "rgba(59,130,246,0.18)",
      color: "#60a5fa",
    };
  }

  if (type === "SALAIRE_CHAUFFEUR") {
    return {
      ...baseStyle,
      background: "rgba(168,85,247,0.18)",
      color: "#c084fc",
    };
  }

  if (type === "CHARGES_LIVRAISON" || type === "TELEPEAGE") {
    return {
      ...baseStyle,
      background: "rgba(245,158,11,0.18)",
      color: "#fbbf24",
    };
  }

  if (
    type === "CARBURANT" ||
    type === "AMENDE_VITESSE" ||
    type === "AMENDE_FEU" ||
    type === "AUTRE_AMENDE"
  ) {
    return {
      ...baseStyle,
      background: "rgba(239,68,68,0.18)",
      color: "#f87171",
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
    };
  }

  if (type === "ACHAT_CAMION") {
    return {
      ...baseStyle,
      background: "rgba(249,115,22,0.18)",
      color: "#fb923c",
    };
  }

  if (type === "VENTE_CAMION") {
    return {
      ...baseStyle,
      background: "rgba(16,185,129,0.18)",
      color: "#34d399",
    };
  }

  return {
    ...baseStyle,
    background: "rgba(255,255,255,0.08)",
    color: "#e5e7eb",
  };
}

const mainStyle: CSSProperties = {
  minHeight: "100vh",
  backgroundImage:
    "linear-gradient(180deg, rgba(3,7,18,0.15), rgba(3,7,18,0.55) 520px), url('/truck.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center top",
  backgroundAttachment: "fixed",
  color: "white",
  padding: "22px",
  position: "relative",
  fontFamily: "Arial, sans-serif",
};

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  pointerEvents: "none",
  background:
    "linear-gradient(135deg, rgba(3,7,18,0.25), rgba(8,13,28,0.20), rgba(3,7,18,0.35))",
  zIndex: 0,
};

const radialOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  pointerEvents: "none",
  background:
    "radial-gradient(circle at 52% 0%, rgba(245,158,11,0.16), transparent 34%), radial-gradient(circle at 80% 18%, rgba(37,99,235,0.12), transparent 25%)",
  zIndex: 0,
};

const pageStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  maxWidth: "1250px",
  margin: "0 auto",
  display: "grid",
  gap: "22px",
};

const topButtonRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
  flexWrap: "wrap",
};

const profileButtonStyle: CSSProperties = {
  color: "white",
  textDecoration: "none",
  fontWeight: 950,
  padding: "12px 18px",
  borderRadius: "999px",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  border: "1px solid rgba(147,197,253,0.45)",
  boxShadow: "0 0 24px rgba(37,99,235,0.34)",
  backdropFilter: "blur(12px)",
};

const heroStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "25px",
  padding: "32px",
  borderRadius: "30px",
  background: "rgba(8,13,28,0.22)",
  border: "1px solid rgba(255,255,255,0.18)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.25)",
};

const kickerStyle: CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  fontSize: "0.82rem",
  fontWeight: 950,
  color: "#60a5fa",
  textShadow: "0 4px 14px rgba(0,0,0,0.9)",
};

const titleStyle: CSSProperties = {
  margin: "8px 0 6px",
  fontSize: "3rem",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.05em",
  textShadow: "0 6px 24px rgba(0,0,0,0.95)",
};

const subtitleStyle: CSSProperties = {
  margin: "0 0 16px",
  color: "rgba(255,255,255,0.82)",
  fontWeight: 700,
};

const tagRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
};

const tagStyle: CSSProperties = {
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(37,99,235,0.16)",
  border: "1px solid rgba(96,165,250,0.28)",
  color: "#dbeafe",
  fontWeight: 900,
  fontSize: "0.85rem",
};

const walletStyle: CSSProperties = {
  minWidth: "270px",
  borderRadius: "22px",
  padding: "20px",
  background:
    "linear-gradient(135deg, rgba(34,197,94,0.20), rgba(34,197,94,0.07))",
  border: "1px solid rgba(34,197,94,0.28)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  boxShadow: "0 0 24px rgba(34,197,94,0.18)",
};

const walletLabelStyle: CSSProperties = {
  opacity: 0.78,
  fontSize: "13px",
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  fontWeight: 900,
};

const walletValueStyle: CSSProperties = {
  fontSize: "34px",
  marginTop: "8px",
};

const walletHintStyle: CSSProperties = {
  opacity: 0.7,
  fontSize: "13px",
  marginTop: "6px",
  fontWeight: 800,
};

const panelStyle: CSSProperties = {
  padding: "18px",
  borderRadius: "26px",
  background: "rgba(8,13,28,0.25)",
  border: "1px solid rgba(255,255,255,0.18)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.25)",
};

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: "14px",
};

const bigStatStyle: CSSProperties = {
  padding: "18px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.22)",
};

const bigStatTopStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "12px",
};

const bigIconStyle: CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "13px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(37,99,235,0.16)",
  border: "1px solid rgba(96,165,250,0.25)",
};

const bigStatTitleStyle: CSSProperties = {
  color: "rgba(255,255,255,0.72)",
  fontWeight: 850,
};

const bigStatValueStyle: CSSProperties = {
  display: "block",
  fontSize: "25px",
  marginBottom: "6px",
  fontWeight: 950,
};

const bigStatDetailStyle: CSSProperties = {
  color: "rgba(255,255,255,0.62)",
  fontSize: "13px",
  fontWeight: 750,
};

const splitStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "22px",
};

const cardStyle: CSSProperties = {
  padding: "20px",
  borderRadius: "20px",
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.12)",
};

const cardTitleStyle: CSSProperties = {
  margin: "0 0 22px",
  fontSize: "1.28rem",
  fontWeight: 950,
};

const infoRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
  padding: "13px 0",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const infoLabelStyle: CSSProperties = {
  color: "rgba(255,255,255,0.68)",
  fontWeight: 850,
};

const infoValueStyle: CSSProperties = {
  textAlign: "right",
  fontWeight: 950,
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
  alignItems: "flex-start",
  marginBottom: "18px",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "1.35rem",
  fontWeight: 950,
};

const sectionSubtitleStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "rgba(255,255,255,0.68)",
  fontWeight: 750,
};

const countStyle: CSSProperties = {
  color: "rgba(255,255,255,0.72)",
  fontSize: "13px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "999px",
  padding: "8px 12px",
  fontWeight: 900,
};

const tableWrapperStyle: CSSProperties = {
  overflowX: "auto",
  borderRadius: "18px",
  border: "1px solid rgba(255,255,255,0.10)",
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "900px",
  background: "rgba(255,255,255,0.035)",
};

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "14px 12px",
  fontSize: "14px",
  borderBottom: "1px solid rgba(255,255,255,0.12)",
  color: "rgba(255,255,255,0.78)",
  fontWeight: 950,
};

const tdStyle: CSSProperties = {
  padding: "14px 12px",
  fontSize: "14px",
  color: "rgba(255,255,255,0.86)",
  fontWeight: 750,
};

const trStyle: CSSProperties = {
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const emptyTableStyle: CSSProperties = {
  padding: "26px",
  textAlign: "center",
  color: "rgba(255,255,255,0.72)",
  fontWeight: 850,
};