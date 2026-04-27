import type { CSSProperties, ReactNode } from "react";
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

  if (!steamId) redirect("/");

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

  if (!user) redirect("/");

  const entreprise =
    user.memberships?.entreprise ?? user.entreprisesCreees ?? null;

  if (!entreprise) redirect("/societe");

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
      <div style={overlayStyle} />
      <div style={radialOverlayStyle} />

      <div style={layoutStyle}>
        <Menu />

        <section style={contentStyle}>
          <div style={topButtonRowStyle}>
            <Link href="/monentreprise" style={profileButtonStyle}>
              ← Mon entreprise
            </Link>

            <Link href="/societe" style={secondaryTopButtonStyle}>
              🏠 Accueil
            </Link>
          </div>

          <section style={heroStyle}>
            <div>
              <div style={kickerStyle}>Elite Routiers • Feuilles de route</div>

              <h1 style={titleStyle}>Livraisons de la société</h1>

              <p style={subtitleStyle}>
                Suivi complet des trajets, kilomètres, gains, charges et
                chauffeurs.
              </p>

              <div style={tagRowStyle}>
                <Tag>{entreprise.nom}</Tag>
                <Tag>[{entreprise.abreviation}]</Tag>
                <Tag>{totalLivraisons} livraison(s)</Tag>
              </div>
            </div>

            <div style={walletStyle}>
              <span style={walletLabelStyle}>Chiffre total</span>
              <strong style={walletValueStyle}>{formatMoney(totalGagne)}</strong>
              <span style={walletHintStyle}>Toutes livraisons affichées</span>
            </div>
          </section>

          <section style={panelStyle}>
            <div style={statsGridStyle}>
              <BigStat
                title="Chiffre total"
                value={formatMoney(totalGagne)}
                detail="Argent total des missions"
                color="#22c55e"
                icon="💶"
              />

              <BigStat
                title="Gain société"
                value={formatMoney(totalSociete)}
                detail="Part entreprise"
                color="#60a5fa"
                icon="🏢"
              />

              <BigStat
                title="Gain chauffeurs"
                value={formatMoney(totalChauffeurs)}
                detail="Parts chauffeurs"
                color="#93c5fd"
                icon="👤"
              />

              <BigStat
                title="Kilomètres réels"
                value={formatKm(totalKm)}
                detail="Distance enregistrée"
                color="#f59e0b"
                icon="🛣️"
              />
            </div>
          </section>

          <section style={panelStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <h2 style={sectionTitleStyle}>📋 Historique des livraisons</h2>
                <p style={sectionSubtitleStyle}>
                  Chaque ligne représente une vraie feuille de route.
                </p>
              </div>

              <span style={countStyle}>{livraisons.length} ligne(s)</span>
            </div>

            {livraisons.length === 0 ? (
              <Empty>Aucune livraison enregistrée pour le moment.</Empty>
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
                            <span>
                              {livraison.sourceCity ?? "Départ inconnu"}
                            </span>

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
                        <Info
                          label="Chauffeur"
                          value={livraison.user.username ?? livraison.user.steamId}
                        />
                        <Info
                          label="Camion"
                          value={livraison.truck || "Non renseigné"}
                        />
                        <Info
                          label="Remorque"
                          value={livraison.remorque?.modele ?? "Aucune"}
                        />
                        <Info label="Début" value={formatDate(livraison.startedAt)} />
                        <Info label="Fin" value={formatDate(livraison.finishedAt)} />
                        <Info label="Km prévu" value={formatKm(livraison.kmPrevu)} />
                        <Info
                          label="Km réel"
                          value={formatKm(livraison.distanceReelleKm)}
                        />
                        <Info
                          label="Écart km"
                          value={`${differenceKm > 0 ? "+" : ""}${differenceKm.toLocaleString(
                            "fr-FR"
                          )} km`}
                        />
                      </div>

                      <div style={moneyGridStyle}>
                        <MoneyBox
                          label="Argent gagné"
                          value={formatMoney(livraison.income)}
                        />
                        <MoneyBox
                          label="Charges"
                          value={formatMoney(livraison.charges)}
                        />
                        <MoneyBox
                          label="Part société"
                          value={formatMoney(livraison.gainSociete)}
                        />
                        <MoneyBox
                          label="Part chauffeur"
                          value={formatMoney(livraison.gainChauffeur)}
                        />
                      </div>

                      <div style={bottomStyle}>
                        <div style={damageStyle}>
                          Perte remorque :{" "}
                          <strong>
                            {livraison.pourcentagePerteRemorque ?? 0}%
                          </strong>
                        </div>

                        <Link
                          href={`/livraisons/${livraison.id}`}
                          style={detailButtonStyle}
                        >
                          Voir la feuille de route
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return <span style={tagStyle}>{children}</span>;
}

function Empty({ children }: { children: ReactNode }) {
  return <div style={emptyStyle}>{children}</div>;
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
  backgroundImage:
    "linear-gradient(180deg, rgba(3,7,18,0.15), rgba(3,7,18,0.55) 520px), url('/truck.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center top",
  backgroundAttachment: "fixed",
  color: "white",
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

const layoutStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  minHeight: "100vh",
  display: "flex",
};

const contentStyle: CSSProperties = {
  width: "100%",
  padding: "22px",
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

const secondaryTopButtonStyle: CSSProperties = {
  ...profileButtonStyle,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.18)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.25)",
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
  color: "#22c55e",
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

const listStyle: CSSProperties = {
  display: "grid",
  gap: "16px",
};

const cardStyle: CSSProperties = {
  padding: "20px",
  borderRadius: "22px",
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.22)",
};

const cardTopStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  marginBottom: "18px",
  flexWrap: "wrap",
};

const routeStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  fontSize: "20px",
  fontWeight: 950,
  flexWrap: "wrap",
};

const arrowStyle: CSSProperties = {
  color: "#60a5fa",
};

const cargoStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "rgba(255,255,255,0.62)",
  fontWeight: 750,
};

const statusStyle: CSSProperties = {
  padding: "9px 13px",
  borderRadius: "999px",
  border: "1px solid",
  fontWeight: 950,
  height: "fit-content",
  whiteSpace: "nowrap",
};

const detailsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "12px",
  marginBottom: "14px",
};

const infoStyle: CSSProperties = {
  padding: "13px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.10)",
};

const infoLabelStyle: CSSProperties = {
  display: "block",
  color: "rgba(255,255,255,0.60)",
  fontSize: "12px",
  marginBottom: "5px",
  fontWeight: 800,
};

const infoValueStyle: CSSProperties = {
  fontSize: "14px",
  fontWeight: 950,
};

const moneyGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "12px",
  marginBottom: "14px",
};

const moneyBoxStyle: CSSProperties = {
  padding: "14px",
  borderRadius: "16px",
  background: "rgba(34,197,94,0.08)",
  border: "1px solid rgba(34,197,94,0.16)",
};

const moneyLabelStyle: CSSProperties = {
  display: "block",
  color: "rgba(255,255,255,0.62)",
  fontSize: "12px",
  marginBottom: "5px",
  fontWeight: 800,
};

const moneyValueStyle: CSSProperties = {
  fontSize: "17px",
  color: "#86efac",
  fontWeight: 950,
};

const bottomStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "14px",
  marginTop: "8px",
  flexWrap: "wrap",
};

const damageStyle: CSSProperties = {
  color: "rgba(255,255,255,0.68)",
  fontWeight: 750,
};

const detailButtonStyle: CSSProperties = {
  textDecoration: "none",
  color: "white",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  border: "1px solid rgba(147,197,253,0.45)",
  boxShadow: "0 0 24px rgba(37,99,235,0.34)",
  padding: "11px 16px",
  borderRadius: "14px",
  fontWeight: 950,
  whiteSpace: "nowrap",
};

const emptyStyle: CSSProperties = {
  padding: "28px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "rgba(255,255,255,0.72)",
  fontWeight: 800,
};