export const dynamic = "force-dynamic";

import type { CSSProperties } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

function formatMarque(marque: string) {
  return marque
    .replace("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function getEtatConfig(etat: number) {
  if (etat >= 80) return { label: "Excellent", color: "#22c55e" };
  if (etat >= 55) return { label: "Correct", color: "#f59e0b" };
  return { label: "À réviser", color: "#ef4444" };
}

export default async function MarcheOccasionPage() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) redirect("/");

  const camions = await prisma.camion.findMany({
    where: {
      aVendre: true,
      actif: true,
    },
    include: {
      entreprise: true,
    },
    orderBy: {
      misEnVenteAt: "desc",
    },
  });

  const prixTotal = camions.reduce(
    (total, camion) => total + (camion.prixVente ?? 0),
    0
  );

  return (
    <main style={mainStyle}>
      <div style={overlayStyle} />

      <div style={pageStyle}>
        <header style={heroStyle}>
          <div>
            <div style={brandStyle}>🚛 ELITE ROUTIERS • OCCASION</div>

            <h1 style={titleStyle}>Marché poids lourds</h1>

            <p style={subtitleStyle}>
              Camions d’occasion mis en vente par les entreprises du réseau.
            </p>
          </div>

          <div style={heroRightStyle}>
            <div style={statBoxStyle}>
              <strong>{camions.length}</strong>
              <span>En vente</span>
            </div>

            <div style={statBoxStyle}>
              <strong>{prixTotal.toLocaleString("fr-FR")} €</strong>
              <span>Valeur marché</span>
            </div>

            <Link href="/societe" style={backButton}>
              ← Retour accueil
            </Link>
          </div>
        </header>

        <section style={marketPanelStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <div style={smallTitleStyle}>Catalogue professionnel</div>
              <h2 style={sectionTitleStyle}>Camions disponibles</h2>
            </div>

            <div style={infoBadgeStyle}>
              Achat direct depuis le marché occasion
            </div>
          </div>

          {camions.length === 0 ? (
            <div style={emptyBoxStyle}>
              <div style={{ fontSize: "2rem", marginBottom: "10px" }}>🚚</div>
              <strong>Aucun camion en vente pour le moment.</strong>
              <p style={{ margin: "8px 0 0", opacity: 0.75 }}>
                Les véhicules mis en vente par les entreprises apparaîtront ici.
              </p>
            </div>
          ) : (
            <div style={gridStyle}>
              {camions.map((camion) => {
                const etatConfig = getEtatConfig(camion.etat ?? 0);

                return (
                  <article key={camion.id} style={cardStyle}>
                    <div
                      style={{
                        ...imageStyle,
                        backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.78)), url('${
                          camion.image || "/truck.jpg"
                        }')`,
                      }}
                    >
                      <div style={sellerBadgeStyle}>
                        {camion.entreprise?.nom ?? "Entreprise"}
                      </div>

                      <div
                        style={{
                          ...etatBadgeStyle,
                          borderColor: `${etatConfig.color}66`,
                          color: etatConfig.color,
                        }}
                      >
                        {etatConfig.label}
                      </div>
                    </div>

                    <div style={cardBodyStyle}>
                      <div>
                        <div style={truckBrandStyle}>
                          {formatMarque(camion.marque)}
                        </div>

                        <h3 style={truckNameStyle}>{camion.modele}</h3>

                        <div style={metaGridStyle}>
                          <div style={metaBoxStyle}>
                            <span>Kilométrage</span>
                            <strong>
                              {camion.kilometrage.toLocaleString("fr-FR")} km
                            </strong>
                          </div>

                          <div style={metaBoxStyle}>
                            <span>État</span>
                            <strong>{camion.etat}%</strong>
                          </div>
                        </div>

                        <div style={conditionBarStyle}>
                          <div
                            style={{
                              width: `${Math.max(0, Math.min(100, camion.etat ?? 0))}%`,
                              height: "100%",
                              borderRadius: "999px",
                              background: etatConfig.color,
                              boxShadow: `0 0 14px ${etatConfig.color}`,
                            }}
                          />
                        </div>
                      </div>

                      <div style={bottomStyle}>
                        <div>
                          <div style={priceLabelStyle}>Prix de vente</div>
                          <div style={priceStyle}>
                            {(camion.prixVente ?? 0).toLocaleString("fr-FR")} €
                          </div>
                        </div>

                        <form action="/api/camions/acheter" method="POST">
                          <input
                            type="hidden"
                            name="camionId"
                            value={camion.id}
                          />

                          <button type="submit" style={buyButton}>
                            Acheter ce camion
                          </button>
                        </form>
                      </div>
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

const mainStyle: CSSProperties = {
  minHeight: "100vh",
  position: "relative",
  color: "white",
  backgroundImage:
    "linear-gradient(90deg, rgba(0,0,0,0.88), rgba(0,0,0,0.55), rgba(0,0,0,0.88)), url('/truck.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundAttachment: "fixed",
};

const overlayStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,0.2)",
};

const pageStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  minHeight: "100vh",
  padding: "24px",
};

const heroStyle: CSSProperties = {
  maxWidth: "1500px",
  margin: "0 auto 24px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "24px",
  padding: "30px",
  borderRadius: "30px",
  background:
    "linear-gradient(135deg, rgba(0,0,0,0.42), rgba(255,255,255,0.08))",
  border: "1px solid rgba(255,255,255,0.18)",
  backdropFilter: "blur(16px)",
  boxShadow: "0 26px 90px rgba(0,0,0,0.6)",
};

const brandStyle: CSSProperties = {
  color: "#fbbf24",
  fontSize: "0.95rem",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  fontWeight: 900,
};

const titleStyle: CSSProperties = {
  margin: "10px 0 8px",
  fontSize: "3.3rem",
  lineHeight: 1,
  fontWeight: 900,
  textShadow: "0 5px 25px rgba(0,0,0,0.65)",
};

const subtitleStyle: CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.72)",
  fontWeight: 700,
};

const heroRightStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "12px",
  flexWrap: "wrap",
};

