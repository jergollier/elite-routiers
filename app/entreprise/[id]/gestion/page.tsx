import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function GestionEntreprisePage({ params }: Props) {
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
    where: { id: entrepriseId },
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

  const membreActuel = entreprise.membres.find(
    (membre) => membre.user?.steamId === steamId
  );

  if (!membreActuel) {
    redirect("/societe");
  }

  const rolesAutorises = [
    "DIRECTEUR",
    "SOUS_DIRECTEUR",
    "CHEF_EQUIPE",
    "CHEF_ATELIER",
  ];

  if (!rolesAutorises.includes(membreActuel.role)) {
    redirect("/mon-entreprise");
  }

  const nbDirecteurs = entreprise.membres.filter(
    (membre) => membre.role === "DIRECTEUR"
  ).length;

  const nbSousDirecteurs = entreprise.membres.filter(
    (membre) => membre.role === "SOUS_DIRECTEUR"
  ).length;

  const nbChefsEquipe = entreprise.membres.filter(
    (membre) => membre.role === "CHEF_EQUIPE"
  ).length;

  const nbChefsAtelier = entreprise.membres.filter(
    (membre) => membre.role === "CHEF_ATELIER"
  ).length;

  const nbChauffeurs = entreprise.membres.filter(
    (membre) => membre.role === "CHAUFFEUR"
  ).length;

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
          background: "rgba(0, 0, 0, 0.60)",
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
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>
            Elite Routiers
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontWeight: "bold" }}>
              Bureau : {entreprise.nom}
            </span>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(255,255,255,0.08)",
                padding: "8px 14px",
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
              <span>
                {entreprise.recrutement
                  ? "Recrutement ouvert"
                  : "Recrutement fermé"}
              </span>
            </div>

            <Link
              href="/mon-entreprise"
              style={{
                padding: "10px 16px",
                background: "#171a21",
                borderRadius: "10px",
                color: "white",
                textDecoration: "none",
                fontWeight: "bold",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              Retour
            </Link>
          </div>
        </header>

        <div
          style={{
            padding: "20px",
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: "20px",
            flex: 1,
          }}
        >
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div style={boxStyle}>
              <h2 style={{ marginTop: 0, marginBottom: "18px" }}>
                Informations entreprise
              </h2>

              <div style={gridTwoStyle}>
                <div style={infoCardStyle}>
                  <div style={labelStyle}>Nom</div>
                  <div style={valueStyle}>{entreprise.nom}</div>
                </div>

                <div style={infoCardStyle}>
                  <div style={labelStyle}>Abréviation</div>
                  <div style={valueStyle}>[{entreprise.abreviation}]</div>
                </div>

                <div style={infoCardStyle}>
                  <div style={labelStyle}>Jeu</div>
                  <div style={valueStyle}>{entreprise.jeu}</div>
                </div>

                <div style={infoCardStyle}>
                  <div style={labelStyle}>Type de transport</div>
                  <div style={valueStyle}>{entreprise.typeTransport}</div>
                </div>

                <div style={infoCardStyle}>
                  <div style={labelStyle}>Directeur</div>
                  <div style={valueStyle}>
                    {entreprise.owner?.username || "Utilisateur Steam"}
                  </div>
                </div>

                <div style={infoCardStyle}>
                  <div style={labelStyle}>Membres</div>
                  <div style={valueStyle}>{entreprise._count.membres}</div>
                </div>
              </div>
            </div>

            <div style={boxStyle}>
              <h2 style={{ marginTop: 0, marginBottom: "18px" }}>Membres</h2>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  maxHeight: "520px",
                  overflowY: "auto",
                  paddingRight: "4px",
                }}
              >
                {entreprise.membres.length > 0 ? (
                  entreprise.membres.map((membre) => (
                    <div
                      key={membre.id}
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        borderRadius: "12px",
                        padding: "14px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "999px",
                            overflow: "hidden",
                            background: "rgba(255,255,255,0.08)",
                            flexShrink: 0,
                            border: "1px solid rgba(255,255,255,0.12)",
                          }}
                        >
                          {membre.user?.avatar ? (
                            <img
                              src={membre.user.avatar}
                              alt="Avatar Steam"
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

                        <div>
                          <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                            {membre.user?.username || "Utilisateur Steam"}
                          </div>
                          <div style={{ opacity: 0.85, fontSize: "14px" }}>
                            {membre.user?.steamId || "Steam ID inconnu"}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          background: "rgba(0,0,0,0.35)",
                          padding: "8px 12px",
                          borderRadius: "10px",
                          border: "1px solid rgba(255,255,255,0.10)",
                          fontWeight: "bold",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {membre.role.replaceAll("_", " ")}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={emptyCardStyle}>Aucun membre dans la société.</div>
                )}
              </div>
            </div>
          </section>

          <aside
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div style={boxStyle}>
              <h2 style={{ marginTop: 0, marginBottom: "18px" }}>Candidatures</h2>

              <div style={emptyCardStyle}>
                Aucune candidature affichée pour le moment.
                <br />
                On branchera ici les candidatures à accepter ou refuser.
              </div>
            </div>

            <div style={boxStyle}>
              <h2 style={{ marginTop: 0, marginBottom: "18px" }}>Organisation</h2>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div style={statCardStyle}>
                  <span>Directeur</span>
                  <strong>{nbDirecteurs}</strong>
                </div>

                <div style={statCardStyle}>
                  <span>Sous-directeur</span>
                  <strong>{nbSousDirecteurs}</strong>
                </div>

                <div style={statCardStyle}>
                  <span>Chef d’équipe</span>
                  <strong>{nbChefsEquipe}</strong>
                </div>

                <div style={statCardStyle}>
                  <span>Chef atelier</span>
                  <strong>{nbChefsAtelier}</strong>
                </div>

                <div style={statCardStyle}>
                  <span>Chauffeurs</span>
                  <strong>{nbChauffeurs}</strong>
                </div>

                <div style={statCardStyle}>
                  <span>Total membres</span>
                  <strong>{entreprise._count.membres}</strong>
                </div>

                <div style={statCardStyle}>
                  <span>Recrutement</span>
                  <strong>{entreprise.recrutement ? "Actif" : "Fermé"}</strong>
                </div>
              </div>
            </div>
          </aside>
        </div>
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

const gridTwoStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "14px",
};

const infoCardStyle = {
  background: "rgba(255,255,255,0.08)",
  borderRadius: "12px",
  padding: "14px",
  border: "1px solid rgba(255,255,255,0.08)",
};

const labelStyle = {
  fontSize: "13px",
  opacity: 0.8,
  marginBottom: "6px",
};

const valueStyle = {
  fontWeight: "bold",
  fontSize: "16px",
};

const statCardStyle = {
  background: "rgba(255,255,255,0.08)",
  borderRadius: "12px",
  padding: "14px",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const emptyCardStyle = {
  background: "rgba(255,255,255,0.08)",
  borderRadius: "12px",
  padding: "14px",
  border: "1px solid rgba(255,255,255,0.08)",
  lineHeight: 1.6,
  opacity: 0.9,
};