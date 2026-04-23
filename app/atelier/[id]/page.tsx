import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import Menu from "@/app/components/Menu";
import { prisma } from "@/lib/prisma";

const ROLES_AUTORISES_ATELIER = [
  "DIRECTEUR",
  "SOUS_DIRECTEUR",
  "CHEF_ATELIER",
] as const;

const PRIX_PNEUS = 8000;
const PRIX_VIDANGE = 3000;
const PRIX_REVISION = 12000;
const PRIX_REPARATION_PAR_POINT = 1000;

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
      percent: 0,
    };
  }

  if (safeValue <= warning) {
    return {
      color: "#f59e0b",
      glow: "0 0 10px rgba(245,158,11,0.55)",
      label: "À prévoir",
      percent: Math.max(0, Math.min(100, (safeValue / max) * 100)),
    };
  }

  return {
    color: "#22c55e",
    glow: "0 0 10px rgba(34,197,94,0.45)",
    label: "OK",
    percent: Math.max(0, Math.min(100, (safeValue / max) * 100)),
  };
}

function getPneusConfig(value?: number | null) {
  return getKmConfig(value, 100000, 15000);
}

function getFreinsConfig(value?: number | null) {
  return getKmConfig(value, 60000, 10000);
}

function getBatterieConfig(value?: number | null) {
  return getKmConfig(value, 150000, 20000);
}

function getEtatGeneral(camion: {
  degatsMoteur?: number | null;
  degatsCarrosserie?: number | null;
  degatsChassis?: number | null;
  degatsRoues?: number | null;
  vidangeRestante?: number | null;
  revisionRestante?: number | null;
  pneusRestantsKm?: number | null;
}) {
  const vidangeRestante = camion.vidangeRestante ?? 0;
  const revisionRestante = camion.revisionRestante ?? 0;
  const pneusRestantsKm = camion.pneusRestantsKm ?? 0;

  const totalDegats =
    (camion.degatsMoteur ?? 0) +
    (camion.degatsCarrosserie ?? 0) +
    (camion.degatsChassis ?? 0) +
    (camion.degatsRoues ?? 0);

  if (
    vidangeRestante <= 0 ||
    revisionRestante <= 0 ||
    pneusRestantsKm <= 0 ||
    totalDegats >= 80
  ) {
    return {
      label: "Critique",
      color: "#ef4444",
      glow: "0 0 14px rgba(239,68,68,0.75)",
    };
  }

  if (
    vidangeRestante <= 5000 ||
    revisionRestante <= 10000 ||
    pneusRestantsKm <= 15000 ||
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

async function changerPneus(formData: FormData) {
  "use server";

  const camionId = Number(formData.get("camionId"));
  if (!camionId || Number.isNaN(camionId)) return;

  const context = await getAtelierContext();
  if (!context) return;

  const { user, membership, entreprise } = context;

  if (!ROLES_AUTORISES_ATELIER.includes(membership.role as (typeof ROLES_AUTORISES_ATELIER)[number])) {
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
      pneusRestantsKm: true,
    },
  });

  if (!camion) return;
  if ((entreprise.argent ?? 0) < PRIX_PNEUS) return;

  await prisma.$transaction([
    prisma.camion.update({
      where: { id: camion.id },
      data: {
        pneusRestantsKm: 100000,
      },
    }),
    prisma.entreprise.update({
      where: { id: entreprise.id },
      data: {
        argent: {
          decrement: PRIX_PNEUS,
        },
      },
    }),
    prisma.camionEntretien.create({
      data: {
        camionId: camion.id,
        entrepriseId: entreprise.id,
        userId: user.id,
        type: "PNEUS",
        prix: PRIX_PNEUS,
        kilometrageKm: camion.kilometrage ?? 0,
        commentaire: "Remplacement complet des pneus camion",
      },
    }),
  ]);

  revalidatePath(`/atelier/${camion.id}`);
  revalidatePath("/atelier");
  revalidatePath("/camions");
}

