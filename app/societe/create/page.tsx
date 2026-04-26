import type { CSSProperties } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { villesETS2, villesATS } from "@/app/data/villes";

export default async function CreerEntreprisePage() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) redirect("/");

  const user = await prisma.user.findUnique({
    where: { steamId },
    include: {
      entreprisesCreees: true,
    },
  });

  if (!user) redirect("/");

  const membershipActif = await prisma.entrepriseMembre.findUnique({
    where: {
      userId: user.id,
    },
    include: {
      entreprise: true,
    },
  });

  const societeActuelle = membershipActif?.entreprise ?? null;
  const societePossedee = user.entreprisesCreees ?? null;

  const estDejaDansUneSociete = !!membershipActif;
  const estDejaProprietaire = !!user.entreprisesCreees;

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
    <main style={mainStyle}>
      <div style={pageOverlayStyle} />

      <div style={pageStyle}>
        <header style={headerStyle}>
          <div>
            <div style={brandStyle}>🚛 ELITE ROUTIERS</div>
            <h1 style={heroTitleStyle}>Créer une entreprise</h1>
            <p style={heroTextStyle}>
              Lance ta société, choisis ta maison mère et construis ton réseau
              de chauffeurs.
            </p>
          </div>

          <Link href="/societe" style={backButtonStyle}>
            ← Retour aux sociétés
          </Link>
        </header>

        <div style={contentStyle}>
          {creationBloquee ? (
            <section style={blockedPanelStyle}>
              <div style={blockedIconStyle}>⛔</div>

              <div>
                <div style={smallTitleStyle}>Accès refusé</div>
                <h2 style={panelTitleStyle}>{blocageTitre}</h2>
              </div>

              <div style={alertBoxStyle}>
                <div style={{ fontWeight: 900, marginBottom: "8px" }}>
                  Action refusée
                </div>

                <div style={{ opacity: 0.92, lineHeight: 1.6 }}>
                  {blocageMessage}
                </div>
              </div>

              <p style={blockedTextStyle}>
                Pour éviter les abus, un chauffeur ne peut pas être dans une
                société et en créer une autre en même temps.
              </p>

              <div style={buttonRowStyle}>
                <Link href={blocageLien} style={buttonPrimaryStyle}>
                  {blocageTexteLien}
                </Link>

                <Link href="/societe" style={buttonSecondaryStyle}>
                  Retour aux sociétés
                </Link>
              </div>
            </section>
          ) : (
            <form
              action="/api/entreprise"
              method="POST"
              encType="multipart/form-data"
              style={formPanelStyle}
            >
              <section style={introCardStyle}>
                <div>
                  <div style={smallTitleStyle}>Nouvelle société</div>
                  <h2 style={panelTitleStyle}>Identité de l’entreprise</h2>
                  <p style={panelTextStyle}>
                    Renseigne les informations principales qui seront visibles
                    par les chauffeurs.
                  </p>
                </div>

                <div style={miniStatsStyle}>
                  <div style={miniStatStyle}>
                    <strong>3</strong>
                    <span>Lettres max</span>
                  </div>

                  <div style={miniStatStyle}>
                    <strong>4 Mo</strong>
                    <span>Bannière max</span>
                  </div>
                </div>
              </section>

              <div style={gridStyle}>
                <section style={cardStyle}>
                  <h3 style={cardTitleStyle}>🏢 Informations générales</h3>

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
                    <label style={labelStyle}>Jeu principal</label>
                    <select
                      name="jeu"
                      required
                      style={selectStyle}
                      defaultValue=""
                    >
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
                </section>

                <section style={cardStyle}>
                  <h3 style={cardTitleStyle}>🗺️ Maisons mères</h3>

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

                  <div style={infoBoxStyle}>
                    <strong>Important</strong>
                    <span>
                      Tu dois choisir au moins une maison mère : ETS2 ou ATS.
                    </span>
                  </div>

                  <div>
                    <label style={labelStyle}>Description</label>
                    <textarea
                      name="description"
                      required
                      style={textareaStyle}
                      placeholder="Présente ta société, ton style de conduite, tes objectifs..."
                    />
                  </div>
                </section>
              </div>

              <section style={bannerPanelStyle}>
                <div style={bannerHeaderStyle}>
                  <div>
                    <div style={smallTitleStyle}>Image publique</div>
                    <h2 style={panelTitleStyle}>Bannière de la société</h2>
                  </div>

                  <div style={formatBadgeStyle}>1500 x 500 px conseillé</div>
                </div>

                <div style={bannerGridStyle}>
                  <div>
                    <div style={formatBoxStyle}>
                      <div style={formatTitleStyle}>Format recommandé</div>
                      <div style={formatLineStyle}>
                        Taille conseillée : <strong>1500 x 500 px</strong>
                      </div>
                      <div style={formatLineStyle}>
                        Ratio conseillé : <strong>3:1</strong>
                      </div>
                      <div style={formatLineStyle}>
                        Formats acceptés : <strong>JPG, PNG, WEBP</strong>
                      </div>
                      <div style={formatLineStyle}>
                        Poids maximum : <strong>4 Mo</strong>
                      </div>
                      <div style={formatHintStyle}>
                        Utilise une image large horizontale pour un rendu propre
                        sur le site.
                      </div>
                    </div>

                    <input
                      name="banniereFile"
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      style={fileInputStyle}
                    />

                    <p style={helpTextStyle}>
                      Le joueur ajoute directement son image ici. La bannière
                      sera ensuite enregistrée par le serveur.
                    </p>
                  </div>

                  <div style={previewStyle}>
                    <div>
                      <div style={previewTitleStyle}>
                        Aperçu du style de bannière
                      </div>
                      <div style={previewTextStyle}>
                        Format large horizontal recommandé
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <div style={actionsStyle}>
                <Link href="/societe" style={buttonSecondaryStyle}>
                  Annuler
                </Link>

                <button type="submit" style={submitButtonStyle}>
                  Créer l&apos;entreprise
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

const mainStyle: CSSProperties = {
  minHeight: "100vh",
  position: "relative",
  color: "white",
  backgroundImage:
    "linear-gradient(90deg, rgba(0,0,0,0.88), rgba(0,0,0,0.55), rgba(0,0,0,0.88)), url('/truck.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundAttachment: "fixed",
};

const pageOverlayStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,0.2)",
};

const pageStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  minHeight: "100vh",
  padding: "24px",
};

const headerStyle: CSSProperties = {
  maxWidth: "1250px",
  margin: "0 auto 24px",
  minHeight: "138px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "24px",
  padding: "30px",
  borderRadius: "30px",
  background:
    "linear-gradient(135deg, rgba(0,0,0,0.42), rgba(255,255,255,0.08))",
  border: "1px solid rgba(255,255,255,0.18)",
  backdropFilter: "blur(16px)",
  boxShadow: "0 26px 90px rgba(0,0,0,0.6)",
};

const brandStyle: CSSProperties = {
  color: "#bfdbfe",
  fontSize: "1rem",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  fontWeight: 900,
};

const heroTitleStyle: CSSProperties = {
  margin: "10px 0 8px",
  fontSize: "3.2rem",
  lineHeight: 1,
  fontWeight: 900,
  textShadow: "0 5px 25px rgba(0,0,0,0.65)",
};

const heroTextStyle: CSSProperties = {
  margin: 0,
  maxWidth: "650px",
  color: "rgba(255,255,255,0.72)",
  fontSize: "1rem",
  fontWeight: 600,
};

const backButtonStyle: CSSProperties = {
  padding: "12px 18px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.09)",
  border: "1px solid rgba(255,255,255,0.16)",
  color: "white",
  textDecoration: "none",
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const contentStyle: CSSProperties = {
  maxWidth: "1250px",
  margin: "0 auto",
  display: "flex",
  justifyContent: "center",
};

const formPanelStyle: CSSProperties = {
  width: "100%",
  display: "grid",
  gap: "22px",
};

const introCardStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  padding: "24px",
  borderRadius: "26px",
  background: "rgba(0,0,0,0.42)",
  border: "1px solid rgba(255,255,255,0.15)",
  backdropFilter: "blur(16px)",
  boxShadow: "0 22px 70px rgba(0,0,0,0.52)",
};

const smallTitleStyle: CSSProperties = {
  color: "#93c5fd",
  textTransform: "uppercase",
  letterSpacing: "0.13em",
  fontSize: "0.76rem",
  fontWeight: 900,
};

const panelTitleStyle: CSSProperties = {
  margin: "6px 0 8px",
  fontSize: "2rem",
  lineHeight: 1,
};

const panelTextStyle: CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.72)",
  fontWeight: 650,
};

const miniStatsStyle: CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
};

const miniStatStyle: CSSProperties = {
  width: "115px",
  minHeight: "76px",
  display: "grid",
  placeItems: "center",
  borderRadius: "18px",
  background: "rgba(0,0,0,0.42)",
  border: "1px solid rgba(255,255,255,0.13)",
  fontWeight: 900,
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "22px",
};

const cardStyle: CSSProperties = {
  display: "grid",
  gap: "18px",
  padding: "24px",
  borderRadius: "26px",
  background: "rgba(0,0,0,0.42)",
  border: "1px solid rgba(255,255,255,0.15)",
  backdropFilter: "blur(16px)",
  boxShadow: "0 22px 70px rgba(0,0,0,0.52)",
};

const cardTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "1.35rem",
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "8px",
  fontWeight: 900,
  color: "rgba(255,255,255,0.78)",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "13px 14px",
  borderRadius: "13px",
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.075)",
  color: "white",
  outline: "none",
  boxSizing: "border-box",
  fontWeight: 800,
};