const statBoxStyle: CSSProperties = {
  minWidth: "120px",
  minHeight: "82px",
  display: "grid",
  placeItems: "center",
  borderRadius: "20px",
  background: "rgba(0,0,0,0.42)",
  border: "1px solid rgba(255,255,255,0.14)",
  fontWeight: 900,
};

const backButton: CSSProperties = {
  padding: "13px 18px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.09)",
  border: "1px solid rgba(255,255,255,0.16)",
  color: "white",
  textDecoration: "none",
  fontWeight: 900,
};

const marketPanelStyle: CSSProperties = {
  maxWidth: "1500px",
  margin: "0 auto",
  padding: "24px",
  borderRadius: "30px",
  background: "rgba(0,0,0,0.42)",
  border: "1px solid rgba(255,255,255,0.15)",
  backdropFilter: "blur(16px)",
  boxShadow: "0 26px 90px rgba(0,0,0,0.58)",
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
  marginBottom: "24px",
};

const smallTitleStyle: CSSProperties = {
  color: "#93c5fd",
  textTransform: "uppercase",
  letterSpacing: "0.13em",
  fontSize: "0.76rem",
  fontWeight: 900,
};

const sectionTitleStyle: CSSProperties = {
  margin: "6px 0 0",
  fontSize: "2.2rem",
  lineHeight: 1,
};

const infoBadgeStyle: CSSProperties = {
  padding: "12px 16px",
  borderRadius: "999px",
  background: "rgba(251,191,36,0.12)",
  border: "1px solid rgba(251,191,36,0.28)",
  color: "#fde68a",
  fontWeight: 900,
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "18px",
};

const cardStyle: CSSProperties = {
  minHeight: "390px",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  borderRadius: "24px",
  background: "rgba(8,13,24,0.82)",
  border: "1px solid rgba(255,255,255,0.14)",
  boxShadow: "0 22px 60px rgba(0,0,0,0.48)",
};

const imageStyle: CSSProperties = {
  height: "170px",
  backgroundSize: "cover",
  backgroundPosition: "center",
  position: "relative",
};

const sellerBadgeStyle: CSSProperties = {
  position: "absolute",
  left: "14px",
  bottom: "14px",
  maxWidth: "75%",
  padding: "7px 11px",
  borderRadius: "999px",
  background: "rgba(0,0,0,0.62)",
  border: "1px solid rgba(255,255,255,0.18)",
  fontWeight: 900,
  fontSize: "0.8rem",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const etatBadgeStyle: CSSProperties = {
  position: "absolute",
  right: "14px",
  top: "14px",
  padding: "7px 11px",
  borderRadius: "999px",
  background: "rgba(0,0,0,0.62)",
  border: "1px solid",
  fontWeight: 900,
  fontSize: "0.78rem",
};

const cardBodyStyle: CSSProperties = {
  padding: "16px",
  display: "flex",
  flexDirection: "column",
  flex: 1,
};

const truckBrandStyle: CSSProperties = {
  color: "#93c5fd",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  fontSize: "0.72rem",
  fontWeight: 900,
};

const truckNameStyle: CSSProperties = {
  margin: "6px 0 14px",
  fontSize: "1.35rem",
  lineHeight: 1.15,
};

const metaGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
  marginBottom: "12px",
};

const metaBoxStyle: CSSProperties = {
  padding: "11px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.065)",
  border: "1px solid rgba(255,255,255,0.10)",
  display: "grid",
  gap: "5px",
  fontSize: "0.82rem",
};

const conditionBarStyle: CSSProperties = {
  width: "100%",
  height: "10px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.10)",
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.08)",
};

const bottomStyle: CSSProperties = {
  marginTop: "auto",
  display: "grid",
  gap: "12px",
};

const priceLabelStyle: CSSProperties = {
  color: "rgba(255,255,255,0.62)",
  fontSize: "0.8rem",
  fontWeight: 800,
};

const priceStyle: CSSProperties = {
  fontSize: "1.8rem",
  fontWeight: 900,
  color: "#fbbf24",
  textShadow: "0 0 18px rgba(251,191,36,0.25)",
};

const buyButton: CSSProperties = {
  width: "100%",
  padding: "13px",
  borderRadius: "14px",
  border: "1px solid rgba(134,239,172,0.42)",
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 0 24px rgba(34,197,94,0.28)",
};

const emptyBoxStyle: CSSProperties = {
  padding: "40px",
  borderRadius: "22px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  textAlign: "center",
};