async function faireVidange(formData: FormData) {
  "use server";

  const camionId = Number(formData.get("camionId"));
  if (!camionId || Number.isNaN(camionId)) return;

  const context = await getAtelierContext();
  if (!context) return;

  const { user, membership, entreprise } = context;

  if (!ROLES_AUTORISES_ATELIER.includes(membership.role as (typeof ROLES_AUTORISES_ATELIER)[number])) {
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
    },
  });

  if (!camion) return;
  if ((entreprise.argent ?? 0) < PRIX_VIDANGE) return;

  await prisma.$transaction([
    prisma.camion.update({
      where: { id: camion.id },
      data: {
        vidangeRestante: 60000,
      },
    }),
    prisma.entreprise.update({
      where: { id: entreprise.id },
      data: {
        argent: {
          decrement: PRIX_VIDANGE,
        },
      },
    }),
    prisma.camionEntretien.create({
      data: {
        camionId: camion.id,
        entrepriseId: entreprise.id,
        userId: user.id,
        type: "VIDANGE",
        prix: PRIX_VIDANGE,
        kilometrageKm: camion.kilometrage ?? 0,
        commentaire: "Vidange moteur complète",
      },
    }),
  ]);

  revalidatePath(`/atelier/${camion.id}`);
  revalidatePath("/atelier");
  revalidatePath("/camions");
}

async function faireRevision(formData: FormData) {
  "use server";

  const camionId = Number(formData.get("camionId"));
  if (!camionId || Number.isNaN(camionId)) return;

  const context = await getAtelierContext();
  if (!context) return;

  const { user, membership, entreprise } = context;

  if (!ROLES_AUTORISES_ATELIER.includes(membership.role as (typeof ROLES_AUTORISES_ATELIER)[number])) {
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
    },
  });

  if (!camion) return;
  if ((entreprise.argent ?? 0) < PRIX_REVISION) return;

  await prisma.$transaction([
    prisma.camion.update({
      where: { id: camion.id },
      data: {
        revisionRestante: 120000,
      },
    }),
    prisma.entreprise.update({
      where: { id: entreprise.id },
      data: {
        argent: {
          decrement: PRIX_REVISION,
        },
      },
    }),
    prisma.camionEntretien.create({
      data: {
        camionId: camion.id,
        entrepriseId: entreprise.id,
        userId: user.id,
        type: "REVISION",
        prix: PRIX_REVISION,
        kilometrageKm: camion.kilometrage ?? 0,
        commentaire: "Révision complète du camion",
      },
    }),
  ]);

  revalidatePath(`/atelier/${camion.id}`);
  revalidatePath("/atelier");
  revalidatePath("/camions");
}

