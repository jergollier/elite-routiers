import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { prisma } from "@/lib/prisma";

export default async function ChauffeurPage() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { steamId },
    include: {
      chauffeurStats: {
        orderBy: {
          createdAt: "desc",
        },
      },
      livraisons: {
        orderBy: {
          createdAt: "desc",
        },
        take: 15,
      },
    },
  });

  if (!user) {
    redirect("/");
  }

  const membershipActif = await prisma.entrepriseMembre.findUnique({
    where: {
      userId: user.id,
    },
    include: {
      entreprise: true,
    },
  });

  const entrepriseActuelle = membershipActif?.entreprise ?? null;

  const totalArgentGagne = user.chauffeurStats.reduce(
    (acc, stat) => acc + (stat.argentGagne ?? 0),
    0
  );

  const totalKilometres = user.chauffeurStats.reduce(
    (acc, stat) => acc + (stat.kilometres ?? 0),
    0
  );

  const totalLivraisonsReussies = user.chauffeurStats.reduce(
    (acc, stat) => acc + (stat.livraisons ?? 0),
    0
  );

  const totalAnnulees = user.livraisons.filter(
    (livraison) => livraison.status === "ANNULEE"
  ).length;

  const totalEnCours = user.livraisons.filter(
    (livraison) => livraison.status === "EN_COURS"
  ).length;

  return (
    <main style={page}>
      <div style={overlay} />

      <div style={topActions}>
        <Link href="/profil" style={topButtonDark}>
          👤 Profil
        </Link>

        <Link href="/societe" style={topButtonBlue}>
          🏢 Société
        </Link>
      </div>

      <div style={container}>
        <section style={hero}>
          <div style={heroLeft}>
            <div style={avatarBox}>
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar chauffeur" style={avatar} />
              ) : (
                <span style={{ fontSize: "2.5rem" }}>🚛</span>
              )}
            </div>

            <div>
              <div style={smallText}>Elite Routiers • Espace chauffeur</div>

              <h1 style={title}>{user.username || "Chauffeur"}</h1>

              <div style={tags}>
                <Tag>{entrepriseActuelle?.nom || "Aucune entreprise"}</Tag>
                <Tag>{membershipActif?.role || "Aucun rôle"}</Tag>
                <Tag>{user.jeuPrincipal || "Jeu non renseigné"}</Tag>
              </div>
            </div>
          </div>

          <div style={heroMoney}>
            <span style={moneyLabel}>Argent personnel</span>
            <strong style={moneyValue}>
              {(user.argentPerso ?? 0).toLocaleString("fr-FR")} €
            </strong>
          </div>
        </section>

        <section style={statsGrid}>
          <StatCard
            title="Gains livraisons"
            value={`${totalArgentGagne.toLocaleString("fr-FR")} €`}
            color="#22c55e"
            icon="💰"
          />

          <StatCard
            title="Kilomètres parcourus"
            value={`${Math.round(totalKilometres).toLocaleString("fr-FR")} km`}
            color="#f59e0b"
            icon="🛣️"
          />

          <StatCard
            title="Livraisons réussies"
            value={totalLivraisonsReussies.toString()}
            color="#60a5fa"
            icon="✅"
          />

          <StatCard
            title="En cours"
            value={totalEnCours.toString()}
            color="#f59e0b"
            icon="⏳"
          />

          <StatCard
            title="Annulées"
            value={totalAnnulees.toString()}
            color="#ef4444"
            icon="❌"
          />
        </section>

        <section style={contentGrid}>
          <section style={cardLarge}>
            <div style={sectionHeader}>
              <div>
                <div style={smallText}>Historique récent</div>
                <h2 style={sectionTitle}>Dernières livraisons</h2>
              </div>

              <span style={badge}>{user.livraisons.length} affichées</span>
            </div>

            {user.livraisons.length === 0 ? (
              <EmptyText>Aucune livraison enregistrée.</EmptyText>
            ) : (
              <div style={deliveryList}>
                {user.livraisons.map((livraison) => {
                  const statutLabel =
                    livraison.status === "TERMINEE"
                      ? "Terminée"
                      : livraison.status === "ANNULEE"
                      ? "Annulée"
                      : "En cours";

                  const statutColor =
                    livraison.status === "TERMINEE"
                      ? "#22c55e"
                      : livraison.status === "ANNULEE"
                      ? "#ef4444"
                      : "#f59e0b";

                  const trajet =
                    livraison.sourceCity && livraison.destinationCity
                      ? `${livraison.sourceCity} → ${livraison.destinationCity}`
                      : "Trajet non disponible";

                  return (
                    <div key={livraison.id} style={deliveryCard}>
                      <div style={deliveryTop}>
                        <div>
                          <strong style={deliveryRoute}>{trajet}</strong>

                          <div style={deliveryMeta}>
                            {livraison.cargo || "Cargo inconnu"} •{" "}
                            {livraison.truck || "Camion inconnu"}
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <div style={{ ...statusPill, color: statutColor }}>
                            ● {statutLabel}
                          </div>

                          <div style={dateText}>
                            {new Date(livraison.createdAt).toLocaleString(
                              "fr-FR"
                            )}
                          </div>
                        </div>
                      </div>

                      {livraison.status === "TERMINEE" && (
                        <div style={moneyGrid}>
                          <MoneyLine
                            label="Brut"
                            value={`${(livraison.income ?? 0).toLocaleString(
                              "fr-FR"
                            )} €`}
                          />

                          <MoneyLine
                            label="Chauffeur"
                            value={`${(
                              livraison.gainChauffeur ?? 0
                            ).toLocaleString("fr-FR")} €`}
                          />

                          <MoneyLine
                            label="Société"
                            value={`${(
                              livraison.gainSociete ?? 0
                            ).toLocaleString("fr-FR")} €`}
                          />

                          <MoneyLine
                            label="Charges"
                            value={`${(livraison.charges ?? 0).toLocaleString(
                              "fr-FR"
                            )} €`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <aside style={sidePanel}>
            <h2 style={sectionTitle}>Actions rapides</h2>

            <div style={quickActions}>
              <Link href="/finance-perso" style={btnGreen}>
                💰 Finance perso
              </Link>

              <Link href="/camions/acheter" style={btnBlue}>
                🚛 Acheter un camion
              </Link>

              <Link href="/camions/parking" style={btnBlue}>
                🅿️ Parking
              </Link>

              <Link href="/profil/modifier" style={btn}>
                ✏️ Modifier profil
              </Link>
            </div>

            <div style={driverCard}>
              <div style={smallText}>Résumé chauffeur</div>

              <InfoLine
                label="Entreprise"
                value={entrepriseActuelle?.nom || "Aucune"}
              />

              <InfoLine
                label="Rôle"
                value={membershipActif?.role || "Aucun rôle"}
              />

              <InfoLine
                label="Jeu"
                value={user.jeuPrincipal || "Non renseigné"}
              />

              <InfoLine
                label="Micro"
                value={user.micro ? "Oui" : "Non"}
              />
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  color,
  icon,
}: {
  title: string;
  value: string;
  color: string;
  icon: string;
}) {
  return (
    <div style={statCard}>
      <div style={statIcon}>{icon}</div>
      <div style={{ opacity: 0.68, marginBottom: "8px" }}>{title}</div>
      <div style={{ fontWeight: 900, fontSize: "1.35rem", color }}>{value}</div>
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return <span style={tag}>{children}</span>;
}

function EmptyText({ children }: { children: ReactNode }) {
  return <div style={emptyText}>{children}</div>;
}

function MoneyLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={moneyLine}>
      <span style={{ opacity: 0.65 }}>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={infoLine}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

const page: CSSProperties = {
  minHeight: "100vh",
  backgroundImage: "url('/truck.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundAttachment: "fixed",
  color: "white",
  padding: "24px",
  position: "relative",
};

const overlay: CSSProperties = {
  position: "fixed",
  inset: 0,
  background:
    "linear-gradient(135deg, rgba(0,0,0,0.88), rgba(8,20,38,0.72), rgba(0,0,0,0.92))",
  zIndex: 0,
};

const topActions: CSSProperties = {
  position: "absolute",
  top: "24px",
  right: "24px",
  zIndex: 5,
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const topButtonBlue: CSSProperties = {
  padding: "12px 18px",
  borderRadius: "999px",
  color: "white",
  textDecoration: "none",
  fontWeight: 900,
  background: "linear-gradient(135deg, rgba(37,99,235,0.95), rgba(14,165,233,0.75))",
  border: "1px solid rgba(255,255,255,0.25)",
  boxShadow: "0 15px 35px rgba(0,0,0,0.45)",
  backdropFilter: "blur(10px)",
};

const topButtonDark: CSSProperties = {
  ...topButtonBlue,
  background: "rgba(0,0,0,0.55)",
};

const container: CSSProperties = {
  position: "relative",
  zIndex: 1,
  maxWidth: "1320px",
  margin: "0 auto",
  display: "grid",
  gap: "22px",
  paddingTop: "62px",
};

const hero: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "24px",
  alignItems: "center",
  padding: "28px",
  borderRadius: "28px",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.13), rgba(255,255,255,0.04))",
  border: "1px solid rgba(255,255,255,0.16)",
  boxShadow: "0 25px 70px rgba(0,0,0,0.52)",
  backdropFilter: "blur(13px)",
};

const heroLeft: CSSProperties = {
  display: "flex",
  gap: "22px",
  alignItems: "center",
  flexWrap: "wrap",
};

const avatarBox: CSSProperties = {
  width: "112px",
  height: "112px",
  borderRadius: "28px",
  overflow: "hidden",
  display: "grid",
  placeItems: "center",
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.22)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.55)",
};

const avatar: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const smallText: CSSProperties = {
  opacity: 0.72,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  fontSize: "0.78rem",
  fontWeight: 900,
};

const title: CSSProperties = {
  margin: "8px 0 12px",
  fontSize: "clamp(2rem, 4vw, 3.7rem)",
  lineHeight: 1,
};

const tags: CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const tag: CSSProperties = {
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.14)",
  fontWeight: 800,
  fontSize: "0.85rem",
};

const heroMoney: CSSProperties = {
  minWidth: "240px",
  padding: "20px",
  borderRadius: "22px",
  background: "rgba(0,0,0,0.38)",
  border: "1px solid rgba(255,255,255,0.13)",
  textAlign: "right",
};

const moneyLabel: CSSProperties = {
  display: "block",
  opacity: 0.7,
  marginBottom: "8px",
};

const moneyValue: CSSProperties = {
  fontSize: "2rem",
  color: "#22c55e",
};

const statsGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "14px",
};

const statCard: CSSProperties = {
  padding: "18px",
  borderRadius: "22px",
  background: "rgba(0,0,0,0.52)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
  backdropFilter: "blur(10px)",
};

const statIcon: CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "14px",
  display: "grid",
  placeItems: "center",
  marginBottom: "12px",
  background: "rgba(255,255,255,0.09)",
  border: "1px solid rgba(255,255,255,0.12)",
};

const contentGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.4fr 0.6fr",
  gap: "22px",
  alignItems: "start",
};

