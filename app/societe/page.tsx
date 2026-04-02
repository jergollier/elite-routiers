import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function SocietePage() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  console.log("SOCIETE steamId =", steamId);

  if (!steamId) {
    redirect("/");
  }

  const entreprises = [
    {
      id: 1,
      nom: "Transports du Nord",
      image: "/truck.jpg",
      recrute: true,
    },
    {
      id: 2,
      nom: "Atlantic Road",
      image: "/truck.jpg",
      recrute: false,
    },
    {
      id: 3,
      nom: "Elite Cargo",
      image: "/truck.jpg",
      recrute: true,
    },
  ];

  const chauffeurs = [
    { id: 1, nom: "RoutierMax", statut: "En ligne" },
    { id: 2, nom: "Pierre_ETS2", statut: "Hors ligne" },
    { id: 3, nom: "Camion59", statut: "En ligne" },
    { id: 4, nom: "ATS_Driver", statut: "En ligne" },
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
            }}
          >
            <span>Entreprises : 3</span>
            <span>Chauffeurs : 4</span>
            <span>Connecté</span>
          </div>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "260px 1fr 300px",
            gap: "20px",
            padding: "20px",
            flex: 1,
          }}
        >
          <aside
            style={{
              background: "rgba(0, 0, 0, 0.45)",
              borderRadius: "16px",
              padding: "20px",
              backdropFilter: "blur(6px)",
              boxShadow: "0 0 20px rgba(0,0,0,0.4)",
              height: "fit-content",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Menu</h2>

            <nav
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <button style={menuButtonStyle}>Accueil</button>
              <button style={menuButtonStyle}>Mon profil</button>
              <button style={menuButtonStyle}>Mon entreprise</button>
              <button style={menuButtonStyle}>Créer une entreprise</button>
              <button style={menuButtonStyle}>Classement</button>
              <button style={menuButtonStyle}>Paramètres</button>
            </nav>
          </aside>

          <section
            style={{
              background: "rgba(0, 0, 0, 0.45)",
              borderRadius: "16px",
              padding: "20px",
              backdropFilter: "blur(6px)",
              boxShadow: "0 0 20px rgba(0,0,0,0.4)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <h2 style={{ margin: 0 }}>Entreprises du site</h2>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <input
                  type="text"
                  placeholder="Rechercher une entreprise..."
                  style={inputStyle}
                />
                <select style={inputStyle}>
                  <option>Toutes</option>
                  <option>Recrute</option>
                  <option>Ne recrute pas</option>
                </select>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "16px",
              }}
            >
              {entreprises.map((entreprise) => (
                <div
                  key={entreprise.id}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: "14px",
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <div
                    style={{
                      height: "140px",
                      backgroundImage: `url('${entreprise.image}')`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />

                  <div style={{ padding: "16px" }}>
                    <h3 style={{ marginTop: 0, marginBottom: "12px" }}>
                      {entreprise.nom}
                    </h3>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "16px",
                        fontWeight: "bold",
                      }}
                    >
                      <span
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          backgroundColor: entreprise.recrute ? "#22c55e" : "#ef4444",
                          display: "inline-block",
                        }}
                      />
                      {entreprise.recrute ? "Recrute" : "Ne recrute pas"}
                    </div>

                    <button style={applyButtonStyle}>Postuler</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside
            style={{
              background: "rgba(0, 0, 0, 0.45)",
              borderRadius: "16px",
              padding: "20px",
              backdropFilter: "blur(6px)",
              boxShadow: "0 0 20px rgba(0,0,0,0.4)",
              height: "fit-content",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: "20px" }}>
              Chauffeurs du site
            </h2>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {chauffeurs.map((chauffeur) => (
                <div
                  key={chauffeur.id}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                    padding: "14px",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div style={{ fontWeight: "bold", marginBottom: "6px" }}>
                    {chauffeur.nom}
                  </div>
                  <div style={{ opacity: 0.85 }}>{chauffeur.statut}</div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

const menuButtonStyle = {
  padding: "12px 14px",
  borderRadius: "10px",
  border: "none",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  textAlign: "left" as const,
  fontWeight: "bold",
  cursor: "pointer",
};

const inputStyle = {
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
};

const applyButtonStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  background: "#171a21",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
};