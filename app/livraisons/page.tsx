import type { CSSProperties } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Menu from "@/app/components/Menu";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatMoney(value?: number | null) {
  return `${(value ?? 0).toLocaleString("fr-FR")} €`;
}

function formatKm(value?: number | null) {
  return `${Math.round(value ?? 0).toLocaleString("fr-FR")} km`;
}

function formatDate(value?: Date | null) {
  if (!value) return "Non terminé";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function statutConfig(status: string) {
  if (status === "TERMINEE" || status === "FINISHED") {
    return {
      label: "Terminée",
      color: "#22c55e",
      bg: "rgba(34,197,94,0.14)",
      border: "rgba(34,197,94,0.35)",
    };
  }

  if (status === "ANNULEE" || status === "CANCELLED") {
    return {
      label: "Annulée",
      color: "#ef4444",
      bg: "rgba(239,68,68,0.14)",
      border: "rgba(239,68,68,0.35)",
    };
  }

  return {
    label: "En cours",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.14)",
    border: "rgba(245,158,11,0.35)",
  };
}

export default async function LivraisonsPage() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { steamId },
    include: {
      memberships: {
        include: {
          entreprise: true,
        },
      },
      entreprisesCreees: true,
    },
  });

  if (!user) {
    redirect("/");
  }

  const entreprise =
    user.memberships?.entreprise ?? user.entreprisesCreees ?? null;

  if (!entreprise) {
    redirect("/societe");
  }

  const livraisons = await prisma.livraison.findMany({
    where: {
      entrepriseId: entreprise.id,
    },
    include: {
      user: true,
      camion: true,
      remorque: true,
    },
    orderBy: {
      startedAt: "desc",
    },
    take: 100,
  });

  const totalLivraisons = livraisons.length;
  const totalGagne = livraisons.reduce((acc, l) => acc + (l.income ?? 0), 0);
  const totalSociete = livraisons.reduce(
    (acc, l) => acc + (l.gainSociete ?? 0),
    0
  );
  const totalChauffeurs = livraisons.reduce(
    (acc, l) => acc + (l.gainChauffeur ?? 0),
    0
  );
  const totalKm = livraisons.reduce(
    (acc, l) => acc + Math.round(l.distanceReelleKm ?? 0),
    0
  );

  return (
    <main style={mainStyle}>
      <div style={overlayStyle}>
        <Menu />

        <section style={contentStyle}>
          <div style={topBarStyle}>
            <div>
              <p style={eyebrowStyle}>Feuilles de route</p>
              <h1 style={titleStyle}>Livraisons de la société</h1>
              <p style={subtitleStyle}>
                Suivi complet des trajets, kilomètres, gains, charges et
                chauffeurs.
              </p>
            </div>

            <Link href="/monentreprise" style={homeButtonStyle}>
              Mon entreprise
            </Link>
          </div>

          <div style={heroStyle}>
            <div>
              <p style={heroLabelStyle}>Société active</p>
              <h2 style={heroTitleStyle}>
                {entreprise.nom}{" "}
                <span style={abbrStyle}>[{entreprise.abreviation}]</span>
              </h2>
              <p style={heroTextStyle}>
                Tableau de bord des missions terminées, en cours ou annulées.
              </p>
            </div>

            <div style={heroBadgeStyle}>
              {totalLivraisons.toLocaleString("fr-FR")} livraisons
            </div>
          </div>

          <div style={statsGridStyle}>
            <StatCard label="Chiffre total" value={formatMoney(totalGagne)} />
            <StatCard label="Gain société" value={formatMoney(totalSociete)} />
            <StatCard
              label="Gain chauffeurs"
              value={formatMoney(totalChauffeurs)}
            />
            <StatCard label="Kilomètres réels" value={formatKm(totalKm)} />
          </div>

          <div style={tableCardStyle}>
            <div style={tableHeaderStyle}>
              <div>
                <h2 style={sectionTitleStyle}>Historique des livraisons</h2>
                <p style={sectionTextStyle}>
                  Chaque ligne représente une vraie feuille de route.
                </p>
              </div>
            </div>

            {livraisons.length === 0 ? (
              <div style={emptyStyle}>
                Aucune livraison enregistrée pour le moment.
              </div>
            ) : (
              <div style={listStyle}>
                {livraisons.map((livraison) => {
                  const statut = statutConfig(livraison.status);
                  const differenceKm =
                    Math.round(livraison.distanceReelleKm ?? 0) -
                    (livraison.kmPrevu ?? 0);

                  return (
                    <article key={livraison.id} style={cardStyle}>
                      <div style={cardTopStyle}>
                        <div>
                          <div style={routeStyle}>
                            <span>{livraison.sourceCity ?? "Départ inconnu"}</span>
                            <span style={arrowStyle}>→</span>
                            <span>
                              {livraison.destinationCity ?? "Arrivée inconnue"}
                            </span>
                          </div>

                          <p style={cargoStyle}>
                            {livraison.cargo ?? "Cargaison inconnue"} •{" "}
                            {livraison.game ?? "Jeu inconnu"}
                          </p>
                        </div>

                        <span
                          style={{
                            ...statusStyle,
                            color: statut.color,
                            background: statut.bg,
                            borderColor: statut.border,
                          }}
                        >
                          {statut.label}
                        </span>
                      </div>

                      <div style={detailsGridStyle}>
                        <Info label="Chauffeur" value={livraison.user.username ?? livraison.user.steamId} />
                        <Info label="Camion" value={livraison.truck || "Non renseigné"} />
                        <Info label="Remorque" value={livraison.remorque?.modele ?? "Aucune"} />
                        <Info label="Début" value={formatDate(livraison.startedAt)} />
                        <Info label="Fin" value={formatDate(livraison.finishedAt)} />
                        <Info label="Km prévu" value={formatKm(livraison.kmPrevu)} />
                        <Info label="Km réel" value={formatKm(livraison.distanceReelleKm)} />
                        <Info
                          label="Écart km"
                          value={`${differenceKm > 0 ? "+" : ""}${differenceKm.toLocaleString("fr-FR")} km`}
                        />
                      </div>

                      <div style={moneyGridStyle}>
                        <MoneyBox label="Argent gagné" value={formatMoney(livraison.income)} />
                        <MoneyBox label="Charges" value={formatMoney(livraison.charges)} />
                        <MoneyBox label="Part société" value={formatMoney(livraison.gainSociete)} />
                        <MoneyBox label="Part chauffeur" value={formatMoney(livraison.gainChauffeur)} />
                      </div>

                      <div style={bottomStyle}>
                        <div style={damageStyle}>
                          Perte remorque :{" "}
                          <strong>{livraison.pourcentagePerteRemorque ?? 0}%</strong>
                        </div>

                        <Link href={`/livraisons/${livraison.id}`} style={detailButtonStyle}>
                          Voir la feuille de route
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={statCardStyle}>
      <p style={statLabelStyle}>{label}</p>
      <strong style={statValueStyle}>{value}</strong>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div style={infoStyle}>
      <span style={infoLabelStyle}>{label}</span>
      <strong style={infoValueStyle}>{value}</strong>
    </div>
  );
}

function MoneyBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={moneyBoxStyle}>
      <span style={moneyLabelStyle}>{label}</span>
      <strong style={moneyValueStyle}>{value}</strong>
    </div>
  );
}

const mainStyle: CSSProperties = {
  minHeight: "100vh",
  backgroundImage: "url('/truck.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundAttachment: "fixed",
  color: "white",
};

const overlayStyle: CSSProperties = {
  minHeight: "100vh",
  background:
    "linear-gradient(120deg, rgba(0,0,0,0.92), rgba(0,0,0,0.76), rgba(15,23,42,0.9))",
  display: "flex",
};

const contentStyle: CSSProperties = {
  width: "100%",
  padding: "34px",
};

const topBarStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "20px",
  alignItems: "center",
  marginBottom: "24px",
};

const eyebrowStyle: CSSProperties = {
  margin: 0,
  color: "#f59e0b",
  fontSize: "13px",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.16em",
};

const titleStyle: CSSProperties = {
  margin: "6px 0",
  fontSize: "38px",
  fontWeight: 950,
};

const subtitleStyle: CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.68)",
  fontSize: "15px",
};