const cardLarge: CSSProperties = {
  padding: "22px",
  borderRadius: "26px",
  background: "rgba(0,0,0,0.55)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 18px 50px rgba(0,0,0,0.42)",
  backdropFilter: "blur(10px)",
};

const sidePanel: CSSProperties = {
  ...cardLarge,
  display: "grid",
  gap: "18px",
};

const sectionHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  marginBottom: "18px",
};

const sectionTitle: CSSProperties = {
  margin: "4px 0 0",
  fontSize: "1.45rem",
};

const badge: CSSProperties = {
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.09)",
  border: "1px solid rgba(255,255,255,0.12)",
  fontWeight: 800,
};

const deliveryList: CSSProperties = {
  display: "grid",
  gap: "13px",
  maxHeight: "560px",
  overflowY: "auto",
  paddingRight: "8px",
  scrollbarWidth: "thin",
};

const deliveryCard: CSSProperties = {
  padding: "16px",
  borderRadius: "18px",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.075), rgba(255,255,255,0.035))",
  border: "1px solid rgba(255,255,255,0.1)",
};

const deliveryTop: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
  flexWrap: "wrap",
};

const deliveryRoute: CSSProperties = {
  display: "block",
  marginBottom: "5px",
  fontSize: "1rem",
};

const deliveryMeta: CSSProperties = {
  opacity: 0.78,
  fontSize: "0.9rem",
};