async function reparerDegats(formData: FormData) {
  "use server";

  const camionId = Number(formData.get("camionId"));
  if (!camionId || Number.isNaN(camionId)) return;

  const context = await getAtelierContext();
  if (!context) return;

  const { user, membership, entreprise } = context;

  if (!ROLES_AUTORISES_ATELIER.includes(membership.role as (typeof ROLES_AUTORISES_ATELIER)[number])) {
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

  const prix = totalDegats * PRIX_REPARATION_PAR_POINT;
  if ((entreprise.argent ?? 0) < prix) return;

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
          decrement: prix,
        },
      },
    }),
    prisma.camionEntretien.create({
      data: {
        camionId: camion.id,
        entrepriseId: entreprise.id,
        userId: user.id,
        type: "REPARATION_GENERALE",
        prix,
        kilometrageKm: camion.kilometrage ?? 0,
        commentaire: `Réparation des dégâts camion (${totalDegats}% cumulés)`,
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

  const vidangeConfig = getKmConfig(camion.vidangeRestante, 60000, 5000);
  const revisionConfig = getKmConfig(camion.revisionRestante, 120000, 10000);
  const pneusConfig = getPneusConfig(camion.pneusRestantsKm);
  const freinsConfig = getFreinsConfig(camion.freinsRestantsKm);
  const batterieConfig = getBatterieConfig(camion.batterieRestanteKm);

  const moteurConfig = getDamageConfig(camion.degatsMoteur);
  const carrosserieConfig = getDamageConfig(camion.degatsCarrosserie);
  const chassisConfig = getDamageConfig(camion.degatsChassis);
  const rouesConfig = getDamageConfig(camion.degatsRoues);

  const totalDegats =
    (camion.degatsMoteur ?? 0) +
    (camion.degatsCarrosserie ?? 0) +
    (camion.degatsChassis ?? 0) +
    (camion.degatsRoues ?? 0);

  const prixReparation = totalDegats * PRIX_REPARATION_PAR_POINT;

  const etatGeneral = getEtatGeneral(camion);
  const statutConfig = getStatutCamionConfig(camion.statut);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#080b10",
      }}
    >
      <Menu />

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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
              marginBottom: "22px",
            }}
          >
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
              {peutAgirAtelier
                ? "Actions atelier autorisées"
                : "Lecture seule"}
            </div>
          </div>

          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(20,20,20,0.82), rgba(12,12,12,0.62))",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "24px",
              padding: "28px",
              backdropFilter: "blur(8px)",
              boxShadow:
                "0 0 20px rgba(0,0,0,0.6), inset 0 0 20px rgba(255,255,255,0.02)",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <h1
                  style={{
                    margin: 0,
                    marginBottom: "10px",
                    color: "#ffffff",
                    fontSize: "34px",
                    fontWeight: 900,
                  }}
                >
                  🔧 Fiche atelier camion
                </h1>

                <div
                  style={{
                    color: "#ffffff",
                    fontSize: "24px",
                    fontWeight: 800,
                    marginBottom: "8px",
                  }}
                >
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

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  alignItems: "flex-end",
                }}
              >
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: statutConfig.color,
                    fontWeight: 700,
                    fontSize: "13px",
                    textShadow: statutConfig.glow,
                  }}
                >
                  {statutConfig.label}
                </div>

                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: etatGeneral.color,
                    fontWeight: 800,
                    textShadow: etatGeneral.glow,
                  }}
                >
                  État général : {etatGeneral.label}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.1fr) minmax(320px, 420px)",
              gap: "22px",
              alignItems: "start",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "22px",
              }}
            >
              <div style={boxStyle}>
                <div style={sectionTitleStyle}>Entretien mécanique</div>

                <div style={{ marginBottom: "16px" }}>
                  <div style={rowTopStyle}>
                    <span>🔧 Vidange</span>
                    <span
                      style={{
                        color: vidangeConfig.color,
                        textShadow: vidangeConfig.glow,
                      }}
                    >
                      {Math.max(0, camion.vidangeRestante ?? 0).toLocaleString("fr-FR")} km •{" "}
                      {vidangeConfig.label}
                    </span>
                  </div>
                  <div style={barBackgroundStyle}>
                    <div
                      style={{
                        ...barFillBaseStyle,
                        width: `${vidangeConfig.percent}%`,
                        background: vidangeConfig.color,
                        boxShadow: vidangeConfig.glow,
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <div style={rowTopStyle}>
                    <span>🔩 Révision</span>
                    <span
                      style={{
                        color: revisionConfig.color,
                        textShadow: revisionConfig.glow,
                      }}
                    >
                      {Math.max(0, camion.revisionRestante ?? 0).toLocaleString("fr-FR")} km •{" "}
                      {revisionConfig.label}
                    </span>
                  </div>
                  <div style={barBackgroundStyle}>
                    <div
                      style={{
                        ...barFillBaseStyle,
                        width: `${revisionConfig.percent}%`,
                        background: revisionConfig.color,
                        boxShadow: revisionConfig.glow,
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <div style={rowTopStyle}>
                    <span>🛞 Pneus</span>
                    <span
                      style={{
                        color: pneusConfig.color,
                        textShadow: pneusConfig.glow,
                      }}
                    >
                      {Math.max(0, camion.pneusRestantsKm ?? 0).toLocaleString("fr-FR")} km •{" "}
                      {pneusConfig.label}
                    </span>
                  </div>
                  <div style={barBackgroundStyle}>
                    <div
                      style={{
                        ...barFillBaseStyle,
                        width: `${pneusConfig.percent}%`,
                        background: pneusConfig.color,
                        boxShadow: pneusConfig.glow,
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <div style={rowTopStyle}>
                    <span>🟥 Freins</span>
                    <span
                      style={{
                        color: freinsConfig.color,
                        textShadow: freinsConfig.glow,
                      }}
                    >
                      {Math.max(0, camion.freinsRestantsKm ?? 0).toLocaleString("fr-FR")} km •{" "}
                      {freinsConfig.label}
                    </span>
                  </div>
                  <div style={barBackgroundStyle}>
                    <div
                      style={{
                        ...barFillBaseStyle,
                        width: `${freinsConfig.percent}%`,
                        background: freinsConfig.color,
                        boxShadow: freinsConfig.glow,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={rowTopStyle}>
                    <span>🔋 Batterie</span>
                    <span
                      style={{
                        color: batterieConfig.color,
                        textShadow: batterieConfig.glow,
                      }}
                    >
                      {Math.max(0, camion.batterieRestanteKm ?? 0).toLocaleString("fr-FR")} km •{" "}
                      {batterieConfig.label}
                    </span>
                  </div>
                  <div style={barBackgroundStyle}>
                    <div
                      style={{
                        ...barFillBaseStyle,
                        width: `${batterieConfig.percent}%`,
                        background: batterieConfig.color,
                        boxShadow: batterieConfig.glow,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={boxStyle}>
                <div style={sectionTitleStyle}>Dégâts camion</div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px 16px",
                  }}
                >
                  <div style={damageRowStyle}>
                    💥 Moteur :{" "}
                    <span
                      style={{
                        color: moteurConfig.color,
                        textShadow: moteurConfig.glow,
                        fontWeight: 800,
                      }}
                    >
                      {moteurConfig.label}
                    </span>
                  </div>

                  <div style={damageRowStyle}>
                    🚪 Carrosserie :{" "}
                    <span
                      style={{
                        color: carrosserieConfig.color,
                        textShadow: carrosserieConfig.glow,
                        fontWeight: 800,
                      }}
                    >
                      {carrosserieConfig.label}
                    </span>
                  </div>

                  <div style={damageRowStyle}>
                    🧱 Châssis :{" "}
                    <span
                      style={{
                        color: chassisConfig.color,
                        textShadow: chassisConfig.glow,
                        fontWeight: 800,
                      }}
                    >
                      {chassisConfig.label}
                    </span>
                  </div>

                  <div style={damageRowStyle}>
                    🛞 Roues :{" "}
                    <span
                      style={{
                        color: rouesConfig.color,
                        textShadow: rouesConfig.glow,
                        fontWeight: 800,
                      }}
                    >
                      {rouesConfig.label}
                    </span>
                  </div>
                </div>
              </div>

              <div style={boxStyle}>
                <div style={sectionTitleStyle}>Suivi mécanique</div>

                {camion.entretiens.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {camion.entretiens.map((entretien) => (
                      <div
                        key={entretien.id}
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: "14px",
                          padding: "14px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "10px",
                            flexWrap: "wrap",
                            marginBottom: "8px",
                          }}
                        >
                          <strong style={{ color: "#ffffff" }}>
                            {formatTypeEntretien(entretien.type)}
                          </strong>

                          <span
                            style={{
                              color: "rgba(255,255,255,0.72)",
                              fontSize: "13px",
                            }}
                          >
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

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "22px",
              }}
            >
              <div style={boxStyle}>
                <div style={sectionTitleStyle}>Actions atelier</div>

                {peutAgirAtelier ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr",
                      gap: "12px",
                    }}
                  >
                    <form action={faireVidange}>
                      <input type="hidden" name="camionId" value={camion.id} />
                      <button type="submit" style={actionButtonStyle}>
                        🔧 Faire la vidange • {PRIX_VIDANGE.toLocaleString("fr-FR")} €
                      </button>
                    </form>

                    <form action={faireRevision}>
                      <input type="hidden" name="camionId" value={camion.id} />
                      <button type="submit" style={actionButtonStyle}>
                        🔩 Faire la révision • {PRIX_REVISION.toLocaleString("fr-FR")} €
                      </button>
                    </form>

                    <form action={changerPneus}>
                      <input type="hidden" name="camionId" value={camion.id} />
                      <button type="submit" style={actionBlueButtonStyle}>
                        🛞 Changer les pneus • {PRIX_PNEUS.toLocaleString("fr-FR")} €
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
                          ? ` • ${prixReparation.toLocaleString("fr-FR")} €`
                          : " • Aucun dégât"}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div style={emptyStateStyle}>
                    Vous pouvez consulter la fiche, mais vous n&apos;avez pas les
                    droits pour effectuer des actions atelier.
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
                  Argent société :{" "}
                  <strong style={{ color: "#ffffff" }}>
                    {entreprise.argent.toLocaleString("fr-FR")} €
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

const damageRowStyle = {
  color: "#ffffff",
  fontSize: "14px",
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