const homeButtonStyle: CSSProperties = {
  textDecoration: "none",
  color: "white",
  padding: "12px 18px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.16)",
  fontWeight: 800,
};

const heroStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  padding: "28px",
  borderRadius: "26px",
  background:
    "linear-gradient(135deg, rgba(245,158,11,0.22), rgba(15,23,42,0.72))",
  border: "1px solid rgba(245,158,11,0.28)",
  boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
  marginBottom: "22px",
};

const heroLabelStyle: CSSProperties = {
  margin: 0,
  color: "#fbbf24",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  fontSize: "12px",
};

const heroTitleStyle: CSSProperties = {
  margin: "6px 0",
  fontSize: "28px",
};

const abbrStyle: CSSProperties = {
  color: "#f59e0b",
};

const heroTextStyle: CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.72)",
};

const heroBadgeStyle: CSSProperties = {
  padding: "14px 18px",
  borderRadius: "16px",
  background: "rgba(0,0,0,0.28)",
  border: "1px solid rgba(255,255,255,0.12)",
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "16px",
  marginBottom: "22px",
};

const statCardStyle: CSSProperties = {
  padding: "20px",
  borderRadius: "22px",
  background: "rgba(0,0,0,0.45)",
  border: "1px solid rgba(255,255,255,0.1)",
  backdropFilter: "blur(8px)",
};

