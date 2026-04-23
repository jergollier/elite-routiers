import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Menu from "@/app/components/Menu";
import { prisma } from "@/lib/prisma";

const ROLES_AUTORISES_ATELIER = [
  "DIRECTEUR",
  "SOUS_DIRECTEUR",
  "CHEF_ATELIER",
] as const;

const PRIX_REPARATION_PAR_POINT = 1000;
const PRIX_PNEUS = 8000;

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

async function reparerDegats(formData: FormData) {
  "use server";

  const camionId = Number(formData.get("camionId"));
  if (!camionId || Number.isNaN(camionId)) {
    return;
  }

  const context = await getAtelierContext();
  if (!context) {
    return;
  }

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

  if (!camion) {
    return;
  }

  const totalDegats =
    (camion.degatsMoteur ?? 0) +
    (camion.degatsCarrosserie ?? 0) +
    (camion.degatsChassis ?? 0) +
    (camion.degatsRoues ?? 0);

  if (totalDegats <= 0) {
    return;
  }

  const prix = totalDegats * PRIX_REPARATION_PAR_POINT;

  if ((entreprise.argent ?? 0) < prix) {
    return;
  }

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

  revalidatePath("/atelier");
  revalidatePath("/mon-entreprise");
  revalidatePath("/camions");
}

async function changerPneus(formData: FormData) {
  "use server";

  const camionId = Number(formData.get("camionId"));
  if (!camionId || Number.isNaN(camionId)) {
    return;
  }

  const context = await getAtelierContext();
  if (!context) {
    return;
  }

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

  if (!camion) {
    return;
  }

  if ((entreprise.argent ?? 0) < PRIX_PNEUS) {
    return;
  }

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

  revalidatePath("/atelier");
  revalidatePath("/mon-entreprise");
  revalidatePath("/camions");
}

