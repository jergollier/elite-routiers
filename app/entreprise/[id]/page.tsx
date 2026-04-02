import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EntrepriseDetailPage({ params }: PageProps) {
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
    },
  });

  if (!entreprise) {
    notFound();
  }

  const estProprietaire = entreprise.ownerSteamId === steamId;

  const chauffeurs = [
    {
      id: 1,
      nom: entreprise.owner.username || "Patron",
      statut: "Directeur",
    },
  ];

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
          }}
        >
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>
            Elite Routiers
          </div>

          <Link
            href="/societe"
            style={{
              color: "white",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            ← Retour à l'accueil
          </Link>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 320px",
            gap: "20px",
            padding: "20px",
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
                    "linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.15))",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  left: "24px",
                  bottom: "24px",
                }}
              >
                <h1 style={{ margin: 0, fontSize: "38px" }}>{entreprise.nom}</h1>
                <div style={{ marginTop: "8px", fontWeight: "bold", opacity: 0.95 }}>
                  [{entreprise.abreviation}] • {entreprise.jeu}
                </div>
              </div>
            </div>

            <div style={{ padding: "24px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "14px",
                  marginBottom: "24px",
                }}
              >
                <div style={infoCardStyle}>
                  <div style={labelSmallStyle}>Type de transport</div>
                  <div style={valueStyle}>{entreprise.typeTransport}</div>
                </div>

                <div style={infoCardStyle}>
                  <div style={labelSmallStyle}>Recrutement</div>
                  <div style={valueStyle}>
                    {entreprise.recrutement ? "Ouvert" : "Fermé"}
                  </div>
                </div>

                <div style={infoCardStyle}>
                  <div style={labelSmallStyle}>Maison mère ETS2</div>
                  <div style={valueStyle}>{entreprise.villeETS2 || "Aucune"}</div>
                </div>

                <div style={infoCardStyle}>
                  <div style={labelSmallStyle}>Maison mère ATS</div>
                  <div style={valueStyle}>{entreprise.villeATS || "Aucune"}</div>
                </div>
              </div>

              <div style={contentCardStyle}>
                <h2 style={{ marginTop: 0 }}>Description</h2>
                <p
                  style={{
                    marginBottom: 0,
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                    opacity: 0.95,
                  }}
                >
                  {entreprise.description}
                </p>
              </div>

              <div
                style={{
                  marginTop: "20px",
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                {estProprietaire ? (
                  <button style={mainButtonStyle}>Gérer mon entreprise</button>
                ) : entreprise.recrutement ? (
                  <button style={mainButtonStyle}>Postuler</button>
                ) : (
                  <button
                    style={{
                      ...mainButtonStyle,
                      opacity: 0.5,
                      cursor: "not-allowed",
                    }}
                    disabled
                  >
                    Recrutement fermé
                  </button>
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
              }}
            >
              <h2 style={{ marginTop: 0, marginBottom: "16px" }}>Direction</h2>

              <div style={sideCardStyle}>
                <div style={{ fontWeight: "bold", marginBottom: "6px" }}>
                  {entreprise.owner.username || "Utilisateur Steam"}
                </div>
                <div style={{ opacity: 0.85 }}>
                  {estProprietaire ? "Votre entreprise" : "Directeur"}
                </div>
              </div>
            </div>

            <div
              style={{
                background: "rgba(0, 0, 0, 0.45)",
                borderRadius: "16px",
                padding: "20px",
                backdropFilter: "blur(6px)",
                boxShadow: "0 0 20px rgba(0,0,0,0.4)",
              }}
            >
              <h2 style={{ marginTop: 0, marginBottom: "16px" }}>Chauffeurs</h2>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {chauffeurs.map((chauffeur) => (
                  <div key={chauffeur.id} style={sideCardStyle}>
                    <div style={{ fontWeight: "bold", marginBottom: "6px" }}>
                      {chauffeur.nom}
                    </div>
                    <div style={{ opacity: 0.85 }}>{chauffeur.statut}</div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

const infoCardStyle = {
  background: "rgba(255,255,255,0.08)",
  borderRadius: "14px",
  padding: "16px",
  border: "1px solid rgba(255,255,255,0.08)",
};

const contentCardStyle = {
  background: "rgba(255,255,255,0.08)",
  borderRadius: "14px",
  padding: "20px",
  border: "1px solid rgba(255,255,255,0.08)",
};

const sideCardStyle = {
  background: "rgba(255,255,255,0.08)",
  borderRadius: "12px",
  padding: "14px",
  border: "1px solid rgba(255,255,255,0.08)",
};

const labelSmallStyle = {
  fontSize: "13px",
  opacity: 0.8,
  marginBottom: "8px",
};

const valueStyle = {
  fontWeight: "bold",
  fontSize: "16px",
};

const mainButtonStyle = {
  padding: "12px 18px",
  borderRadius: "10px",
  border: "none",
  background: "#171a21",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
};