import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import Menu from "@/app/components/Menu";

export default async function ProfilPage() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { steamId },
    include: {
      dlcs: {
        orderBy: [{ jeu: "asc" }, { nomDlc: "asc" }],
      },
      memberships: {
        include: {
          entreprise: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      entreprisesCreees: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!user) {
    redirect("/");
  }

  const entreprisePossedee = user.entreprisesCreees[0] ?? null;
  const membershipActif = user.memberships[0] ?? null;

  const entrepriseActuelle =
    entreprisePossedee?.nom ??
    membershipActif?.entreprise?.nom ??
    "Aucune entreprise";

  const roleActuel = entreprisePossedee
    ? "DIRECTEUR"
    : membershipActif?.role ?? "Aucun rôle";

  const dlcsETS2 = user.dlcs.filter((dlc) => dlc.jeu === "ETS2");
  const dlcsATS = user.dlcs.filter((dlc) => dlc.jeu === "ATS");

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
          gridTemplateColumns: "220px minmax(0, 1fr)",
          gap: "20px",
          alignItems: "start",
        }}
      >
        <div>
          <Menu />
        </div>

        <div style={{ display: "grid", gap: "20px" }}>
          <section
            style={{
              background: "rgba(0, 0, 0, 0.85)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "18px",
              overflow: "hidden",
              boxShadow: "0 10px 30px rgba(0,0,0,0.55)",
              backdropFilter: "blur(6px)",
            }}
          >
            <div
              style={{
                padding: "24px",
                background:
                  "linear-gradient(90deg, rgba(0,0,0,0.72), rgba(0,0,0,0.38))",
                borderBottom: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <div
                style={{
                  fontSize: "0.95rem",
                  opacity: 0.8,
                  marginBottom: "8px",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}
              >
                Elite Routiers
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: "2.2rem",
                  fontWeight: "bold",
                }}
              >
                Profil de {user.username || "Chauffeur"}
              </h1>

              <div
                style={{
                  marginTop: "10px",
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <Tag>{entrepriseActuelle}</Tag>
                <Tag>{roleActuel}</Tag>
                <Tag>{user.jeuPrincipal || "Jeu non renseigné"}</Tag>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "18px",
                padding: "20px",
              }}
            >
              <Card title="Informations générales">
                <InfoRow
                  label="Pseudo Steam"
                  value={user.username || "Non renseigné"}
                />
                <InfoRow
                  label="Âge"
                  value={
                    user.age !== null && user.age !== undefined
                      ? String(user.age)
                      : "Non renseigné"
                  }
                />
                <InfoRow
                  label="Région"
                  value={user.region || "Non renseignée"}
                />
                <InfoRow label="Micro" value={user.micro ? "Oui" : "Non"} />
              </Card>

              <Card title="Profil routier">
                <InfoRow label="Rôle" value={roleActuel} />
                <InfoRow label="Entreprise" value={entrepriseActuelle} />
                <InfoRow
                  label="Jeu principal"
                  value={user.jeuPrincipal || "Non renseigné"}
                />
                <InfoRow
                  label="Transport préféré"
                  value={user.typeTransportPrefere || "Non renseigné"}
                />
              </Card>
            </div>
          </section>

          <section
            style={{
              background: "rgba(0, 0, 0, 0.85)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "18px",
              padding: "20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.55)",
              backdropFilter: "blur(6px)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 0.8fr",
                gap: "18px",
              }}
            >
              <Card title="Informations de conduite">
                <InfoRow label="Style de jeu" value="Non renseigné" />

                <div
                  style={{
                    background: "rgba(10, 10, 10, 0.85)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.6)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.9rem",
                      opacity: 0.75,
                      marginBottom: "8px",
                    }}
                  >
                    Présentation chauffeur
                  </div>

                  <div
                    style={{
                      lineHeight: "1.7",
                      fontWeight: "bold",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {user.descriptionChauffeur?.trim()
                      ? user.descriptionChauffeur
                      : "Aucune description pour le moment."}
                  </div>
                </div>
              </Card>

              <Card title="DLC">
                <div style={{ display: "grid", gap: "14px" }}>
                  <div>
                    <div
                      style={{
                        fontSize: "1rem",
                        fontWeight: "bold",
                        marginBottom: "10px",
                      }}
                    >
                      ETS2
                    </div>

                    {dlcsETS2.length > 0 ? (
                      <div style={{ display: "grid", gap: "10px" }}>
                        {dlcsETS2.map((dlc) => (
                          <ListLine key={dlc.id}>{dlc.nomDlc}</ListLine>
                        ))}
                      </div>
                    ) : (
                      <MutedText>Aucun DLC ETS2 renseigné.</MutedText>
                    )}
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: "1rem",
                        fontWeight: "bold",
                        marginBottom: "10px",
                        marginTop: "8px",
                      }}
                    >
                      ATS
                    </div>

                    {dlcsATS.length > 0 ? (
                      <div style={{ display: "grid", gap: "10px" }}>
                        {dlcsATS.map((dlc) => (
                          <ListLine key={dlc.id}>{dlc.nomDlc}</ListLine>
                        ))}
                      </div>
                    ) : (
                      <MutedText>Aucun DLC ATS renseigné.</MutedText>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </section>

          <div
            style={{
              display: "flex",
              gap: "14px",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/site"
              style={{
                background: "rgba(0, 0, 0, 0.85)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "white",
                textDecoration: "none",
                padding: "14px 22px",
                borderRadius: "14px",
                fontWeight: "bold",
                boxShadow: "0 8px 25px rgba(0,0,0,0.6)",
              }}
            >
              Retour au site
            </Link>

            <Link
              href="/profil/modifier"
              style={{
                background: "rgba(20, 40, 90, 0.92)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "white",
                textDecoration: "none",
                padding: "14px 22px",
                borderRadius: "14px",
                fontWeight: "bold",
                boxShadow: "0 8px 25px rgba(0,0,0,0.6)",
              }}
            >
              Modifier mon profil
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        background: "rgba(10, 10, 10, 0.85)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "14px",
        padding: "16px",
        height: "100%",
        boxShadow: "0 8px 25px rgba(0,0,0,0.6)",
      }}
    >
      <h3
        style={{
          marginTop: 0,
          marginBottom: "14px",
          fontSize: "1.3rem",
          fontWeight: "bold",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "rgba(10, 10, 10, 0.85)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "12px",
        padding: "12px 14px",
        marginBottom: "10px",
        boxShadow: "0 8px 25px rgba(0,0,0,0.6)",
      }}
    >
      <div
        style={{
          fontSize: "0.9rem",
          opacity: 0.75,
          marginBottom: "4px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "1.05rem",
          fontWeight: "bold",
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        background: "rgba(10, 10, 10, 0.88)",
        border: "1px solid rgba(255,255,255,0.12)",
        padding: "8px 12px",
        borderRadius: "999px",
        fontSize: "0.9rem",
        fontWeight: "bold",
        boxShadow: "0 8px 20px rgba(0,0,0,0.5)",
      }}
    >
      {children}
    </span>
  );
}

function ListLine({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: "rgba(10, 10, 10, 0.85)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "12px",
        padding: "12px 14px",
        fontWeight: "bold",
        boxShadow: "0 8px 25px rgba(0,0,0,0.6)",
      }}
    >
      {children}
    </div>
  );
}

function MutedText({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        opacity: 0.8,
        lineHeight: "1.6",
      }}
    >
      {children}
    </div>
  );
}