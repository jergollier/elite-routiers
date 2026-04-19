import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Menu from "@/app/components/Menu";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

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

function formatMoney(value: number | null | undefined) {
  return `${(value ?? 0).toLocaleString("fr-FR")} €`;
}

export default async function EntreprisePage({ params }: PageProps) {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) {
    redirect("/");
  }

  const { id } = await params;
  const entrepriseId = Number(id);

  if (!entrepriseId || Number.isNaN(entrepriseId)) {
    notFound();
  }

  const entreprise = await prisma.entreprise.findUnique({
    where: {
      id: entrepriseId,
    },
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
      _count: {
        select: {
          membres: true,
        },
      },
    },
  });

  if (!entreprise) {
    notFound();
  }

  const directeurs = entreprise.membres.filter(
    (membre) => membre.role === "DIRECTEUR"
  ).length;

  const sousDirecteurs = entreprise.membres.filter(
    (membre) => membre.role === "SOUS_DIRECTEUR"
  ).length;

  const chefsEquipe = entreprise.membres.filter(
    (membre) => membre.role === "CHEF_EQUIPE"
  ).length;

  const chefsAtelier = entreprise.membres.filter(
    (membre) => membre.role === "CHEF_ATELIER"
  ).length;

  const chauffeurs = entreprise.membres.filter(
    (membre) => membre.role === "CHAUFFEUR"
  ).length;

  const argentSociete = (entreprise as { argent?: number | null }).argent ?? 0;

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
          background: "rgba(0, 0, 0, 0.65)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header
          style={{
            height: "80px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            borderBottom: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>
            Elite Routiers
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/societe"
              style={{
                padding: "10px 16px",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "white",
                textDecoration: "none",
                fontWeight: "bold",
              }}
            >
              ← Retour
            </Link>

            {entreprise.recrutement ? (
              <Link
                href={`/entreprise/${entreprise.id}/postuler`}
                style={{
                  padding: "10px 16px",
                  borderRadius: "10px",
                  background: "#2563eb",
                  color: "white",
                  textDecoration: "none",
                  fontWeight: "bold",
                }}
              >
                Postuler
              </Link>
            ) : (
              <div
                style={{
                  padding: "10px 16px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.10)",
                  color: "rgba(255,255,255,0.7)",
                  fontWeight: "bold",
                }}
              >
                Recrutement fermé
              </div>
            )}
          </div>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "260px 1fr 320px",
            gap: "20px",
            padding: "20px",
            flex: 1,
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
                  height: "260px",
                  backgroundImage: `url('${entreprise.banniere || "/truck.jpg"}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.88), rgba(0,0,0,0.20))",
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    left: "24px",
                    bottom: "24px",
                    right: "24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    gap: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <h1 style={{ margin: 0, fontSize: "40px" }}>
                      {entreprise.nom}
                    </h1>

                    <div
                      style={{
                        marginTop: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          padding: "8px 12px",
                          borderRadius: "999px",
                          background: "rgba(255,255,255,0.10)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          fontWeight: "bold",
                          fontSize: "13px",
                        }}
                      >
                        [{entreprise.abreviation}]
                      </div>

                      <div
                        style={{
                          padding: "8px 12px",
                          borderRadius: "999px",
                          background: "rgba(255,255,255,0.10)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          fontWeight: "bold",
                          fontSize: "13px",
                        }}
                      >
                        {entreprise.jeu || "Jeu non renseigné"}
                      </div>

                      <div
                        style={{
                          padding: "8px 12px",
                          borderRadius: "999px",
                          background: "rgba(255,255,255,0.10)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          fontWeight: "bold",
                          fontSize: "13px",
                        }}
                      >
                        {entreprise.typeTransport || "Transport non renseigné"}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "rgba(255,255,255,0.10)",
                      padding: "10px 14px",
                      borderRadius: "999px",
                      border: "1px solid rgba(255,255,255,0.12)",
                      fontWeight: "bold",
                    }}
                  >
                    <span
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        display: "inline-block",
                        background: entreprise.recrutement ? "#22c55e" : "#ef4444",
                        boxShadow: entreprise.recrutement
                          ? "0 0 8px #22c55e"
                          : "0 0 8px #ef4444",
                      }}
                    />
                    {entreprise.recrutement
                      ? "Recrutement ouvert"
                      : "Recrutement fermé"}
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: "24px",
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  gap: "16px",
                }}
              >
                <div style={statBoxStyle}>
                  <div style={statLabelStyle}>Argent société</div>
                  <div style={{ ...statValueStyle, color: "#22c55e" }}>
                    {formatMoney(argentSociete)}
                  </div>
                </div>

                <div style={statBoxStyle}>
                  <div style={statLabelStyle}>Membres</div>
                  <div style={statValueStyle}>{entreprise._count.membres}</div>
                </div>

                <div style={statBoxStyle}>
                  <div style={statLabelStyle}>Directeur</div>
                  <div style={statValueStyle}>
                    {entreprise.owner?.username || "Utilisateur Steam"}
                  </div>
                </div>

                <div style={statBoxStyle}>
                  <div style={statLabelStyle}>Transport</div>
                  <div style={statValueStyle}>
                    {entreprise.typeTransport || "Non renseigné"}
                  </div>
                </div>
              </div>
            </section>

            <section
              style={{
                background: "rgba(0, 0, 0, 0.45)",
                borderRadius: "18px",
                padding: "24px",
                backdropFilter: "blur(6px)",
                boxShadow: "0 0 20px rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <h2 style={{ marginTop: 0, marginBottom: "16px", fontSize: "28px" }}>
                Présentation de la société
              </h2>

              <p
                style={{
                  margin: 0,
                  lineHeight: 1.8,
                  opacity: 0.92,
                  whiteSpace: "pre-wrap",
                }}
              >
                {entreprise.description?.trim()
                  ? entreprise.description
                  : "Cette société n’a pas encore ajouté de présentation."}
              </p>
            </section>

            <section
              style={{
                background: "rgba(0, 0, 0, 0.45)",
                borderRadius: "18px",
                padding: "24px",
                backdropFilter: "blur(6px)",
                boxShadow: "0 0 20px rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <h2 style={{ marginTop: 0, marginBottom: "18px", fontSize: "28px" }}>
                Répartition des rôles
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                  gap: "14px",
                }}
              >
                <div style={roleStatStyle}>
                  <div style={roleStatNumberStyle}>{directeurs}</div>
                  <div style={roleStatLabelStyle}>Directeurs</div>
                </div>

                <div style={roleStatStyle}>
                  <div style={roleStatNumberStyle}>{sousDirecteurs}</div>
                  <div style={roleStatLabelStyle}>Sous-directeurs</div>
                </div>

                <div style={roleStatStyle}>
                  <div style={roleStatNumberStyle}>{chefsEquipe}</div>
                  <div style={roleStatLabelStyle}>Chefs d’équipe</div>
                </div>

                <div style={roleStatStyle}>
                  <div style={roleStatNumberStyle}>{chefsAtelier}</div>
                  <div style={roleStatLabelStyle}>Chefs d’atelier</div>
                </div>

                <div style={roleStatStyle}>
                  <div style={roleStatNumberStyle}>{chauffeurs}</div>
                  <div style={roleStatLabelStyle}>Chauffeurs</div>
                </div>
              </div>
            </section>

            <section
              style={{
                background: "rgba(0, 0, 0, 0.45)",
                borderRadius: "18px",
                padding: "24px",
                backdropFilter: "blur(6px)",
                boxShadow: "0 0 20px rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <h2 style={{ marginTop: 0, marginBottom: "18px", fontSize: "28px" }}>
                Membres de la société
              </h2>

              {entreprise.membres.length > 0 ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "14px",
                  }}
                >
                  {entreprise.membres.map((membre) => (
                    <div
                      key={membre.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        padding: "14px",
                        borderRadius: "12px",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        <img
                          src={membre.user.avatar || "/truck.jpg"}
                          alt={membre.user.username || "Chauffeur"}
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "1px solid rgba(255,255,255,0.15)",
                            flexShrink: 0,
                          }}
                        />

                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: "bold",
                              fontSize: "15px",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {membre.user.username || "Chauffeur sans pseudo"}
                          </div>

                          <div
                            style={{
                              fontSize: "13px",
                              opacity: 0.75,
                              marginTop: "4px",
                            }}
                          >
                            {formatRole(membre.role)}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          padding: "7px 10px",
                          borderRadius: "999px",
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.10)",
                          fontSize: "12px",
                          fontWeight: "bold",
                          flexShrink: 0,
                        }}
                      >
                        {formatRole(membre.role)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.05)",
                    textAlign: "center",
                  }}
                >
                  Aucun membre dans cette société pour le moment.
                </div>
              )}
            </section>
          </section>

          <aside
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div style={sideBoxStyle}>
              <h2 style={{ marginTop: 0, marginBottom: "14px" }}>
                Infos rapides
              </h2>

              <div style={infoLineStyle}>
                <span style={labelStyle}>Nom</span>
                <span style={valueStyle}>{entreprise.nom}</span>
              </div>

              <div style={infoLineStyle}>
                <span style={labelStyle}>Abréviation</span>
                <span style={valueStyle}>[{entreprise.abreviation}]</span>
              </div>

              <div style={infoLineStyle}>
                <span style={labelStyle}>Directeur</span>
                <span style={valueStyle}>
                  {entreprise.owner?.username || "Utilisateur Steam"}
                </span>
              </div>

              <div style={infoLineStyle}>
                <span style={labelStyle}>Ville ETS2</span>
                <span style={valueStyle}>
                  {entreprise.villeETS2 || "Non renseignée"}
                </span>
              </div>

              <div style={infoLineStyle}>
                <span style={labelStyle}>Ville ATS</span>
                <span style={valueStyle}>
                  {entreprise.villeATS || "Non renseignée"}
                </span>
              </div>

              <div style={infoLineStyle}>
                <span style={labelStyle}>Jeu</span>
                <span style={valueStyle}>
                  {entreprise.jeu || "Non renseigné"}
                </span>
              </div>

              <div style={infoLineStyle}>
                <span style={labelStyle}>Recrutement</span>
                <span
                  style={{
                    ...valueStyle,
                    color: entreprise.recrutement ? "#22c55e" : "#ef4444",
                  }}
                >
                  {entreprise.recrutement ? "Ouvert" : "Fermé"}
                </span>
              </div>
            </div>

            <div style={sideBoxStyle}>
              <h2 style={{ marginTop: 0, marginBottom: "12px" }}>
                Rejoindre cette société
              </h2>

              <p style={smallTextStyle}>
                Regarde rapidement l’argent, les membres, le style de transport
                et les infos générales avant d’envoyer ta candidature.
              </p>

              <div style={{ marginTop: "16px" }}>
                {entreprise.recrutement ? (
                  <Link
                    href={`/entreprise/${entreprise.id}/postuler`}
                    style={{
                      display: "block",
                      textAlign: "center",
                      padding: "12px",
                      background: "#2563eb",
                      borderRadius: "10px",
                      color: "white",
                      textDecoration: "none",
                      fontWeight: "bold",
                    }}
                  >
                    Postuler maintenant
                  </Link>
                ) : (
                  <div
                    style={{
                      display: "block",
                      textAlign: "center",
                      padding: "12px",
                      background: "rgba(255,255,255,0.12)",
                      borderRadius: "10px",
                      color: "rgba(255,255,255,0.7)",
                      fontWeight: "bold",
                    }}
                  >
                    Recrutement fermé
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

const statBoxStyle = {
  background: "rgba(255,255,255,0.06)",
  borderRadius: "14px",
  padding: "16px",
  border: "1px solid rgba(255,255,255,0.08)",
};

const statLabelStyle = {
  fontSize: "13px",
  opacity: 0.75,
};

const statValueStyle = {
  marginTop: "8px",
  fontSize: "24px",
  fontWeight: "bold",
};

const roleStatStyle = {
  background: "rgba(255,255,255,0.06)",
  borderRadius: "14px",
  padding: "18px 14px",
  border: "1px solid rgba(255,255,255,0.08)",
  textAlign: "center" as const,
};

const roleStatNumberStyle = {
  fontSize: "28px",
  fontWeight: "bold",
  marginBottom: "8px",
};

const roleStatLabelStyle = {
  fontSize: "13px",
  opacity: 0.8,
};

const sideBoxStyle = {
  background: "rgba(0, 0, 0, 0.45)",
  borderRadius: "18px",
  padding: "20px",
  backdropFilter: "blur(6px)",
  boxShadow: "0 0 20px rgba(0,0,0,0.4)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const infoLineStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "10px 0",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};

const labelStyle = {
  opacity: 0.8,
};

const valueStyle = {
  fontWeight: "bold",
  textAlign: "right" as const,
};

const smallTextStyle = {
  margin: 0,
  lineHeight: 1.6,
  opacity: 0.9,
};