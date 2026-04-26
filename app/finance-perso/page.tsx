import type { CSSProperties, ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

function euro(value: number) {
  return `${value.toLocaleString("fr-FR")} €`;
}

function getMovementConfig(type: string, montant: number) {
  if (type === "GAIN_LIVRAISON") {
    return {
      label: "Gain livraison",
      icon: "📦",
      color: "#22c55e",
      bg: "rgba(34,197,94,0.12)",
      border: "rgba(34,197,94,0.35)",
    };
  }

  if (type === "DEPENSE_CARBURANT") {
    return {
      label: "Carburant",
      icon: "⛽",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.12)",
      border: "rgba(245,158,11,0.35)",
    };
  }

  if (type === "DEPENSE_ENTRETIEN") {
    return {
      label: "Entretien",
      icon: "🔧",
      color: "#ef4444",
      bg: "rgba(239,68,68,0.12)",
      border: "rgba(239,68,68,0.35)",
    };
  }

  if (type === "BONUS") {
    return {
      label: "Bonus",
      icon: "🎁",
      color: "#22c55e",
      bg: "rgba(34,197,94,0.12)",
      border: "rgba(34,197,94,0.35)",
    };
  }

  if (type === "MALUS") {
    return {
      label: "Malus",
      icon: "⚠️",
      color: "#ef4444",
      bg: "rgba(239,68,68,0.12)",
      border: "rgba(239,68,68,0.35)",
    };
  }

  return {
    label: montant >= 0 ? "Entrée" : "Sortie",
    icon: "💳",
    color: montant >= 0 ? "#22c55e" : "#ef4444",
    bg: "rgba(148,163,184,0.12)",
    border: "rgba(148,163,184,0.25)",
  };
}

export default async function FinancePersoPage() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) redirect("/");

  const user = await prisma.user.findUnique({
    where: { steamId },
    include: {
      financesPerso: {
        orderBy: {
          createdAt: "desc",
        },
        take: 120,
      },
      livraisons: {
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      },
      memberships: {
        include: {
          entreprise: true,
        },
      },
    },
  });

  if (!user) redirect("/");

  const mouvements = user.financesPerso;

const membershipActif = Array.isArray(user.memberships)
  ? user.memberships[0] ?? null
  : user.memberships ?? null;

