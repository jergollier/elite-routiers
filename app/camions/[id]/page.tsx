import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Menu from "@/app/components/Menu";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

function formatMarque(marque: string) {
  switch (marque) {
    case "RENAULT":
      return "Renault";
    case "SCANIA":
      return "Scania";
    case "VOLVO":
      return "Volvo";
    case "MAN":
      return "MAN";
    case "DAF":
      return "DAF";
    case "MERCEDES":
      return "Mercedes-Benz";
    case "IVECO":
      return "Iveco";
    case "KENWORTH":
      return "Kenworth";
    case "PETERBILT":
      return "Peterbilt";
    case "FREIGHTLINER":
      return "Freightliner";
    case "INTERNATIONAL":
      return "International";
    case "MACK":
      return "Mack";
    case "WESTERN_STAR":
      return "Western Star";
    default:
      return marque;
  }
}

function getStatutConfig(statut: string) {
  switch (statut) {
    case "DISPONIBLE":
      return {
        label: "Disponible",
        color: "#22c55e",
        glow: "0 0 10px rgba(34,197,94,0.85)",
      };
    case "EN_MISSION":
      return {
        label: "En mission",
        color: "#f59e0b",
        glow: "0 0 10px rgba(245,158,11,0.85)",
      };
    case "EN_MAINTENANCE":
      return {
        label: "En maintenance",
        color: "#ef4444",
        glow: "0 0 10px rgba(239,68,68,0.85)",
      };
    default:
      return {
        label: "Inconnu",
        color: "#9ca3af",
        glow: "0 0 10px rgba(156,163,175,0.85)",
      };
  }
}

