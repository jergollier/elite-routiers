import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { villesETS2, villesATS } from "@/app/data/villes";

export default async function CreerEntreprisePage() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) {
    redirect("/");
  }

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

          <Link
            href="/societe"
            style={{
              color: "white",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            ← Retour
          </Link>
        </header>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "30px 20px",
            flex: 1,
          }}
        >
          <form
            action="/api/entreprises"
            method="POST"
            style={{
              width: "100%",
              maxWidth: "900px",
              background: "rgba(0, 0, 0, 0.45)",
              borderRadius: "16px",
              padding: "25px",
              backdropFilter: "blur(6px)",
              boxShadow: "0 0 20px rgba(0,0,0,0.4)",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: "10px" }}>
              Créer une entreprise
            </h2>

            <div>
              <label style={labelStyle}>Nom de la société</label>
              <input
                name="nom"
                type="text"
                required
                style={inputStyle}
                placeholder="Ex : Elite Cargo"
              />
            </div>

            <div>
              <label style={labelStyle}>Abréviation (3 lettres)</label>
              <input
                name="abreviation"
                type="text"
                maxLength={3}
                required
                style={inputStyle}
                placeholder="Ex : ECR"
              />
            </div>

            <div>
              <label style={labelStyle}>Maison mère ETS2</label>
              <select name="villeETS2" style={selectStyle} defaultValue="">
                <option value="" style={optionStyle}>
                  Aucune ville ETS2
                </option>

                <optgroup label="ETS2">
                  {villesETS2.map((ville) => (
                    <option
                      key={`ets2-${ville}`}
                      value={ville}
                      style={optionStyle}
                    >
                      {ville}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Maison mère ATS</label>
              <select name="villeATS" style={selectStyle} defaultValue="">
                <option value="" style={optionStyle}>
                  Aucune ville ATS
                </option>

                <optgroup label="ATS">
                  {villesATS.map((ville) => (
                    <option
                      key={`ats-${ville}`}
                      value={ville}
                      style={optionStyle}
                    >
                      {ville}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Jeu principal</label>
              <select name="jeu" required style={selectStyle} defaultValue="">
                <option value="" style={optionStyle}>
                  Choisir un jeu
                </option>
                <option value="ETS2" style={optionStyle}>
                  ETS2
                </option>
                <option value="ATS" style={optionStyle}>
                  ATS
                </option>
                <option value="Les deux" style={optionStyle}>
                  Les deux
                </option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Type de transport</label>
              <select
                name="typeTransport"
                required
                style={selectStyle}
                defaultValue=""
              >
                <option value="" style={optionStyle}>
                  Choisir un type
                </option>
                <option value="General" style={optionStyle}>
                  Général
                </option>
                <option value="Convoi exceptionnel" style={optionStyle}>
                  Convoi exceptionnel
                </option>
                <option value="Citerne" style={optionStyle}>
                  Citerne
                </option>
                <option value="Frigorifique" style={optionStyle}>
                  Frigorifique
                </option>
                <option value="Bois" style={optionStyle}>
                  Bois
                </option>
                <option value="Materiaux" style={optionStyle}>
                  Matériaux
                </option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Bannière (URL image)</label>
              <input
                name="banniere"
                type="text"
                style={inputStyle}
                placeholder="Ex : /truck.jpg"
              />
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                name="description"
                required
                style={{
                  ...inputStyle,
                  minHeight: "120px",
                  resize: "vertical",
                }}
                placeholder="Présente ta société..."
              />
            </div>

            <div>
              <label style={labelStyle}>Recrutement</label>
              <select
                name="recrutement"
                style={selectStyle}
                defaultValue="ouvert"
              >
                <option value="ouvert" style={optionStyle}>
                  Ouvert
                </option>
                <option value="ferme" style={optionStyle}>
                  Fermé
                </option>
              </select>
            </div>

            <p style={{ margin: 0, opacity: 0.9, fontSize: "14px" }}>
              Tu dois choisir au moins une maison mère : ETS2 ou ATS.
            </p>

            <button type="submit" style={buttonStyle}>
              Créer l'entreprise
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: "6px",
  fontWeight: "bold",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  outline: "none",
};

const selectStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.15)",
  backgroundColor: "#ffffff",
  color: "#000000",
  outline: "none",
};

const optionStyle = {
  backgroundColor: "#ffffff",
  color: "#000000",
};

const buttonStyle = {
  padding: "14px",
  borderRadius: "10px",
  border: "none",
  background: "#171a21",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
};