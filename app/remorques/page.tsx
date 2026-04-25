import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";


function formatMarque(value: string) {
  return value.replaceAll("_", " ");
}

function formatType(value: string) {
  switch (value) {
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
      return value;
  }
}

function getStatutConfig(statut: string) {
  switch (statut) {
    case "DISPONIBLE":
      return {
        label: "Disponible",
        color: "#22c55e",
        bg: "rgba(34,197,94,0.16)",
        border: "1px solid rgba(34,197,94,0.35)",
      };
    case "ATTRIBUEE":
      return {
        label: "Attribuée",
        color: "#f59e0b",
        bg: "rgba(245,158,11,0.16)",
        border: "1px solid rgba(245,158,11,0.35)",
      };
    case "EN_MAINTENANCE":
      return {
        label: "Maintenance",
        color: "#ef4444",
        bg: "rgba(239,68,68,0.16)",
        border: "1px solid rgba(239,68,68,0.35)",
      };
    default:
      return {
        label: "Inconnu",
        color: "#cbd5e1",
        bg: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
      };
  }
}

function getPneusColor(usure: number) {
  if (usure >= 75) return "#ef4444";
  if (usure >= 45) return "#f59e0b";
  return "#22c55e";
}

export default async function RemorquesPage() {
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

  if (!user || !user.memberships) {
    redirect("/societe");
  }

  const entreprise = user.memberships.entreprise;

  const remorques = await prisma.remorque.findMany({
    where: {
      entrepriseId: entreprise.id,
      actif: true,
    },
    include: {
      chauffeurAttribue: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const total = remorques.length;
  const disponibles = remorques.filter((r) => r.statut === "DISPONIBLE").length;
  const attribuees = remorques.filter((r) => r.statut === "ATTRIBUEE").length;
  const maintenance = remorques.filter((r) => r.statut === "EN_MAINTENANCE").length;
  const maRemorque = remorques.find((r) => r.chauffeurAttribueId === user.id);

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundImage: "url('/truck.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        color: "white",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(120deg, rgba(0,0,0,0.82), rgba(0,0,0,0.58), rgba(0,0,0,0.82))",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          padding: "20px",
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "20px",
        }}
      >
        

        <section style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              borderRadius: "20px",
              padding: "22px",
              background:
                "linear-gradient(135deg, rgba(15,23,42,0.82), rgba(0,0,0,0.55))",
              border: "1px solid rgba(255,255,255,0.10)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
              backdropFilter: "blur(8px)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "13px",
                  opacity: 0.8,
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                Flotte société
              </div>

              <h1 style={{ margin: 0, fontSize: "32px", lineHeight: 1.1 }}>
                Remorques
              </h1>

              <p style={{ margin: "10px 0 0", opacity: 0.82, maxWidth: "720px" }}>
                Gérez les remorques de {entreprise.nom}. Les chauffeurs peuvent
                prendre une remorque disponible et la rendre après mission.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Link href="/monentreprise" style={buttonGhostStyle}>
                ← Retour société
              </Link>

              <Link href="/remorques/acheter" style={buttonPrimaryStyle}>
                Acheter une remorque
              </Link>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: "14px",
            }}
          >
            <div style={statCardStyle}>
              <span style={statLabelStyle}>Total</span>
              <strong style={statValueStyle}>{total}</strong>
            </div>

            <div style={statCardStyle}>
              <span style={statLabelStyle}>Disponibles</span>
              <strong style={{ ...statValueStyle, color: "#22c55e" }}>
                {disponibles}
              </strong>
            </div>

            <div style={statCardStyle}>
              <span style={statLabelStyle}>Attribuées</span>
              <strong style={{ ...statValueStyle, color: "#f59e0b" }}>
                {attribuees}
              </strong>
            </div>

            <div style={statCardStyle}>
              <span style={statLabelStyle}>Maintenance</span>
              <strong style={{ ...statValueStyle, color: "#ef4444" }}>
                {maintenance}
              </strong>
            </div>
          </div>

          {maRemorque && (
            <div
              style={{
                borderRadius: "16px",
                padding: "16px",
                background: "rgba(34,197,94,0.12)",
                border: "1px solid rgba(34,197,94,0.30)",
                boxShadow: "0 0 25px rgba(34,197,94,0.08)",
              }}
            >
              <strong>Ta remorque actuelle :</strong>{" "}
              {formatMarque(maRemorque.marque)} {maRemorque.modele} —{" "}
              {formatType(maRemorque.type)}
            </div>
          )}

          {remorques.length === 0 ? (
            <div style={emptyStyle}>
              <h2 style={{ marginTop: 0 }}>Aucune remorque pour le moment</h2>
              <p style={{ opacity: 0.82 }}>
                La société n’a pas encore acheté de remorque.
              </p>
              <Link href="/remorques/acheter" style={buttonPrimaryStyle}>
                Ouvrir le catalogue
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "18px",
              }}
            >
              {remorques.map((remorque) => {
                const statut = getStatutConfig(remorque.statut);
                const pneusColor = getPneusColor(remorque.pneusUsure);
                const pneusOk = Math.max(0, 100 - remorque.pneusUsure);
                const estAMoi = remorque.chauffeurAttribueId === user.id;
                const peutPrendre =
                  remorque.statut === "DISPONIBLE" && !maRemorque;

                return (
                  <article
                    key={remorque.id}
                    style={{
                      borderRadius: "18px",
                      overflow: "hidden",
                      background: "rgba(0,0,0,0.52)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
                      backdropFilter: "blur(7px)",
                    }}
                  >
                    <div
                      style={{
                        height: "150px",
                        position: "relative",
                        background:
                          "linear-gradient(135deg, rgba(37,99,235,0.22), rgba(0,0,0,0.35))",
                      }}
                    >
                      <img
                        src={remorque.image || "/truck.jpg"}
                        alt={`${remorque.marque} ${remorque.modele}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                          opacity: 0.9,
                        }}
                      />

                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "linear-gradient(to top, rgba(0,0,0,0.82), rgba(0,0,0,0.05))",
                        }}
                      />

                      <div
                        style={{
                          position: "absolute",
                          top: "12px",
                          right: "12px",
                          padding: "7px 10px",
                          borderRadius: "999px",
                          background: statut.bg,
                          border: statut.border,
                          color: statut.color,
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        {statut.label}
                      </div>

                      <div
                        style={{
                          position: "absolute",
                          left: "14px",
                          bottom: "12px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "20px",
                            fontWeight: "bold",
                            textShadow: "0 2px 8px rgba(0,0,0,0.8)",
                          }}
                        >
                          {formatMarque(remorque.marque)} {remorque.modele}
                        </div>

                        <div style={{ fontSize: "13px", opacity: 0.86 }}>
                          {formatType(remorque.type)} • {remorque.jeu}
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: "16px" }}>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "10px",
                          marginBottom: "14px",
                        }}
                      >
                        <div style={miniBoxStyle}>
                          <span style={miniLabelStyle}>Chauffeur</span>
                          <strong style={miniValueStyle}>
                            {remorque.chauffeurAttribue?.username || "Aucun"}
                          </strong>
                        </div>

                        <div style={miniBoxStyle}>
                          <span style={miniLabelStyle}>Prix achat</span>
                          <strong style={miniValueStyle}>
                            {(remorque.prixAchat ?? 0).toLocaleString("fr-FR")} €
                          </strong>
                        </div>
                      </div>

                      <div style={{ marginBottom: "14px" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "7px",
                            fontSize: "13px",
                          }}
                        >
                          <span style={{ opacity: 0.82 }}>État des pneus</span>
                          <strong style={{ color: pneusColor }}>
                            {pneusOk}% OK
                          </strong>
                        </div>

                        <div
                          style={{
                            height: "9px",
                            borderRadius: "999px",
                            background: "rgba(255,255,255,0.10)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${pneusOk}%`,
                              height: "100%",
                              background: pneusColor,
                              borderRadius: "999px",
                            }}
                          />
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          flexWrap: "wrap",
                        }}
                      >
                        {peutPrendre && (
                          <form action="/api/remorques/prendre" method="POST">
                            <input
                              type="hidden"
                              name="remorqueId"
                              value={remorque.id}
                            />
                            <button type="submit" style={buttonTakeStyle}>
                              Prendre
                            </button>
                          </form>
                        )}

                        {estAMoi && (
                          <form action="/api/remorques/rendre" method="POST">
                            <input
                              type="hidden"
                              name="remorqueId"
                              value={remorque.id}
                            />
                            <button type="submit" style={buttonReturnStyle}>
                              Rendre
                            </button>
                          </form>
                        )}

                        {!peutPrendre && !estAMoi && (
                          <span style={disabledTextStyle}>
                            {maRemorque
                              ? "Tu as déjà une remorque"
                              : "Non disponible"}
                          </span>
                        )}
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

const buttonPrimaryStyle = {
  padding: "11px 14px",
  borderRadius: "12px",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "white",
  fontWeight: "bold",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 10px 25px rgba(37,99,235,0.28)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const buttonGhostStyle = {
  padding: "11px 14px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  fontWeight: "bold",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,0.12)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const statCardStyle = {
  borderRadius: "16px",
  padding: "16px",
  background: "rgba(0,0,0,0.46)",
  border: "1px solid rgba(255,255,255,0.09)",
  backdropFilter: "blur(6px)",
};

const statLabelStyle = {
  display: "block",
  fontSize: "12px",
  opacity: 0.72,
  marginBottom: "8px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
};

const statValueStyle = {
  fontSize: "28px",
  lineHeight: 1,
};

const emptyStyle = {
  borderRadius: "18px",
  padding: "24px",
  background: "rgba(0,0,0,0.50)",
  border: "1px solid rgba(255,255,255,0.10)",
  backdropFilter: "blur(7px)",
};

const miniBoxStyle = {
  borderRadius: "12px",
  padding: "10px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  minWidth: 0,
};

const miniLabelStyle = {
  display: "block",
  fontSize: "11px",
  opacity: 0.72,
  marginBottom: "5px",
};

const miniValueStyle = {
  display: "block",
  fontSize: "13px",
  whiteSpace: "nowrap" as const,
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const buttonTakeStyle = {
  padding: "10px 14px",
  borderRadius: "10px",
  background: "#22c55e",
  color: "white",
  border: "none",
  fontWeight: "bold",
  cursor: "pointer",
};

const buttonReturnStyle = {
  padding: "10px 14px",
  borderRadius: "10px",
  background: "#ef4444",
  color: "white",
  border: "none",
  fontWeight: "bold",
  cursor: "pointer",
};

const disabledTextStyle = {
  padding: "10px 12px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.72)",
  fontSize: "13px",
};