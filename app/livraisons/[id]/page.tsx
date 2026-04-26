import type { CSSProperties } from "react";
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
            (livraison.finishedAt.getTime() - livraison.startedAt.getTime()) /
              60000
          )
        )
      : null;

  const dureeTexte =
    dureeMinutes === null
      ? "Mission en cours"
      : `${Math.floor(dureeMinutes / 60)}h ${dureeMinutes % 60}min`;

  return (
    <main style={mainStyle}>
      <div style={overlayStyle}>
        <Menu />

        <section style={contentStyle}>
          <div style={topStyle}>
            <div>
              <p style={eyebrowStyle}>Feuille de route</p>
              <h1 style={titleStyle}>
                {livraison.sourceCity ?? "Départ inconnu"} →{" "}
                {livraison.destinationCity ?? "Arrivée inconnue"}
              </h1>
              <p style={subtitleStyle}>
                Mission #{livraison.id.slice(0, 8)} • {statusLabel(livraison.status)}
              </p>
            </div>

            <div style={actionsStyle}>
              <Link href="/livraisons" style={ghostButtonStyle}>
                Retour livraisons
              </Link>
              <Link href="/monentreprise" style={goldButtonStyle}>
                Mon entreprise
              </Link>
            </div>
          </div>

          <div style={heroStyle}>
            <div>
              <p style={heroLabelStyle}>Société</p>
              <h2 style={heroTitleStyle}>
                {entreprise.nom}{" "}
                <span style={{ color: "#f59e0b" }}>[{entreprise.abreviation}]</span>
              </h2>
              <p style={heroTextStyle}>
                Chauffeur :{" "}
                <strong>{livraison.user.username ?? livraison.user.steamId}</strong>
              </p>
            </div>

            <div style={statusBoxStyle}>
              <span style={statusMiniStyle}>Statut</span>
              <strong>{statusLabel(livraison.status)}</strong>
            </div>
          </div>

          <div style={gridStyle}>
            <Card title="Trajet">
              <Line label="Départ" value={livraison.sourceCity ?? "Non renseigné"} />
              <Line label="Arrivée" value={livraison.destinationCity ?? "Non renseigné"} />
              <Line label="Cargaison" value={livraison.cargo ?? "Non renseignée"} />
              <Line label="Jeu" value={livraison.game ?? "Non renseigné"} />
              <Line label="Km prévus" value={km(livraison.kmPrevu)} />
              <Line label="Km réels" value={km(livraison.distanceReelleKm)} />
              <Line
                label="Écart"
                value={`${ecartKm > 0 ? "+" : ""}${ecartKm.toLocaleString("fr-FR")} km`}
              />
            </Card>

            <Card title="Horaires">
              <Line label="Début mission" value={date(livraison.startedAt)} />
              <Line label="Fin mission" value={date(livraison.finishedAt)} />
              <Line label="Durée totale" value={dureeTexte} />
              <Line label="Créée le" value={date(livraison.createdAt)} />
              <Line label="Dernière mise à jour" value={date(livraison.updatedAt)} />
            </Card>

            <Card title="Véhicule">
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

            <Card title="Finances">
              <Line label="Argent brut gagné" value={money(livraison.income)} highlight />
              <Line label="Charges" value={money(livraison.charges)} />
              <Line label="Part société" value={money(livraison.gainSociete)} highlight />
              <Line label="Part chauffeur" value={money(livraison.gainChauffeur)} highlight />
              <Line
                label="Argent déjà ajouté"
                value={livraison.argentAjoute ? "Oui" : "Non"}
              />
            </Card>

            <Card title="Dégâts remorque">
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

            <Card title="Carburant / suivi">
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
          </div>

          <div style={roadmapStyle}>
            <h2 style={roadmapTitleStyle}>Résumé feuille de route</h2>

            <p style={roadmapTextStyle}>
              Le chauffeur{" "}
              <strong>{livraison.user.username ?? livraison.user.steamId}</strong>{" "}
              est parti de <strong>{livraison.sourceCity ?? "ville inconnue"}</strong>{" "}
              pour rejoindre{" "}
              <strong>{livraison.destinationCity ?? "ville inconnue"}</strong>{" "}
              avec la cargaison{" "}
              <strong>{livraison.cargo ?? "non renseignée"}</strong>.
            </p>

            <p style={roadmapTextStyle}>
              Distance prévue : <strong>{km(livraison.kmPrevu)}</strong>. Distance
              réellement effectuée :{" "}
              <strong>{km(livraison.distanceReelleKm)}</strong>. Argent brut gagné :{" "}
              <strong>{money(livraison.income)}</strong>.
            </p>

            <p style={roadmapTextStyle}>
              Part société : <strong>{money(livraison.gainSociete)}</strong>. Part
              chauffeur : <strong>{money(livraison.gainChauffeur)}</strong>. Charges :{" "}
              <strong>{money(livraison.charges)}</strong>.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={cardStyle}>
      <h2 style={cardTitleStyle}>{title}</h2>
      <div style={cardContentStyle}>{children}</div>
    </div>
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
      <strong style={highlight ? lineValueGoldStyle : lineValueStyle}>{value}</strong>
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
  display: "flex",
  background:
    "linear-gradient(120deg, rgba(0,0,0,0.94), rgba(0,0,0,0.78), rgba(15,23,42,0.92))",
};

