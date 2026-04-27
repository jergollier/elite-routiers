import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

const ROLES_AUTORISES_ATELIER = [
  "DIRECTEUR",
  "SOUS_DIRECTEUR",
  "CHEF_ATELIER",
] as const;

const PRIX_PNEUS = 8000;
const PRIX_VIDANGE = 3000;
const PRIX_REVISION = 12000;
const PRIX_FREINS = 9500;
const PRIX_BATTERIE = 6000;
const PRIX_REPARATION_PAR_POINT = 1000;

function normaliserVille(value?: string | null) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function calculerPrixAtelier(
  prixBase: number,
  positionActuelle?: string | null,
  villeETS2?: string | null,
  villeATS?: string | null
) {
  const villeCamion = normaliserVille(positionActuelle);
  const maisonETS2 = normaliserVille(villeETS2);
  const maisonATS = normaliserVille(villeATS);

  const estMaisonMere =
    villeCamion !== "" && (villeCamion === maisonETS2 || villeCamion === maisonATS);

  const majoration = estMaisonMere ? 0 : Math.round(prixBase * 0.2);
  const prixFinal = prixBase + majoration;

  return {
    prixBase,
    majoration,
    prixFinal,
    estMaisonMere,
  };
}

function getDamageConfig(value?: number | null) {
  const safeValue = value ?? 0;

  if (safeValue >= 30) {
    return {
      color: "#ef4444",
      glow: "0 0 10px rgba(239,68,68,0.65)",
      label: `${safeValue}%`,
    };
  }

  if (safeValue >= 10) {
    return {
      color: "#f59e0b",
      glow: "0 0 10px rgba(245,158,11,0.55)",
      label: `${safeValue}%`,
    };
  }

  return {
    color: "#22c55e",
    glow: "0 0 10px rgba(34,197,94,0.45)",
    label: `${safeValue}%`,
  };
}

function getKmConfig(value?: number | null, max = 60000, warning = 5000) {
  const safeValue = value ?? 0;

  if (safeValue <= 0) {
    return {
      color: "#ef4444",
      glow: "0 0 10px rgba(239,68,68,0.65)",
      label: "Urgent",
      message: "Entretien obligatoire",
      percent: 0,
    };
  }

  if (safeValue <= warning) {
    return {
      color: "#f59e0b",
      glow: "0 0 10px rgba(245,158,11,0.55)",
      label: "À prévoir",
      message: `Attention dans ${safeValue.toLocaleString("fr-FR")} km`,
      percent: Math.max(0, Math.min(100, (safeValue / max) * 100)),
    };
  }

  return {
    color: "#22c55e",
    glow: "0 0 10px rgba(34,197,94,0.45)",
    label: "OK",
    message: "RAS",
    percent: Math.max(0, Math.min(100, (safeValue / max) * 100)),
  };
}

function getEtatGeneral(camion: {
  degatsMoteur?: number | null;
  degatsCarrosserie?: number | null;
  degatsChassis?: number | null;
  degatsRoues?: number | null;
  vidangeRestante?: number | null;
  revisionRestante?: number | null;
  pneusRestantsKm?: number | null;
  freinsRestantsKm?: number | null;
  batterieRestanteKm?: number | null;
}) {
  const totalDegats =
    (camion.degatsMoteur ?? 0) +
    (camion.degatsCarrosserie ?? 0) +
    (camion.degatsChassis ?? 0) +
    (camion.degatsRoues ?? 0);

  if (
    (camion.revisionRestante ?? 0) <= 0 ||
    (camion.pneusRestantsKm ?? 0) <= 0 ||
    (camion.freinsRestantsKm ?? 0) <= 0 ||
    (camion.batterieRestanteKm ?? 0) <= 0 ||
    totalDegats >= 80
  ) {
    return {
      label: "Camion bloqué",
      color: "#ef4444",
      glow: "0 0 14px rgba(239,68,68,0.75)",
    };
  }

  if (
    (camion.vidangeRestante ?? 0) <= 5000 ||
    (camion.revisionRestante ?? 0) <= 10000 ||
    (camion.pneusRestantsKm ?? 0) <= 7500 ||
    (camion.freinsRestantsKm ?? 0) <= 7500 ||
    (camion.batterieRestanteKm ?? 0) <= 10000 ||
    totalDegats >= 25
  ) {
    return {
      label: "À surveiller",
      color: "#f59e0b",
      glow: "0 0 14px rgba(245,158,11,0.65)",
    };
  }

  return {
    label: "Bon état",
    color: "#22c55e",
    glow: "0 0 14px rgba(34,197,94,0.55)",
  };
}

