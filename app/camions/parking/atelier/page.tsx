import type { CSSProperties } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import Menu from "@/app/components/Menu";
import { prisma } from "@/lib/prisma";

const PRIX = {
  REPARATION: 20000,
  PNEUS: 8000,
  VIDANGE: 2500,
  REVISION: 10000,
  FREINS: 6000,
  BATTERIE: 7000,
};

async function payerEntretien(formData: FormData) {
  "use server";

  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) redirect("/");

  const camionId = Number(formData.get("camionId"));
  const type = String(formData.get("type"));

  if (!camionId || Number.isNaN(camionId)) return;

  const prix =
    type === "REPARATION"
      ? PRIX.REPARATION
      : type === "PNEUS"
      ? PRIX.PNEUS
      : type === "VIDANGE"
      ? PRIX.VIDANGE
      : type === "REVISION"
      ? PRIX.REVISION
      : type === "FREINS"
      ? PRIX.FREINS
      : type === "BATTERIE"
      ? PRIX.BATTERIE
      : null;

  if (!prix) return;

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { steamId },
      select: {
        id: true,
        argentPerso: true,
        camionsPerso: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) return;
    if ((user.argentPerso ?? 0) < prix) return;

    const camionAppartientAuUser = user.camionsPerso.some(
      (camion) => camion.id === camionId
    );

    if (!camionAppartientAuUser) return;

    await tx.user.update({
      where: { steamId },
      data: {
        argentPerso: {
          decrement: prix,
        },
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

function formatMarque(marque: string) {
  return marque
    .replace("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function getStatut(statut: string) {
  if (statut === "DISPONIBLE") return { label: "Disponible", color: "#22c55e" };
  if (statut === "EN_MISSION") return { label: "En mission", color: "#f59e0b" };
  return { label: "En maintenance", color: "#ef4444" };
}

function getBarColor(value: number) {
  if (value > 60) return "#22c55e";
  if (value > 30) return "#f59e0b";
  return "#ef4444";
}

function percent(value: number, max: number) {
  return Math.max(0, Math.min(100, (value / max) * 100));
}

export default async function Page() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) redirect("/");

  const user = await prisma.user.findUnique({
    where: { steamId },
    include: {
      camionsPerso: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) redirect("/");

  const argentPerso = user.argentPerso ?? 0;

  return (
    <main style={mainStyle}>
      <div style={overlayStyle} />

      <div style={layoutStyle}>
        <Menu />

        <div style={contentStyle}>
          <section style={panelStyle}>
            <div style={headerStyle}>
              <div>
                <h1 style={titleStyle}>🏭 Atelier perso chauffeur</h1>
                <p style={subtitleStyle}>
                  Entretien de tes camions personnels avec ton argent perso.
                </p>
              </div>

              <div style={topActionsStyle}>
                <Link href="/finance-perso" style={financeButtonStyle}>
                  💰 Finance perso
                </Link>

                <Link href="/camions/parking" style={backButtonStyle}>
                  ← Retour parking
                </Link>
              </div>
            </div>

            <div style={statsGridStyle}>
              <div style={statCardStyle}>
                <span style={statLabelStyle}>Argent perso</span>
                <strong style={statValueStyle}>
                  {argentPerso.toLocaleString("fr-FR")} €
                </strong>
              </div>

              <div style={statCardStyle}>
                <span style={statLabelStyle}>Camions perso</span>
                <strong style={statValueStyle}>{user.camionsPerso.length}</strong>
              </div>
            </div>

            {user.camionsPerso.length === 0 ? (
              <div style={emptyStyle}>
                Tu n’as aucun camion personnel dans ton parking.
              </div>
            ) : (
              <div style={gridStyle}>
                {user.camionsPerso.map((camion) => {
                  const statut = getStatut(camion.statut);
                  const vidange = percent(camion.vidangeRestante ?? 0, 60000);
                  const revision = percent(camion.revisionRestante ?? 0, 120000);
                  const pneus = percent(camion.pneusRestantsKm ?? 0, 100000);
                  const freins = percent(camion.freinsRestantsKm ?? 0, 60000);
                  const batterie = percent(camion.batterieRestanteKm ?? 0, 150000);

                  return (
                    <article key={camion.id} style={cardStyle}>
                      <div style={cardTopStyle}>
                        <div>
                          <h2 style={truckTitleStyle}>
                            {formatMarque(camion.marque)} {camion.modele}
                          </h2>
                          <p style={smallTextStyle}>
                            {camion.kilometrage.toLocaleString("fr-FR")} km
                          </p>
                        </div>

                        <div style={{ ...badgeStyle, color: statut.color }}>
                          ● {statut.label}
                        </div>
                      </div>

                      <div style={infoRowStyle}>
                        <span>État général</span>
                        <strong>{camion.etat}%</strong>
                      </div>

                      <div style={infoRowStyle}>
                        <span>Carburant</span>
                        <strong>{camion.carburant}%</strong>
                      </div>

                      <div style={sectionStyle}>
                        <h3 style={sectionTitleStyle}>Entretien</h3>

                        <Bar label="Vidange" value={camion.vidangeRestante ?? 0} percent={vidange} />
                        <Bar label="Révision" value={camion.revisionRestante ?? 0} percent={revision} />
                        <Bar label="Pneus" value={camion.pneusRestantsKm ?? 0} percent={pneus} />
                        <Bar label="Freins" value={camion.freinsRestantsKm ?? 0} percent={freins} />
                        <Bar label="Batterie" value={camion.batterieRestanteKm ?? 0} percent={batterie} />
                      </div>

                      <div style={sectionStyle}>
                        <h3 style={sectionTitleStyle}>Dégâts</h3>

                        <div style={damageGridStyle}>
                          <span>Moteur : {camion.degatsMoteur ?? 0}%</span>
                          <span>Carrosserie : {camion.degatsCarrosserie ?? 0}%</span>
                          <span>Châssis : {camion.degatsChassis ?? 0}%</span>
                          <span>Roues : {camion.degatsRoues ?? 0}%</span>
                        </div>
                      </div>

                      <div style={sectionStyle}>
                        <h3 style={sectionTitleStyle}>Actions atelier</h3>

                        <div style={actionsGridStyle}>
                          <PayButton camionId={camion.id} type="REPARATION" label="Réparer" prix={PRIX.REPARATION} argent={argentPerso} />
                          <PayButton camionId={camion.id} type="PNEUS" label="Pneus" prix={PRIX.PNEUS} argent={argentPerso} />
                          <PayButton camionId={camion.id} type="VIDANGE" label="Vidange" prix={PRIX.VIDANGE} argent={argentPerso} />
                          <PayButton camionId={camion.id} type="REVISION" label="Révision" prix={PRIX.REVISION} argent={argentPerso} />
                          <PayButton camionId={camion.id} type="FREINS" label="Freins" prix={PRIX.FREINS} argent={argentPerso} />
                          <PayButton camionId={camion.id} type="BATTERIE" label="Batterie" prix={PRIX.BATTERIE} argent={argentPerso} />
                        </div>
                      </div>

                      <Link href={`/camions/${camion.id}`} style={buttonStyle}>
                        Voir le camion
                      </Link>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function PayButton({
  camionId,
  type,
  label,
  prix,
  argent,
}: {
  camionId: number;
  type: string;
  label: string;
  prix: number;
  argent: number;
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
        <span>{label}</span>
        <small>{prix.toLocaleString("fr-FR")} €</small>
      </button>
    </form>
  );
}

function Bar({
  label,
  value,
  percent,
}: {
  label: string;
  value: number;
  percent: number;
}) {
  const color = getBarColor(percent);

  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={barTopStyle}>
        <span>{label}</span>
        <strong>{Math.max(0, value).toLocaleString("fr-FR")} km</strong>
      </div>

      <div style={barBgStyle}>
        <div
          style={{
            ...barFillStyle,
            width: `${percent}%`,
            background: color,
            boxShadow: `0 0 10px ${color}`,
          }}
        />
      </div>
    </div>
  );
}

const mainStyle: CSSProperties = {
  minHeight: "100vh",
  backgroundImage: "url('/atelier.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundAttachment: "fixed",
  position: "relative",
  color: "white",
};

const overlayStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,0.68)",
};

const layoutStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  minHeight: "100vh",
  display: "flex",
};

const contentStyle: CSSProperties = {
  flex: 1,
  padding: "24px",
  minWidth: 0,
};

const panelStyle: CSSProperties = {
  background: "rgba(0,0,0,0.48)",
  borderRadius: "18px",
  padding: "24px",
  backdropFilter: "blur(6px)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 0 20px rgba(0,0,0,0.45)",
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
  marginBottom: "22px",
};

const topActionsStyle: CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "34px",
  fontWeight: 900,
};

const subtitleStyle: CSSProperties = {
  marginTop: "8px",
  marginBottom: 0,
  opacity: 0.82,
};

const backButtonStyle: CSSProperties = {
  padding: "12px 18px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  textDecoration: "none",
  fontWeight: "bold",
  border: "1px solid rgba(255,255,255,0.12)",
};

const financeButtonStyle: CSSProperties = {
  ...backButtonStyle,
  background: "linear-gradient(135deg, #16a34a, #22c55e)",
};

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
  marginBottom: "22px",
};

const statCardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  borderRadius: "16px",
  padding: "18px",
  border: "1px solid rgba(255,255,255,0.08)",
};

const statLabelStyle: CSSProperties = {
  display: "block",
  opacity: 0.75,
  fontSize: "14px",
  marginBottom: "8px",
};

const statValueStyle: CSSProperties = {
  fontSize: "26px",
  color: "#22c55e",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
  gap: "18px",
};

const cardStyle: CSSProperties = {
  background: "rgba(15,15,15,0.82)",
  borderRadius: "18px",
  padding: "18px",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 0 18px rgba(0,0,0,0.35)",
};

const cardTopStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
  marginBottom: "14px",
};

const truckTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "22px",
};

const smallTextStyle: CSSProperties = {
  margin: "6px 0 0 0",
  opacity: 0.72,
};

const badgeStyle: CSSProperties = {
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.08)",
  fontWeight: "bold",
  fontSize: "13px",
};

const infoRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "8px 0",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};

const sectionStyle: CSSProperties = {
  marginTop: "16px",
  padding: "14px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const sectionTitleStyle: CSSProperties = {
  margin: "0 0 12px",
  fontSize: "14px",
  opacity: 0.7,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const barTopStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "6px",
  fontSize: "14px",
};

const barBgStyle: CSSProperties = {
  height: "9px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.1)",
  overflow: "hidden",
};

const barFillStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
};

const damageGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
  fontSize: "14px",
};

const actionsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "10px",
};

const payButtonStyle: CSSProperties = {
  width: "100%",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "12px",
  padding: "11px",
  background: "linear-gradient(135deg, rgba(37,99,235,0.95), rgba(29,78,216,0.95))",
  color: "white",
  fontWeight: "bold",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "4px",
};

const buttonStyle: CSSProperties = {
  marginTop: "16px",
  width: "100%",
  boxSizing: "border-box",
  padding: "12px",
  borderRadius: "12px",
  background: "#2563eb",
  color: "white",
  textDecoration: "none",
  fontWeight: "bold",
  display: "inline-flex",
  justifyContent: "center",
};

const emptyStyle: CSSProperties = {
  padding: "28px",
  textAlign: "center",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
};