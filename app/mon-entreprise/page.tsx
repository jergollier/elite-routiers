import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Menu from "@/app/components/Menu";
import DeleteLivraisonButton from "@/app/components/DeleteLivraisonButton";

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
              membres: {
                include: {
                  user: true,
                },
                orderBy: {
                  createdAt: "asc",
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user || user.memberships.length === 0) {
    redirect("/societe");
  }

  const membership = user.memberships[0];
  const entreprise = membership.entreprise;

  const rolesAutorisesBureau = [
    "DIRECTEUR",
    "SOUS_DIRECTEUR",
    "CHEF_EQUIPE",
    "CHEF_ATELIER",
  ];

  const peutAccederBureau = rolesAutorisesBureau.includes(membership.role);

  const argentSociete = entreprise.argent ?? 0;
  const cuveMax = entreprise.cuveMax ?? 10000;
  const cuveActuelle = entreprise.cuveActuelle ?? 0;
  const cuvePourcent = Math.max(
    0,
    Math.min(100, (cuveActuelle / cuveMax) * 100)
  );

  const steamIdsSociete = entreprise.membres
    .map((membre) => membre.user?.steamId)
    .filter((value): value is string => Boolean(value));

  const livraisonsDb =
    steamIdsSociete.length > 0
      ? await prisma.livraison.findMany({
          where: {
            steamId: {
              in: steamIdsSociete,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 50,
        })
      : [];

  const chauffeursParSteamId = new Map(
    entreprise.membres
      .filter((membre) => membre.user?.steamId)
      .map((membre) => [
        membre.user!.steamId,
        membre.user?.username || "Utilisateur Steam",
      ])
  );

  const livraisons = livraisonsDb.map((livraison) => ({
    id: livraison.id,
    chauffeur: livraison.steamId
      ? chauffeursParSteamId.get(livraison.steamId) || "Chauffeur inconnu"
      : "Chauffeur inconnu",
    trajet: `${livraison.sourceCity} → ${livraison.destinationCity}`,
    gain: `${livraison.income.toLocaleString("fr-FR")} €`,
    statut:
      livraison.status === "TERMINEE"
        ? "Terminée"
        : livraison.status === "ANNULEE"
          ? "Annulée"
          : "En cours",
    cargo: livraison.cargo,
    truck: livraison.truck,
  }));

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
          background: "rgba(0, 0, 0, 0.55)",
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
              gap: "20px",
              fontWeight: "bold",
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <span>Entreprise : {entreprise.nom}</span>
            <span>Rôle : {membership.role.replaceAll("_", " ")}</span>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(255,255,255,0.08)",
                padding: "8px 14px",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "#22c55e",
                  display: "inline-block",
                  boxShadow: "0 0 8px #22c55e",
                }}
              />
              <span>Connecté</span>
            </div>
          </div>
        </header>

        <div
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            flex: 1,
          }}
        >
          <section
            style={{
              background: "rgba(0, 0, 0, 0.45)",
              borderRadius: "16px",
              overflow: "hidden",
              backdropFilter: "blur(6px)",
              boxShadow: "0 0 20px rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                height: "220px",
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
                    "linear-gradient(to top, rgba(0,0,0,0.88), rgba(0,0,0,0.18))",
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
                  gap: "20px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h1 style={{ margin: 0, fontSize: "36px" }}>
                    {entreprise.nom}
                  </h1>

                  <div
                    style={{
                      marginTop: "8px",
                      fontWeight: "bold",
                      opacity: 0.95,
                    }}
                  >
                    [{entreprise.abreviation}] • {entreprise.jeu}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                  }}
                >
                  <div
                    style={{
                      background: "rgba(0,0,0,0.45)",
                      padding: "14px 18px",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.12)",
                      minWidth: "220px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "13px",
                        opacity: 0.85,
                        marginBottom: "6px",
                      }}
                    >
                      Argent de la société
                    </div>
                    <div style={{ fontSize: "28px", fontWeight: "bold" }}>
                      {argentSociete.toLocaleString("fr-FR")} €
                    </div>
                  </div>

                  {peutAccederBureau && (
                    <Link
                      href={`/entreprise/${entreprise.id}/gestion`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: "160px",
                        padding: "14px 18px",
                        borderRadius: "12px",
                        background: "#171a21",
                        color: "white",
                        textDecoration: "none",
                        fontWeight: "bold",
                        border: "1px solid rgba(255,255,255,0.12)",
                        boxShadow: "0 0 20px rgba(0,0,0,0.25)",
                      }}
                    >
                      Bureau
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </section>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "260px 1fr 320px",
              gap: "20px",
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
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.45)",
                  borderRadius: "16px",
                  padding: "20px",
                  backdropFilter: "blur(6px)",
                  boxShadow: "0 0 20px rgba(0,0,0,0.4)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  minHeight: "620px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <h2 style={{ marginTop: 0, marginBottom: "18px", flexShrink: 0 }}>
                  Livraisons des chauffeurs
                </h2>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    height: "540px",
                    overflowY: "auto",
                    paddingRight: "8px",
                    scrollbarWidth: "thin",
                  }}
                >
                  {livraisons.length > 0 ? (
                    livraisons.map((livraison) => {
                      const statutStyle =
                        livraison.statut === "Terminée"
                          ? {
                              color: "#22c55e",
                              textShadow: "0 0 8px rgba(34,197,94,0.45)",
                            }
                          : livraison.statut === "Annulée"
                            ? {
                                color: "#ef4444",
                                textShadow: "0 0 8px rgba(239,68,68,0.45)",
                              }
                            : {
                                color: "#f59e0b",
                                textShadow: "0 0 8px rgba(245,158,11,0.45)",
                              };

                      return (
                        <div
                          key={livraison.id}
                          style={{
                            background: "rgba(255,255,255,0.08)",
                            borderRadius: "12px",
                            padding: "14px",
                            border: "1px solid rgba(255,255,255,0.08)",
                            display: "grid",
                            gridTemplateColumns: peutAccederBureau
                              ? "1.1fr 1.3fr 0.8fr 0.8fr 0.9fr"
                              : "1.1fr 1.3fr 0.8fr 0.8fr",
                            gap: "12px",
                            alignItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          <div>
                            <div style={{ fontSize: "13px", opacity: 0.8 }}>
                              Chauffeur
                            </div>
                            <div style={{ fontWeight: "bold" }}>
                              {livraison.chauffeur}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: "13px", opacity: 0.8 }}>
                              Trajet
                            </div>
                            <div style={{ fontWeight: "bold" }}>
                              {livraison.trajet}
                            </div>
                            <div
                              style={{
                                marginTop: "4px",
                                fontSize: "12px",
                                opacity: 0.75,
                              }}
                            >
                              {livraison.cargo} • {livraison.truck}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: "13px", opacity: 0.8 }}>
                              Gain
                            </div>
                            <div style={{ fontWeight: "bold" }}>
                              {livraison.gain}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: "13px", opacity: 0.8 }}>
                              Statut
                            </div>
                            <div
                              style={{
                                fontWeight: "bold",
                                ...statutStyle,
                              }}
                            >
                              {livraison.statut}
                            </div>
                          </div>

                          {peutAccederBureau && (
                            <div>
                              <div style={{ fontSize: "13px", opacity: 0.8 }}>
                                Action
                              </div>
                              <DeleteLivraisonButton livraisonId={livraison.id} />
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        borderRadius: "12px",
                        padding: "14px",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      Aucune vraie livraison enregistrée pour le moment.
                    </div>
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
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.45)",
                  borderRadius: "16px",
                  padding: "20px",
                  backdropFilter: "blur(6px)",
                  boxShadow: "0 0 20px rgba(0,0,0,0.4)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <h2 style={{ marginTop: 0, marginBottom: "18px" }}>
                  Chauffeurs de la société
                </h2>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    maxHeight: "320px",
                    overflowY: "auto",
                    paddingRight: "6px",
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
                          gap: "12px",
                        }}
                      >
                        <div
                          style={{
                            width: "42px",
                            height: "42px",
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
                          <div
                            style={{ fontWeight: "bold", marginBottom: "4px" }}
                          >
                            {membre.user?.username || "Utilisateur Steam"}
                          </div>
                          <div style={{ opacity: 0.85 }}>
                            {membre.role.replaceAll("_", " ")}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        borderRadius: "12px",
                        padding: "14px",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      Aucun chauffeur dans la société.
                    </div>
                  )}
                </div>
              </div>

              <div
                style={{
                  background: "rgba(0, 0, 0, 0.45)",
                  borderRadius: "16px",
                  padding: "20px",
                  backdropFilter: "blur(6px)",
                  boxShadow: "0 0 20px rgba(0,0,0,0.4)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <h2 style={{ marginTop: 0, marginBottom: "10px" }}>
                  Classement interne
                </h2>

                <p
                  style={{
                    margin: 0,
                    lineHeight: 1.6,
                    opacity: 0.9,
                  }}
                >
                  Consulte le classement des chauffeurs de ta société :
                  argent, kilomètres, infractions, accidents et classement
                  général.
                </p>

                <Link
                  href="/mon-entreprise/classement"
                  style={{
                    width: "100%",
                    maxWidth: "100%",
                    boxSizing: "border-box",
                    marginTop: "16px",
                    padding: "12px 16px",
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
                  }}
                >
                  Voir le classement
                </Link>
              </div>

              <div
                style={{
                  background: "rgba(0, 0, 0, 0.45)",
                  borderRadius: "16px",
                  padding: "20px",
                  backdropFilter: "blur(6px)",
                  boxShadow: "0 0 20px rgba(0,0,0,0.4)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <h2 style={{ marginTop: 0, marginBottom: "18px" }}>
                  Cuve de la société
                </h2>

                <div
                  style={{
                    fontSize: "14px",
                    opacity: 0.9,
                    marginBottom: "10px",
                  }}
                >
                  {cuveActuelle.toLocaleString("fr-FR")} L /{" "}
                  {cuveMax.toLocaleString("fr-FR")} L
                </div>

                <div
                  style={{
                    width: "100%",
                    height: "24px",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.10)",
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    style={{
                      width: `${cuvePourcent}%`,
                      height: "100%",
                      background:
                        "linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #22c55e 100%)",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "8px",
                    fontSize: "13px",
                    opacity: 0.8,
                  }}
                >
                  <span>0</span>
                  <span>10000</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}