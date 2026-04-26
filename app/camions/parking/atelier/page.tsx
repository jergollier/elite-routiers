import type { CSSProperties } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

const PRIX = {
  REPARATION: 20000,
  PNEUS: 8000,
  VIDANGE: 2500,
  REVISION: 10000,
  FREINS: 6000,
  BATTERIE: 7000,
};

type EntretienType = keyof typeof PRIX;
type StatItem = [string, number | string, string];

async function payerEntretien(formData: FormData) {
  "use server";

  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) redirect("/");

  const camionId = Number(formData.get("camionId"));
  const type = String(formData.get("type")) as EntretienType;

  if (!camionId || Number.isNaN(camionId)) return;
  if (!PRIX[type]) return;

  const prix = PRIX[type];

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { steamId },
      select: {
        argentPerso: true,
        camionsPerso: { select: { id: true } },
      },
    });

    if (!user) return;
    if ((user.argentPerso ?? 0) < prix) return;

    const ok = user.camionsPerso.some((c) => c.id === camionId);
    if (!ok) return;

    await tx.user.update({
      where: { steamId },
      data: {
        argentPerso: { decrement: prix },
      },
    });

    if (type === "REPARATION") {
      await tx.camion.update({
        where: { id: camionId },
        data: {
          etat: 100,
          degatsMoteur: 0,
          degatsCarrosserie: 0,
          degatsChassis: 0,
          degatsRoues: 0,
        },
      });
    }

    if (type === "PNEUS") {
      await tx.camion.update({
        where: { id: camionId },
        data: {
          pneusRestantsKm: 100000,
          degatsRoues: 0,
        },
      });
    }

    if (type === "VIDANGE") {
      await tx.camion.update({
        where: { id: camionId },
        data: {
          vidangeRestante: 60000,
        },
      });
    }

    if (type === "REVISION") {
      await tx.camion.update({
        where: { id: camionId },
        data: {
          revisionRestante: 120000,
        },
      });
    }

    if (type === "FREINS") {
      await tx.camion.update({
        where: { id: camionId },
        data: {
          freinsRestantsKm: 60000,
        },
      });
    }

    if (type === "BATTERIE") {
      await tx.camion.update({
        where: { id: camionId },
        data: {
          batterieRestanteKm: 150000,
        },
      });
    }
  });

  revalidatePath("/camions/atelier-perso");
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
        label: "Garage perso",
        color: "#93c5fd",
        glow: "0 0 8px rgba(147,197,253,0.55)",
      };
  }
}