const contentStyle: CSSProperties = {
  width: "100%",
  padding: "34px",
};

const topStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  marginBottom: "24px",
};

const eyebrowStyle: CSSProperties = {
  margin: 0,
  color: "#f59e0b",
  fontSize: "13px",
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.16em",
};

const titleStyle: CSSProperties = {
  margin: "6px 0",
  fontSize: "34px",
  fontWeight: 950,
};

const subtitleStyle: CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.66)",
};

const actionsStyle: CSSProperties = {
  display: "flex",
  gap: "12px",
};

const ghostButtonStyle: CSSProperties = {
  textDecoration: "none",
  color: "white",
  padding: "12px 16px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.14)",
  fontWeight: 850,
};

const goldButtonStyle: CSSProperties = {
  textDecoration: "none",
  color: "black",
  padding: "12px 16px",
  borderRadius: "14px",
  background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
  fontWeight: 950,
};

const heroStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "20px",
  alignItems: "center",
  padding: "28px",
  borderRadius: "26px",
  background:
    "linear-gradient(135deg, rgba(245,158,11,0.22), rgba(15,23,42,0.78))",
  border: "1px solid rgba(245,158,11,0.28)",
  boxShadow: "0 24px 80px rgba(0,0,0,0.36)",
  marginBottom: "22px",
};

const heroLabelStyle: CSSProperties = {
  margin: 0,
  color: "#fbbf24",
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  fontSize: "12px",
};

const heroTitleStyle: CSSProperties = {
  margin: "6px 0",
  fontSize: "28px",
};

const heroTextStyle: CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.72)",
};

const statusBoxStyle: CSSProperties = {
  padding: "16px 20px",
  borderRadius: "18px",
  background: "rgba(0,0,0,0.32)",
  border: "1px solid rgba(255,255,255,0.13)",
  textAlign: "right",
};

const statusMiniStyle: CSSProperties = {
  display: "block",
  color: "rgba(255,255,255,0.55)",
  fontSize: "12px",
  marginBottom: "5px",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "16px",
  marginBottom: "22px",
};

const cardStyle: CSSProperties = {
  padding: "20px",
  borderRadius: "24px",
  background: "rgba(0,0,0,0.5)",
  border: "1px solid rgba(255,255,255,0.1)",
  backdropFilter: "blur(10px)",
};

const cardTitleStyle: CSSProperties = {
  margin: "0 0 16px",
  fontSize: "20px",
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
  borderBottom: "1px solid rgba(255,255,255,0.075)",
};

const lineLabelStyle: CSSProperties = {
  color: "rgba(255,255,255,0.56)",
  fontSize: "14px",
};

const lineValueStyle: CSSProperties = {
  color: "white",
  fontSize: "14px",
  textAlign: "right",
};

const lineValueGoldStyle: CSSProperties = {
  color: "#fbbf24",
  fontSize: "14px",
  textAlign: "right",
};

const roadmapStyle: CSSProperties = {
  padding: "24px",
  borderRadius: "26px",
  background: "rgba(15,23,42,0.74)",
  border: "1px solid rgba(255,255,255,0.1)",
  backdropFilter: "blur(10px)",
};

const roadmapTitleStyle: CSSProperties = {
  margin: "0 0 14px",
  fontSize: "24px",
};

const roadmapTextStyle: CSSProperties = {
  margin: "10px 0",
  color: "rgba(255,255,255,0.74)",
  lineHeight: 1.7,
};