function getStatutCamionConfig(statut?: string | null) {
  switch (statut) {
    case "DISPONIBLE":
      return {
        label: "Disponible",
        color: "#22c55e",
        glow: "0 0 10px rgba(34,197,94,0.75)",
      };
    case "EN_MISSION":
      return {
        label: "En mission",
        color: "#f59e0b",
        glow: "0 0 10px rgba(245,158,11,0.75)",
      };
    case "EN_MAINTENANCE":
      return {
        label: "En maintenance",
        color: "#ef4444",
        glow: "0 0 10px rgba(239,68,68,0.75)",
      };
    default:
      return {
        label: "Inconnu",
        color: "#94a3b8",
        glow: "0 0 8px rgba(148,163,184,0.55)",
      };
  }
}

function formatTypeEntretien(type: string) {
  switch (type) {
    case "VIDANGE":
      return "Vidange";
    case "REVISION":
      return "Révision";
    case "PNEUS":
      return "Pneus";
    case "FREINS":
      return "Freins";
    case "BATTERIE":
      return "Batterie";
    case "REPARATION_GENERALE":
      return "Réparation générale";
    default:
      return type;
  }
}

async function getAtelierContext() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { steamId },
    include: {
      memberships: {
        include: {
          entreprise: true,
        },
      },
    },
  });

  if (!user || !user.memberships?.entreprise) {
    return null;
  }

  return {
    user,
    membership: user.memberships,
    entreprise: user.memberships.entreprise,
  };
}

async function faireEntretien(
  formData: FormData,
  type: "VIDANGE" | "REVISION" | "PNEUS" | "FREINS" | "BATTERIE",
  prixBase: number,
  resetData: {
    vidangeRestante?: number;
    revisionRestante?: number;
    pneusRestantsKm?: number;
    freinsRestantsKm?: number;
    batterieRestanteKm?: number;
    statut?: "DISPONIBLE" | "EN_MISSION" | "EN_MAINTENANCE";
  },
  commentaireBase: string
) {
  "use server";

  const camionId = Number(formData.get("camionId"));
  if (!camionId || Number.isNaN(camionId)) return;

  const context = await getAtelierContext();
  if (!context) return;

  const { user, membership, entreprise } = context;

  if (
    !ROLES_AUTORISES_ATELIER.includes(
      membership.role as (typeof ROLES_AUTORISES_ATELIER)[number]
    )
  ) {
    return;
  }

  const camion = await prisma.camion.findFirst({
    where: {
      id: camionId,
      entrepriseId: entreprise.id,
    },
    select: {
      id: true,
      kilometrage: true,
      positionActuelle: true,
    },
  });

  if (!camion) return;

  const prix = calculerPrixAtelier(
    prixBase,
    camion.positionActuelle,
    entreprise.villeETS2,
    entreprise.villeATS
  );

  if ((entreprise.argent ?? 0) < prix.prixFinal) return;

  await prisma.$transaction([
    prisma.camion.update({
      where: { id: camion.id },
      data: resetData,
    }),
    prisma.entreprise.update({
      where: { id: entreprise.id },
      data: {
        argent: {
          decrement: prix.prixFinal,
        },
      },
    }),
    prisma.camionEntretien.create({
      data: {
        camionId: camion.id,
        entrepriseId: entreprise.id,
        userId: user.id,
        type,
        prix: prix.prixFinal,
        kilometrageKm: camion.kilometrage ?? 0,
        commentaire: prix.estMaisonMere
          ? `${commentaireBase} à la maison mère`
          : `${commentaireBase} hors maison mère (+20%)`,
      },
    }),
  ]);

  revalidatePath(`/atelier/${camion.id}`);
  revalidatePath("/atelier");
  revalidatePath("/camions");
}