export default async function AtelierPage() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) {
    redirect("/");
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

  if (!user) {
    redirect("/");
  }

  if (!user.memberships?.entreprise) {
    redirect("/societe");
  }

  const membership = user.memberships;
  const entreprise = membership.entreprise;

  const peutAgirAtelier = ROLES_AUTORISES_ATELIER.includes(
    membership.role as (typeof ROLES_AUTORISES_ATELIER)[number]
  );

  const camions = await prisma.camion.findMany({
    where: {
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
    },
    orderBy: {
      id: "desc",
    },
  });

  const totalCamions = camions.length;

  const totalCritiques = camions.filter((camion) => {
    return getEtatGeneral(camion).label === "Critique";
  }).length;

  const totalASurveiller = camions.filter((camion) => {
    return getEtatGeneral(camion).label === "À surveiller";
  }).length;

  const totalOk = camions.filter((camion) => {
    return getEtatGeneral(camion).label === "Bon état";
  }).length;

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
            "linear-gradient(rgba(5,8,15,0.88), rgba(5,8,15,0.92)), url('/atelier.jpg')",
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
              "linear-gradient(180deg, rgba(8,11,16,0.28) 0%, rgba(8,11,16,0.58) 100%)",
          }}
        >
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
              marginBottom: "26px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: "36px",
                    fontWeight: 900,
                    color: "#ffffff",
                    margin: 0,
                    marginBottom: "10px",
                    letterSpacing: "0.02em",
                    textShadow: "0 0 18px rgba(255,255,255,0.08)",
                  }}
                >
                  🏭 Atelier mécanique poids lourd
                </h1>

                <p
                  style={{
                    margin: 0,
                    color: "rgba(255,255,255,0.74)",
                    fontSize: "15px",
                  }}
                >
                  Suivi des entretiens, pneus et réparations de la flotte de{" "}
                  <strong style={{ color: "#ffffff" }}>{entreprise.nom}</strong>
                </p>
              </div>

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
                  boxShadow: peutAgirAtelier
                    ? "0 0 12px rgba(34,197,94,0.18)"
                    : "0 0 12px rgba(245,158,11,0.14)",
                }}
              >
                {peutAgirAtelier
                  ? "Accès mécanicien autorisé"
                  : "Lecture seule pour votre rôle"}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "18px",
              marginBottom: "28px",
            }}
          >
            {[
              {
                label: "Camions atelier",
                value: totalCamions,
                color: "#60a5fa",
                glow: "0 0 14px rgba(96,165,250,0.35)",
              },
              {
                label: "État correct",
                value: totalOk,
                color: "#22c55e",
                glow: "0 0 14px rgba(34,197,94,0.35)",
              },
              {
                label: "À surveiller",
                value: totalASurveiller,
                color: "#f59e0b",
                glow: "0 0 14px rgba(245,158,11,0.35)",
              },
              {
                label: "Critiques",
                value: totalCritiques,
                color: "#ef4444",
                glow: "0 0 14px rgba(239,68,68,0.35)",
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: "rgba(18,18,18,0.78)",
                  borderRadius: "20px",
                  padding: "20px",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  boxShadow:
                    "0 0 20px rgba(0,0,0,0.45), inset 0 0 20px rgba(255,255,255,0.015)",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    color: "rgba(255,255,255,0.68)",
                    marginBottom: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {item.label}
                </div>

                <div
                  style={{
                    fontSize: "32px",
                    fontWeight: 800,
                    color: item.color,
                    textShadow: item.glow,
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {camions.length === 0 ? (
            <div
              style={{
                background: "rgba(18,18,18,0.78)",
                borderRadius: "22px",
                padding: "26px",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.82)",
              }}
            >
              Aucun camion dans la société pour le moment.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                gap: "22px",
              }}
            >
              {camions.map((camion) => {
                const vidangeRestante = camion.vidangeRestante ?? 0;
                const revisionRestante = camion.revisionRestante ?? 0;
                const pneusRestantsKm = camion.pneusRestantsKm ?? 0;

                const vidangeConfig = getKmConfig(vidangeRestante, 60000, 5000);
                const revisionConfig = getKmConfig(revisionRestante, 120000, 10000);
                const pneusConfig = getPneusConfig(pneusRestantsKm);

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
                    key={camion.id}
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(18,18,18,0.84), rgba(10,10,10,0.7))",
                      borderRadius: "22px",
                      padding: "22px",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      boxShadow:
                        "0 0 20px rgba(0,0,0,0.55), inset 0 0 18px rgba(255,255,255,0.02)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "12px",
                        marginBottom: "14px",
                      }}
                    >
                      <div>
                        <h2
                          style={{
                            margin: 0,
                            color: "#ffffff",
                            fontSize: "22px",
                            fontWeight: 800,
                          }}
                        >
                          {camion.marque} {camion.modele}
                        </h2>

                        <p
                          style={{
                            margin: "8px 0 0 0",
                            color: "rgba(255,255,255,0.68)",
                            fontSize: "14px",
                          }}
                        >
                          Chauffeur :{" "}
                          <strong style={{ color: "#ffffff" }}>
                            {camion.chauffeurAttribue?.username ?? "Non attribué"}
                          </strong>
                        </p>

                        <p
                          style={{
                            margin: "8px 0 0 0",
                            color: "rgba(255,255,255,0.68)",
                            fontSize: "14px",
                          }}
                        >
                          Position :{" "}
                          <strong style={{ color: "#ffffff" }}>
                            {camion.positionActuelle ?? "Inconnue"}
                          </strong>
                        </p>

                        <p
                          style={{
                            margin: "8px 0 0 0",
                            color: "rgba(255,255,255,0.68)",
                            fontSize: "14px",
                          }}
                        >
                          Kilométrage :{" "}
                          <strong style={{ color: "#ffffff" }}>
                            {(camion.kilometrage ?? 0).toLocaleString("fr-FR")} km
                          </strong>
                        </p>
                      </div>

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
                          whiteSpace: "nowrap",
                        }}
                      >
                        {statutConfig.label}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 12px",
                        borderRadius: "999px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: etatGeneral.color,
                        fontWeight: 800,
                        marginBottom: "18px",
                        textShadow: etatGeneral.glow,
                      }}
                    >
                      État général : {etatGeneral.label}
                    </div>

                    <div style={sectionStyle}>
                      <div style={sectionTitleStyle}>Entretien atelier</div>

                      <div style={{ marginBottom: "14px" }}>
                        <div style={rowTopStyle}>
                          <span>🔧 Vidange</span>
                          <span
                            style={{
                              color: vidangeConfig.color,
                              textShadow: vidangeConfig.glow,
                            }}
                          >
                            {Math.max(0, vidangeRestante).toLocaleString("fr-FR")} km •{" "}
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

                      <div style={{ marginBottom: "14px" }}>
                        <div style={rowTopStyle}>
                          <span>🔩 Révision</span>
                          <span
                            style={{
                              color: revisionConfig.color,
                              textShadow: revisionConfig.glow,
                            }}
                          >
                            {Math.max(0, revisionRestante).toLocaleString("fr-FR")} km •{" "}
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

                      <div>
                        <div style={rowTopStyle}>
                          <span>🛞 Pneus</span>
                          <span
                            style={{
                              color: pneusConfig.color,
                              textShadow: pneusConfig.glow,
                            }}
                          >
                            {Math.max(0, pneusRestantsKm).toLocaleString("fr-FR")} km •{" "}
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
                    </div>

                    <div style={sectionStyle}>
                      <div style={sectionTitleStyle}>Dégâts camion</div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "10px 14px",
                        }}
                      >
                        <div style={{ color: "#ffffff", fontSize: "14px" }}>
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

                        <div style={{ color: "#ffffff", fontSize: "14px" }}>
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

                        <div style={{ color: "#ffffff", fontSize: "14px" }}>
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

                        <div style={{ color: "#ffffff", fontSize: "14px" }}>
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

                    {peutAgirAtelier && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr",
                          gap: "10px",
                        }}
                      >
                        <button type="button" style={actionButtonStyle}>
                          🔧 Faire la vidange
                        </button>

                        <button type="button" style={actionButtonStyle}>
                          🔩 Faire la révision
                        </button>

                        <form action={changerPneus}>
                          <input type="hidden" name="camionId" value={camion.id} />
                          <button
                            type="submit"
                            style={{
                              ...actionPneusButtonStyle,
                              opacity: pneusRestantsKm < 100000 ? 1 : 0.72,
                              cursor:
                                pneusRestantsKm < 100000 ? "pointer" : "not-allowed",
                            }}
                            disabled={pneusRestantsKm >= 100000}
                          >
                            🛞 Changer les pneus •{" "}
                            {PRIX_PNEUS.toLocaleString("fr-FR")} €
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
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const sectionStyle = {
  marginBottom: "18px",
  padding: "14px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const sectionTitleStyle = {
  fontSize: "13px",
  color: "rgba(255,255,255,0.56)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  marginBottom: "12px",
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

const actionPneusButtonStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(59,130,246,0.24)",
  background: "rgba(59,130,246,0.14)",
  color: "#bfdbfe",
  fontWeight: "bold",
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