const statusPill: CSSProperties = {
  fontWeight: 900,
};

const dateText: CSSProperties = {
  opacity: 0.72,
  fontSize: "0.82rem",
  marginTop: "5px",
};

const moneyGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "10px",
  marginTop: "14px",
};

const moneyLine: CSSProperties = {
  padding: "10px",
  borderRadius: "13px",
  background: "rgba(0,0,0,0.28)",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "grid",
  gap: "4px",
};

const quickActions: CSSProperties = {
  display: "grid",
  gap: "10px",
};

const driverCard: CSSProperties = {
  padding: "16px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.09)",
};

const infoLine: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "11px 0",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const emptyText: CSSProperties = {
  opacity: 0.7,
  padding: "20px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const btn: CSSProperties = {
  padding: "12px 16px",
  background: "rgba(255,255,255,0.1)",
  borderRadius: "14px",
  textDecoration: "none",
  color: "white",
  fontWeight: 900,
  border: "1px solid rgba(255,255,255,0.14)",
  textAlign: "center",
};

const btnBlue: CSSProperties = {
  ...btn,
  background: "linear-gradient(135deg, rgba(37,99,235,0.95), rgba(59,130,246,0.65))",
};

const btnGreen: CSSProperties = {
  ...btn,
  background: "linear-gradient(135deg, #16a34a, #22c55e)",
  boxShadow: "0 0 16px rgba(34,197,94,0.45)",
};