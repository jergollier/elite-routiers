import type { CSSProperties, ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Menu from "@/app/components/Menu";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function money(value?: number | null) {
  return `${(value ?? 0).toLocaleString("fr-FR")} €`;
}

function km(value?: number | null) {
  return `${Math.round(value ?? 0).toLocaleString("fr-FR")} km`;
}

function date(value?: Date | null) {
  if (!value) return "Non terminé";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function statusLabel(status: string) {
  if (status === "TERMINEE" || status === "FINISHED") return "Terminée";
  if (status === "ANNULEE" || status === "CANCELLED") return "Annulée";
  return "En cours";
}

function statusConfig(status: string) {
  if (status === "TERMINEE" || status === "FINISHED") {
    return {
      color: "#22c55e",
      bg: "rgba(34,197,94,0.14)",
      border: "rgba(34,197,94,0.35)",
    };
  }

  if (status === "ANNULEE" || status === "CANCELLED") {
    return {
      color: "#ef4444",
      bg: "rgba(239,68,68,0.14)",
      border: "rgba(239,68,68,0.35)",
    };
  }

  return {
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.14)",
    border: "rgba(245,158,11,0.35)",
  };
}

export default async function LivraisonDetailPage({ params }: PageProps) {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) redirect("/");

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { steamId },
    include: {
      memberships: { include: { entreprise: true } },
      entreprisesCreees: true,
    },
  });

  if (!user) redirect("/");

  const entreprise =
    user.memberships?.entreprise ?? user.entreprisesCreees ?? null;

  if (!entreprise) redirect("/societe");

  const livraison = await prisma.livraison.findFirst({
    where: {
      id,
      entrepriseId: entreprise.id,
    },
    include: {
      user: true,
      camion: true,
      remorque: true,
      pleins: true,
      livraisonCarburantSite: true,
    },
  });

  if (!livraison) notFound();

  const ecartKm =
    Math.round(livraison.distanceReelleKm ?? 0) - (livraison.kmPrevu ?? 0);

  const dureeMinutes =
    livraison.finishedAt && livraison.startedAt
      ? Math.max(
          0,
          Math.round(
            (livraison.finishedAt.getTime() -
              livraison.startedAt.getTime()) /
              60000
          )
        )
      : null;

  const dureeTexte =
    dureeMinutes === null
      ? "Mission en cours"
      : `${Math.floor(dureeMinutes / 60)}h ${dureeMinutes % 60}min`;

  const statut = statusConfig(livraison.status);

  return (
    <main style={mainStyle}>
      <div style={overlayStyle} />
      <div style={radialOverlayStyle} />

      <div style={layoutStyle}>
        <Menu />

        <section style={contentStyle}>
          <div style={topButtonRowStyle}>
            <Link href="/livraisons" style={profileButtonStyle}>
              ← Retour livraisons
            </Link>

            <Link href="/monentreprise" style={secondaryTopButtonStyle}>
              Mon entreprise
            </Link>
          </div>

          <section style={heroStyle}>
            <div>
              <div style={kickerStyle}>Elite Routiers • Feuille de route</div>

              <h1 style={titleStyle}>
                {livraison.sourceCity ?? "Départ inconnu"} →{" "}
                {livraison.destinationCity ?? "Arrivée inconnue"}
              </h1>

              <p style={subtitleStyle}>
                Mission #{livraison.id.slice(0, 8)} •{" "}
                {statusLabel(livraison.status)}
              </p>

              <div style={tagRowStyle}>
                <Tag>{entreprise.nom}</Tag>
                <Tag>[{entreprise.abreviation}]</Tag>
                <Tag>{livraison.user.username ?? livraison.user.steamId}</Tag>
              </div>
            </div>

            <div
              style={{
                ...walletStyle,
                background: `linear-gradient(135deg, ${statut.bg}, rgba(255,255,255,0.04))`,
                border: `1px solid ${statut.border}`,
              }}
            >
              <span style={walletLabelStyle}>Statut</span>
              <strong style={{ ...walletValueStyle, color: statut.color }}>
                {statusLabel(livraison.status)}
              </strong>
              <span style={walletHintStyle}>État de la mission</span>
            </div>
          </section>

          <section style={panelStyle}>
            <div style={statsGridStyle}>
              <BigStat
                title="Argent brut"
                value={money(livraison.income)}
                detail="Montant total gagné"
                color="#22c55e"
                icon="💶"
              />

              <BigStat
                title="Part société"
                value={money(livraison.gainSociete)}
                detail="Gain entreprise"
                color="#60a5fa"
                icon="🏢"
              />

              <BigStat
                title="Part chauffeur"
                value={money(livraison.gainChauffeur)}
                detail="Gain personnel"
                color="#93c5fd"
                icon="👤"
              />

              <BigStat
                title="Distance réelle"
                value={km(livraison.distanceReelleKm)}
                detail={`Écart : ${ecartKm > 0 ? "+" : ""}${ecartKm.toLocaleString(
                  "fr-FR"
                )} km`}
                color="#f59e0b"
                icon="🛣️"
              />
            </div>
          </section>

          <section style={gridStyle}>
            <Card title="🛣️ Trajet">
              <Line label="Départ" value={livraison.sourceCity ?? "Non renseigné"} />
              <Line label="Arrivée" value={livraison.destinationCity ?? "Non renseigné"} />
              <Line label="Cargaison" value={livraison.cargo ?? "Non renseignée"} />
              <Line label="Jeu" value={livraison.game ?? "Non renseigné"} />
              <Line label="Km prévus" value={km(livraison.kmPrevu)} />
              <Line label="Km réels" value={km(livraison.distanceReelleKm)} />
              <Line
                label="Écart"
                value={`${ecartKm > 0 ? "+" : ""}${ecartKm.toLocaleString(
                  "fr-FR"
                )} km`}
                highlight
              />
            </Card>

            <Card title="⏱️ Horaires">
              <Line label="Début mission" value={date(livraison.startedAt)} />
              <Line label="Fin mission" value={date(livraison.finishedAt)} />
              <Line label="Durée totale" value={dureeTexte} highlight />
              <Line label="Créée le" value={date(livraison.createdAt)} />
              <Line label="Dernière mise à jour" value={date(livraison.updatedAt)} />
            </Card>

            <Card title="🚛 Véhicule">
              <Line label="Camion télémétrie" value={livraison.truck || "Non renseigné"} />
              <Line label="Marque" value={livraison.truckBrand ?? "Non renseignée"} />
              <Line label="Modèle" value={livraison.truckModel ?? "Non renseigné"} />
              <Line
                label="Camion société"
                value={
                  livraison.camion
                    ? `${livraison.camion.marque} ${livraison.camion.modele}`
                    : "Non lié"
                }
              />
              <Line
                label="Remorque"
                value={
                  livraison.remorque
                    ? `${livraison.remorque.marque} ${livraison.remorque.modele}`
                    : "Aucune"
                }
              />
            </Card>

            <Card title="💶 Finances">
              <Line label="Argent brut gagné" value={money(livraison.income)} highlight />
              <Line label="Charges" value={money(livraison.charges)} />
              <Line label="Part société" value={money(livraison.gainSociete)} highlight />
              <Line label="Part chauffeur" value={money(livraison.gainChauffeur)} highlight />
              <Line
                label="Argent déjà ajouté"
                value={livraison.argentAjoute ? "Oui" : "Non"}
              />
            </Card>

            <Card title="💥 Dégâts remorque">
              <Line
                label="Châssis"
                value={`${Math.round(livraison.trailerDamageChassis ?? 0)}%`}
              />
              <Line
                label="Roues"
                value={`${Math.round(livraison.trailerDamageWheels ?? 0)}%`}
              />
              <Line
                label="Caisse"
                value={`${Math.round(livraison.trailerDamageBody ?? 0)}%`}
              />
              <Line
                label="Cargaison"
                value={`${Math.round(livraison.trailerCargoDamage ?? 0)}%`}
              />
              <Line
                label="Perte totale"
                value={`${livraison.pourcentagePerteRemorque ?? 0}%`}
                highlight
              />
            </Card>

            <Card title="⛽ Carburant / suivi">
              <Line label="Pleins détectés" value={`${livraison.pleins.length}`} />
              <Line
                label="Livraison carburant site"
                value={livraison.livraisonCarburantSite ? "Oui" : "Non"}
              />
              <Line label="Session" value={livraison.sessionId ?? "Non renseignée"} />
              <Line label="Device" value={livraison.deviceId ?? "Non renseigné"} />
              <Line
                label="Validée serveur"
                value={livraison.validatedByServer ? "Oui" : "Non"}
              />
            </Card>
          </section>

          <section style={panelStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <h2 style={sectionTitleStyle}>📋 Résumé feuille de route</h2>
                <p style={sectionSubtitleStyle}>
                  Synthèse complète de la mission enregistrée.
                </p>
              </div>
            </div>

            <div style={roadmapTextBoxStyle}>
              <p>
                Le chauffeur{" "}
                <strong>{livraison.user.username ?? livraison.user.steamId}</strong>{" "}
                est parti de{" "}
                <strong>{livraison.sourceCity ?? "ville inconnue"}</strong> pour
                rejoindre{" "}
                <strong>{livraison.destinationCity ?? "ville inconnue"}</strong>{" "}
                avec la cargaison{" "}
                <strong>{livraison.cargo ?? "non renseignée"}</strong>.
              </p>

              <p>
                Distance prévue : <strong>{km(livraison.kmPrevu)}</strong>.
                Distance réellement effectuée :{" "}
                <strong>{km(livraison.distanceReelleKm)}</strong>. Argent brut
                gagné : <strong>{money(livraison.income)}</strong>.
              </p>

              <p>
                Part société : <strong>{money(livraison.gainSociete)}</strong>.
                Part chauffeur :{" "}
                <strong>{money(livraison.gainChauffeur)}</strong>. Charges :{" "}
                <strong>{money(livraison.charges)}</strong>.
              </p>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={cardStyle}>
      <h2 style={cardTitleStyle}>{title}</h2>
      <div style={cardContentStyle}>{children}</div>
    </section>
  );
}

