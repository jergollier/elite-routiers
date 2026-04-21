import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PostulerPage({ params }: PageProps) {
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

  const [entreprise, user] = await Promise.all([
    prisma.entreprise.findUnique({
      where: {
        id: entrepriseId,
      },
      include: {
        owner: true,
        _count: {
          select: {
            membres: true,
          },
        },
      },
    }),
    prisma.user.findUnique({
      where: {
        steamId,
      },
      include: {
        entreprisesCreees: true,
      },
    }),
  ]);

  if (!entreprise || !user) {
    notFound();
  }

  const membershipActif = await prisma.entrepriseMembre.findUnique({
    where: {
      userId: user.id,
    },
    include: {
      entreprise: true,
    },
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
  const estProprietaireSociete = user.entreprisesCreees.length > 0;
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
    blocageMessage = `Tu fais déjà partie de la société ${societeActuelle?.nom ?? "actuelle"}. Quitte d’abord ta société avant de postuler ailleurs.`;
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
          background: "rgba(0, 0, 0, 0.65)",
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
            href={`/entreprise/${entreprise.id}`}
            style={{
              color: "white",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            ← Retour à l’entreprise
          </Link>
        </header>

        <div
          style={{
            maxWidth: "1100px",
            width: "100%",
            margin: "0 auto",
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
                height: "240px",
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
                    "linear-gradient(to top, rgba(0,0,0,0.88), rgba(0,0,0,0.20))",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  left: "24px",
                  bottom: "24px",
                  right: "24px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h1 style={{ margin: 0, fontSize: "36px" }}>
                    Postuler chez {entreprise.nom}
                  </h1>

                  <div
                    style={{
                      marginTop: "8px",
                      fontWeight: "bold",
                      opacity: 0.95,
                    }}
                  >
                    [{entreprise.abreviation}] • {entreprise.jeu}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "rgba(255,255,255,0.10)",
                    padding: "10px 14px",
                    borderRadius: "999px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    fontWeight: "bold",
                  }}
                >
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      display: "inline-block",
                      background: entreprise.recrutement ? "#22c55e" : "#ef4444",
                      boxShadow: entreprise.recrutement
                        ? "0 0 8px #22c55e"
                        : "0 0 8px #ef4444",
                    }}
                  />
                  {entreprise.recrutement
                    ? "Recrutement ouvert"
                    : "Recrutement fermé"}
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "24px",
                display: "grid",
                gridTemplateColumns: "320px 1fr",
                gap: "20px",
              }}
            >
              <aside
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div style={boxStyle}>
                  <h2 style={{ marginTop: 0, marginBottom: "14px" }}>
                    Infos rapides
                  </h2>

                  <div style={infoLineStyle}>
                    <span style={labelStyle}>Entreprise</span>
                    <span style={valueStyle}>{entreprise.nom}</span>
                  </div>

                  <div style={infoLineStyle}>
                    <span style={labelStyle}>Jeu</span>
                    <span style={valueStyle}>{entreprise.jeu}</span>
                  </div>

                  <div style={infoLineStyle}>
                    <span style={labelStyle}>Transport</span>
                    <span style={valueStyle}>{entreprise.typeTransport}</span>
                  </div>

                  <div style={infoLineStyle}>
                    <span style={labelStyle}>Membres</span>
                    <span style={valueStyle}>{entreprise._count.membres}</span>
                  </div>

                  <div style={infoLineStyle}>
                    <span style={labelStyle}>Directeur</span>
                    <span style={valueStyle}>
                      {entreprise.owner.username || "Utilisateur Steam"}
                    </span>
                  </div>
                </div>

                <div style={boxStyle}>
                  <h2 style={{ marginTop: 0, marginBottom: "10px" }}>
                    Avant de postuler
                  </h2>

                  <p style={smallTextStyle}>
                    Tu ne peux envoyer une candidature que si tu n’es dans
                    aucune autre société et que tu n’en possèdes pas déjà une.
                  </p>
                </div>
              </aside>

              <section style={boxStyle}>
                {formulaireBloque ? (
                  <>
                    <h2 style={{ marginTop: 0, marginBottom: "8px" }}>
                      {blocageTitre}
                    </h2>

                    <p
                      style={{
                        marginTop: 0,
                        marginBottom: "20px",
                        opacity: 0.9,
                        lineHeight: 1.6,
                      }}
                    >
                      {blocageMessage}
                    </p>

                    <div
                      style={{
                        padding: "18px",
                        borderRadius: "14px",
                        background: "rgba(239,68,68,0.12)",
                        border: "1px solid rgba(239,68,68,0.30)",
                        marginBottom: "18px",
                      }}
                    >
                      <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
                        Candidature bloquée
                      </div>
                      <div style={{ opacity: 0.9, lineHeight: 1.6 }}>
                        Cette règle évite qu’un chauffeur soit dans plusieurs
                        sociétés en même temps.
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                      <Link href={blocageLien} style={mainButtonStyle}>
                        {blocageTexteLien}
                      </Link>

                      <Link
                        href={`/entreprise/${entreprise.id}`}
                        style={secondaryButtonStyle}
                      >
                        Retour à l’entreprise
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 style={{ marginTop: 0, marginBottom: "8px" }}>
                      Formulaire de candidature
                    </h2>

                    <p
                      style={{
                        marginTop: 0,
                        marginBottom: "20px",
                        opacity: 0.85,
                        lineHeight: 1.6,
                      }}
                    >
                      Présente-toi simplement pour donner envie au directeur de te
                      recruter.
                    </p>

                    <form
                      action={`/api/entreprises/${entreprise.id}/postuler`}
                      method="POST"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                      }}
                    >
                      <div style={gridTwoStyle}>
                        <div>
                          <label style={inputLabelStyle}>Pseudo Steam</label>
                          <input
                            type="text"
                            value={user.username || "Utilisateur Steam"}
                            disabled
                            style={disabledInputStyle}
                          />
                        </div>

                        <div>
                          <label style={inputLabelStyle}>Âge</label>
                          <input
                            name="age"
                            type="number"
                            placeholder="Ton âge"
                            style={inputStyle}
                          />
                        </div>
                      </div>

                      <div style={gridTwoStyle}>
                        <div>
                          <label style={inputLabelStyle}>Région / Pays</label>
                          <input
                            name="region"
                            type="text"
                            placeholder="Exemple : France / Bourgogne"
                            style={inputStyle}
                          />
                        </div>

                        <div>
                          <label style={inputLabelStyle}>Jeu principal</label>
                          <select
                            name="jeuPrincipal"
                            defaultValue={user.jeuPrincipal || "ETS2"}
                            style={inputStyle}
                          >
                            <option value="ETS2">ETS2</option>
                            <option value="ATS">ATS</option>
                            <option value="LES_DEUX">Les deux</option>
                          </select>
                        </div>
                      </div>

                      <div style={gridTwoStyle}>
                        <div>
                          <label style={inputLabelStyle}>Expérience</label>
                          <select name="experience" defaultValue="INTERMEDIAIRE" style={inputStyle}>
                            <option value="DEBUTANT">Débutant</option>
                            <option value="INTERMEDIAIRE">Intermédiaire</option>
                            <option value="EXPERIMENTE">Expérimenté</option>
                          </select>
                        </div>

                        <div>
                          <label style={inputLabelStyle}>Micro</label>
                          <select
                            name="micro"
                            defaultValue={user.micro ? "OUI" : "NON"}
                            style={inputStyle}
                          >
                            <option value="OUI">Oui</option>
                            <option value="NON">Non</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label style={inputLabelStyle}>Disponibilités</label>
                        <input
                          name="disponibilites"
                          type="text"
                          placeholder="Exemple : le soir et le week-end"
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={inputLabelStyle}>
                          Pourquoi veux-tu rejoindre cette entreprise ?
                        </label>
                        <textarea
                          name="motivation"
                          placeholder="Explique un peu ta motivation..."
                          style={textareaStyle}
                          required
                        />
                      </div>

                      <div>
                        <label style={inputLabelStyle}>Message complémentaire</label>
                        <textarea
                          name="message"
                          placeholder="Tu peux ajouter un petit message libre..."
                          style={textareaStyle}
                        />
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          flexWrap: "wrap",
                          marginTop: "8px",
                        }}
                      >
                        <button type="submit" style={mainButtonStyle}>
                          Envoyer ma candidature
                        </button>

                        <Link
                          href={`/entreprise/${entreprise.id}`}
                          style={secondaryButtonStyle}
                        >
                          Retour
                        </Link>
                      </div>
                    </form>
                  </>
                )}
              </section>
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

const infoLineStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "10px 0",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};

const labelStyle = {
  opacity: 0.8,
};

const valueStyle = {
  fontWeight: "bold",
};

const smallTextStyle = {
  margin: 0,
  lineHeight: 1.6,
  opacity: 0.9,
};

const gridTwoStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "16px",
};

const inputLabelStyle = {
  display: "block",
  marginBottom: "8px",
  fontWeight: "bold",
  fontSize: "14px",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box" as const,
};

const disabledInputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box" as const,
  opacity: 0.95,
};

const textareaStyle = {
  width: "100%",
  minHeight: "120px",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  fontSize: "14px",
  outline: "none",
  resize: "vertical" as const,
  boxSizing: "border-box" as const,
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
  display: "inline-flex",
  alignItems: "center",
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