async function faireVidange(formData: FormData) {
  "use server";

  await faireEntretien(
    formData,
    "VIDANGE",
    PRIX_VIDANGE,
    {
      vidangeRestante: 60000,
    },
    "Vidange moteur complète"
  );
}

async function faireRevision(formData: FormData) {
  "use server";

  await faireEntretien(
    formData,
    "REVISION",
    PRIX_REVISION,
    {
      revisionRestante: 120000,
      statut: "DISPONIBLE",
    },
    "Révision complète du camion"
  );
}

async function changerPneus(formData: FormData) {
  "use server";

  await faireEntretien(
    formData,
    "PNEUS",
    PRIX_PNEUS,
    {
      pneusRestantsKm: 80000,
      statut: "DISPONIBLE",
    },
    "Remplacement complet des pneus camion"
  );
}

async function changerFreins(formData: FormData) {
  "use server";

  await faireEntretien(
    formData,
    "FREINS",
    PRIX_FREINS,
    {
      freinsRestantsKm: 60000,
      statut: "DISPONIBLE",
    },
    "Remplacement complet des freins"
  );
}

async function changerBatterie(formData: FormData) {
  "use server";

  await faireEntretien(
    formData,
    "BATTERIE",
    PRIX_BATTERIE,
    {
      batterieRestanteKm: 150000,
      statut: "DISPONIBLE",
    },
    "Remplacement de la batterie"
  );
}

async function reparerDegats(formData: FormData) {
  "use server";

  const camionId = Number(formData.get("camionId"));
  if (!camionId || Number.isNaN(camionId)) return;

  const context = await getAtelierContext();
  if (!context) return;

  const { user, membership, entreprise } = context;

  if (
    !ROLES_AUTORISES_ATELIER.includes(
      membership.role as (typeof ROLES_AUTORISES_ATELIER)[number]
    )
  ) {
    return;
  }

  const camion = await prisma.camion.findFirst({
    where: {
      id: camionId,
      entrepriseId: entreprise.id,
    },
    select: {
      id: true,
      kilometrage: true,
      positionActuelle: true,
      degatsMoteur: true,
      degatsCarrosserie: true,
      degatsChassis: true,
      degatsRoues: true,
    },
  });

  if (!camion) return;

  const totalDegats =
    (camion.degatsMoteur ?? 0) +
    (camion.degatsCarrosserie ?? 0) +
    (camion.degatsChassis ?? 0) +
    (camion.degatsRoues ?? 0);

  if (totalDegats <= 0) return;

  const prixBase = totalDegats * PRIX_REPARATION_PAR_POINT;

  const prix = calculerPrixAtelier(
    prixBase,
    camion.positionActuelle,
    entreprise.villeETS2,
    entreprise.villeATS
  );

  if ((entreprise.argent ?? 0) < prix.prixFinal) return;

  await prisma.$transaction([
    prisma.camion.update({
      where: { id: camion.id },
      data: {
        degatsMoteur: 0,
        degatsCarrosserie: 0,
        degatsChassis: 0,
        degatsRoues: 0,
      },
    }),
    prisma.entreprise.update({
      where: { id: entreprise.id },
      data: {
        argent: {
          decrement: prix.prixFinal,
        },
      },
    }),
    prisma.camionEntretien.create({
      data: {
        camionId: camion.id,
        entrepriseId: entreprise.id,
        userId: user.id,
        type: "REPARATION_GENERALE",
        prix: prix.prixFinal,
        kilometrageKm: camion.kilometrage ?? 0,
        commentaire: prix.estMaisonMere
          ? `Réparation des dégâts camion (${totalDegats}% cumulés) à la maison mère`
          : `Réparation des dégâts camion (${totalDegats}% cumulés) hors maison mère (+20%)`,
      },
    }),
  ]);

  revalidatePath(`/atelier/${camion.id}`);
  revalidatePath("/atelier");
  revalidatePath("/camions");
}

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function EntretienDisplay({
  icon,
  label,
  value,
  max,
  warning,
}: {
  icon: string;
  label: string;
  value?: number | null;
  max: number;
  warning: number;
}) {
  const config = getKmConfig(value, max, warning);
  const safeValue = value ?? 0;

  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={rowTopStyle}>
        <span>
          {icon} {label}
        </span>

        <span
          style={{
            color: config.color,
            textShadow: config.glow,
            fontWeight: 800,
          }}
        >
          {Math.max(0, safeValue).toLocaleString("fr-FR")} km • {config.label}
        </span>
      </div>

      {safeValue <= warning && (
        <div
          style={{
            marginBottom: "8px",
            color: config.color,
            textShadow: config.glow,
            fontSize: "13px",
            fontWeight: 800,
          }}
        >
          {safeValue <= 0
            ? "🔴 Entretien obligatoire"
            : `⚠️ Attention dans ${safeValue.toLocaleString("fr-FR")} km`}
        </div>
      )}

      <div style={barBackgroundStyle}>
        <div
          style={{
            ...barFillBaseStyle,
            width: `${config.percent}%`,
            background: config.color,
            boxShadow: config.glow,
          }}
        />
      </div>
    </div>
  );
}