const entreprise = membershipActif?.entreprise ?? null;
const roleEntreprise = membershipActif?.role ?? "CHAUFFEUR";

  const totalGains = mouvements
    .filter((m) => m.montant > 0)
    .reduce((acc, m) => acc + m.montant, 0);

  const totalDepenses = mouvements
    .filter((m) => m.montant < 0)
    .reduce((acc, m) => acc + Math.abs(m.montant), 0);

  const totalCarburant = mouvements
    .filter((m) => m.type === "DEPENSE_CARBURANT")
    .reduce((acc, m) => acc + Math.abs(m.montant), 0);

  const totalEntretien = mouvements
    .filter((m) => m.type === "DEPENSE_ENTRETIEN")
    .reduce((acc, m) => acc + Math.abs(m.montant), 0);

  const totalLivraison = mouvements
    .filter((m) => m.type === "GAIN_LIVRAISON")
    .reduce((acc, m) => acc + Math.abs(m.montant), 0);

  const balanceNette = totalGains - totalDepenses;
  const argentPerso = user.argentPerso ?? 0;

  const livraisonsTerminees = user.livraisons.filter(
    (l) => l.status === "TERMINEE"
  );

  const totalKm = livraisonsTerminees.reduce(
    (acc, l) => acc + Math.round(l.distanceReelleKm ?? 0),
    0
  );

  const moyenneGain =
    livraisonsTerminees.length > 0
      ? Math.round(totalLivraison / livraisonsTerminees.length)
      : 0;

  const coutMoyenCarburant =
    livraisonsTerminees.length > 0
      ? Math.round(totalCarburant / livraisonsTerminees.length)
      : 0;

  return (
    <main style={mainStyle}>
      <div style={overlayStyle} />

      <div style={topButtonsStyle}>
        <Link href="/profil" style={topButtonStyle}>
          👤 Profil
        </Link>

        <Link href="/societe" style={topButtonBlueStyle}>
          🏢 Société
        </Link>
      </div>

      <div style={layoutStyle}>
        <div style={contentStyle}>
          <section style={proHeaderStyle}>
            <div style={headerGlowStyle} />

            <div style={profileLeftStyle}>
              <div style={avatarFrameStyle}>
                <img
                  src={user.avatar || "/truck.jpg"}
                  alt={user.username || "Chauffeur"}
                  style={avatarStyle}
                />
              </div>

              <div style={profileTextStyle}>
                <div style={kickerStyle}>Elite Routiers • Espace chauffeur</div>

                <h1 style={pseudoStyle}>{user.username || "Chauffeur"}</h1>

                <div style={identityRowStyle}>
                  <Badge>{entreprise?.nom || "Aucune entreprise"}</Badge>
                  <Badge>{roleEntreprise}</Badge>
                  <Badge>{user.jeuPrincipal || "Jeu non renseigné"}</Badge>
                </div>
              </div>
            </div>

            <div style={heroWalletStyle}>
              <span style={walletLabelStyle}>Solde disponible</span>
              <strong style={walletValueStyle}>{euro(argentPerso)}</strong>
              <span style={walletHintStyle}>Argent perso chauffeur</span>
            </div>
          </section>

          <section style={quickActionsStyle}>
            <Link href="/chauffeur" style={actionButtonStyle}>
              ← Retour chauffeur
            </Link>

            <Link href="/camions/atelier-perso" style={actionButtonBlueStyle}>
              🏭 Atelier perso
            </Link>

            <Link href="/camions/parking" style={actionButtonStyle}>
              🚚 Parking
            </Link>
          </section>

          <section style={statsGridStyle}>
            <BigStat
              title="Gains totaux"
              value={`+ ${euro(totalGains)}`}
              detail="Livraisons, bonus et entrées"
              color="#22c55e"
              icon="📈"
            />

            <BigStat
              title="Dépenses totales"
              value={`- ${euro(totalDepenses)}`}
              detail="Carburant, entretien et malus"
              color="#ef4444"
              icon="📉"
            />

            <BigStat
              title="Balance nette"
              value={`${balanceNette >= 0 ? "+" : "-"} ${euro(
                Math.abs(balanceNette)
              )}`}
              detail="Gains - dépenses"
              color={balanceNette >= 0 ? "#22c55e" : "#ef4444"}
              icon="⚖️"
            />

            <BigStat
              title="Carburant payé"
              value={euro(totalCarburant)}
              detail="Tous les pleins payés perso"
              color="#f59e0b"
              icon="⛽"
            />

            <BigStat
              title="Entretien"
              value={euro(totalEntretien)}
              detail="Réparations, pneus, vidange..."
              color="#fb7185"
              icon="🔧"
            />

            <BigStat
              title="Livraisons récentes"
              value={livraisonsTerminees.length.toString()}
              detail={`${totalKm.toLocaleString("fr-FR")} km enregistrés`}
              color="#60a5fa"
              icon="🛣️"
            />
          </section>

          <section style={dashboardGridStyle}>
            <article style={panelStyle}>
              <div style={panelHeaderStyle}>
                <div>
                  <h2 style={panelTitleStyle}>📊 Analyse chauffeur</h2>
                  <p style={panelSubtitleStyle}>
                    Résumé réaliste de ta rentabilité personnelle.
                  </p>
                </div>
              </div>

              <div style={analysisGridStyle}>
                <MiniStat
                  label="Gain moyen / livraison"
                  value={euro(moyenneGain)}
                  color="#22c55e"
                />
                <MiniStat
                  label="Carburant moyen / mission"
                  value={euro(coutMoyenCarburant)}
                  color="#f59e0b"
                />
                <MiniStat
                  label="Dépense entretien"
                  value={euro(totalEntretien)}
                  color="#ef4444"
                />
                <MiniStat
                  label="Mouvements enregistrés"
                  value={mouvements.length.toString()}
                  color="#93c5fd"
                />
              </div>

              <div style={realismBoxStyle}>
                <strong>🧾 Logique actuelle</strong>
                <p>
                  Tes pleins sont payés avec ton argent perso. Si tu prends dans
                  la cuve de la société, elle vend son carburant et ton solde est
                  débité. Les entretiens personnels sont aussi suivis ici.
                </p>
              </div>
            </article>

            <article style={panelStyle}>
              <div style={panelHeaderStyle}>
                <div>
                  <h2 style={panelTitleStyle}>🚚 Dernières livraisons</h2>
                  <p style={panelSubtitleStyle}>
                    Aperçu des dernières missions enregistrées.
                  </p>
                </div>
              </div>

              {user.livraisons.length === 0 ? (
                <Empty>Aucune livraison récente.</Empty>
              ) : (
                <div style={deliveryListStyle}>
                  {user.livraisons.map((livraison) => {
                    const trajet =
                      livraison.sourceCity && livraison.destinationCity
                        ? `${livraison.sourceCity} → ${livraison.destinationCity}`
                        : "Trajet non disponible";

                    const statusColor =
                      livraison.status === "TERMINEE"
                        ? "#22c55e"
                        : livraison.status === "ANNULEE"
                        ? "#ef4444"
                        : "#f59e0b";

                    return (
                      <div key={livraison.id} style={deliveryItemStyle}>
                        <div>
                          <strong>{trajet}</strong>
                          <div style={mutedSmallStyle}>
                            {livraison.cargo || "Cargo inconnu"} •{" "}
                            {Math.round(livraison.distanceReelleKm ?? 0)} km
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <strong style={{ color: statusColor }}>
                            {livraison.status}
                          </strong>
                          <div style={mutedSmallStyle}>
                            + {euro(livraison.gainChauffeur ?? 0)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>
          </section>

          <section style={panelStyle}>
            <div style={panelHeaderStyle}>
              <div>
                <h2 style={panelTitleStyle}>🧾 Historique financier</h2>
                <p style={panelSubtitleStyle}>
                  Tous les mouvements liés à ton argent perso chauffeur.
                </p>
              </div>

              <span style={countStyle}>{mouvements.length} ligne(s)</span>
            </div>

            {mouvements.length === 0 ? (
              <Empty>
                Aucun mouvement financier pour le moment. Fais une livraison,
                un plein ou un entretien pour voir apparaître l’historique.
              </Empty>
            ) : (
              <div style={movementListStyle}>
                {mouvements.map((mouvement) => {
                  const config = getMovementConfig(
                    mouvement.type,
                    mouvement.montant
                  );

                  const isNegative = mouvement.montant < 0;

                  return (
                    <article key={mouvement.id} style={movementItemStyle}>
                      <div style={movementLeftStyle}>
                        <div
                          style={{
                            ...movementIconStyle,
                            background: config.bg,
                            borderColor: config.border,
                          }}
                        >
                          {config.icon}
                        </div>

                        <div>
                          <div style={movementTitleStyle}>
                            <span style={{ color: config.color }}>
                              {config.label}
                            </span>
                          </div>

                          <div style={movementDescStyle}>
                            {mouvement.description || "Aucune description"}
                          </div>

                          <div style={movementMetaStyle}>
                            {new Date(mouvement.createdAt).toLocaleString(
                              "fr-FR"
                            )}
                            {mouvement.camionId
                              ? ` • Camion #${mouvement.camionId}`
                              : ""}
                            {mouvement.pleinId ? " • Plein carburant" : ""}
                            {mouvement.livraisonId ? " • Livraison" : ""}
                          </div>
                        </div>
                      </div>

                      <div style={movementAmountBoxStyle}>
                        <strong
                          style={{
                            color: isNegative ? "#ef4444" : "#22c55e",
                            fontSize: "18px",
                          }}
                        >
                          {isNegative ? "-" : "+"}{" "}
                          {euro(Math.abs(mouvement.montant))}
                        </strong>

                        <span style={amountHintStyle}>
                          {isNegative ? "Sortie" : "Entrée"}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
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

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div style={miniStatStyle}>
      <span style={miniLabelStyle}>{label}</span>
      <strong style={{ color, fontSize: "20px" }}>{value}</strong>
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return <span style={badgeStyle}>{children}</span>;
}

function Empty({ children }: { children: ReactNode }) {
  return <div style={emptyStyle}>{children}</div>;
}

const mainStyle: CSSProperties = {
  minHeight: "100vh",
  backgroundImage:
    "linear-gradient(120deg, rgba(0,0,0,0.82), rgba(0,0,0,0.62)), url('/truck.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundAttachment: "fixed",
  color: "white",
};

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background:
    "radial-gradient(circle at top right, rgba(34,197,94,0.16), transparent 34%), radial-gradient(circle at bottom left, rgba(37,99,235,0.14), transparent 36%)",
  pointerEvents: "none",
};

const topButtonsStyle: CSSProperties = {
  position: "fixed",
  top: "22px",
  right: "24px",
  zIndex: 20,
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const topButtonStyle: CSSProperties = {
  color: "white",
  textDecoration: "none",
  padding: "11px 15px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.14)",
  fontWeight: 900,
  backdropFilter: "blur(10px)",
  boxShadow: "0 12px 28px rgba(0,0,0,0.28)",
};

const topButtonBlueStyle: CSSProperties = {
  ...topButtonStyle,
  background: "linear-gradient(135deg, rgba(37,99,235,0.95), rgba(29,78,216,0.9))",
  border: "1px solid rgba(147,197,253,0.28)",
};

const layoutStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  minHeight: "100vh",
  display: "flex",
};

const contentStyle: CSSProperties = {
  flex: 1,
  padding: "78px 24px 24px",
  minWidth: 0,
  display: "grid",
  gap: "18px",
};

const proHeaderStyle: CSSProperties = {
  position: "relative",
  overflow: "hidden",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "stretch",
  gap: "20px",
  flexWrap: "wrap",
  padding: "28px",
  borderRadius: "28px",
  background:
    "linear-gradient(120deg, rgba(255,255,255,0.13), rgba(15,23,42,0.74) 46%, rgba(0,0,0,0.62))",
  border: "1px solid rgba(255,255,255,0.16)",
  boxShadow:
    "0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12)",
  backdropFilter: "blur(14px)",
};

const headerGlowStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(circle at 18% 35%, rgba(255,255,255,0.18), transparent 24%), radial-gradient(circle at 78% 20%, rgba(34,197,94,0.14), transparent 28%)",
  pointerEvents: "none",
};

const profileLeftStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  display: "flex",
  alignItems: "center",
  gap: "22px",
  minWidth: 0,
};

const avatarFrameStyle: CSSProperties = {
  width: "112px",
  height: "112px",
  borderRadius: "26px",
  padding: "4px",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.25))",
  boxShadow: "0 18px 40px rgba(0,0,0,0.42)",
  flex: "0 0 auto",
};

const avatarStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  borderRadius: "22px",
  objectFit: "cover",
  display: "block",
};

const profileTextStyle: CSSProperties = {
  minWidth: 0,
};

const kickerStyle: CSSProperties = {
  opacity: 0.82,
  fontSize: "13px",
  textTransform: "uppercase",
  letterSpacing: "0.18em",
  fontWeight: 900,
};

const pseudoStyle: CSSProperties = {
  margin: "8px 0 0",
  fontSize: "58px",
  lineHeight: 0.95,
  fontWeight: 950,
  letterSpacing: "-0.04em",
  textShadow: "0 8px 28px rgba(0,0,0,0.48)",
};

const identityRowStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "18px",
};

const badgeStyle: CSSProperties = {
  padding: "9px 14px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.16)",
  fontWeight: 900,
  fontSize: "13px",
  textTransform: "uppercase",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
};

const heroWalletStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  minWidth: "270px",
  borderRadius: "22px",
  padding: "20px",
  background:
    "linear-gradient(135deg, rgba(22,163,74,0.25), rgba(34,197,94,0.08))",
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
};

const quickActionsStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const actionButtonStyle: CSSProperties = {
  color: "white",
  textDecoration: "none",
  padding: "12px 16px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.1)",
  fontWeight: 800,
};

const actionButtonBlueStyle: CSSProperties = {
  ...actionButtonStyle,
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
};

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: "14px",
};

const bigStatStyle: CSSProperties = {
  padding: "18px",
  borderRadius: "20px",
  background: "rgba(0,0,0,0.5)",
  border: "1px solid rgba(255,255,255,0.09)",
  boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
};

const bigStatTopStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "12px",
};

const bigIconStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "12px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.08)",
};

const bigStatTitleStyle: CSSProperties = {
  opacity: 0.75,
  fontWeight: 800,
};

const bigStatValueStyle: CSSProperties = {
  display: "block",
  fontSize: "25px",
  marginBottom: "6px",
};

const bigStatDetailStyle: CSSProperties = {
  opacity: 0.62,
  fontSize: "13px",
};

const dashboardGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.1fr 0.9fr",
  gap: "18px",
};

const panelStyle: CSSProperties = {
  background: "rgba(0,0,0,0.52)",
  borderRadius: "22px",
  padding: "20px",
  backdropFilter: "blur(8px)",
  border: "1px solid rgba(255,255,255,0.09)",
  boxShadow: "0 18px 50px rgba(0,0,0,0.34)",
};

const panelHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "flex-start",
  marginBottom: "16px",
};

const panelTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "22px",
};

const panelSubtitleStyle: CSSProperties = {
  margin: "6px 0 0",
  opacity: 0.68,
  fontSize: "14px",
};

const analysisGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "12px",
};

const miniStatStyle: CSSProperties = {
  padding: "14px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const miniLabelStyle: CSSProperties = {
  display: "block",
  opacity: 0.66,
  fontSize: "13px",
  marginBottom: "8px",
};

const realismBoxStyle: CSSProperties = {
  marginTop: "14px",
  padding: "14px",
  borderRadius: "16px",
  background: "rgba(34,197,94,0.08)",
  border: "1px solid rgba(34,197,94,0.22)",
  lineHeight: 1.55,
  opacity: 0.92,
};

const deliveryListStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
};

const deliveryItemStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "12px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const mutedSmallStyle: CSSProperties = {
  opacity: 0.62,
  fontSize: "13px",
  marginTop: "4px",
};

const countStyle: CSSProperties = {
  opacity: 0.68,
  fontSize: "13px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "999px",
  padding: "7px 10px",
};

const movementListStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
};

const movementItemStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "14px",
  padding: "14px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const movementLeftStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "13px",
  minWidth: 0,
};

const movementIconStyle: CSSProperties = {
  width: "44px",
  height: "44px",
  borderRadius: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid",
  flex: "0 0 auto",
};

const movementTitleStyle: CSSProperties = {
  fontWeight: 900,
  marginBottom: "4px",
};

const movementDescStyle: CSSProperties = {
  opacity: 0.8,
  fontSize: "14px",
};

const movementMetaStyle: CSSProperties = {
  opacity: 0.52,
  fontSize: "12px",
  marginTop: "5px",
};

const movementAmountBoxStyle: CSSProperties = {
  textAlign: "right",
  flex: "0 0 auto",
};

const amountHintStyle: CSSProperties = {
  display: "block",
  opacity: 0.55,
  fontSize: "12px",
  marginTop: "4px",
};

const emptyStyle: CSSProperties = {
  padding: "26px",
  borderRadius: "18px",
  textAlign: "center",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  opacity: 0.78,
};