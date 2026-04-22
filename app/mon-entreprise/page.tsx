import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Menu from "@/app/components/Menu";

function formatJeu(jeu: string) {
  if (jeu === "LES_DEUX") return "Les deux";
  return jeu;
}

function formatTypeTransport(type: string) {
  switch (type) {
    case "GENERAL":
      return "Général";
    case "CITERNE":
      return "Citerne";
    case "CONVOI_EXCEPTIONNEL":
      return "Convoi exceptionnel";
    case "FRIGO":
      return "Frigo";
    case "BENNE":
      return "Benne";
    case "PLATEAU":
      return "Plateau";
    case "LIVESTOCK":
      return "Bétail";
    default:
      return type;
  }
}

function formatRole(role: string) {
  switch (role) {
    case "DIRECTEUR":
      return "Directeur";
    case "SOUS_DIRECTEUR":
      return "Sous-directeur";
    case "CHEF_EQUIPE":
      return "Chef d’équipe";
    case "CHEF_ATELIER":
      return "Chef d’atelier";
    default:
      return "Chauffeur";
  }
}

function formatStatutLivraison(status: string | null | undefined) {
  if (status === "TERMINEE") return "Terminée";
  if (status === "EN_COURS") return "En cours";
  if (status === "ANNULEE") return "Annulée";
  return status || "Inconnue";
}

