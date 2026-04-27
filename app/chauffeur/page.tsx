import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ChauffeurPage() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) redirect("/");

  const user = await prisma.user.findUnique({
    where: { steamId },
    include: {
      chauffeurStats: {
        orderBy: { createdAt: "desc" },
      },
      livraisons: {
        orderBy: { createdAt: "desc" },
        take: 15,
      },
      entreprisesCreees: true,
    },
  });

  if (!user) redirect("/");

  const membershipActif = await prisma.entrepriseMembre.findUnique({
    where: { userId: user.id },
    include: { entreprise: true },
  });

  const entreprisePossedee = user.entreprisesCreees ?? null;

  const entrepriseActuelle =
    entreprisePossedee?.nom ??
    membershipActif?.entreprise?.nom ??
    "Aucune entreprise";

  const roleActuel = entreprisePossedee
    ? "DIRECTEUR"
    : membershipActif?.role ?? "Aucun rôle";

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
      <div style={radialOverlay} />

      <Link href="/societe" style={topButton}>
        ← Société
      </Link>

      <div style={container}>
        <section style={hero}>
          <div style={heroLeft}>
            <div style={avatarBox}>
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar chauffeur" style={avatar} />
              ) : (
                <span style={{ fontSize: "2.4rem" }}>🚛</span>
              )}
            </div>

            <div>
              <div style={smallText}>Elite Routiers • Espace chauffeur</div>

              <h1 style={title}>{user.username || "Chauffeur"}</h1>

              <div style={tags}>
                <Tag>{entrepriseActuelle}</Tag>
                <Tag>{roleActuel}</Tag>
                <Tag>{user.jeuPrincipal || "Jeu non renseigné"}</Tag>
              </div>
            </div>
          </div>

          <div style={heroRight}>
            <StatBox
              label="Argent perso"
              value={`${(user.argentPerso ?? 0).toLocaleString("fr-FR")} €`}
            />
            <StatBox label="En cours" value={totalEnCours.toString()} />
            <StatBox label="Annulées" value={totalAnnulees.toString()} />
          </div>
        </section>

        <section style={grid2}>
          <Card title="Résumé chauffeur" icon="👤">
            <InfoRow label="Pseudo Steam" value={user.username || "Non renseigné"} />
            <InfoRow label="Entreprise" value={entrepriseActuelle} />
            <InfoRow label="Rôle" value={roleActuel} />
            <InfoRow label="Jeu principal" value={user.jeuPrincipal || "Non renseigné"} />
            <InfoRow label="Micro" value={user.micro ? "Oui" : "Non"} />
          </Card>

          <Card title="Performances chauffeur" icon="📊">
            <InfoRow
              label="Gains livraisons"
              value={`${totalArgentGagne.toLocaleString("fr-FR")} €`}
            />
            <InfoRow
              label="Kilomètres parcourus"
              value={`${Math.round(totalKilometres).toLocaleString("fr-FR")} km`}
            />
            <InfoRow
              label="Livraisons réussies"
              value={totalLivraisonsReussies.toString()}
            />
            <InfoRow label="Livraisons en cours" value={totalEnCours.toString()} />
            <InfoRow label="Livraisons annulées" value={totalAnnulees.toString()} />
          </Card>
        </section>

        <section style={gridMain}>
          <Card title="Dernières livraisons" icon="📦">
            {user.livraisons.length === 0 ? (
              <div style={empty}>Aucune livraison enregistrée.</div>
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

                        <div style={deliveryRight}>
                          <div style={{ ...statusPill, color: statutColor }}>
                            ● {statutLabel}
                          </div>

                          <div style={dateText}>
                            {new Date(livraison.createdAt).toLocaleString("fr-FR")}
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
          </Card>

          <Card title="Actions chauffeur" icon="⚡">
            <div style={descriptionBox}>
              Depuis cet espace, tu peux suivre tes gains, tes trajets récents,
              ton argent personnel et accéder rapidement à tes outils chauffeur.
            </div>

            <div style={actions}>
              <Link href="/societe" style={btn}>
                Retour
              </Link>

              <Link href="/profil" style={btnBlue}>
                Profil
              </Link>

              <Link href="/finance-perso" style={btnGreen}>
                Finance perso
              </Link>

              <Link href="/camions/acheter" style={btnBlue}>
                Acheter un camion
              </Link>

              <Link href="/camions/parking" style={btn}>
                Parking
              </Link>
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: ReactNode;
}) {
  return (
    <section style={card}>
      <h2 style={cardTitle}>
        <span style={cardIcon}>{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={infoRow}>
      <span style={infoLabel}>{label}</span>
      <strong style={infoValue}>{value}</strong>
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return <span style={tag}>{children}</span>;
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={statBox}>
      <strong style={statValue}>{value}</strong>
      <span style={statLabel}>{label}</span>
    </div>
  );
}

function MoneyLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={moneyLine}>
      <span style={moneyLabel}>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  backgroundImage:
    "linear-gradient(180deg, rgba(3,7,18,0.15), rgba(3,7,18,0.58) 520px), url('/truck.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center top",
  backgroundAttachment: "fixed",
  color: "white",
  padding: "24px",
  position: "relative",
  fontFamily: "Arial, sans-serif",
};

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background:
    "linear-gradient(135deg, rgba(3,7,18,0.32), rgba(8,13,28,0.18), rgba(3,7,18,0.42))",
  zIndex: 0,
  pointerEvents: "none",
};

const radialOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 0,
  pointerEvents: "none",
  background:
    "radial-gradient(circle at 52% 0%, rgba(245,158,11,0.18), transparent 34%), radial-gradient(circle at 80% 18%, rgba(37,99,235,0.14), transparent 25%)",
};

const container: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
  maxWidth: "1400px",
  margin: "0 auto",
  display: "grid",
  gap: "24px",
  paddingTop: "92px",
};

const topButton: React.CSSProperties = {
  position: "fixed",
  top: "54px",
  right: "24px",
  zIndex: 5,
  padding: "13px 22px",
  borderRadius: "999px 0 0 999px",
  color: "white",
  textDecoration: "none",
  fontWeight: 950,
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  border: "1px solid rgba(147,197,253,0.5)",
  boxShadow: "0 0 30px rgba(37,99,235,0.45)",
  backdropFilter: "blur(14px)",
};

const hero: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "28px",
  alignItems: "center",
  padding: "32px",
  borderRadius: "28px",
  background:
    "linear-gradient(135deg, rgba(8,13,28,0.62), rgba(48,28,38,0.46))",
  border: "1px solid rgba(148,163,184,0.28)",
  boxShadow: "0 34px 95px rgba(0,0,0,0.58)",
  backdropFilter: "blur(18px)",
};

const heroLeft: React.CSSProperties = {
  display: "flex",
  gap: "24px",
  alignItems: "center",
  flexWrap: "wrap",
};

const heroRight: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(120px, 1fr))",
  gap: "14px",
};

const avatarBox: React.CSSProperties = {
  width: "122px",
  height: "122px",
  borderRadius: "26px",
  overflow: "hidden",
  display: "grid",
  placeItems: "center",
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(147,197,253,0.32)",
  boxShadow: "0 0 36px rgba(37,99,235,0.26)",
};

const avatar: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const smallText: React.CSSProperties = {
  color: "#60a5fa",
  textTransform: "uppercase",
  letterSpacing: "0.16em",
  fontSize: "0.82rem",
  fontWeight: 950,
  textShadow: "0 4px 14px rgba(0,0,0,0.9)",
};

const title: React.CSSProperties = {
  margin: "8px 0 12px",
  fontSize: "clamp(2.4rem, 5vw, 4.2rem)",
  lineHeight: 0.95,
  fontWeight: 950,
  letterSpacing: "-0.06em",
  textShadow: "0 8px 28px rgba(0,0,0,0.95)",
};

const tags: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const tag: React.CSSProperties = {
  padding: "9px 16px",
  borderRadius: "999px",
  background: "rgba(37,99,235,0.22)",
  border: "1px solid rgba(96,165,250,0.34)",
  color: "#dbeafe",
  fontWeight: 950,
  fontSize: "0.88rem",
  boxShadow: "inset 0 0 18px rgba(96,165,250,0.08)",
};

const statBox: React.CSSProperties = {
  padding: "18px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.13)",
  textAlign: "center",
  boxShadow: "0 18px 45px rgba(0,0,0,0.26)",
  backdropFilter: "blur(12px)",
};

const statValue: React.CSSProperties = {
  display: "block",
  fontSize: "1.45rem",
  fontWeight: 950,
  textShadow: "0 4px 18px rgba(0,0,0,0.65)",
};

const statLabel: React.CSSProperties = {
  color: "rgba(255,255,255,0.7)",
  fontSize: "0.82rem",
  fontWeight: 850,
};

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "24px",
};

