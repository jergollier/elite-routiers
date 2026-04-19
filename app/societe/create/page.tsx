import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { villesETS2, villesATS } from "@/app/data/villes";

export default async function CreerEntreprisePage() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: {
      steamId,
    },
    include: {
      memberships: {
        include: {
          entreprise: true,
        },
      },
      entreprisesCreees: true,
    },
  });

  if (!user) {
    redirect("/");
  }

  const societeActuelle = user.memberships[0]?.entreprise ?? null;
  const societePossedee = user.entreprisesCreees[0] ?? null;

  const estDejaDansUneSociete = user.memberships.length > 0;
  const estDejaProprietaire = user.entreprisesCreees.length > 0;

  let blocageTitre = "";
  let blocageMessage = "";
  let blocageLien = "/societe";
  let blocageTexteLien = "Retour aux sociétés";

  if (estDejaProprietaire) {
    blocageTitre = "Création impossible";
    blocageMessage = `Tu possèdes déjà la société ${
      societePossedee?.nom ?? ""
    }. Un chauffeur ne peut créer qu’une seule société.`;
    blocageLien = "/monentreprise";
    blocageTexteLien = "Retour à mon entreprise";
  } else if (estDejaDansUneSociete) {
    blocageTitre = "Création impossible";
    blocageMessage = `Tu fais déjà partie de la société ${
      societeActuelle?.nom ?? ""
    }. Quitte d’abord ta société actuelle avant d’en créer une nouvelle.`;
    blocageLien = "/monentreprise";
    blocageTexteLien = "Retour à mon entreprise";
  }

  const creationBloquee = Boolean(blocageTitre);

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
          {creationBloquee ? (
            <section
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
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <h2 style={{ marginTop: 0, marginBottom: "10px" }}>
                {blocageTitre}
              </h2>

              <div
                style={{
                  padding: "18px",
                  borderRadius: "14px",
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.30)",
                }}
              >
                <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
                  Action refusée
                </div>

                <div style={{ opacity: 0.92, lineHeight: 1.6 }}>
                  {blocageMessage}
                </div>
              </div>

              <p style={{ margin: 0, opacity: 0.9, lineHeight: 1.6 }}>
                Pour éviter les abus, un chauffeur ne peut pas être dans une
                société et en créer une autre en même temps.
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <Link href={blocageLien} style={buttonLinkStyle}>
                  {blocageTexteLien}
                </Link>

                <Link href="/societe" style={secondaryButtonStyle}>
                  Retour aux sociétés
                </Link>
              </div>
            </section>
          ) : (
            <form
              action="/api/entreprises"
              method="POST"
              encType="multipart/form-data"
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
                border: "1px solid rgba(255,255,255,0.08)",
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
                  <option value="LES_DEUX" style={optionStyle}>
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
                  <option value="GENERAL" style={optionStyle}>
                    Général
                  </option>
                  <option value="CITERNE" style={optionStyle}>
                    Citerne
                  </option>
                  <option value="CONVOI_EXCEPTIONNEL" style={optionStyle}>
                    Convoi exceptionnel
                  </option>
                  <option value="FRIGO" style={optionStyle}>
                    Frigo
                  </option>
                  <option value="BENNE" style={optionStyle}>
                    Benne
                  </option>
                  <option value="PLATEAU" style={optionStyle}>
                    Plateau
                  </option>
                  <option value="LIVESTOCK" style={optionStyle}>
                    Bétail
                  </option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Bannière de la société</label>

                <div
                  style={{
                    padding: "16px",
                    borderRadius: "14px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    marginBottom: "12px",
                    lineHeight: 1.6,
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      marginBottom: "8px",
                      fontSize: "15px",
                    }}
                  >
                    Format recommandé
                  </div>

                  <div style={{ fontSize: "14px", opacity: 0.92 }}>
                    Taille conseillée : <strong>1500 x 500 px</strong>
                  </div>
                  <div style={{ fontSize: "14px", opacity: 0.92 }}>
                    Ratio conseillé : <strong>3:1</strong>
                  </div>
                  <div style={{ fontSize: "14px", opacity: 0.92 }}>
                    Formats acceptés : <strong>JPG, PNG, WEBP</strong>
                  </div>
                  <div style={{ fontSize: "14px", opacity: 0.92 }}>
                    Poids maximum : <strong>4 Mo</strong>
                  </div>
                  <div style={{ fontSize: "14px", opacity: 0.82 }}>
                    Utilise une image large horizontale pour un rendu propre sur
                    le site.
                  </div>
                </div>

                <input
                  name="banniereFile"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  style={fileInputStyle}
                />

                <p
                  style={{
                    marginTop: "8px",
                    marginBottom: "14px",
                    fontSize: "13px",
                    opacity: 0.82,
                    lineHeight: 1.5,
                  }}
                >
                  Le joueur ajoute directement son image ici. La bannière sera
                  ensuite enregistrée par le serveur.
                </p>

                <div
                  style={{
                    width: "100%",
                    minHeight: "180px",
                    borderRadius: "14px",
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.10)",
                    background:
                      "linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.45)), url('/truck.jpg') center/cover no-repeat",
                    display: "flex",
                    alignItems: "flex-end",
                    padding: "16px",
                    boxSizing: "border-box",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                      Aperçu du style de bannière
                    </div>
                    <div style={{ fontSize: "13px", opacity: 0.85 }}>
                      Format large horizontal recommandé
                    </div>
                  </div>
                </div>
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
                Créer l&apos;entreprise
              </button>
            </form>
          )}
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
  boxSizing: "border-box" as const,
};

const selectStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.15)",
  backgroundColor: "#ffffff",
  color: "#000000",
  outline: "none",
  boxSizing: "border-box" as const,
};

const optionStyle = {
  backgroundColor: "#ffffff",
  color: "#000000",
};

const fileInputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  outline: "none",
  boxSizing: "border-box" as const,
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

const buttonLinkStyle = {
  padding: "14px 18px",
  borderRadius: "10px",
  border: "none",
  background: "#171a21",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
};

const secondaryButtonStyle = {
  padding: "14px 18px",
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