export default async function MonEntreprisePage() {
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
          entreprise: {
            include: {
              owner: true,
              membres: {
                include: {
                  user: true,
                },
                orderBy: {
                  createdAt: "asc",
                },
              },
              livraisons: {
                include: {
                  user: true,
                },
                orderBy: {
                  createdAt: "desc",
                },
                take: 12,
              },
            },
          },
        },
      },
    },
  });

  if (!user || !user.memberships || !user.memberships.entreprise) {
    redirect("/societe");
  }

  const membership = user.memberships;
  const entreprise = membership.entreprise;

  const rolesAutorisesBureau = [
    "DIRECTEUR",
    "SOUS_DIRECTEUR",
    "CHEF_EQUIPE",
    "CHEF_ATELIER",
  ];

  const peutVoirBureau = rolesAutorisesBureau.includes(membership.role);

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
          background: "rgba(0,0,0,0.60)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          padding: "20px",
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          gap: "20px",
        }}
      >
        <Menu />

        <section
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div
            style={{
              position: "relative",
              borderRadius: "18px",
              overflow: "hidden",
              height: "220px",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 0 20px rgba(0,0,0,0.35)",
              background: "rgba(0,0,0,0.55)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.25))",
                zIndex: 2,
              }}
            />

            <img
              src={entreprise.banniere || "/truck.jpg"}
              alt="Bannière entreprise"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
                display: "block",
              }}
            />

            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0.10))",
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                position: "absolute",
                left: "20px",
                bottom: "20px",
                zIndex: 2,
              }}
            >
              <div style={{ fontSize: "28px", fontWeight: "bold" }}>
                {entreprise.nom}
              </div>
              <div style={{ fontSize: "14px", opacity: 0.92, marginTop: "4px" }}>
                [{entreprise.abreviation}] • {formatJeu(entreprise.jeu)}
              </div>
              <div style={{ fontSize: "13px", opacity: 0.82, marginTop: "6px" }}>
                Type de transport : {formatTypeTransport(entreprise.typeTransport)}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "260px minmax(0, 1fr) 280px",
              gap: "20px",
              alignItems: "start",
            }}
          >
            <div style={boxStyle}>
              <h2 style={{ marginTop: 0, marginBottom: "18px" }}>
                Infos société
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={infoCardStyle}>
                  <div style={labelStyle}>Nom</div>
                  <div style={valueStyle}>{entreprise.nom}</div>
                </div>

                <div style={infoCardStyle}>
                  <div style={labelStyle}>Abréviation</div>
                  <div style={valueStyle}>{entreprise.abreviation}</div>
                </div>

                <div style={infoCardStyle}>
                  <div style={labelStyle}>Jeu</div>
                  <div style={valueStyle}>{formatJeu(entreprise.jeu)}</div>
                </div>

                <div style={infoCardStyle}>
                  <div style={labelStyle}>Transport</div>
                  <div style={valueStyle}>
                    {formatTypeTransport(entreprise.typeTransport)}
                  </div>
                </div>

                <div style={infoCardStyle}>
                  <div style={labelStyle}>Argent société</div>
                  <div style={valueStyle}>
                    {entreprise.argent.toLocaleString("fr-FR")} €
                  </div>
                </div>

                <div style={infoCardStyle}>
                  <div style={labelStyle}>Membres</div>
                  <div style={valueStyle}>{entreprise.membres.length}</div>
                </div>

                {peutVoirBureau && (
                  <Link
                    href={`/entreprise/${entreprise.id}/gestion`}
                    style={buttonBlueStyle}
                  >
                    🏢 Ouvrir le bureau
                  </Link>
                )}
              </div>
            </div>

            <div style={boxStyle}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  marginBottom: "18px",
                  flexWrap: "wrap",
                }}
              >
                <h2 style={{ margin: 0 }}>Livraisons des chauffeurs</h2>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <Link href="/camions" style={buttonStyle}>
                    🚛 Camions
                  </Link>

                  <Link href="/finance" style={buttonStyle}>
                    💶 Finance
                  </Link>
                </div>
              </div>

              {entreprise.livraisons.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {entreprise.livraisons.map((livraison) => (
                    <div
                      key={livraison.id}
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        borderRadius: "12px",
                        padding: "14px",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "12px",
                          flexWrap: "wrap",
                          marginBottom: "8px",
                        }}
                      >
                        <div style={{ fontWeight: "bold", fontSize: "15px" }}>
                          {livraison.user?.username || "Chauffeur inconnu"}
                        </div>

                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: "bold",
                            padding: "6px 10px",
                            borderRadius: "999px",
                            background:
                              livraison.status === "TERMINEE"
                                ? "rgba(34,197,94,0.18)"
                                : livraison.status === "ANNULEE"
                                ? "rgba(239,68,68,0.18)"
                                : "rgba(245,158,11,0.18)",
                            border:
                              livraison.status === "TERMINEE"
                                ? "1px solid rgba(34,197,94,0.35)"
                                : livraison.status === "ANNULEE"
                                ? "1px solid rgba(239,68,68,0.35)"
                                : "1px solid rgba(245,158,11,0.35)",
                          }}
                        >
                          {formatStatutLivraison(livraison.status)}
                        </div>
                      </div>

                      <div style={miniTextStyle}>
                        Trajet : {livraison.sourceCity || "?"} →{" "}
                        {livraison.destinationCity || "?"}
                      </div>

                      <div style={miniTextStyle}>
                        Cargaison : {livraison.cargo || "Non renseignée"}
                      </div>

                      <div style={miniTextStyle}>
                        Gain :{" "}
                        <strong>
                          {(livraison.income ?? 0).toLocaleString("fr-FR")} €
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={emptyCardStyle}>
                  Aucune livraison affichée pour le moment.
                </div>
              )}
            </div>

            <div style={boxStyle}>
              <h2 style={{ marginTop: 0, marginBottom: "18px" }}>
                Chauffeurs
              </h2>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  maxHeight: "320px",
                  overflowY: "auto",
                  paddingRight: "4px",
                }}
              >
                {entreprise.membres.length > 0 ? (
                  entreprise.membres.map((membre) => (
                    <div
                      key={membre.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px",
                        borderRadius: "12px",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "999px",
                          overflow: "hidden",
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          flexShrink: 0,
                        }}
                      >
                        {membre.user?.avatar ? (
                          <img
                            src={membre.user.avatar}
                            alt="Avatar"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                              opacity: 0.7,
                            }}
                          >
                            ?
                          </div>
                        )}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: "bold",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {membre.user?.username || "Utilisateur Steam"}
                        </div>
                        <div style={{ fontSize: "12px", opacity: 0.8 }}>
                          {formatRole(membre.role)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={emptyCardStyle}>Aucun chauffeur dans la société.</div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

const boxStyle = {
  background: "rgba(0, 0, 0, 0.45)",
  borderRadius: "16px",
  padding: "20px",
  backdropFilter: "blur(6px)",
  boxShadow: "0 0 20px rgba(0,0,0,0.4)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const infoCardStyle = {
  background: "rgba(255,255,255,0.08)",
  borderRadius: "12px",
  padding: "12px",
  border: "1px solid rgba(255,255,255,0.08)",
};

const labelStyle = {
  display: "block",
  fontSize: "12px",
  opacity: 0.8,
  marginBottom: "6px",
};

const valueStyle = {
  fontWeight: "bold",
  fontSize: "15px",
};

const buttonStyle = {
  padding: "10px 12px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  fontWeight: "bold",
  textDecoration: "none",
  display: "block",
  textAlign: "center" as const,
};

const buttonBlueStyle = {
  padding: "12px 14px",
  borderRadius: "10px",
  background: "#2563eb",
  color: "white",
  fontWeight: "bold",
  textDecoration: "none",
  display: "block",
  textAlign: "center" as const,
};

const emptyCardStyle = {
  background: "rgba(255,255,255,0.08)",
  borderRadius: "12px",
  padding: "14px",
  border: "1px solid rgba(255,255,255,0.08)",
  lineHeight: 1.6,
  opacity: 0.9,
};

const miniTextStyle = {
  fontSize: "13px",
  opacity: 0.9,
  marginBottom: "4px",
};