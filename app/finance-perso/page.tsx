import type { CSSProperties, ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function euro(value: number) {
  return `${value.toLocaleString("fr-FR")} €`;
}

function getMovementConfig(type: string, montant: number) {
  if (type === "GAIN_LIVRAISON") {
    return { label: "Gain livraison", icon: "📦", color: "#22c55e", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.35)" };
  }

  if (type === "DEPENSE_CARBURANT") {
    return { label: "Carburant", icon: "⛽", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.35)" };
  }

  if (type === "DEPENSE_ENTRETIEN") {
    return { label: "Entretien", icon: "🔧", color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.35)" };
  }

  if (type === "BONUS") {
    return { label: "Bonus", icon: "🎁", color: "#22c55e", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.35)" };
  }

  if (type === "MALUS") {
    return { label: "Malus", icon: "⚠️", color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.35)" };
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
        orderBy: { createdAt: "desc" },
        take: 120,
      },
      livraisons: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      memberships: {
        include: { entreprise: true },
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
      <div style={radialOverlayStyle} />

      <div style={pageStyle}>
        <div style={topButtonRowStyle}>
          <Link href="/profil" style={secondaryTopButtonStyle}>
            👤 Profil
          </Link>

          <Link href="/societe" style={profileButtonStyle}>
            🏢 Société
          </Link>
        </div>

        <section style={heroStyle}>
          <div style={heroLeftStyle}>
            <img
              src={user.avatar || "/truck.jpg"}
              alt={user.username || "Chauffeur"}
              style={avatarStyle}
            />

            <div>
              <div style={kickerStyle}>Elite Routiers • Finance chauffeur</div>

              <h1 style={titleStyle}>{user.username || "Chauffeur"}</h1>

              <p style={subtitleStyle}>
                Suivi de ton argent perso, livraisons, carburant et entretien.
              </p>

              <div style={tagRowStyle}>
                <Tag>{entreprise?.nom || "Aucune entreprise"}</Tag>
                <Tag>{roleEntreprise}</Tag>
                <Tag>{user.jeuPrincipal || "Jeu non renseigné"}</Tag>
              </div>
            </div>
          </div>

          <div style={walletStyle}>
            <span style={walletLabelStyle}>Solde disponible</span>
            <strong style={walletValueStyle}>{euro(argentPerso)}</strong>
            <span style={walletHintStyle}>Argent perso chauffeur</span>
          </div>
        </section>

        <section style={actionsStyle}>
          <Link href="/chauffeur" style={cancelButtonStyle}>
            ← Retour chauffeur
          </Link>

          <Link href="/camions/atelier-perso" style={blueButtonStyle}>
            🏭 Atelier perso
          </Link>

          <Link href="/camions/parking" style={cancelButtonStyle}>
            🚚 Parking
          </Link>
        </section>

        <section style={panelStyle}>
          <div style={statsGridStyle}>
            <BigStat title="Gains totaux" value={`+ ${euro(totalGains)}`} detail="Livraisons, bonus et entrées" color="#22c55e" icon="📈" />
            <BigStat title="Dépenses totales" value={`- ${euro(totalDepenses)}`} detail="Carburant, entretien et malus" color="#ef4444" icon="📉" />
            <BigStat title="Balance nette" value={`${balanceNette >= 0 ? "+" : "-"} ${euro(Math.abs(balanceNette))}`} detail="Gains - dépenses" color={balanceNette >= 0 ? "#22c55e" : "#ef4444"} icon="⚖️" />
            <BigStat title="Carburant payé" value={euro(totalCarburant)} detail="Tous les pleins payés perso" color="#f59e0b" icon="⛽" />
            <BigStat title="Entretien" value={euro(totalEntretien)} detail="Réparations, pneus, vidange..." color="#fb7185" icon="🔧" />
            <BigStat title="Livraisons récentes" value={livraisonsTerminees.length.toString()} detail={`${totalKm.toLocaleString("fr-FR")} km enregistrés`} color="#60a5fa" icon="🛣️" />
          </div>
        </section>

        <section style={panelStyle}>
          <div style={splitStyle}>
            <Card title="📊 Analyse chauffeur">
              <p style={cardSubtitleStyle}>
                Résumé réaliste de ta rentabilité personnelle.
              </p>

              <div style={analysisGridStyle}>
                <MiniStat label="Gain moyen / livraison" value={euro(moyenneGain)} color="#22c55e" />
                <MiniStat label="Carburant moyen / mission" value={euro(coutMoyenCarburant)} color="#f59e0b" />
                <MiniStat label="Dépense entretien" value={euro(totalEntretien)} color="#ef4444" />
                <MiniStat label="Mouvements enregistrés" value={mouvements.length.toString()} color="#93c5fd" />
              </div>

              <div style={realismBoxStyle}>
                <strong>🧾 Logique actuelle</strong>
                <p style={{ margin: "8px 0 0" }}>
                  Tes pleins sont payés avec ton argent perso. Si tu prends dans
                  la cuve de la société, elle vend son carburant et ton solde est
                  débité. Les entretiens personnels sont aussi suivis ici.
                </p>
              </div>
            </Card>

            <Card title="🚚 Dernières livraisons">
              <p style={cardSubtitleStyle}>
                Aperçu des dernières missions enregistrées.
              </p>

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
            </Card>
          </div>
        </section>

        <section style={panelStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>🧾 Historique financier</h2>
              <p style={sectionSubtitleStyle}>
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
                          {new Date(mouvement.createdAt).toLocaleString("fr-FR")}
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

function Tag({ children }: { children: ReactNode }) {
  return <span style={tagStyle}>{children}</span>;
}

function Empty({ children }: { children: ReactNode }) {
  return <div style={emptyStyle}>{children}</div>;
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

const heroLeftStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "22px",
  flexWrap: "wrap",
};

const avatarStyle: CSSProperties = {
  width: "112px",
  height: "112px",
  borderRadius: "26px",
  objectFit: "cover",
  border: "1px solid rgba(147,197,253,0.26)",
  boxShadow: "0 0 30px rgba(37,99,235,0.22)",
  background: "rgba(255,255,255,0.08)",
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

const actionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "14px",
  padding: "18px",
  borderRadius: "20px",
  background: "rgba(8,13,28,0.25)",
  border: "1px solid rgba(255,255,255,0.18)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.25)",
  flexWrap: "wrap",
};

const cancelButtonStyle: CSSProperties = {
  textAlign: "center",
  padding: "13px 22px",
  borderRadius: "12px",
  color: "white",
  textDecoration: "none",
  fontWeight: 950,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.18)",
};

const blueButtonStyle: CSSProperties = {
  ...cancelButtonStyle,
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  border: "1px solid rgba(147,197,253,0.45)",
  boxShadow: "0 0 24px rgba(37,99,235,0.34)",
};

const panelStyle: CSSProperties = {
  padding: "18px",
  borderRadius: "26px",
  background: "rgba(8,13,28,0.25)",
  border: "1px solid rgba(255,255,255,0.18)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.25)",
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
  margin: "0 0 10px",
  fontSize: "1.28rem",
  fontWeight: 950,
};

const cardSubtitleStyle: CSSProperties = {
  margin: "0 0 18px",
  color: "rgba(255,255,255,0.68)",
  fontWeight: 750,
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

const analysisGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "12px",
};

const miniStatStyle: CSSProperties = {
  padding: "14px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.075)",
  border: "1px solid rgba(255,255,255,0.10)",
};

const miniLabelStyle: CSSProperties = {
  display: "block",
  color: "rgba(255,255,255,0.66)",
  fontSize: "13px",
  marginBottom: "8px",
  fontWeight: 800,
};

const realismBoxStyle: CSSProperties = {
  marginTop: "14px",
  padding: "14px",
  borderRadius: "16px",
  background: "rgba(34,197,94,0.08)",
  border: "1px solid rgba(34,197,94,0.22)",
  lineHeight: 1.55,
  color: "rgba(255,255,255,0.88)",
  fontWeight: 750,
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
  background: "rgba(255,255,255,0.075)",
  border: "1px solid rgba(255,255,255,0.10)",
};

const mutedSmallStyle: CSSProperties = {
  color: "rgba(255,255,255,0.62)",
  fontSize: "13px",
  marginTop: "4px",
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
  border: "1px solid rgba(255,255,255,0.12)",
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
  fontWeight: 950,
  marginBottom: "4px",
};

const movementDescStyle: CSSProperties = {
  color: "rgba(255,255,255,0.80)",
  fontSize: "14px",
  fontWeight: 750,
};

const movementMetaStyle: CSSProperties = {
  color: "rgba(255,255,255,0.52)",
  fontSize: "12px",
  marginTop: "5px",
  fontWeight: 700,
};

const movementAmountBoxStyle: CSSProperties = {
  textAlign: "right",
  flex: "0 0 auto",
};

const amountHintStyle: CSSProperties = {
  display: "block",
  color: "rgba(255,255,255,0.55)",
  fontSize: "12px",
  marginTop: "4px",
  fontWeight: 800,
};

const emptyStyle: CSSProperties = {
  padding: "26px",
  borderRadius: "18px",
  textAlign: "center",
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "rgba(255,255,255,0.72)",
  fontWeight: 800,
};