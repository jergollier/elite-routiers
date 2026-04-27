import type { CSSProperties, ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PostulerPage({ params }: PageProps) {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) redirect("/");

  const { id } = await params;
  const entrepriseId = Number(id);

  if (!entrepriseId || Number.isNaN(entrepriseId)) notFound();

  const [entreprise, user] = await Promise.all([
    prisma.entreprise.findUnique({
      where: { id: entrepriseId },
      include: {
        owner: true,
        _count: {
          select: { membres: true },
        },
      },
    }),
    prisma.user.findUnique({
      where: { steamId },
      include: {
        entreprisesCreees: true,
      },
    }),
  ]);

  if (!entreprise || !user) notFound();

  const membershipActif = await prisma.entrepriseMembre.findUnique({
    where: { userId: user.id },
    include: { entreprise: true },
  });

  const candidatureExistante = await prisma.entrepriseCandidature.findFirst({
    where: {
      userId: user.id,
      entrepriseId,
      statut: "EN_ATTENTE",
    },
  });

  const societeActuelle = membershipActif?.entreprise ?? null;
  const estDejaDansUneSociete = Boolean(membershipActif);
  const estProprietaireSociete = !!user.entreprisesCreees;
  const estSaPropreSociete = entreprise.ownerSteamId === steamId;
  const recrutementFerme = !entreprise.recrutement;
  const candidatureDejaEnvoyee = Boolean(candidatureExistante);

  let blocageTitre = "";
  let blocageMessage = "";
  let blocageLien = "/societe";
  let blocageTexteLien = "Retour aux sociétés";

  if (estSaPropreSociete) {
    blocageTitre = "Impossible de postuler";
    blocageMessage = "Tu es le propriétaire de cette société.";
    blocageLien = "/monentreprise";
    blocageTexteLien = "Retour à mon entreprise";
  } else if (estProprietaireSociete) {
    blocageTitre = "Impossible de postuler";
    blocageMessage =
      "Tu possèdes déjà une société. Tu ne peux pas postuler dans une autre entreprise.";
    blocageLien = "/monentreprise";
    blocageTexteLien = "Retour à mon entreprise";
  } else if (estDejaDansUneSociete) {
    blocageTitre = "Impossible de postuler";
    blocageMessage = `Tu fais déjà partie de la société ${
      societeActuelle?.nom ?? "actuelle"
    }. Quitte d’abord ta société avant de postuler ailleurs.`;
    blocageLien = "/monentreprise";
    blocageTexteLien = "Retour à mon entreprise";
  } else if (recrutementFerme) {
    blocageTitre = "Recrutement fermé";
    blocageMessage =
      "Cette société ne recrute pas pour le moment. Tu ne peux pas envoyer de candidature.";
    blocageLien = `/entreprise/${entreprise.id}`;
    blocageTexteLien = "Retour à l’entreprise";
  } else if (candidatureDejaEnvoyee) {
    blocageTitre = "Candidature déjà envoyée";
    blocageMessage =
      "Tu as déjà une candidature en attente pour cette société.";
    blocageLien = `/entreprise/${entreprise.id}`;
    blocageTexteLien = "Retour à l’entreprise";
  }

  const formulaireBloque = Boolean(blocageTitre);

  return (
    <main style={mainStyle}>
      <div style={overlayStyle} />
      <div style={radialOverlayStyle} />

      <div style={pageStyle}>
        <div style={topButtonRowStyle}>
          <Link href={`/entreprise/${entreprise.id}`} style={profileButtonStyle}>
            ← Retour à l’entreprise
          </Link>

          <Link href="/societe" style={secondaryTopButtonStyle}>
            🏠 Sociétés
          </Link>
        </div>

        <section style={heroStyle}>
          <div style={heroLeftStyle}>
            <img
              src={entreprise.banniere || "/truck.jpg"}
              alt="Bannière entreprise"
              style={companyImageStyle}
            />

            <div>
              <div style={kickerStyle}>Elite Routiers • Candidature</div>

              <h1 style={titleStyle}>Postuler chez {entreprise.nom}</h1>

              <p style={subtitleStyle}>
                [{entreprise.abreviation}] • {entreprise.jeu} •{" "}
                {entreprise.typeTransport}
              </p>

              <div style={tagRowStyle}>
                <Tag>{entreprise._count.membres} membre(s)</Tag>
                <Tag>{entreprise.owner.username || "Directeur inconnu"}</Tag>
                <Tag>
                  {entreprise.recrutement
                    ? "Recrutement ouvert"
                    : "Recrutement fermé"}
                </Tag>
              </div>
            </div>
          </div>

          <div
            style={{
              ...walletStyle,
              background: entreprise.recrutement
                ? "linear-gradient(135deg, rgba(34,197,94,0.20), rgba(34,197,94,0.07))"
                : "linear-gradient(135deg, rgba(239,68,68,0.20), rgba(239,68,68,0.07))",
              border: entreprise.recrutement
                ? "1px solid rgba(34,197,94,0.28)"
                : "1px solid rgba(239,68,68,0.28)",
              boxShadow: entreprise.recrutement
                ? "0 0 24px rgba(34,197,94,0.18)"
                : "0 0 24px rgba(239,68,68,0.18)",
            }}
          >
            <span style={walletLabelStyle}>Recrutement</span>
            <strong
              style={{
                ...walletValueStyle,
                color: entreprise.recrutement ? "#22c55e" : "#ef4444",
              }}
            >
              {entreprise.recrutement ? "Ouvert" : "Fermé"}
            </strong>
            <span style={walletHintStyle}>Candidatures société</span>
          </div>
        </section>

        <section style={mainGridStyle}>
          <aside style={sideColumnStyle}>
            <Panel title="ℹ️ Infos rapides">
              <InfoLine label="Entreprise" value={entreprise.nom} />
              <InfoLine label="Jeu" value={entreprise.jeu} />
              <InfoLine label="Transport" value={entreprise.typeTransport} />
              <InfoLine
                label="Membres"
                value={entreprise._count.membres.toString()}
              />
              <InfoLine
                label="Directeur"
                value={entreprise.owner.username || "Utilisateur Steam"}
              />
            </Panel>

            <Panel title="✅ Avant de postuler">
              <p style={smallTextStyle}>
                Tu ne peux envoyer une candidature que si tu n’es dans aucune
                autre société et que tu n’en possèdes pas déjà une.
              </p>
            </Panel>
          </aside>

          <section style={panelStyle}>
            {formulaireBloque ? (
              <>
                <div style={blockedIconStyle}>⛔</div>

                <h2 style={sectionTitleStyle}>{blocageTitre}</h2>

                <p style={blockedTextStyle}>{blocageMessage}</p>

                <div style={alertBoxStyle}>
                  <strong>Candidature bloquée</strong>
                  <p style={{ margin: "8px 0 0", lineHeight: 1.6 }}>
                    Cette règle évite qu’un chauffeur soit dans plusieurs
                    sociétés en même temps.
                  </p>
                </div>

                <div style={actionsStyle}>
                  <Link href={blocageLien} style={blueButtonStyle}>
                    {blocageTexteLien}
                  </Link>

                  <Link
                    href={`/entreprise/${entreprise.id}`}
                    style={cancelButtonStyle}
                  >
                    Retour à l’entreprise
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div style={sectionHeaderStyle}>
                  <div>
                    <h2 style={sectionTitleStyle}>📝 Formulaire de candidature</h2>
                    <p style={sectionSubtitleStyle}>
                      Présente-toi simplement pour donner envie au directeur de
                      te recruter.
                    </p>
                  </div>
                </div>

                <form
                  action={`/api/entreprise/${entreprise.id}/postuler`}
                  method="POST"
                  style={formStyle}
                >
                  <div style={splitStyle}>
                    <Field label="Pseudo Steam">
                      <input
                        type="text"
                        value={user.username || "Utilisateur Steam"}
                        disabled
                        style={disabledInputStyle}
                      />
                    </Field>

                    <Field label="Âge">
                      <input
                        name="age"
                        type="number"
                        placeholder="Ton âge"
                        style={inputStyle}
                      />
                    </Field>
                  </div>

                  <div style={splitStyle}>
                    <Field label="Région / Pays">
                      <input
                        name="region"
                        type="text"
                        placeholder="Exemple : France / Bourgogne"
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="Jeu principal">
                      <select
                        name="jeuPrincipal"
                        defaultValue={user.jeuPrincipal || "ETS2"}
                        style={selectStyle}
                      >
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
                  </div>

                  <div style={splitStyle}>
                    <Field label="Expérience">
                      <select
                        name="experience"
                        defaultValue="INTERMEDIAIRE"
                        style={selectStyle}
                      >
                        <option value="DEBUTANT" style={optionStyle}>
                          Débutant
                        </option>
                        <option value="INTERMEDIAIRE" style={optionStyle}>
                          Intermédiaire
                        </option>
                        <option value="EXPERIMENTE" style={optionStyle}>
                          Expérimenté
                        </option>
                      </select>
                    </Field>

                    <Field label="Micro">
                      <select
                        name="micro"
                        defaultValue={user.micro ? "OUI" : "NON"}
                        style={selectStyle}
                      >
                        <option value="OUI" style={optionStyle}>
                          Oui
                        </option>
                        <option value="NON" style={optionStyle}>
                          Non
                        </option>
                      </select>
                    </Field>
                  </div>

                  <Field label="Disponibilités">
                    <input
                      name="disponibilites"
                      type="text"
                      placeholder="Exemple : le soir et le week-end"
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Pourquoi veux-tu rejoindre cette entreprise ?">
                    <textarea
                      name="motivation"
                      placeholder="Explique un peu ta motivation..."
                      style={textareaStyle}
                      required
                    />
                  </Field>

                  <Field label="Message complémentaire">
                    <textarea
                      name="message"
                      placeholder="Tu peux ajouter un petit message libre..."
                      style={textareaStyle}
                    />
                  </Field>

                  <div style={actionsStyle}>
                    <button type="submit" style={blueButtonStyle}>
                      Envoyer ma candidature
                    </button>

                    <Link
                      href={`/entreprise/${entreprise.id}`}
                      style={cancelButtonStyle}
                    >
                      Retour
                    </Link>
                  </div>
                </form>
              </>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return <span style={tagStyle}>{children}</span>;
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={panelStyle}>
      <h2 style={sideTitleStyle}>{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label style={inputLabelStyle}>{label}</label>
      {children}
    </div>
  );
}

function InfoLine({
  label,
  value,
  color = "white",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div style={infoLineStyle}>
      <span style={infoLabelStyle}>{label}</span>
      <strong style={{ ...infoValueStyle, color }}>{value}</strong>
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

const secondaryTopButtonStyle: CSSProperties = {
  ...profileButtonStyle,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.18)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.25)",
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

const heroLeftStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "22px",
  flexWrap: "wrap",
};

const companyImageStyle: CSSProperties = {
  width: "180px",
  height: "112px",
  borderRadius: "26px",
  objectFit: "cover",
  border: "1px solid rgba(147,197,253,0.26)",
  boxShadow: "0 0 30px rgba(37,99,235,0.22)",
  background: "rgba(255,255,255,0.08)",
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

const walletStyle: CSSProperties = {
  minWidth: "270px",
  borderRadius: "22px",
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

const walletLabelStyle: CSSProperties = {
  opacity: 0.78,
  fontSize: "13px",
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  fontWeight: 900,
};

const walletValueStyle: CSSProperties = {
  fontSize: "34px",
  marginTop: "8px",
};

const walletHintStyle: CSSProperties = {
  opacity: 0.7,
  fontSize: "13px",
  marginTop: "6px",
  fontWeight: 800,
};

const mainGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "320px minmax(0, 1fr)",
  gap: "22px",
  alignItems: "start",
};

const sideColumnStyle: CSSProperties = {
  display: "grid",
  gap: "22px",
};

const panelStyle: CSSProperties = {
  padding: "18px",
  borderRadius: "26px",
  background: "rgba(8,13,28,0.25)",
  border: "1px solid rgba(255,255,255,0.18)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.25)",
};

const sideTitleStyle: CSSProperties = {
  margin: "0 0 18px",
  fontSize: "1.25rem",
  fontWeight: 950,
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
  alignItems: "flex-start",
  marginBottom: "18px",
};

const sectionTitleStyle: CSSProperties = {
  margin: "0 0 8px",
  fontSize: "1.6rem",
  fontWeight: 950,
};

const sectionSubtitleStyle: CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.68)",
  fontWeight: 750,
  lineHeight: 1.6,
};

const infoLineStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "11px 0",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const infoLabelStyle: CSSProperties = {
  color: "rgba(255,255,255,0.68)",
  fontWeight: 800,
};

const infoValueStyle: CSSProperties = {
  fontWeight: 950,
  textAlign: "right",
};

const smallTextStyle: CSSProperties = {
  margin: 0,
  lineHeight: 1.6,
  color: "rgba(255,255,255,0.82)",
  fontWeight: 750,
};

const formStyle: CSSProperties = {
  display: "grid",
  gap: "16px",
};

const splitStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "16px",
};

const inputLabelStyle: CSSProperties = {
  display: "block",
  marginBottom: "8px",
  fontWeight: 850,
  fontSize: "0.92rem",
  color: "rgba(255,255,255,0.78)",
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

const disabledInputStyle: CSSProperties = {
  ...inputStyle,
  opacity: 0.75,
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
  minHeight: "120px",
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

const actionsStyle: CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginTop: "8px",
};

const blueButtonStyle: CSSProperties = {
  padding: "13px 22px",
  borderRadius: "12px",
  color: "white",
  fontWeight: 950,
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  border: "1px solid rgba(147,197,253,0.45)",
  boxShadow: "0 0 24px rgba(37,99,235,0.34)",
  cursor: "pointer",
  textDecoration: "none",
};

const cancelButtonStyle: CSSProperties = {
  padding: "13px 22px",
  borderRadius: "12px",
  color: "white",
  textDecoration: "none",
  fontWeight: 950,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.18)",
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
  marginBottom: "18px",
};

const blockedTextStyle: CSSProperties = {
  margin: "0 0 20px",
  color: "rgba(255,255,255,0.82)",
  lineHeight: 1.6,
  fontWeight: 750,
};

const alertBoxStyle: CSSProperties = {
  padding: "18px",
  borderRadius: "18px",
  background: "rgba(239,68,68,0.12)",
  border: "1px solid rgba(239,68,68,0.30)",
  marginBottom: "18px",
  color: "rgba(255,255,255,0.88)",
};