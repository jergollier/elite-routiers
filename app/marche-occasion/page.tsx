export const dynamic = "force-dynamic";

import type { CSSProperties, ReactNode } from "react";
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
      <div style={radialOverlayStyle} />

      <div style={pageStyle}>
        <div style={topButtonRowStyle}>
          <Link href="/societe" style={profileButtonStyle}>
            ← Retour accueil
          </Link>
        </div>

        <section style={heroStyle}>
          <div>
            <div style={kickerStyle}>Elite Routiers • Occasion</div>

            <h1 style={titleStyle}>Marché poids lourds</h1>

            <p style={subtitleStyle}>
              Camions d’occasion mis en vente par les entreprises du réseau.
            </p>

            <div style={tagRowStyle}>
              <Tag>{camions.length} camion(s) en vente</Tag>
              <Tag>Achat direct</Tag>
              <Tag>Marché entreprise</Tag>
            </div>
          </div>

          <div style={walletStyle}>
            <span style={walletLabelStyle}>Valeur marché</span>
            <strong style={walletValueStyle}>
              {prixTotal.toLocaleString("fr-FR")} €
            </strong>
            <span style={walletHintStyle}>Total des véhicules en vente</span>
          </div>
        </section>

        <section style={panelStyle}>
          <div style={statsGridStyle}>
            <BigStat
              title="Camions en vente"
              value={camions.length.toString()}
              detail="Catalogue occasion"
              color="#60a5fa"
              icon="🚛"
            />

            <BigStat
              title="Valeur marché"
              value={`${prixTotal.toLocaleString("fr-FR")} €`}
              detail="Total des prix de vente"
              color="#f59e0b"
              icon="💶"
            />

            <BigStat
              title="Achat"
              value="Direct"
              detail="Depuis le marché"
              color="#22c55e"
              icon="✅"
            />

            <BigStat
              title="Vendeurs"
              value="Sociétés"
              detail="Entreprises du réseau"
              color="#93c5fd"
              icon="🏢"
            />
          </div>
        </section>

        <section style={panelStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>🚚 Camions disponibles</h2>
              <p style={sectionSubtitleStyle}>
                Catalogue professionnel des véhicules mis en vente.
              </p>
            </div>

            <span style={countStyle}>{camions.length} annonce(s)</span>
          </div>

          {camions.length === 0 ? (
            <Empty>
              <div style={{ fontSize: "2rem", marginBottom: "10px" }}>🚚</div>
              <strong>Aucun camion en vente pour le moment.</strong>
              <p style={{ margin: "8px 0 0" }}>
                Les véhicules mis en vente par les entreprises apparaîtront ici.
              </p>
            </Empty>
          ) : (
            <div style={gridStyle}>
              {camions.map((camion) => {
                const etatConfig = getEtatConfig(camion.etat ?? 0);

                return (
                  <article key={camion.id} style={truckCardStyle}>
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
                            <span style={metaLabelStyle}>Kilométrage</span>
                            <strong>
                              {camion.kilometrage.toLocaleString("fr-FR")} km
                            </strong>
                          </div>

                          <div style={metaBoxStyle}>
                            <span style={metaLabelStyle}>État</span>
                            <strong>{camion.etat}%</strong>
                          </div>
                        </div>

                        <div style={conditionBarStyle}>
                          <div
                            style={{
                              width: `${Math.max(
                                0,
                                Math.min(100, camion.etat ?? 0)
                              )}%`,
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

                          <button type="submit" style={buyButtonStyle}>
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

function Tag({ children }: { children: ReactNode }) {
  return <span style={tagStyle}>{children}</span>;
}

function Empty({ children }: { children: ReactNode }) {
  return <div style={emptyBoxStyle}>{children}</div>;
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
  maxWidth: "1500px",
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
    "linear-gradient(135deg, rgba(245,158,11,0.20), rgba(245,158,11,0.07))",
  border: "1px solid rgba(245,158,11,0.28)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  boxShadow: "0 0 24px rgba(245,158,11,0.18)",
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
  color: "#fbbf24",
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

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: "18px",
};

const truckCardStyle: CSSProperties = {
  minHeight: "390px",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  borderRadius: "24px",
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.22)",
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
  fontWeight: 950,
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
  fontWeight: 950,
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
  fontWeight: 950,
};

const truckNameStyle: CSSProperties = {
  margin: "6px 0 14px",
  fontSize: "1.35rem",
  lineHeight: 1.15,
  fontWeight: 950,
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
  background: "rgba(255,255,255,0.075)",
  border: "1px solid rgba(255,255,255,0.10)",
  display: "grid",
  gap: "5px",
  fontSize: "0.82rem",
};

const metaLabelStyle: CSSProperties = {
  color: "rgba(255,255,255,0.68)",
  fontWeight: 800,
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
  fontWeight: 950,
  color: "#fbbf24",
  textShadow: "0 0 18px rgba(251,191,36,0.25)",
};

const buyButtonStyle: CSSProperties = {
  width: "100%",
  padding: "13px",
  borderRadius: "14px",
  border: "1px solid rgba(134,239,172,0.42)",
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  color: "white",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "0 0 24px rgba(34,197,94,0.28)",
};

const emptyBoxStyle: CSSProperties = {
  padding: "40px",
  borderRadius: "22px",
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.12)",
  textAlign: "center",
  color: "rgba(255,255,255,0.78)",
  fontWeight: 800,
  lineHeight: 1.6,
};