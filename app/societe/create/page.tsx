import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { villesETS2, villesATS } from "@/app/data/villes";

export const dynamic = "force-dynamic";

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
    where: { userId: user.id },
    include: { entreprise: true },
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
      <div style={overlayStyle} />
      <div style={radialOverlayStyle} />

      <div style={pageStyle}>
        <div style={topButtonRowStyle}>
          <Link href="/societe" style={profileButtonStyle}>
            ← Retour aux sociétés
          </Link>
        </div>

        <section style={heroStyle}>
          <div>
            <div style={kickerStyle}>Elite Routiers • Création société</div>

            <h1 style={titleStyle}>Créer une entreprise</h1>

            <p style={subtitleStyle}>
              Lance ta société, choisis ta maison mère et construis ton réseau
              de chauffeurs.
            </p>

            <div style={tagRowStyle}>
              <Tag>1 société maximum</Tag>
              <Tag>Recrutement configurable</Tag>
              <Tag>Bannière personnalisée</Tag>
            </div>
          </div>

          <div style={statsStyle}>
            <Stat value="3" label="Lettres max" />
            <Stat value="4 Mo" label="Bannière" />
            <Stat value="ETS2 / ATS" label="Jeux" />
          </div>
        </section>

        {creationBloquee ? (
          <section style={panelStyle}>
            <div style={blockedPanelStyle}>
              <div style={blockedIconStyle}>⛔</div>

              <div>
                <div style={kickerStyle}>Accès refusé</div>
                <h2 style={sectionTitleStyle}>{blocageTitre}</h2>
              </div>

              <div style={alertBoxStyle}>
                <strong>Action refusée</strong>
                <p style={{ margin: "8px 0 0", lineHeight: 1.6 }}>
                  {blocageMessage}
                </p>
              </div>

              <p style={blockedTextStyle}>
                Pour éviter les abus, un chauffeur ne peut pas être dans une
                société et en créer une autre en même temps.
              </p>

              <div style={actionsInlineStyle}>
                <Link href={blocageLien} style={blueButtonStyle}>
                  {blocageTexteLien}
                </Link>

                <Link href="/societe" style={cancelButtonStyle}>
                  Retour aux sociétés
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <form
            action="/api/entreprise"
            method="POST"
            encType="multipart/form-data"
            style={formStyle}
          >
            <section style={panelStyle}>
              <div style={splitStyle}>
                <Card title="🏢 Informations générales">
                  <Field label="Nom de la société">
                    <input
                      name="nom"
                      type="text"
                      required
                      style={inputStyle}
                      placeholder="Ex : Elite Cargo"
                    />
                  </Field>

                  <Field label="Abréviation (3 lettres)">
                    <input
                      name="abreviation"
                      type="text"
                      maxLength={3}
                      required
                      style={inputStyle}
                      placeholder="Ex : ECR"
                    />
                  </Field>

                  <Field label="Jeu principal">
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
                  </Field>

                  <Field label="Type de transport">
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
                  </Field>

                  <Field label="Recrutement">
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
                  </Field>
                </Card>

                <Card title="🗺️ Maisons mères">
                  <Field label="Maison mère ETS2">
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
                  </Field>

                  <Field label="Maison mère ATS">
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
                  </Field>

                  <div style={infoBoxStyle}>
                    <strong>Important</strong>
                    <span>
                      Tu dois choisir au moins une maison mère : ETS2 ou ATS.
                    </span>
                  </div>

                  <Field label="Description">
                    <textarea
                      name="description"
                      required
                      style={textareaStyle}
                      placeholder="Présente ta société, ton style de conduite, tes objectifs..."
                    />
                  </Field>
                </Card>
              </div>
            </section>

            <section style={panelStyle}>
              <div style={sectionHeaderStyle}>
                <div>
                  <h2 style={sectionTitleStyle}>🖼️ Bannière de la société</h2>
                  <p style={sectionSubtitleStyle}>
                    Image publique visible sur la fiche de ta société.
                  </p>
                </div>

                <span style={countStyle}>1500 x 500 px conseillé</span>
              </div>

              <div style={bannerGridStyle}>
                <Card title="📁 Importer une bannière">
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
                    Le joueur ajoute directement son image ici. La bannière sera
                    ensuite enregistrée par le serveur.
                  </p>
                </Card>

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
              <Link href="/societe" style={cancelButtonStyle}>
                ✕ Annuler
              </Link>

              <button type="submit" style={blueButtonStyle}>
                Créer l&apos;entreprise
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={cardStyle}>
      <h3 style={cardTitleStyle}>{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <div style={fieldLabelStyle}>{label}</div>
      {children}
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return <span style={tagStyle}>{children}</span>;
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={statBoxStyle}>
      <strong style={statValueStyle}>{value}</strong>
      <span style={statLabelStyle}>{label}</span>
    </div>
  );
}

const mainStyle: CSSProperties = {
  minHeight: "100vh",
  backgroundImage:
    "linear-gradient(180deg, rgba(3,7,18,0.15), rgba(3,7,18,0.55) 520px), url('/truck.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center top",
  backgroundAttachment: "fixed",
  color: "white",
  padding: "22px",
  position: "relative",
  fontFamily: "Arial, sans-serif",
};

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  pointerEvents: "none",
  background:
    "linear-gradient(135deg, rgba(3,7,18,0.25), rgba(8,13,28,0.20), rgba(3,7,18,0.35))",
  zIndex: 0,
};

const radialOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  pointerEvents: "none",
  background:
    "radial-gradient(circle at 52% 0%, rgba(245,158,11,0.16), transparent 34%), radial-gradient(circle at 80% 18%, rgba(37,99,235,0.12), transparent 25%)",
  zIndex: 0,
};

const pageStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  maxWidth: "1250px",
  margin: "0 auto",
  display: "grid",
  gap: "22px",
};

const topButtonRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
  flexWrap: "wrap",
};

const profileButtonStyle: CSSProperties = {
  color: "white",
  textDecoration: "none",
  fontWeight: 950,
  padding: "12px 18px",
  borderRadius: "999px",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  border: "1px solid rgba(147,197,253,0.45)",
  boxShadow: "0 0 24px rgba(37,99,235,0.34)",
  backdropFilter: "blur(12px)",
};

const formStyle: CSSProperties = {
  display: "grid",
  gap: "22px",
};

const heroStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "25px",
  padding: "32px",
  borderRadius: "30px",
  background: "rgba(8,13,28,0.22)",
  border: "1px solid rgba(255,255,255,0.18)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.25)",
};

const kickerStyle: CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  fontSize: "0.82rem",
  fontWeight: 950,
  color: "#60a5fa",
  textShadow: "0 4px 14px rgba(0,0,0,0.9)",
};

const titleStyle: CSSProperties = {
  margin: "8px 0 6px",
  fontSize: "3rem",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.05em",
  textShadow: "0 6px 24px rgba(0,0,0,0.95)",
};

const subtitleStyle: CSSProperties = {
  margin: "0 0 16px",
  color: "rgba(255,255,255,0.82)",
  fontWeight: 700,
};

const tagRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
};

const tagStyle: CSSProperties = {
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(37,99,235,0.16)",
  border: "1px solid rgba(96,165,250,0.28)",
  color: "#dbeafe",
  fontWeight: 900,
  fontSize: "0.85rem",
};

const statsStyle: CSSProperties = {
  display: "flex",
  gap: "14px",
  flexWrap: "wrap",
};

const statBoxStyle: CSSProperties = {
  width: "110px",
  minHeight: "86px",
  display: "grid",
  placeItems: "center",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.065)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.22)",
};

const statValueStyle: CSSProperties = {
  fontSize: "1.5rem",
  lineHeight: 1,
  fontWeight: 950,
  textAlign: "center",
};

const statLabelStyle: CSSProperties = {
  fontSize: "0.78rem",
  color: "rgba(255,255,255,0.72)",
  fontWeight: 800,
  marginTop: "-16px",
  textAlign: "center",
};

const panelStyle: CSSProperties = {
  padding: "18px",
  borderRadius: "26px",
  background: "rgba(8,13,28,0.25)",
  border: "1px solid rgba(255,255,255,0.18)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.25)",
};

const splitStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "22px",
};

const cardStyle: CSSProperties = {
  padding: "20px",
  borderRadius: "20px",
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.12)",
};