const selectStyle: CSSProperties = {
  width: "100%",
  padding: "13px 14px",
  borderRadius: "13px",
  border: "1px solid rgba(255,255,255,0.16)",
  backgroundColor: "#ffffff",
  color: "#000000",
  outline: "none",
  boxSizing: "border-box",
  fontWeight: 800,
};

const optionStyle: CSSProperties = {
  backgroundColor: "#ffffff",
  color: "#000000",
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: "132px",
  resize: "vertical",
  fontFamily: "inherit",
};

const infoBoxStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  padding: "15px",
  borderRadius: "16px",
  background: "rgba(37,99,235,0.14)",
  border: "1px solid rgba(147,197,253,0.22)",
  color: "rgba(255,255,255,0.88)",
};

const bannerPanelStyle: CSSProperties = {
  padding: "24px",
  borderRadius: "26px",
  background: "rgba(0,0,0,0.42)",
  border: "1px solid rgba(255,255,255,0.15)",
  backdropFilter: "blur(16px)",
  boxShadow: "0 22px 70px rgba(0,0,0,0.52)",
};

const bannerHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
  marginBottom: "18px",
};

const formatBadgeStyle: CSSProperties = {
  padding: "10px 14px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.14)",
  fontWeight: 900,
};

const bannerGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "0.9fr 1.1fr",
  gap: "20px",
};

const formatBoxStyle: CSSProperties = {
  padding: "16px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.065)",
  border: "1px solid rgba(255,255,255,0.11)",
  marginBottom: "14px",
  lineHeight: 1.6,
};

const formatTitleStyle: CSSProperties = {
  fontWeight: 900,
  marginBottom: "8px",
  fontSize: "15px",
};

const formatLineStyle: CSSProperties = {
  fontSize: "14px",
  opacity: 0.92,
};

const formatHintStyle: CSSProperties = {
  marginTop: "8px",
  fontSize: "14px",
  opacity: 0.78,
};

const fileInputStyle: CSSProperties = {
  width: "100%",
  padding: "13px",
  borderRadius: "13px",
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.075)",
  color: "white",
  outline: "none",
  boxSizing: "border-box",
  fontWeight: 800,
};

const helpTextStyle: CSSProperties = {
  marginTop: "9px",
  marginBottom: 0,
  fontSize: "13px",
  opacity: 0.82,
  lineHeight: 1.5,
};

const previewStyle: CSSProperties = {
  minHeight: "260px",
  borderRadius: "22px",
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.14)",
  background:
    "linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.72)), url('/truck.jpg') center/cover no-repeat",
  display: "flex",
  alignItems: "flex-end",
  padding: "20px",
  boxSizing: "border-box",
  boxShadow: "inset 0 -80px 80px rgba(0,0,0,0.45)",
};

const previewTitleStyle: CSSProperties = {
  fontSize: "1.3rem",
  fontWeight: 900,
};

const previewTextStyle: CSSProperties = {
  fontSize: "0.9rem",
  opacity: 0.82,
  marginTop: "4px",
};

const actionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
  flexWrap: "wrap",
  padding: "18px",
  borderRadius: "22px",
  background: "rgba(0,0,0,0.42)",
  border: "1px solid rgba(255,255,255,0.14)",
  backdropFilter: "blur(16px)",
};

const buttonPrimaryStyle: CSSProperties = {
  padding: "14px 18px",
  borderRadius: "13px",
  border: "1px solid rgba(147,197,253,0.55)",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  boxShadow: "0 0 22px rgba(37,99,235,0.34)",
};

const buttonSecondaryStyle: CSSProperties = {
  padding: "14px 18px",
  borderRadius: "13px",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
};

const submitButtonStyle: CSSProperties = {
  padding: "14px 22px",
  borderRadius: "13px",
  border: "1px solid rgba(147,197,253,0.55)",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 0 24px rgba(37,99,235,0.38)",
};

const blockedPanelStyle: CSSProperties = {
  width: "100%",
  maxWidth: "900px",
  padding: "28px",
  borderRadius: "28px",
  background: "rgba(0,0,0,0.42)",
  border: "1px solid rgba(255,255,255,0.15)",
  backdropFilter: "blur(16px)",
  boxShadow: "0 26px 90px rgba(0,0,0,0.58)",
  display: "grid",
  gap: "18px",
};

const blockedIconStyle: CSSProperties = {
  width: "70px",
  height: "70px",
  display: "grid",
  placeItems: "center",
  borderRadius: "22px",
  background: "rgba(239,68,68,0.14)",
  border: "1px solid rgba(239,68,68,0.32)",
  fontSize: "2rem",
};

const alertBoxStyle: CSSProperties = {
  padding: "18px",
  borderRadius: "18px",
  background: "rgba(239,68,68,0.12)",
  border: "1px solid rgba(239,68,68,0.30)",
};

const blockedTextStyle: CSSProperties = {
  margin: 0,
  opacity: 0.9,
  lineHeight: 1.6,
};

const buttonRowStyle: CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
};