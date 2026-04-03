import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Menu from "@/app/components/Menu";
import { prisma } from "@/lib/prisma";

function formatPrix(prix: number) {
  return `${prix.toLocaleString("fr-FR")} €`;
}

const camionsCatalogue = [
  {
    id: "scania-s",
    marque: "SCANIA",
    modele: "S 770",
    prix: 189000,
    jeu: "ETS2",
    puissance: "770 ch",
    description:
      "Un camion haut de gamme, puissant et parfait pour les longues distances.",
    image:
      "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "volvo-fh16",
    marque: "VOLVO",
    modele: "FH16 750",
    prix: 192000,
    jeu: "ETS2",
    puissance: "750 ch",
    description:
      "Confort premium, grande fiabilité et excellente présence sur la route.",
    image:
      "https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "daf-xgplus",
    marque: "DAF",
    modele: "XG+",
    prix: 171000,
    jeu: "ETS2",
    puissance: "530 ch",
    description:
      "Cabine moderne, bonne rentabilité et camion idéal pour développer le parc.",
    image:
      "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "renault-t",
    marque: "RENAULT",
    modele: "T High",
    prix: 164000,
    jeu: "ETS2",
    puissance: "520 ch",
    description:
      "Un très bon choix pour commencer avec un camion efficace et polyvalent.",
    image:
      "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "kenworth-w900",
    marque: "KENWORTH",
    modele: "W900",
    prix: 198000,
    jeu: "ATS",
    puissance: "605 ch",
    description:
      "Un grand classique américain avec énormément de caractère et de style.",
    image:
      "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "peterbilt-389",
    marque: "PETERBILT",
    modele: "389",
    prix: 201000,
    jeu: "ATS",
    puissance: "565 ch",
    description:
      "Le mythe américain par excellence, parfait pour une flotte Elite Routiers.",
    image:
      "https://images.unsplash.com/photo-1502740479091-635887520276?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "man-tgx",
    marque: "MAN",
    modele: "TGX",
    prix: 176000,
    jeu: "ETS2",
    puissance: "640 ch",
    description:
      "Un excellent camion pour les gros trajets avec une cabine confortable.",
    image:
      "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "iveco-sway",
    marque: "IVECO",
    modele: "S-Way",
    prix: 158000,
    jeu: "ETS2",
    puissance: "570 ch",
    description:
      "Design moderne, très bon rapport qualité/prix et bon choix pour agrandir vite.",
    image:
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80",
  },
];