const cardTitleStyle: CSSProperties = {
  margin: "0 0 22px",
  fontSize: "1.28rem",
  fontWeight: 950,
};

const fieldLabelStyle: CSSProperties = {
  marginBottom: "8px",
  color: "rgba(255,255,255,0.78)",
  fontWeight: 850,
  fontSize: "0.92rem",
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: "48px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.10)",
  color: "white",
  padding: "0 14px",
  outline: "none",
  fontWeight: 850,
  boxSizing: "border-box",
};

const selectStyle: CSSProperties = {
  width: "100%",
  height: "48px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.18)",
  backgroundColor: "#ffffff",
  color: "#000000",
  padding: "0 14px",
  outline: "none",
  fontWeight: 850,
  boxSizing: "border-box",
};

const optionStyle: CSSProperties = {
  backgroundColor: "#ffffff",
  color: "#000000",
};

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "132px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.10)",
  color: "white",
  padding: "14px",
  outline: "none",
  fontWeight: 750,
  fontFamily: "inherit",
  resize: "vertical",
  boxSizing: "border-box",
};

const infoBoxStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  padding: "15px",
  borderRadius: "16px",
  background: "rgba(37,99,235,0.14)",
  border: "1px solid rgba(147,197,253,0.22)",
  color: "rgba(255,255,255,0.88)",
  marginBottom: "18px",
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
  alignItems: "flex-start",
  marginBottom: "18px",
};

const sectionTitleStyle: CSSProperties = {
  margin: "0 0 6px",
  fontSize: "1.7rem",
  fontWeight: 950,
};

const sectionSubtitleStyle: CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.68)",
  fontWeight: 750,
};

const countStyle: CSSProperties = {
  color: "rgba(255,255,255,0.72)",
  fontSize: "13px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "999px",
  padding: "8px 12px",
  fontWeight: 900,
};

const bannerGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "0.95fr 1.05fr",
  gap: "22px",
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
  fontWeight: 950,
  marginBottom: "8px",
  fontSize: "15px",
};

const formatLineStyle: CSSProperties = {
  fontSize: "14px",
  color: "rgba(255,255,255,0.88)",
};

const formatHintStyle: CSSProperties = {
  marginTop: "8px",
  fontSize: "14px",
  color: "rgba(255,255,255,0.72)",
};

const fileInputStyle: CSSProperties = {
  width: "100%",
  padding: "13px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.10)",
  color: "white",
  outline: "none",
  boxSizing: "border-box",
  fontWeight: 850,
};

const helpTextStyle: CSSProperties = {
  marginTop: "9px",
  marginBottom: 0,
  fontSize: "13px",
  color: "rgba(255,255,255,0.72)",
  lineHeight: 1.5,
  fontWeight: 700,
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
  fontWeight: 950,
};

const previewTextStyle: CSSProperties = {
  fontSize: "0.9rem",
  color: "rgba(255,255,255,0.82)",
  marginTop: "4px",
  fontWeight: 800,
};

const actionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "14px",
  padding: "18px",
  borderRadius: "20px",
  background: "rgba(8,13,28,0.25)",
  border: "1px solid rgba(255,255,255,0.18)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.25)",
  flexWrap: "wrap",
};

const actionsInlineStyle: CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
};

const cancelButtonStyle: CSSProperties = {
  minWidth: "160px",
  textAlign: "center",
  padding: "13px 22px",
  borderRadius: "12px",
  color: "white",
  textDecoration: "none",
  fontWeight: 950,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.18)",
  cursor: "pointer",
};

const blueButtonStyle: CSSProperties = {
  minWidth: "210px",
  textAlign: "center",
  padding: "13px 22px",
  borderRadius: "12px",
  color: "white",
  textDecoration: "none",
  fontWeight: 950,
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  border: "1px solid rgba(147,197,253,0.45)",
  boxShadow: "0 0 24px rgba(37,99,235,0.34)",
  cursor: "pointer",
};

const blockedPanelStyle: CSSProperties = {
  padding: "20px",
  borderRadius: "20px",
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.12)",
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
  color: "rgba(255,255,255,0.88)",
};

const blockedTextStyle: CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.82)",
  lineHeight: 1.6,
  fontWeight: 750,
};