const gridMain: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.15fr 0.85fr",
  gap: "24px",
  alignItems: "start",
};

const card: React.CSSProperties = {
  padding: "24px",
  borderRadius: "26px",
  background:
    "linear-gradient(135deg, rgba(8,13,28,0.58), rgba(8,13,28,0.34))",
  border: "1px solid rgba(255,255,255,0.18)",
  boxShadow: "0 20px 55px rgba(0,0,0,0.34)",
  backdropFilter: "blur(15px)",
};

const cardTitle: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  alignItems: "center",
  margin: "0 0 20px",
  fontSize: "1.42rem",
  fontWeight: 950,
  textShadow: "0 4px 16px rgba(0,0,0,0.8)",
};

const cardIcon: React.CSSProperties = {
  width: "42px",
  height: "42px",
  display: "grid",
  placeItems: "center",
  borderRadius: "13px",
  background: "rgba(37,99,235,0.24)",
  border: "1px solid rgba(96,165,250,0.34)",
  boxShadow: "0 0 24px rgba(37,99,235,0.18)",
};

const infoRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
  padding: "13px 0",
  borderBottom: "1px solid rgba(255,255,255,0.09)",
};

const infoLabel: React.CSSProperties = {
  color: "rgba(255,255,255,0.66)",
  fontWeight: 850,
};

const infoValue: React.CSSProperties = {
  textAlign: "right",
  fontWeight: 950,
  textShadow: "0 4px 14px rgba(0,0,0,0.65)",
};

const descriptionBox: React.CSSProperties = {
  minHeight: "130px",
  padding: "18px",
  borderRadius: "18px",
  lineHeight: 1.7,
  background: "rgba(255,255,255,0.075)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "rgba(255,255,255,0.86)",
  fontWeight: 750,
  boxShadow: "inset 0 0 30px rgba(255,255,255,0.025)",
};

const actions: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginTop: "18px",
};

const btn: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: "14px",
  color: "white",
  textDecoration: "none",
  fontWeight: 950,
  background: "rgba(255,255,255,0.09)",
  border: "1px solid rgba(255,255,255,0.15)",
  boxShadow: "0 14px 28px rgba(0,0,0,0.22)",
};

const btnBlue: React.CSSProperties = {
  ...btn,
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  border: "1px solid rgba(147,197,253,0.45)",
  boxShadow: "0 0 24px rgba(37,99,235,0.32)",
};

const btnGreen: React.CSSProperties = {
  ...btn,
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  border: "1px solid rgba(74,222,128,0.45)",
  boxShadow: "0 0 24px rgba(34,197,94,0.3)",
};

const deliveryList: React.CSSProperties = {
  display: "grid",
  gap: "13px",
  maxHeight: "560px",
  overflowY: "auto",
  paddingRight: "8px",
};

const deliveryCard: React.CSSProperties = {
  padding: "16px",
  borderRadius: "17px",
  background: "rgba(255,255,255,0.075)",
  border: "1px solid rgba(255,255,255,0.1)",
  boxShadow: "0 14px 32px rgba(0,0,0,0.22)",
};

const deliveryTop: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
  flexWrap: "wrap",
};

const deliveryRoute: React.CSSProperties = {
  display: "block",
  marginBottom: "5px",
  fontWeight: 950,
};

const deliveryMeta: React.CSSProperties = {
  color: "rgba(255,255,255,0.68)",
  fontSize: "0.9rem",
  fontWeight: 800,
};

const deliveryRight: React.CSSProperties = {
  textAlign: "right",
};

const statusPill: React.CSSProperties = {
  fontWeight: 950,
};

const dateText: React.CSSProperties = {
  color: "rgba(255,255,255,0.62)",
  fontSize: "0.82rem",
  marginTop: "5px",
  fontWeight: 750,
};

const moneyGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "10px",
  marginTop: "14px",
};

const moneyLine: React.CSSProperties = {
  padding: "11px",
  borderRadius: "12px",
  background: "rgba(0,0,0,0.22)",
  border: "1px solid rgba(255,255,255,0.09)",
  display: "grid",
  gap: "4px",
};

const moneyLabel: React.CSSProperties = {
  color: "rgba(255,255,255,0.62)",
  fontWeight: 800,
};

const empty: React.CSSProperties = {
  color: "rgba(255,255,255,0.68)",
  padding: "14px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.09)",
  fontWeight: 800,
};