export default async function AcheterCamionPage() {
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

  const entrepriseId = monMembership.entrepriseId;

  const entreprise = await prisma.entreprise.findUnique({
    where: { id: entrepriseId },
  });

  if (!entreprise) {
    redirect("/societe");
  }

  const totalCamions = await prisma.camion.count({
    where: {
      entrepriseId,
      actif: true,
    },
  });

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
                <h1 style={{ margin: 0, fontSize: "34px" }}>Acheter un camion</h1>
                <p
                  style={{
                    marginTop: "8px",
                    marginBottom: 0,
                    opacity: 0.88,
                    lineHeight: 1.5,
                  }}
                >
                  Choisis un nouveau camion pour l’entreprise {entreprise.nom}
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
                gridTemplateColumns: "1fr 300px",
                gap: "20px",
                alignItems: "start",
              }}
            >
              <section>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: "18px",
                  }}
                >
                  {camionsCatalogue.map((camion) => (
                    <article key={camion.id} style={truckCardStyle}>
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
                          src={camion.image}
                          alt={`${camion.marque} ${camion.modele}`}
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
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "10px",
                          marginBottom: "12px",
                        }}
                      >
                        <div>
                          <h2
                            style={{
                              margin: 0,
                              fontSize: "22px",
                              lineHeight: 1.2,
                            }}
                          >
                            {camion.marque}
                          </h2>
                          <div
                            style={{
                              marginTop: "4px",
                              opacity: 0.82,
                              fontSize: "14px",
                            }}
                          >
                            {camion.modele}
                          </div>
                        </div>

                        <div
                          style={{
                            background: "rgba(37,99,235,0.18)",
                            border: "1px solid rgba(37,99,235,0.35)",
                            color: "#93c5fd",
                            borderRadius: "999px",
                            padding: "7px 12px",
                            fontSize: "12px",
                            fontWeight: "bold",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {camion.jeu}
                        </div>
                      </div>

                      <p
                        style={{
                          marginTop: 0,
                          marginBottom: "14px",
                          lineHeight: 1.6,
                          opacity: 0.9,
                          minHeight: "72px",
                        }}
                      >
                        {camion.description}
                      </p>

                      <div style={infoListStyle}>
                        <div style={infoRowStyle}>
                          <span style={labelStyle}>Puissance</span>
                          <span style={valueStyle}>{camion.puissance}</span>
                        </div>

                        <div style={infoRowStyle}>
                          <span style={labelStyle}>Prix</span>
                          <span
                            style={{
                              ...valueStyle,
                              color: "#22c55e",
                              fontSize: "16px",
                            }}
                          >
                            {formatPrix(camion.prix)}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          marginTop: "18px",
                          flexWrap: "wrap",
                        }}
                      >
                        <button style={mainButtonStyle}>Acheter</button>
                      </div>
                    </article>
                  ))}
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
                  <h2 style={{ marginTop: 0, marginBottom: "10px" }}>
                    Résumé entreprise
                  </h2>

                  <div style={infoRowStyle}>
                    <span style={labelStyle}>Entreprise</span>
                    <span style={valueStyle}>{entreprise.nom}</span>
                  </div>

                  <div style={infoRowStyle}>
                    <span style={labelStyle}>Camions actifs</span>
                    <span style={valueStyle}>{totalCamions}</span>
                  </div>

                  <div style={infoRowStyle}>
                    <span style={labelStyle}>Catalogue</span>
                    <span style={valueStyle}>{camionsCatalogue.length}</span>
                  </div>
                </div>

                <div style={boxStyle}>
                  <h2 style={{ marginTop: 0, marginBottom: "10px" }}>
                    Infos achat
                  </h2>

                  <p style={smallTextStyle}>
                    Cette page sert à choisir un nouveau camion pour agrandir le
                    parc de ton entreprise.
                  </p>

                  <p
                    style={{
                      ...smallTextStyle,
                      marginTop: "12px",
                    }}
                  >
                    Pour l’instant, le bouton acheter est visuel. Ensuite on branchera
                    l’achat réel à la base de données.
                  </p>
                </div>

                <div style={boxStyle}>
                  <h2 style={{ marginTop: 0, marginBottom: "10px" }}>
                    Types disponibles
                  </h2>

                  <div style={legendRowStyle}>
                    <span
                      style={{
                        ...legendDotStyle,
                        background: "#2563eb",
                        boxShadow: "0 0 10px rgba(37,99,235,0.85)",
                      }}
                    />
                    Camions ETS2
                  </div>

                  <div style={legendRowStyle}>
                    <span
                      style={{
                        ...legendDotStyle,
                        background: "#22c55e",
                        boxShadow: "0 0 10px rgba(34,197,94,0.85)",
                      }}
                    />
                    Camions ATS
                  </div>
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

const truckCardStyle = {
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

const smallTextStyle = {
  margin: 0,
  lineHeight: 1.6,
  opacity: 0.9,
};

const mainButtonStyle = {
  padding: "12px 18px",
  borderRadius: "10px",
  border: "none",
  background: "#2563eb",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
  textDecoration: "none",
  width: "100%",
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
};

const legendRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "8px 0",
};

const legendDotStyle = {
  width: "12px",
  height: "12px",
  borderRadius: "50%",
  display: "inline-block",
};