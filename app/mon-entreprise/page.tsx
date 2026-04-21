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
            },
          },
        },
      },
    },
  });

if (!user || !user.memberships) {
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
              background: entreprise.banniere
                ? `linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.55)), url('${entreprise.banniere}') center/cover no-repeat`
                : "linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.55)), url('/truck.jpg') center/cover no-repeat",
              borderRadius: "18px",
              minHeight: "240px",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 0 20px rgba(0,0,0,0.35)",
              padding: "24px",
              display: "flex",
              alignItems: "flex-end",
            }}
          >
            <div>
              <div style={{ fontSize: "32px", fontWeight: "bold" }}>
                {entreprise.nom}
              </div>
              <div style={{ fontSize: "15px", opacity: 0.9, marginTop: "6px" }}>
                [{entreprise.abreviation}] • {formatJeu(entreprise.jeu)}
              </div>
              <div style={{ fontSize: "14px", opacity: 0.8, marginTop: "8px" }}>
                Type de transport : {formatTypeTransport(entreprise.typeTransport)}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 0.8fr",
              gap: "20px",
            }}
          >
            <div style={boxStyle}>
              <h2 style={{ marginTop: 0, marginBottom: "18px" }}>
                Informations de la société
              </h2>

              <div style={gridTwoStyle}>
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
                  <div style={labelStyle}>Argent de la société</div>
                  <div style={valueStyle}>
                    {entreprise.argent.toLocaleString("fr-FR")} €
                  </div>
                </div>

                <div style={infoCardStyle}>
                  <div style={labelStyle}>Membres</div>
                  <div style={valueStyle}>{entreprise.membres.length}</div>
                </div>
              </div>
            </div>

            <div style={boxStyle}>
              <h2 style={{ marginTop: 0, marginBottom: "18px" }}>Accès rapide</h2>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <Link href="/camions" style={buttonStyle}>
                  🚛 Voir les camions
                </Link>

                <Link href="/finance" style={buttonStyle}>
                  💶 Voir les finances
                </Link>

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
          </div>

          <div style={boxStyle}>
            <h2 style={{ marginTop: 0, marginBottom: "18px" }}>
              Chauffeurs de la société
            </h2>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {entreprise.membres.map((membre) => (
                <div
                  key={membre.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px",
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

                  <div>
                    <div style={{ fontWeight: "bold" }}>
                      {membre.user?.username || "Utilisateur Steam"}
                    </div>
                    <div style={{ fontSize: "13px", opacity: 0.8 }}>
                      {formatRole(membre.role)}
                    </div>
                  </div>
                </div>
              ))}
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
  display: "block",
  fontSize: "13px",
  opacity: 0.8,
  marginBottom: "6px",
};

const valueStyle = {
  fontWeight: "bold",
  fontSize: "16px",
};

const buttonStyle = {
  padding: "12px 14px",
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