export default async function AtelierCamionPage({ params }: PageProps) {
  const { id } = await params;
  const camionId = Number(id);

  if (!camionId || Number.isNaN(camionId)) {
    notFound();
  }

  const context = await getAtelierContext();

  if (!context) {
    redirect("/");
  }

  const { membership, entreprise } = context;

  const peutAgirAtelier = ROLES_AUTORISES_ATELIER.includes(
    membership.role as (typeof ROLES_AUTORISES_ATELIER)[number]
  );

  const camion = await prisma.camion.findFirst({
    where: {
      id: camionId,
      entrepriseId: entreprise.id,
    },
    select: {
      id: true,
      marque: true,
      modele: true,
      statut: true,
      positionActuelle: true,
      kilometrage: true,
      vidangeRestante: true,
      revisionRestante: true,
      pneusRestantsKm: true,
      freinsRestantsKm: true,
      batterieRestanteKm: true,
      degatsMoteur: true,
      degatsCarrosserie: true,
      degatsChassis: true,
      degatsRoues: true,
      chauffeurAttribue: {
        select: {
          username: true,
        },
      },
      entretiens: {
        orderBy: {
          createdAt: "desc",
        },
        take: 12,
        select: {
          id: true,
          type: true,
          prix: true,
          kilometrageKm: true,
          commentaire: true,
          createdAt: true,
          user: {
            select: {
              username: true,
            },
          },
        },
      },
    },
  });

  if (!camion) {
    notFound();
  }

  const moteurConfig = getDamageConfig(camion.degatsMoteur);
  const carrosserieConfig = getDamageConfig(camion.degatsCarrosserie);
  const chassisConfig = getDamageConfig(camion.degatsChassis);
  const rouesConfig = getDamageConfig(camion.degatsRoues);

  const totalDegats =
    (camion.degatsMoteur ?? 0) +
    (camion.degatsCarrosserie ?? 0) +
    (camion.degatsChassis ?? 0) +
    (camion.degatsRoues ?? 0);

  const prixVidange = calculerPrixAtelier(
    PRIX_VIDANGE,
    camion.positionActuelle,
    entreprise.villeETS2,
    entreprise.villeATS
  );

  const prixRevision = calculerPrixAtelier(
    PRIX_REVISION,
    camion.positionActuelle,
    entreprise.villeETS2,
    entreprise.villeATS
  );

  const prixPneus = calculerPrixAtelier(
    PRIX_PNEUS,
    camion.positionActuelle,
    entreprise.villeETS2,
    entreprise.villeATS
  );

  const prixFreins = calculerPrixAtelier(
    PRIX_FREINS,
    camion.positionActuelle,
    entreprise.villeETS2,
    entreprise.villeATS
  );

  const prixBatterie = calculerPrixAtelier(
    PRIX_BATTERIE,
    camion.positionActuelle,
    entreprise.villeETS2,
    entreprise.villeATS
  );

  const prixReparation = calculerPrixAtelier(
    totalDegats * PRIX_REPARATION_PAR_POINT,
    camion.positionActuelle,
    entreprise.villeETS2,
    entreprise.villeATS
  );

  const etatGeneral = getEtatGeneral(camion);
  const statutConfig = getStatutCamionConfig(camion.statut);

  const lieuPrixLabel = prixVidange.estMaisonMere
    ? "Prix maison mère"
    : "Hors maison mère : +20%";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#080b10" }}>
      

      <div
        style={{
          flex: 1,
          minHeight: "100vh",
          backgroundImage:
            "linear-gradient(rgba(5,8,15,0.62), rgba(5,8,15,0.72)), url('/atelier.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div
          style={{
            minHeight: "100vh",
            padding: "32px",
            background:
              "linear-gradient(180deg, rgba(8,11,16,0.12) 0%, rgba(8,11,16,0.28) 100%)",
          }}
        >
          <div style={topRowStyle}>
            <Link href="/atelier" style={backLinkStyle}>
              ← Retour atelier
            </Link>

            <div
              style={{
                padding: "10px 16px",
                borderRadius: "999px",
                background: peutAgirAtelier
                  ? "rgba(34,197,94,0.12)"
                  : "rgba(245,158,11,0.12)",
                border: peutAgirAtelier
                  ? "1px solid rgba(34,197,94,0.28)"
                  : "1px solid rgba(245,158,11,0.28)",
                color: peutAgirAtelier ? "#86efac" : "#fcd34d",
                fontWeight: 700,
              }}
            >
              {peutAgirAtelier ? "Actions atelier autorisées" : "Lecture seule"}
            </div>
          </div>

          <div style={heroStyle}>
            <div style={heroInnerStyle}>
              <div>
                <h1 style={heroTitleStyle}>🔧 Fiche atelier camion</h1>

                <div style={truckTitleStyle}>
                  {camion.marque} {camion.modele}
                </div>

                <div style={mutedLineStyle}>
                  Chauffeur :{" "}
                  <strong style={{ color: "#ffffff" }}>
                    {camion.chauffeurAttribue?.username ?? "Non attribué"}
                  </strong>
                </div>

                <div style={mutedLineStyle}>
                  Position :{" "}
                  <strong style={{ color: "#ffffff" }}>
                    {camion.positionActuelle ?? "Inconnue"}
                  </strong>
                </div>

                <div style={mutedLineStyle}>
                  Kilométrage :{" "}
                  <strong style={{ color: "#ffffff" }}>
                    {(camion.kilometrage ?? 0).toLocaleString("fr-FR")} km
                  </strong>
                </div>
              </div>

              <div style={statusColumnStyle}>
                <div
                  style={{
                    ...statusPillStyle,
                    color: statutConfig.color,
                    textShadow: statutConfig.glow,
                  }}
                >
                  {statutConfig.label}
                </div>

                <div
                  style={{
                    ...statusPillStyle,
                    color: etatGeneral.color,
                    textShadow: etatGeneral.glow,
                  }}
                >
                  État général : {etatGeneral.label}
                </div>

                <div
                  style={{
                    ...statusPillStyle,
                    color: prixVidange.estMaisonMere ? "#86efac" : "#fcd34d",
                  }}
                >
                  {lieuPrixLabel}
                </div>
              </div>
            </div>
          </div>

          <div style={mainGridStyle}>
            <div style={leftColumnStyle}>
              <div style={boxStyle}>
                <div style={sectionTitleStyle}>Entretien mécanique</div>

                <EntretienDisplay
                  icon="🔧"
                  label="Vidange"
                  value={camion.vidangeRestante}
                  max={60000}
                  warning={5000}
                />

                <EntretienDisplay
                  icon="🔩"
                  label="Révision"
                  value={camion.revisionRestante}
                  max={120000}
                  warning={10000}
                />

                <EntretienDisplay
                  icon="🛞"
                  label="Pneus"
                  value={camion.pneusRestantsKm}
                  max={80000}
                  warning={7500}
                />

                <EntretienDisplay
                  icon="🛑"
                  label="Freins"
                  value={camion.freinsRestantsKm}
                  max={60000}
                  warning={5000}
                />

                <EntretienDisplay
                  icon="🔋"
                  label="Batterie"
                  value={camion.batterieRestanteKm}
                  max={150000}
                  warning={10000}
                />
              </div>

              <div style={boxStyle}>
                <div style={sectionTitleStyle}>Dégâts camion</div>

                <div style={damageGridStyle}>
                  <div style={damageRowStyle}>
                    💥 Moteur :{" "}
                    <span style={damageValueStyle(moteurConfig)}>
                      {moteurConfig.label}
                    </span>
                  </div>

                  <div style={damageRowStyle}>
                    🚪 Carrosserie :{" "}
                    <span style={damageValueStyle(carrosserieConfig)}>
                      {carrosserieConfig.label}
                    </span>
                  </div>

                  <div style={damageRowStyle}>
                    🧱 Châssis :{" "}
                    <span style={damageValueStyle(chassisConfig)}>
                      {chassisConfig.label}
                    </span>
                  </div>

                  <div style={damageRowStyle}>
                    🛞 Roues :{" "}
                    <span style={damageValueStyle(rouesConfig)}>
                      {rouesConfig.label}
                    </span>
                  </div>
                </div>
              </div>

              <div style={boxStyle}>
                <div style={sectionTitleStyle}>Suivi mécanique</div>

                {camion.entretiens.length > 0 ? (
                  <div style={historyListStyle}>
                    {camion.entretiens.map((entretien) => (
                      <div key={entretien.id} style={historyCardStyle}>
                        <div style={historyHeaderStyle}>
                          <strong style={{ color: "#ffffff" }}>
                            {formatTypeEntretien(entretien.type)}
                          </strong>

                          <span style={historyDateStyle}>
                            {new Date(entretien.createdAt).toLocaleString("fr-FR")}
                          </span>
                        </div>

                        <div style={historyLineStyle}>
                          Prix :{" "}
                          <strong style={{ color: "#ffffff" }}>
                            {entretien.prix.toLocaleString("fr-FR")} €
                          </strong>
                        </div>

                        <div style={historyLineStyle}>
                          Kilométrage :{" "}
                          <strong style={{ color: "#ffffff" }}>
                            {(entretien.kilometrageKm ?? 0).toLocaleString("fr-FR")} km
                          </strong>
                        </div>

                        <div style={historyLineStyle}>
                          Par :{" "}
                          <strong style={{ color: "#ffffff" }}>
                            {entretien.user?.username ?? "Système"}
                          </strong>
                        </div>

                        {entretien.commentaire ? (
                          <div style={historyLineStyle}>
                            Détail :{" "}
                            <strong style={{ color: "#ffffff" }}>
                              {entretien.commentaire}
                            </strong>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={emptyStateStyle}>
                    Aucun entretien enregistré pour ce camion.
                  </div>
                )}
              </div>
            </div>

            <div style={rightColumnStyle}>
              <div style={boxStyle}>
                <div style={sectionTitleStyle}>Actions atelier</div>

                <div style={priceInfoStyle}>
                  {prixVidange.estMaisonMere
                    ? "✅ Camion dans la maison mère : prix normal."
                    : "⚠️ Camion hors maison mère : tous les prix sont majorés de 20%."}
                </div>

                {peutAgirAtelier ? (
                  <div style={actionsGridStyle}>
                    <form action={faireVidange}>
                      <input type="hidden" name="camionId" value={camion.id} />
                      <button type="submit" style={actionButtonStyle}>
                        🔧 Faire la vidange •{" "}
                        {prixVidange.prixFinal.toLocaleString("fr-FR")} €
                      </button>
                    </form>

                    <form action={faireRevision}>
                      <input type="hidden" name="camionId" value={camion.id} />
                      <button type="submit" style={actionButtonStyle}>
                        🔩 Faire la révision •{" "}
                        {prixRevision.prixFinal.toLocaleString("fr-FR")} €
                      </button>
                    </form>

                    <form action={changerPneus}>
                      <input type="hidden" name="camionId" value={camion.id} />
                      <button type="submit" style={actionBlueButtonStyle}>
                        🛞 Changer les pneus •{" "}
                        {prixPneus.prixFinal.toLocaleString("fr-FR")} €
                      </button>
                    </form>

                    <form action={changerFreins}>
                      <input type="hidden" name="camionId" value={camion.id} />
                      <button type="submit" style={actionOrangeButtonStyle}>
                        🛑 Changer les freins •{" "}
                        {prixFreins.prixFinal.toLocaleString("fr-FR")} €
                      </button>
                    </form>

                    <form action={changerBatterie}>
                      <input type="hidden" name="camionId" value={camion.id} />
                      <button type="submit" style={actionGreenButtonStyle}>
                        🔋 Changer la batterie •{" "}
                        {prixBatterie.prixFinal.toLocaleString("fr-FR")} €
                      </button>
                    </form>

                    <form action={reparerDegats}>
                      <input type="hidden" name="camionId" value={camion.id} />
                      <button
                        type="submit"
                        style={{
                          ...actionDangerButtonStyle,
                          opacity: totalDegats > 0 ? 1 : 0.6,
                          cursor: totalDegats > 0 ? "pointer" : "not-allowed",
                        }}
                        disabled={totalDegats <= 0}
                      >
                        💥 Réparer les dégâts
                        {totalDegats > 0
                          ? ` • ${prixReparation.prixFinal.toLocaleString("fr-FR")} €`
                          : " • Aucun dégât"}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div style={emptyStateStyle}>
                    Vous pouvez consulter la fiche, mais vous n&apos;avez pas les droits
                    pour effectuer des actions atelier.
                  </div>
                )}
              </div>

              <div style={boxStyle}>
                <div style={sectionTitleStyle}>Résumé atelier</div>

                <div style={summaryLineStyle}>
                  Société :{" "}
                  <strong style={{ color: "#ffffff" }}>{entreprise.nom}</strong>
                </div>

                <div style={summaryLineStyle}>
                  Maison mère ETS2 :{" "}
                  <strong style={{ color: "#ffffff" }}>
                    {entreprise.villeETS2 ?? "Non définie"}
                  </strong>
                </div>

                <div style={summaryLineStyle}>
                  Maison mère ATS :{" "}
                  <strong style={{ color: "#ffffff" }}>
                    {entreprise.villeATS ?? "Non définie"}
                  </strong>
                </div>

                <div style={summaryLineStyle}>
                  Argent société :{" "}
                  <strong style={{ color: "#ffffff" }}>
                    {(entreprise.argent ?? 0).toLocaleString("fr-FR")} €
                  </strong>
                </div>

                <div style={summaryLineStyle}>
                  Dernier état :{" "}
                  <strong style={{ color: etatGeneral.color }}>
                    {etatGeneral.label}
                  </strong>
                </div>

                <div style={summaryLineStyle}>
                  Total dégâts camion :{" "}
                  <strong style={{ color: "#ffffff" }}>{totalDegats}%</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const topRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
  flexWrap: "wrap" as const,
  marginBottom: "22px",
};

const heroStyle = {
  background:
    "linear-gradient(135deg, rgba(20,20,20,0.82), rgba(12,12,12,0.62))",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "24px",
  padding: "28px",
  backdropFilter: "blur(8px)",
  boxShadow:
    "0 0 20px rgba(0,0,0,0.6), inset 0 0 20px rgba(255,255,255,0.02)",
  marginBottom: "24px",
};

const heroInnerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  flexWrap: "wrap" as const,
};

const heroTitleStyle = {
  margin: 0,
  marginBottom: "10px",
  color: "#ffffff",
  fontSize: "34px",
  fontWeight: 900,
};

const truckTitleStyle = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: 800,
  marginBottom: "8px",
};

const statusColumnStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "10px",
  alignItems: "flex-end",
};

const statusPillStyle = {
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  fontWeight: 800,
  fontSize: "13px",
};

const mainGridStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.1fr) minmax(320px, 420px)",
  gap: "22px",
  alignItems: "start",
};

const leftColumnStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "22px",
};

const rightColumnStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "22px",
};