function formatMarque(value?: string | null) {
  if (!value) return "Marque inconnue";

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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

function PayButton({
  camionId,
  type,
  prix,
  argent,
  label,
  icon,
}: {
  camionId: number;
  type: EntretienType;
  prix: number;
  argent: number;
  label: string;
  icon: string;
}) {
  const disabled = argent < prix;

  return (
    <form action={payerEntretien}>
      <input type="hidden" name="camionId" value={camionId} />
      <input type="hidden" name="type" value={type} />

      <button
        type="submit"
        disabled={disabled}
        style={{
          ...payButtonStyle,
          opacity: disabled ? 0.45 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <span>{icon}</span>
        <span>{label}</span>
        <strong>{prix.toLocaleString("fr-FR")} €</strong>
      </button>
    </form>
  );
}

export default async function AtelierPersoPage() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { steamId },
    include: {
      camionsPerso: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!user) {
    redirect("/");
  }

  const argent = user.argentPerso ?? 0;
  const camions = user.camionsPerso ?? [];

  const totalCamions = camions.length;

  const totalBloques = camions.filter(
    (camion) => getEtatGeneral(camion).label === "Camion bloqué"
  ).length;

  const totalASurveiller = camions.filter(
    (camion) => getEtatGeneral(camion).label === "À surveiller"
  ).length;

  const totalOk = camions.filter(
    (camion) => getEtatGeneral(camion).label === "Bon état"
  ).length;

  const stats: StatItem[] = [
    ["Solde personnel", `${argent.toLocaleString("fr-FR")} €`, "#22c55e"],
    ["Camions perso", totalCamions, "#60a5fa"],
    ["Bon état", totalOk, "#22c55e"],
    ["À surveiller", totalASurveiller, "#f59e0b"],
    ["Bloqués", totalBloques, "#ef4444"],
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#080b10" }}>
      <div style={backgroundStyle}>
        <div style={{ minHeight: "100vh", padding: "32px" }}>
          <div style={headerStyle}>
            <div style={headerTopStyle}>
              <div style={profileBlockStyle}>
                <img
                  src={user.avatar || "/truck.jpg"}
                  alt={user.username || "Profil Steam"}
                  style={avatarStyle}
                />

                <div>
                  <h1 style={titleStyle}>🏭 Atelier personnel</h1>

                  <p style={{ margin: 0, color: "rgba(255,255,255,0.74)" }}>
                    Garage privé de{" "}
                    <strong style={{ color: "#ffffff" }}>
                      {user.username || "Chauffeur"}
                    </strong>
                  </p>

                  <p style={{ margin: "8px 0 0", color: "#93c5fd" }}>
                    Entretien, réparations et suivi mécanique de tes camions
                    personnels.
                  </p>
                </div>
              </div>

              <div style={actionsStyle}>
                <Link href="/societe" style={btnBlue}>
                  🏠 Accueil
                </Link>

                <Link href="/parking" style={btnGreen}>
                  🅿️ Parking
                </Link>
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
              <h2 style={bigSectionTitleStyle}>🚛 Camions personnels</h2>
              <p style={sectionSubtitleStyle}>
                Même suivi que l’atelier entreprise, mais payé avec ton argent
                personnel.
              </p>
            </div>
          </div>

          {camions.length === 0 ? (
            <div style={emptyStyle}>
              Aucun camion personnel dans ton parking pour le moment.
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
                          {formatMarque(String(camion.marque))} {camion.modele}
                        </h2>

                        <p style={smallTextStyle}>
                          Propriétaire :{" "}
                          <strong style={{ color: "#ffffff" }}>
                            {user.username || "Moi"}
                          </strong>
                        </p>

                        <p style={smallTextStyle}>
                          Kilométrage :{" "}
                          <strong style={{ color: "#ffffff" }}>
                            {(camion.kilometrage ?? 0).toLocaleString("fr-FR")}{" "}
                            km
                          </strong>
                        </p>

                        <p style={smallTextStyle}>
                          Valeur entretien :{" "}
                          <strong style={{ color: "#ffffff" }}>
                            Atelier privé
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

                      <div style={moneyPillStyle}>
                        💰 {argent.toLocaleString("fr-FR")} €
                      </div>
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
                        max={100000}
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

                    <div style={sectionStyle}>
                      <div style={sectionTitleStyle}>Actions atelier perso</div>

                      <div style={actionsGridStyle}>
                        <PayButton
                          camionId={camion.id}
                          type="REPARATION"
                          prix={PRIX.REPARATION}
                          argent={argent}
                          label="Réparation"
                          icon="🛠️"
                        />

                        <PayButton
                          camionId={camion.id}
                          type="PNEUS"
                          prix={PRIX.PNEUS}
                          argent={argent}
                          label="Pneus"
                          icon="🛞"
                        />

                        <PayButton
                          camionId={camion.id}
                          type="VIDANGE"
                          prix={PRIX.VIDANGE}
                          argent={argent}
                          label="Vidange"
                          icon="🔧"
                        />

                        <PayButton
                          camionId={camion.id}
                          type="REVISION"
                          prix={PRIX.REVISION}
                          argent={argent}
                          label="Révision"
                          icon="🔩"
                        />

                        <PayButton
                          camionId={camion.id}
                          type="FREINS"
                          prix={PRIX.FREINS}
                          argent={argent}
                          label="Freins"
                          icon="🛑"
                        />

                        <PayButton
                          camionId={camion.id}
                          type="BATTERIE"
                          prix={PRIX.BATTERIE}
                          argent={argent}
                          label="Batterie"
                          icon="🔋"
                        />
                      </div>

                      {argent < PRIX.VIDANGE && (
                        <p style={warningTextStyle}>
                          Solde insuffisant pour effectuer un entretien.
                        </p>
                      )}
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

const backgroundStyle: CSSProperties = {
  flex: 1,
  minHeight: "100vh",
  backgroundImage:
    "linear-gradient(rgba(5,8,15,0.62), rgba(5,8,15,0.72)), url('/atelier.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundAttachment: "fixed",
};

const headerStyle: CSSProperties = {
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

const headerTopStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
};

const profileBlockStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "18px",
};

const avatarStyle: CSSProperties = {
  width: "76px",
  height: "76px",
  borderRadius: "20px",
  objectFit: "cover",
  border: "2px solid rgba(96,165,250,0.8)",
  boxShadow: "0 0 28px rgba(37,99,235,0.42)",
};

const titleStyle: CSSProperties = {
  fontSize: "36px",
  fontWeight: 900,
  color: "#ffffff",
  margin: 0,
  marginBottom: "10px",
};

const actionsStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const btnBlue: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "11px 16px",
  borderRadius: "999px",
  background: "rgba(37,99,235,0.22)",
  border: "1px solid rgba(37,99,235,0.45)",
  color: "#bfdbfe",
  fontWeight: 800,
  textDecoration: "none",
  boxShadow: "0 0 14px rgba(37,99,235,0.28)",
};

const btnGreen: CSSProperties = {
  ...btnBlue,
  background: "rgba(34,197,94,0.18)",
  border: "1px solid rgba(34,197,94,0.38)",
  color: "#bbf7d0",
  boxShadow: "0 0 14px rgba(34,197,94,0.24)",
};

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "18px",
  marginBottom: "28px",
};

const statCardStyle: CSSProperties = {
  background: "rgba(18,18,18,0.78)",
  borderRadius: "20px",
  padding: "20px",
  backdropFilter: "blur(8px)",
  border: "1px solid rgba(255,255,255,0.05)",
};

const statLabelStyle: CSSProperties = {
  fontSize: "14px",
  color: "rgba(255,255,255,0.68)",
  marginBottom: "10px",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const emptyStyle: CSSProperties = {
  background: "rgba(18,18,18,0.78)",
  borderRadius: "22px",
  padding: "26px",
  backdropFilter: "blur(8px)",
  border: "1px solid rgba(255,255,255,0.05)",
  color: "rgba(255,255,255,0.82)",
  marginBottom: "28px",
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
  margin: "10px 0 18px",
};

const bigSectionTitleStyle: CSSProperties = {
  margin: 0,
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: 900,
};

const sectionSubtitleStyle: CSSProperties = {
  margin: "6px 0 0 0",
  color: "rgba(255,255,255,0.68)",
  fontSize: "14px",
};

const camionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
  gap: "22px",
  marginBottom: "34px",
};

const camionCardStyle: CSSProperties = {
  background:
    "linear-gradient(180deg, rgba(18,18,18,0.84), rgba(10,10,10,0.7))",
  borderRadius: "22px",
  padding: "20px",
  backdropFilter: "blur(8px)",
  border: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "0 0 20px rgba(0,0,0,0.55)",
};

const cardHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
  marginBottom: "14px",
};

const camionTitleStyle: CSSProperties = {
  margin: 0,
  color: "#ffffff",
  fontSize: "22px",
  fontWeight: 800,
};

const smallTextStyle: CSSProperties = {
  margin: "8px 0 0 0",
  color: "rgba(255,255,255,0.68)",
  fontSize: "14px",
};

const pillStyle: CSSProperties = {
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  fontWeight: 700,
  fontSize: "13px",
  whiteSpace: "nowrap",
};

const etatRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "18px",
  flexWrap: "wrap",
};

const etatPillStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  fontWeight: 800,
};

const moneyPillStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(34,197,94,0.12)",
  border: "1px solid rgba(34,197,94,0.28)",
  color: "#86efac",
  fontWeight: 900,
};

const sectionStyle: CSSProperties = {
  marginBottom: "16px",
  padding: "12px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const sectionTitleStyle: CSSProperties = {
  fontSize: "13px",
  color: "rgba(255,255,255,0.56)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: "12px",
};

const rowTopStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "8px",
  gap: "8px",
  color: "#ffffff",
  fontSize: "14px",
};

const barBackgroundStyle: CSSProperties = {
  height: "8px",
  background: "rgba(255,255,255,0.08)",
  borderRadius: "999px",
  overflow: "hidden",
};

const barFillBaseStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
};

const damageGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px 14px",
};

const damageTextStyle: CSSProperties = {
  color: "#ffffff",
  fontSize: "14px",
};

const actionsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "10px",
};

const payButtonStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "auto 1fr auto",
  alignItems: "center",
  gap: "8px",
  padding: "11px 12px",
  borderRadius: "14px",
  background: "rgba(37,99,235,0.18)",
  border: "1px solid rgba(37,99,235,0.35)",
  color: "#dbeafe",
  fontWeight: 800,
  boxShadow: "0 0 12px rgba(37,99,235,0.18)",
};

const warningTextStyle: CSSProperties = {
  margin: "12px 0 0",
  color: "#fca5a5",
  fontWeight: 800,
  fontSize: "13px",
};

function damageValueStyle(config: { color: string; glow: string }) {
  return {
    color: config.color,
    textShadow: config.glow,
    fontWeight: 800,
  };
}