const statLabelStyle: CSSProperties = {
  margin: "0 0 8px",
  color: "rgba(255,255,255,0.58)",
  fontSize: "13px",
};

const statValueStyle: CSSProperties = {
  fontSize: "24px",
};

const tableCardStyle: CSSProperties = {
  padding: "22px",
  borderRadius: "26px",
  background: "rgba(0,0,0,0.5)",
  border: "1px solid rgba(255,255,255,0.1)",
  backdropFilter: "blur(10px)",
};

const tableHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "18px",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "24px",
};

const sectionTextStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "rgba(255,255,255,0.6)",
};

const emptyStyle: CSSProperties = {
  padding: "28px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.7)",
};

const listStyle: CSSProperties = {
  display: "grid",
  gap: "16px",
};

const cardStyle: CSSProperties = {
  padding: "20px",
  borderRadius: "22px",
  background: "rgba(15,23,42,0.72)",
  border: "1px solid rgba(255,255,255,0.1)",
};

const cardTopStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  marginBottom: "18px",
};

const routeStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  fontSize: "20px",
  fontWeight: 950,
};

const arrowStyle: CSSProperties = {
  color: "#f59e0b",
};

const cargoStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "rgba(255,255,255,0.62)",
};

const statusStyle: CSSProperties = {
  padding: "9px 13px",
  borderRadius: "999px",
  border: "1px solid",
  fontWeight: 900,
  height: "fit-content",
  whiteSpace: "nowrap",
};

const detailsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "12px",
  marginBottom: "14px",
};

const infoStyle: CSSProperties = {
  padding: "13px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const infoLabelStyle: CSSProperties = {
  display: "block",
  color: "rgba(255,255,255,0.5)",
  fontSize: "12px",
  marginBottom: "5px",
};

const infoValueStyle: CSSProperties = {
  fontSize: "14px",
};

const moneyGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "12px",
  marginBottom: "14px",
};

const moneyBoxStyle: CSSProperties = {
  padding: "14px",
  borderRadius: "16px",
  background: "rgba(245,158,11,0.1)",
  border: "1px solid rgba(245,158,11,0.16)",
};

const moneyLabelStyle: CSSProperties = {
  display: "block",
  color: "rgba(255,255,255,0.58)",
  fontSize: "12px",
  marginBottom: "5px",
};

const moneyValueStyle: CSSProperties = {
  fontSize: "17px",
  color: "#fbbf24",
};

const bottomStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "14px",
  marginTop: "8px",
};

const damageStyle: CSSProperties = {
  color: "rgba(255,255,255,0.65)",
};

const detailButtonStyle: CSSProperties = {
  textDecoration: "none",
  color: "black",
  background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
  padding: "11px 16px",
  borderRadius: "14px",
  fontWeight: 950,
  whiteSpace: "nowrap",
};