const boxStyle = {
  background:
    "linear-gradient(180deg, rgba(18,18,18,0.84), rgba(10,10,10,0.7))",
  borderRadius: "22px",
  padding: "20px",
  backdropFilter: "blur(8px)",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow:
    "0 0 20px rgba(0,0,0,0.55), inset 0 0 18px rgba(255,255,255,0.02)",
};

const sectionTitleStyle = {
  fontSize: "13px",
  color: "rgba(255,255,255,0.56)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  marginBottom: "14px",
};

const rowTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "8px",
  gap: "8px",
  color: "#ffffff",
  fontSize: "14px",
};

const barBackgroundStyle = {
  height: "8px",
  background: "rgba(255,255,255,0.08)",
  borderRadius: "999px",
  overflow: "hidden" as const,
};

const barFillBaseStyle = {
  height: "100%",
  borderRadius: "999px",
};

const mutedLineStyle = {
  color: "rgba(255,255,255,0.68)",
  fontSize: "14px",
  marginBottom: "6px",
};

const damageGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px 16px",
};

const damageRowStyle = {
  color: "#ffffff",
  fontSize: "14px",
};

function damageValueStyle(config: { color: string; glow: string }) {
  return {
    color: config.color,
    textShadow: config.glow,
    fontWeight: 800,
  };
}

const historyListStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "12px",
};

const historyCardStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "14px",
  padding: "14px",
};

const historyHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
  flexWrap: "wrap" as const,
  marginBottom: "8px",
};

const historyDateStyle = {
  color: "rgba(255,255,255,0.72)",
  fontSize: "13px",
};

const historyLineStyle = {
  color: "rgba(255,255,255,0.72)",
  fontSize: "13px",
  marginBottom: "4px",
};

const summaryLineStyle = {
  color: "rgba(255,255,255,0.72)",
  fontSize: "14px",
  marginBottom: "8px",
};

const emptyStateStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "14px",
  padding: "14px",
  color: "rgba(255,255,255,0.78)",
  lineHeight: 1.6,
};

const priceInfoStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "14px",
  padding: "12px",
  color: "rgba(255,255,255,0.82)",
  fontSize: "14px",
  marginBottom: "14px",
};

const actionsGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "12px",
};

const actionButtonStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
  boxShadow: "0 0 14px rgba(255,255,255,0.04)",
};

const actionBlueButtonStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(59,130,246,0.24)",
  background: "rgba(59,130,246,0.14)",
  color: "#bfdbfe",
  fontWeight: "bold",
  cursor: "pointer",
  boxShadow: "0 0 14px rgba(59,130,246,0.08)",
};

const actionOrangeButtonStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(245,158,11,0.24)",
  background: "rgba(245,158,11,0.14)",
  color: "#fde68a",
  fontWeight: "bold",
  cursor: "pointer",
  boxShadow: "0 0 14px rgba(245,158,11,0.08)",
};

const actionGreenButtonStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(34,197,94,0.24)",
  background: "rgba(34,197,94,0.14)",
  color: "#bbf7d0",
  fontWeight: "bold",
  cursor: "pointer",
  boxShadow: "0 0 14px rgba(34,197,94,0.08)",
};

const actionDangerButtonStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(239,68,68,0.22)",
  background: "rgba(239,68,68,0.14)",
  color: "#fecaca",
  fontWeight: "bold",
  boxShadow: "0 0 14px rgba(239,68,68,0.08)",
};

const backLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 14px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: 700,
};