function Line({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div style={lineStyle}>
      <span style={lineLabelStyle}>{label}</span>
      <strong style={highlight ? lineValueHighlightStyle : lineValueStyle}>
        {value}
      </strong>
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return <span style={tagStyle}>{children}</span>;
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
  fontSize: "32px",
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

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
  gap: "16px",
};

const cardStyle: CSSProperties = {
  padding: "20px",
  borderRadius: "24px",
  background: "rgba(8,13,28,0.25)",
  border: "1px solid rgba(255,255,255,0.18)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.25)",
};

const cardTitleStyle: CSSProperties = {
  margin: "0 0 16px",
  fontSize: "1.25rem",
  fontWeight: 950,
};

const cardContentStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
};

const lineStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
  padding: "11px 0",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const lineLabelStyle: CSSProperties = {
  color: "rgba(255,255,255,0.62)",
  fontSize: "14px",
  fontWeight: 800,
};

const lineValueStyle: CSSProperties = {
  color: "white",
  fontSize: "14px",
  textAlign: "right",
  fontWeight: 950,
};

const lineValueHighlightStyle: CSSProperties = {
  color: "#fbbf24",
  fontSize: "14px",
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

const roadmapTextBoxStyle: CSSProperties = {
  padding: "16px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "rgba(255,255,255,0.82)",
  lineHeight: 1.7,
  fontWeight: 750,
};