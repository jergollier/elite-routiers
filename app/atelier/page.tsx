import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

const ROLES_AUTORISES_ATELIER = [
  "DIRECTEUR",
  "SOUS_DIRECTEUR",
  "CHEF_ATELIER",
] as const;

type StatItem = [string, number, string];

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
      urgent: true,
      warning: false,
    };
  }

  if (safeValue <= warning) {
    return {
      color: "#f59e0b",
      glow: "0 0 10px rgba(245,158,11,0.55)",
      label: "À prévoir",
      message: `Attention dans ${safeValue.toLocaleString("fr-FR")} km`,
      percent: Math.max(0, Math.min(100, (safeValue / max) * 100)),
      urgent: false,
      warning: true,
    };
  }

  return {
    color: "#22c55e",
    glow: "0 0 10px rgba(34,197,94,0.45)",
    label: "OK",
    message: "RAS",
    percent: Math.max(0, Math.min(100, (safeValue / max) * 100)),
    urgent: false,
    warning: false,
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
    (camion.vidangeRestante ?? 0) <= 0 ||
    (camion.vidangeRestante ?? 0) <= 5000 ||
    (camion.revisionRestante ?? 0) <= 10000 ||
    (camion.pneusRestantsKm ?? 0) <= 7500 ||
    (camion.freinsRestantsKm ?? 0) <= 5000 ||
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

function getEtatRemorque(remorque: {
  pneusRestantsKm?: number | null;
  degatsChassis?: number | null;
  degatsRoues?: number | null;
  degatsCaisse?: number | null;
  degatsCargaison?: number | null;
}) {
  const totalDegats =
    (remorque.degatsChassis ?? 0) +
    (remorque.degatsRoues ?? 0) +
    (remorque.degatsCaisse ?? 0) +
    (remorque.degatsCargaison ?? 0);

  if ((remorque.pneusRestantsKm ?? 0) <= 0 || totalDegats >= 80) {
    return {
      label: "Remorque bloquée",
      color: "#ef4444",
      glow: "0 0 14px rgba(239,68,68,0.75)",
    };
  }

  if ((remorque.pneusRestantsKm ?? 0) <= 7500 || totalDegats >= 25) {
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

function getStatutRemorqueConfig(statut?: string | null) {
  switch (statut) {
    case "DISPONIBLE":
      return {
        label: "Disponible",
        color: "#22c55e",
        glow: "0 0 10px rgba(34,197,94,0.75)",
      };
    case "ATTRIBUEE":
      return {
        label: "Attribuée",
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

function formatTypeRemorque(type?: string | null) {
  switch (type) {
    case "FRIGO":
      return "Frigo";
    case "CITERNE":
      return "Citerne";
    case "PLATEAU":
      return "Plateau";
    case "BACHEE":
      return "Bâchée";
    case "BENNE":
      return "Benne";
    case "PORTE_ENGINS":
      return "Porte-engins";
    case "PORTE_CONTENEUR":
      return "Porte-conteneur";
    case "LOWBOY":
      return "Lowboy";
    case "FOURGON":
      return "Fourgon";
    case "TAUTLINER":
      return "Tautliner";
    default:
      return type || "Inconnu";
  }
}

function EntretienLine({
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
  const restante = value ?? 0;
  const config = getKmConfig(restante, max, warning);

  return (
    <div style={{ marginBottom: "14px" }}>
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
          {Math.max(0, restante).toLocaleString("fr-FR")} km • {config.label}
        </span>
      </div>

      {(config.warning || config.urgent) && (
        <div
          style={{
            marginBottom: "8px",
            color: config.color,
            fontSize: "13px",
            fontWeight: 800,
            textShadow: config.glow,
          }}
        >
          {config.urgent ? "🔴 " : "⚠️ "}
          {config.message}
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

  const remorques = await prisma.remorque.findMany({
    where: {
      entrepriseId: entreprise.id,
      actif: true,
    },
    select: {
      id: true,
      marque: true,
      modele: true,
      type: true,
      jeu: true,
      statut: true,
      pneusUsure: true,
      pneusRestantsKm: true,
      degatsChassis: true,
      degatsRoues: true,
      degatsCaisse: true,
      degatsCargaison: true,
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
  const totalRemorques = remorques.length;

  const totalCritiquesCamions = camions.filter(
    (camion) => getEtatGeneral(camion).label === "Camion bloqué"
  ).length;

  const totalASurveillerCamions = camions.filter(
    (camion) => getEtatGeneral(camion).label === "À surveiller"
  ).length;

  const totalCritiquesRemorques = remorques.filter(
    (remorque) => getEtatRemorque(remorque).label === "Remorque bloquée"
  ).length;

  const totalASurveillerRemorques = remorques.filter(
    (remorque) => getEtatRemorque(remorque).label === "À surveiller"
  ).length;

  const totalOk =
    camions.filter((camion) => getEtatGeneral(camion).label === "Bon état")
      .length +
    remorques.filter((remorque) => getEtatRemorque(remorque).label === "Bon état")
      .length;

  const stats: StatItem[] = [
    ["Camions atelier", totalCamions, "#60a5fa"],
    ["Remorques atelier", totalRemorques, "#93c5fd"],
    ["État correct", totalOk, "#22c55e"],
    [
      "À surveiller",
      totalASurveillerCamions + totalASurveillerRemorques,
      "#f59e0b",
    ],
    ["Bloqués", totalCritiquesCamions + totalCritiquesRemorques, "#ef4444"],
  ];

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
        <div style={{ minHeight: "100vh", padding: "32px" }}>
          <div style={headerStyle}>
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
                <h1 style={titleStyle}>🏭 Atelier mécanique poids lourd</h1>

                <p style={{ margin: 0, color: "rgba(255,255,255,0.74)" }}>
                  Vue générale de l&apos;atelier de{" "}
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
                }}
              >
                {peutAgirAtelier
                  ? "Accès mécanicien autorisé"
                  : "Lecture seule pour votre rôle"}
              </div>
            </div>
          </div>

          <div style={statsGridStyle}>
            {stats.map(([label, value, color]) => (
              <div key={label} style={statCardStyle}>
                <div style={statLabelStyle}>{label}</div>

                <div
                  style={{
                    fontSize: "32px",
                    fontWeight: 800,
                    color,
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={bigSectionTitleStyle}>🚛 Camions</h2>
              <p style={sectionSubtitleStyle}>
                Entretien mécanique, dégâts et état général des camions.
              </p>
            </div>
          </div>

          {camions.length === 0 ? (
            <div style={emptyStyle}>
              Aucun camion dans la société pour le moment.
            </div>
          ) : (
            <div style={camionGridStyle}>
              {camions.map((camion) => {
                const moteurConfig = getDamageConfig(camion.degatsMoteur);
                const carrosserieConfig = getDamageConfig(
                  camion.degatsCarrosserie
                );
                const chassisConfig = getDamageConfig(camion.degatsChassis);
                const rouesConfig = getDamageConfig(camion.degatsRoues);

                const etatGeneral = getEtatGeneral(camion);
                const statutConfig = getStatutCamionConfig(camion.statut);

                return (
                  <div key={camion.id} style={camionCardStyle}>
                    <div style={cardHeaderStyle}>
                      <div>
                        <h2 style={camionTitleStyle}>
                          {camion.marque} {camion.modele}
                        </h2>

                        <p style={smallTextStyle}>
                          Chauffeur :{" "}
                          <strong style={{ color: "#ffffff" }}>
                            {camion.chauffeurAttribue?.username ??
                              "Non attribué"}
                          </strong>
                        </p>

                        <p style={smallTextStyle}>
                          Position :{" "}
                          <strong style={{ color: "#ffffff" }}>
                            {camion.positionActuelle ?? "Inconnue"}
                          </strong>
                        </p>

                        <p style={smallTextStyle}>
                          Kilométrage :{" "}
                          <strong style={{ color: "#ffffff" }}>
                            {(camion.kilometrage ?? 0).toLocaleString("fr-FR")} km
                          </strong>
                        </p>
                      </div>

                      <div
                        style={{
                          ...pillStyle,
                          color: statutConfig.color,
                          textShadow: statutConfig.glow,
                        }}
                      >
                        {statutConfig.label}
                      </div>
                    </div>

                    <div style={etatRowStyle}>
                      <div
                        style={{
                          ...etatPillStyle,
                          color: etatGeneral.color,
                          textShadow: etatGeneral.glow,
                        }}
                      >
                        État général : {etatGeneral.label}
                      </div>

                      <Link href={`/atelier/${camion.id}`} style={atelierLinkStyle}>
                        🔧 Atelier
                      </Link>
                    </div>

                    <div style={sectionStyle}>
                      <div style={sectionTitleStyle}>Entretien atelier</div>

                      <EntretienLine
                        icon="🔧"
                        label="Vidange"
                        value={camion.vidangeRestante}
                        max={60000}
                        warning={5000}
                      />

                      <EntretienLine
                        icon="🔩"
                        label="Révision"
                        value={camion.revisionRestante}
                        max={120000}
                        warning={10000}
                      />

                      <EntretienLine
                        icon="🛞"
                        label="Pneus"
                        value={camion.pneusRestantsKm}
                        max={80000}
                        warning={7500}
                      />

                      <EntretienLine
                        icon="🛑"
                        label="Freins"
                        value={camion.freinsRestantsKm}
                        max={60000}
                        warning={5000}
                      />

                      <EntretienLine
                        icon="🔋"
                        label="Batterie"
                        value={camion.batterieRestanteKm}
                        max={150000}
                        warning={10000}
                      />
                    </div>

                    <div style={sectionStyle}>
                      <div style={sectionTitleStyle}>Dégâts camion</div>

                      <div style={damageGridStyle}>
                        <div style={damageTextStyle}>
                          💥 Moteur :{" "}
                          <span style={damageValueStyle(moteurConfig)}>
                            {moteurConfig.label}
                          </span>
                        </div>

                        <div style={damageTextStyle}>
                          🚪 Carrosserie :{" "}
                          <span style={damageValueStyle(carrosserieConfig)}>
                            {carrosserieConfig.label}
                          </span>
                        </div>

                        <div style={damageTextStyle}>
                          🧱 Châssis :{" "}
                          <span style={damageValueStyle(chassisConfig)}>
                            {chassisConfig.label}
                          </span>
                        </div>

                        <div style={damageTextStyle}>
                          🛞 Roues :{" "}
                          <span style={damageValueStyle(rouesConfig)}>
                            {rouesConfig.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={bigSectionTitleStyle}>🚚 Remorques</h2>
              <p style={sectionSubtitleStyle}>
                État des pneus, dégâts et suivi des remorques de société.
              </p>
            </div>

            <Link href="/remorques" style={atelierLinkStyle}>
              Voir flotte remorques
            </Link>
          </div>

          {remorques.length === 0 ? (
            <div style={emptyStyle}>
              Aucune remorque dans la société pour le moment.
            </div>
          ) : (
            <div style={camionGridStyle}>
              {remorques.map((remorque) => {
                const chassisConfig = getDamageConfig(remorque.degatsChassis);
                const rouesConfig = getDamageConfig(remorque.degatsRoues);
                const caisseConfig = getDamageConfig(remorque.degatsCaisse);
                const cargaisonConfig = getDamageConfig(
                  remorque.degatsCargaison
                );

                const etatGeneral = getEtatRemorque(remorque);
                const statutConfig = getStatutRemorqueConfig(remorque.statut);

                return (
                  <div key={remorque.id} style={camionCardStyle}>
                    <div style={cardHeaderStyle}>
                      <div>
                        <h2 style={camionTitleStyle}>
                          {remorque.marque} {remorque.modele}
                        </h2>

                        <p style={smallTextStyle}>
                          Type :{" "}
                          <strong style={{ color: "#ffffff" }}>
                            {formatTypeRemorque(remorque.type)}
                          </strong>
                        </p>

                        <p style={smallTextStyle}>
                          Jeu :{" "}
                          <strong style={{ color: "#ffffff" }}>
                            {remorque.jeu}
                          </strong>
                        </p>

                        <p style={smallTextStyle}>
                          Chauffeur :{" "}
                          <strong style={{ color: "#ffffff" }}>
                            {remorque.chauffeurAttribue?.username ??
                              "Non attribuée"}
                          </strong>
                        </p>
                      </div>

                      <div
                        style={{
                          ...pillStyle,
                          color: statutConfig.color,
                          textShadow: statutConfig.glow,
                        }}
                      >
                        {statutConfig.label}
                      </div>
                    </div>

                    <div style={etatRowStyle}>
                      <div
                        style={{
                          ...etatPillStyle,
                          color: etatGeneral.color,
                          textShadow: etatGeneral.glow,
                        }}
                      >
                        État général : {etatGeneral.label}
                      </div>

                      <Link
                        href={`/atelier/remorques/${remorque.id}`}
                        style={atelierLinkStyle}
                      >
                        🔧 Atelier
                      </Link>
                    </div>

                    <div style={sectionStyle}>
                      <div style={sectionTitleStyle}>Entretien remorque</div>

                      <EntretienLine
                        icon="🛞"
                        label="Pneus remorque"
                        value={remorque.pneusRestantsKm}
                        max={100000}
                        warning={7500}
                      />

                      <p style={smallTextStyle}>
                        Usure pneus :{" "}
                        <strong style={{ color: "#ffffff" }}>
                          {remorque.pneusUsure ?? 0}%
                        </strong>
                      </p>
                    </div>

                    <div style={sectionStyle}>
                      <div style={sectionTitleStyle}>Dégâts remorque</div>

                      <div style={damageGridStyle}>
                        <div style={damageTextStyle}>
                          🧱 Châssis :{" "}
                          <span style={damageValueStyle(chassisConfig)}>
                            {chassisConfig.label}
                          </span>
                        </div>

                        <div style={damageTextStyle}>
                          🛞 Roues :{" "}
                          <span style={damageValueStyle(rouesConfig)}>
                            {rouesConfig.label}
                          </span>
                        </div>

                        <div style={damageTextStyle}>
                          📦 Caisse :{" "}
                          <span style={damageValueStyle(caisseConfig)}>
                            {caisseConfig.label}
                          </span>
                        </div>

                        <div style={damageTextStyle}>
                          📉 Cargaison :{" "}
                          <span style={damageValueStyle(cargaisonConfig)}>
                            {cargaisonConfig.label}
                          </span>
                        </div>
                      </div>
                    </div>
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

const headerStyle = {
  background:
    "linear-gradient(135deg, rgba(20,20,20,0.82), rgba(12,12,12,0.62))",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "24px",
  padding: "28px",
  backdropFilter: "blur(8px)",
  boxShadow:
    "0 0 20px rgba(0,0,0,0.6), inset 0 0 20px rgba(255,255,255,0.02)",
  marginBottom: "26px",
};

const titleStyle = {
  fontSize: "36px",
  fontWeight: 900,
  color: "#ffffff",
  margin: 0,
  marginBottom: "10px",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "18px",
  marginBottom: "28px",
};

const statCardStyle = {
  background: "rgba(18,18,18,0.78)",
  borderRadius: "20px",
  padding: "20px",
  backdropFilter: "blur(8px)",
  border: "1px solid rgba(255,255,255,0.05)",
};

const statLabelStyle = {
  fontSize: "14px",
  color: "rgba(255,255,255,0.68)",
  marginBottom: "10px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
};

const emptyStyle = {
  background: "rgba(18,18,18,0.78)",
  borderRadius: "22px",
  padding: "26px",
  backdropFilter: "blur(8px)",
  border: "1px solid rgba(255,255,255,0.05)",
  color: "rgba(255,255,255,0.82)",
  marginBottom: "28px",
};

const sectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap" as const,
  margin: "10px 0 18px",
};

const bigSectionTitleStyle = {
  margin: 0,
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: 900,
};

const sectionSubtitleStyle = {
  margin: "6px 0 0 0",
  color: "rgba(255,255,255,0.68)",
  fontSize: "14px",
};

const camionGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
  gap: "22px",
  marginBottom: "34px",
};

const camionCardStyle = {
  background:
    "linear-gradient(180deg, rgba(18,18,18,0.84), rgba(10,10,10,0.7))",
  borderRadius: "22px",
  padding: "20px",
  backdropFilter: "blur(8px)",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "0 0 20px rgba(0,0,0,0.55)",
};

const cardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
  marginBottom: "14px",
};

const camionTitleStyle = {
  margin: 0,
  color: "#ffffff",
  fontSize: "22px",
  fontWeight: 800,
};

const smallTextStyle = {
  margin: "8px 0 0 0",
  color: "rgba(255,255,255,0.68)",
  fontSize: "14px",
};

const pillStyle = {
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  fontWeight: 700,
  fontSize: "13px",
  whiteSpace: "nowrap" as const,
};

const etatRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "18px",
  flexWrap: "wrap" as const,
};

const etatPillStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  fontWeight: 800,
};

const sectionStyle = {
  marginBottom: "16px",
  padding: "12px",
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

const damageGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px 14px",
};

const damageTextStyle = {
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

const atelierLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 14px",
  borderRadius: "999px",
  background: "rgba(37,99,235,0.18)",
  border: "1px solid rgba(37,99,235,0.35)",
  color: "#93c5fd",
  fontWeight: 700,
  fontSize: "13px",
  textDecoration: "none",
  boxShadow: "0 0 12px rgba(37,99,235,0.22)",
  whiteSpace: "nowrap" as const,
};