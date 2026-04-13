import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Menu from "@/app/components/Menu";

export default async function ChauffeurPage() {
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
        orderBy: {
          createdAt: "desc",
        },
      },
      chauffeurStats: {
        orderBy: {
          createdAt: "desc",
        },
      },
      livraisons: {
        orderBy: {
          createdAt: "desc",
        },
        take: 15,
      },
    },
  });

  if (!user) {
    redirect("/");
  }

  const membershipActif = user.memberships[0] ?? null;
  const entrepriseActuelle = membershipActif?.entreprise ?? null;

  const totalArgentGagne = user.chauffeurStats.reduce(
    (acc, stat) => acc + (stat.argentGagne ?? 0),
    0
  );

  const totalKilometres = user.chauffeurStats.reduce(
    (acc, stat) => acc + (stat.kilometres ?? 0),
    0
  );

  const totalLivraisonsReussies = user.chauffeurStats.reduce(
    (acc, stat) => acc + (stat.livraisons ?? 0),
    0
  );

  const totalAnnulees = user.livraisons.filter(
    (livraison) => livraison.status === "ANNULEE"
  ).length;

  const totalEnCours = user.livraisons.filter(
    (livraison) => livraison.status === "EN_COURS"
  ).length;

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundImage: "url('/truck.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        padding: "20px",
        color: "white",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "220px 1fr",
          gap: "20px",
        }}
      >
        <Menu />

        <div style={{ display: "grid", gap: "20px" }}>
          <section
            style={{
              background: "rgba(0,0,0,0.55)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "18px",
              backdropFilter: "blur(6px)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ padding: "24px" }}>
              <div style={{ opacity: 0.7 }}>Elite Routiers</div>

              <h1 style={{ margin: "5px 0", fontSize: "2rem" }}>
                Espace chauffeur
              </h1>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "10px",
                  flexWrap: "wrap",
                }}
              >
                <Tag>{user.username || "Chauffeur"}</Tag>
                <Tag>{entrepriseActuelle?.nom || "Aucune entreprise"}</Tag>
                <Tag>{user.jeuPrincipal || "Jeu non renseigné"}</Tag>
              </div>
            </div>
          </section>

          <section
            style={{
              background: "rgba(0,0,0,0.55)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "18px",
              padding: "20px",
              backdropFilter: "blur(6px)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "15px",
              }}
            >
              <StatCard
                title="Argent perso"
                value={`${(user.argentPerso ?? 0).toLocaleString("fr-FR")} €`}
                color="#22c55e"
              />
              <StatCard
                title="Gains livraisons"
                value={`${totalArgentGagne.toLocaleString("fr-FR")} €`}
                color="#60a5fa"
              />
              <StatCard
                title="Kilomètres"
                value={`${Math.round(totalKilometres).toLocaleString("fr-FR")} km`}
                color="#f59e0b"
              />
              <StatCard
                title="Livraisons réussies"
                value={totalLivraisonsReussies.toString()}
                color="#22c55e"
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "15px",
                marginTop: "15px",
              }}
            >
              <StatCard
                title="Livraisons annulées"
                value={totalAnnulees.toString()}
                color="#ef4444"
              />
              <StatCard
                title="Livraisons en cours"
                value={totalEnCours.toString()}
                color="#f59e0b"
              />
            </div>
          </section>

          <section
            style={{
              background: "rgba(0,0,0,0.55)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "18px",
              padding: "20px",
              backdropFilter: "blur(6px)",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: "16px" }}>
              Dernières livraisons
            </h2>

            {user.livraisons.length === 0 ? (
              <EmptyText>Aucune livraison enregistrée.</EmptyText>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: "12px",
                }}
              >
                {user.livraisons.map((livraison) => {
                  const statutLabel =
                    livraison.status === "TERMINEE"
                      ? "Terminée"
                      : livraison.status === "ANNULEE"
                      ? "Annulée"
                      : "En cours";

                  const statutStyle =
                    livraison.status === "TERMINEE"
                      ? { color: "#22c55e" }
                      : livraison.status === "ANNULEE"
                      ? { color: "#ef4444" }
                      : { color: "#f59e0b" };

                  const trajet =
                    livraison.sourceCity && livraison.destinationCity
                      ? `${livraison.sourceCity} → ${livraison.destinationCity}`
                      : "Trajet non disponible";

                  return (
                    <div
                      key={livraison.id}
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "12px",
                        padding: "14px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "12px",
                          flexWrap: "wrap",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                            {trajet}
                          </div>
                          <div style={{ opacity: 0.8, fontSize: "14px" }}>
                            {livraison.cargo || "Cargo inconnu"} •{" "}
                            {livraison.truck || "Camion inconnu"}
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <div
                            style={{
                              fontWeight: "bold",
                              ...statutStyle,
                            }}
                          >
                            {statutLabel}
                          </div>
                          <div
                            style={{
                              opacity: 0.8,
                              fontSize: "14px",
                              marginTop: "4px",
                            }}
                          >
                            {new Date(livraison.createdAt).toLocaleString("fr-FR")}
                          </div>
                        </div>
                      </div>

                      {livraison.status === "TERMINEE" && (
                        <div
                          style={{
                            display: "flex",
                            gap: "18px",
                            flexWrap: "wrap",
                            marginTop: "12px",
                            fontSize: "14px",
                            opacity: 0.95,
                          }}
                        >
                          <span>
                            💰 Brut : {(livraison.income ?? 0).toLocaleString("fr-FR")} €
                          </span>
                          <span>
                            👤 Chauffeur : {(livraison.gainChauffeur ?? 0).toLocaleString("fr-FR")} €
                          </span>
                          <span>
                            🏢 Société : {(livraison.gainSociete ?? 0).toLocaleString("fr-FR")} €
                          </span>
                          <span>
                            🏛️ Charges : {(livraison.charges ?? 0).toLocaleString("fr-FR")} €
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <Link href="/profil" style={btn}>
              Retour au profil
            </Link>

            <Link href="/societe" style={btnBlue}>
              Retour société
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "12px",
        padding: "16px",
      }}
    >
      <div style={{ opacity: 0.7, marginBottom: "8px" }}>{title}</div>
      <div style={{ fontWeight: "bold", fontSize: "1.25rem", color }}>
        {value}
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        background: "rgba(255,255,255,0.1)",
        padding: "5px 10px",
        borderRadius: "10px",
      }}
    >
      {children}
    </span>
  );
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return <div style={{ opacity: 0.7 }}>{children}</div>;
}

const btn: React.CSSProperties = {
  padding: "10px 20px",
  background: "rgba(255,255,255,0.1)",
  borderRadius: "10px",
  textDecoration: "none",
  color: "white",
};

const btnBlue: React.CSSProperties = {
  ...btn,
  background: "rgba(0,100,255,0.6)",
};