export default async function VoirCamionPage({ params }: Props) {
  const { id } = await params;
  const camionId = Number(id);

  if (!Number.isInteger(camionId) || camionId <= 0) {
    notFound();
  }

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

  const monMembership = user.memberships[0];

  if (!monMembership) {
    redirect("/societe");
  }

  const entreprise = await prisma.entreprise.findUnique({
    where: { id: monMembership.entrepriseId },
  });

  if (!entreprise) {
    redirect("/societe");
  }

  const camion = await prisma.camion.findFirst({
    where: {
      id: camionId,
      entrepriseId: monMembership.entrepriseId,
      actif: true,
    },
    include: {
      chauffeur: true,
    },
  });

  if (!camion) {
    notFound();
  }

  const statut = getStatutConfig(camion.statut);

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundImage: "url('/truck.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        position: "relative",
        color: "white",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0, 0, 0, 0.68)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
        }}
      >
        <Menu />

        <div
          style={{
            flex: 1,
            padding: "24px",
            minWidth: 0,
          }}
        >
          <section
            style={{
              background: "rgba(0, 0, 0, 0.45)",
              borderRadius: "18px",
              overflow: "hidden",
              backdropFilter: "blur(6px)",
              boxShadow: "0 0 20px rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                padding: "24px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <h1 style={{ margin: 0, fontSize: "34px" }}>Voir le camion</h1>
                <p
                  style={{
                    marginTop: "8px",
                    marginBottom: 0,
                    opacity: 0.88,
                    lineHeight: 1.5,
                  }}
                >
                  Détails du camion de l’entreprise {entreprise.nom}
                </p>
              </div>

              <Link href="/camions" style={secondaryButtonStyle}>
                ← Retour camions
              </Link>
            </div>

            <div
              style={{
                padding: "24px",
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) 320px",
                gap: "20px",
                alignItems: "start",
              }}
            >
              <section style={{ minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    gap: "20px",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                  }}
                >
                  <article style={camionCardStyle}>
                    <div
                      style={{
                        height: "190px",
                        borderRadius: "14px",
                        overflow: "hidden",
                        marginBottom: "14px",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <img
                        src={camion.image || "/truck.jpg"}
                        alt={`${formatMarque(camion.marque)} ${camion.modele}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "10px",
                        marginBottom: "12px",
                      }}
                    >
                      <div>
                        <h2
                          style={{
                            margin: 0,
                            fontSize: "24px",
                            lineHeight: 1.2,
                          }}
                        >
                          {formatMarque(camion.marque)}
                        </h2>
                        <div
                          style={{
                            marginTop: "4px",
                            opacity: 0.82,
                            fontSize: "16px",
                          }}
                        >
                          {camion.modele}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: "999px",
                          padding: "8px 12px",
                          fontSize: "13px",
                          fontWeight: "bold",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span
                          style={{
                            width: "10px",
                            height: "10px",
                            borderRadius: "50%",
                            background: statut.color,
                            boxShadow: statut.glow,
                            display: "inline-block",
                          }}
                        />
                        {statut.label}
                      </div>
                    </div>

                    <div style={infoListStyle}>
                      <div style={infoRowStyle}>
                        <span style={labelStyle}>Chauffeur</span>
                        <span style={valueStyle}>
                          {camion.chauffeur?.username || "Non attribué"}
                        </span>
                      </div>

                      <div style={infoRowStyle}>
                        <span style={labelStyle}>Cabine</span>
                        <span style={valueStyle}>{camion.cabine || "Non définie"}</span>
                      </div>

                      <div style={infoRowStyle}>
                        <span style={labelStyle}>Châssis</span>
                        <span style={valueStyle}>{camion.chassis || "Non défini"}</span>
                      </div>

                      <div style={infoRowStyle}>
                        <span style={labelStyle}>Moteur</span>
                        <span style={valueStyle}>{camion.moteur || "Non défini"}</span>
                      </div>

                      <div style={infoRowStyle}>
                        <span style={labelStyle}>Transmission</span>
                        <span style={valueStyle}>
                          {camion.transmission || "Non définie"}
                        </span>
                      </div>

                      <div style={infoRowStyle}>
                        <span style={labelStyle}>Peinture</span>
                        <span style={valueStyle}>{camion.peinture || "Non définie"}</span>
                      </div>
                    </div>
                  </article>

                  <div style={{ flex: 1, minWidth: "280px" }}>
                    <div style={boxStyle}>
                      <h2 style={{ marginTop: 0, marginBottom: "16px" }}>
                        Accessoires extérieurs
                      </h2>

                      <div style={accessoiresBoxStyle}>
                        {camion.accessoiresExterieur || "Aucun accessoire extérieur"}
                      </div>
                    </div>

                    <div style={{ ...boxStyle, marginTop: "18px" }}>
                      <h2 style={{ marginTop: 0, marginBottom: "16px" }}>
                        Accessoires intérieurs
                      </h2>

                      <div style={accessoiresBoxStyle}>
                        {camion.accessoiresInterieur || "Aucun accessoire intérieur"}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        marginTop: "22px",
                        flexWrap: "wrap",
                      }}
                    >
                      <Link
                        href={`/camions/${camion.id}/modifier`}
                        style={mainButtonLinkStyle}
                      >
                        Modifier
                      </Link>

                      <Link
                        href={`/camions/${camion.id}/attribuer`}
                        style={secondaryButtonStyle}
                      >
                        Attribuer
                      </Link>
                    </div>
                  </div>
                </div>
              </section>

              <aside
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div style={boxStyle}>
                  <h2 style={{ marginTop: 0, marginBottom: "12px" }}>
                    Résumé
                  </h2>

                  <div style={infoRowStyle}>
                    <span style={labelStyle}>Entreprise</span>
                    <span style={valueStyle}>{entreprise.nom}</span>
                  </div>

                  <div style={infoRowStyle}>
                    <span style={labelStyle}>Statut</span>
                    <span style={valueStyle}>{statut.label}</span>
                  </div>

                  <div style={infoRowStyle}>
                    <span style={labelStyle}>Chauffeur</span>
                    <span style={valueStyle}>
                      {camion.chauffeur?.username || "Non attribué"}
                    </span>
                  </div>
                </div>

                <div style={boxStyle}>
                  <h2 style={{ marginTop: 0, marginBottom: "12px" }}>
                    Infos techniques
                  </h2>

                  <p style={smallTextStyle}>
                    Ici tu retrouves les informations principales du camion sans le
                    prix ni la preuve d’achat.
                  </p>
                </div>
              </aside>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

const boxStyle = {
  background: "rgba(255,255,255,0.08)",
  borderRadius: "16px",
  padding: "20px",
  border: "1px solid rgba(255,255,255,0.08)",
};

const camionCardStyle = {
  width: "360px",
  maxWidth: "100%",
  background: "rgba(255,255,255,0.08)",
  borderRadius: "16px",
  padding: "16px",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(4px)",
  boxShadow: "0 0 18px rgba(0,0,0,0.28)",
};

const infoListStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
};

const infoRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "8px 0",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};

const labelStyle = {
  opacity: 0.82,
  fontSize: "14px",
};

const valueStyle = {
  fontWeight: "bold",
  fontSize: "14px",
  textAlign: "right" as const,
};

const accessoiresBoxStyle = {
  minHeight: "120px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.06)",
  padding: "14px",
  lineHeight: 1.6,
  whiteSpace: "pre-wrap" as const,
};

const smallTextStyle = {
  margin: 0,
  lineHeight: 1.6,
  opacity: 0.9,
};

const mainButtonLinkStyle = {
  padding: "12px 18px",
  borderRadius: "10px",
  border: "none",
  background: "#2563eb",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const secondaryButtonStyle = {
  padding: "12px 18px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};