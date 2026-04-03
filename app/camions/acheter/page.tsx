import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import Menu from "@/app/components/Menu";
import { prisma } from "@/lib/prisma";
import { MarqueCamion, RoleEntreprise, StatutCamion } from "@prisma/client";

const MARQUES = [
  { value: MarqueCamion.RENAULT, label: "Renault" },
  { value: MarqueCamion.SCANIA, label: "Scania" },
  { value: MarqueCamion.VOLVO, label: "Volvo" },
  { value: MarqueCamion.MAN, label: "MAN" },
  { value: MarqueCamion.DAF, label: "DAF" },
  { value: MarqueCamion.MERCEDES, label: "Mercedes-Benz" },
  { value: MarqueCamion.IVECO, label: "Iveco" },

  { value: MarqueCamion.KENWORTH, label: "Kenworth" },
  { value: MarqueCamion.PETERBILT, label: "Peterbilt" },
  { value: MarqueCamion.FREIGHTLINER, label: "Freightliner" },
  { value: MarqueCamion.INTERNATIONAL, label: "International" },
  { value: MarqueCamion.MACK, label: "Mack" },
  { value: MarqueCamion.WESTERN_STAR, label: "Western Star" },
];

function toNumber(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

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

  const entreprise = await prisma.entreprise.findUnique({
    where: { id: monMembership.entrepriseId },
  });

  if (!entreprise) {
    redirect("/societe");
  }

  const peutAjouterCamion =
    monMembership.role === RoleEntreprise.DIRECTEUR ||
    monMembership.role === RoleEntreprise.SOUS_DIRECTEUR;

  async function ajouterCamion(formData: FormData) {
    "use server";

    const cookieStore = await cookies();
    const steamId = cookieStore.get("steamId")?.value;

    if (!steamId) {
      redirect("/");
    }

    const user = await prisma.user.findUnique({
      where: { steamId },
      include: {
        memberships: true,
      },
    });

    if (!user) {
      redirect("/");
    }

    const membership = user.memberships[0];

    if (!membership) {
      redirect("/societe");
    }

    const autorise =
      membership.role === RoleEntreprise.DIRECTEUR ||
      membership.role === RoleEntreprise.SOUS_DIRECTEUR;

    if (!autorise) {
      redirect("/camions");
    }

    const marqueValue = String(formData.get("marque") || "").trim();
    const modele = String(formData.get("modele") || "").trim();
    const cabine = String(formData.get("cabine") || "").trim();
    const chassis = String(formData.get("chassis") || "").trim();
    const moteur = String(formData.get("moteur") || "").trim();
    const transmission = String(formData.get("transmission") || "").trim();
    const peinture = String(formData.get("peinture") || "").trim();
    const image = String(formData.get("image") || "").trim();
    const preuveAchat = String(formData.get("preuveAchat") || "").trim();
    const accessoiresExterieur = String(formData.get("accessoiresExterieur") || "").trim();
    const accessoiresInterieur = String(formData.get("accessoiresInterieur") || "").trim();
    const prixAchat = toNumber(formData.get("prixAchat"), 0);

    if (!modele || !marqueValue || prixAchat <= 0) {
      redirect("/camions/acheter");
    }

    const marque = Object.values(MarqueCamion).includes(marqueValue as MarqueCamion)
      ? (marqueValue as MarqueCamion)
      : null;

    if (!marque) {
      redirect("/camions/acheter");
    }

    const entrepriseActuelle = await prisma.entreprise.findUnique({
      where: { id: membership.entrepriseId },
    });

    if (!entrepriseActuelle) {
      redirect("/societe");
    }

    if (entrepriseActuelle.argent < prixAchat) {
      redirect("/camions/acheter");
    }

    await prisma.$transaction([
      prisma.camion.create({
        data: {
          entrepriseId: membership.entrepriseId,
          marque,
          modele,
          cabine: cabine || null,
          chassis: chassis || null,
          moteur: moteur || null,
          transmission: transmission || null,
          peinture: peinture || null,
          image: image || "/truck.jpg",
          preuveAchat: preuveAchat || null,
          prixAchat,
          accessoiresExterieur: accessoiresExterieur || null,
          accessoiresInterieur: accessoiresInterieur || null,
          kilometrage: 0,
          etat: 100,
          carburant: 100,
          positionActuelle: null,
          statut: StatutCamion.DISPONIBLE,
          vidangeRestante: 60000,
          revisionRestante: 120000,
          actif: true,
        },
      }),
      prisma.entreprise.update({
        where: { id: membership.entrepriseId },
        data: {
          argent: {
            decrement: prixAchat,
          },
        },
      }),
      prisma.finance.create({
        data: {
          entrepriseId: membership.entrepriseId,
          chauffeurId: null,
          type: "ACHAT_CAMION",
          description: `Achat du camion ${marque} ${modele}`,
          montant: -prixAchat,
        },
      }),
    ]);

    revalidatePath("/camions");
    revalidatePath("/camions/acheter");
    revalidatePath("/societe");
    redirect("/camions");
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
            minWidth: 0,
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
                <h1 style={{ margin: 0, fontSize: "34px" }}>Ajouter un camion</h1>
                <p
                  style={{
                    marginTop: "8px",
                    marginBottom: 0,
                    opacity: 0.88,
                    lineHeight: 1.5,
                  }}
                >
                  Achat manuel du camion pour l’entreprise {entreprise.nom}
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
                gridTemplateColumns: "minmax(0, 1fr) 320px",
                gap: "20px",
                alignItems: "start",
              }}
            >
              <section style={{ minWidth: 0 }}>
                {!peutAjouterCamion ? (
                  <div style={boxStyle}>
                    <h2 style={{ marginTop: 0 }}>Accès refusé</h2>
                    <p style={smallTextStyle}>
                      Seul le directeur ou le sous-directeur peut ajouter un camion.
                    </p>
                  </div>
                ) : (
                  <>
                    <form action={ajouterCamion} style={formCardStyle}>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                          gap: "16px",
                        }}
                      >
                        <div style={fieldGroupStyle}>
                          <label style={labelInputStyle}>Marque</label>
                          <select name="marque" defaultValue="" style={inputStyle} required>
                            <option value="" disabled>
                              Choisir une marque
                            </option>
                            {MARQUES.map((item) => (
                              <option key={item.value} value={item.value}>
                                {item.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div style={fieldGroupStyle}>
                          <label style={labelInputStyle}>Modèle</label>
                          <input
                            name="modele"
                            type="text"
                            placeholder="Exemple : S 770"
                            required
                            style={inputStyle}
                          />
                        </div>

                        <div style={fieldGroupStyle}>
                          <label style={labelInputStyle}>Cabine</label>
                          <input
                            name="cabine"
                            type="text"
                            placeholder="Exemple : Topline"
                            style={inputStyle}
                          />
                        </div>

                        <div style={fieldGroupStyle}>
                          <label style={labelInputStyle}>Châssis</label>
                          <input
                            name="chassis"
                            type="text"
                            placeholder="Exemple : 6x4"
                            style={inputStyle}
                          />
                        </div>

                        <div style={fieldGroupStyle}>
                          <label style={labelInputStyle}>Moteur</label>
                          <input
                            name="moteur"
                            type="text"
                            placeholder="Exemple : 770 ch"
                            style={inputStyle}
                          />
                        </div>

                        <div style={fieldGroupStyle}>
                          <label style={labelInputStyle}>Transmission</label>
                          <input
                            name="transmission"
                            type="text"
                            placeholder="Exemple : Automatique"
                            style={inputStyle}
                          />
                        </div>

                        <div style={fieldGroupStyle}>
                          <label style={labelInputStyle}>Peinture</label>
                          <input
                            name="peinture"
                            type="text"
                            placeholder="Exemple : Blanc nacré"
                            style={inputStyle}
                          />
                        </div>

                        <div style={fieldGroupStyle}>
                          <label style={labelInputStyle}>Prix du camion (€)</label>
                          <input
                            name="prixAchat"
                            type="number"
                            min="1"
                            placeholder="Exemple : 185000"
                            required
                            style={inputStyle}
                          />
                        </div>

                        <div style={fieldGroupStyle}>
                          <label style={labelInputStyle}>Photo du camion (URL)</label>
                          <input
                            name="image"
                            type="text"
                            placeholder="https://..."
                            style={inputStyle}
                          />
                        </div>

                        <div style={fieldGroupStyle}>
                          <label style={labelInputStyle}>Preuve d’achat (URL image)</label>
                          <input
                            name="preuveAchat"
                            type="text"
                            placeholder="https://..."
                            style={inputStyle}
                          />
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          marginTop: "22px",
                          flexWrap: "wrap",
                        }}
                      >
                        <button type="submit" style={mainButtonStyle}>
                          Enregistrer le camion
                        </button>

                        <Link href="/camions" style={secondaryButtonStyle}>
                          Annuler
                        </Link>
                      </div>
                    </form>

                    <div style={{ ...formCardStyle, marginTop: "18px" }}>
                      <h2 style={{ marginTop: 0, marginBottom: "16px" }}>
                        Accessoires
                      </h2>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                          gap: "16px",
                        }}
                      >
                        <div style={fieldGroupStyle}>
                          <label style={labelInputStyle}>Accessoires extérieurs</label>
                          <textarea
                            name="accessoiresExterieur"
                            form=""
                            placeholder="Exemple : gyrophares, pare-buffle, jantes, trompes..."
                            style={textareaStyle}
                            disabled
                          />
                        </div>

                        <div style={fieldGroupStyle}>
                          <label style={labelInputStyle}>Accessoires intérieurs</label>
                          <textarea
                            name="accessoiresInterieur"
                            form=""
                            placeholder="Exemple : GPS, rideaux, tablette, volant personnalisé..."
                            style={textareaStyle}
                            disabled
                          />
                        </div>
                      </div>

                      <p style={{ ...smallTextStyle, marginTop: "14px" }}>
                        Bloc prêt visuellement. Juste après, je te le branche pour qu’il enregistre vraiment.
                      </p>
                    </div>
                  </>
                )}
              </section>

              <aside
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div style={boxStyle}>
                  <h2 style={{ marginTop: 0, marginBottom: "12px" }}>
                    Qui peut ajouter
                  </h2>

                  <div style={infoRowStyle}>
                    <span style={labelStyle}>Ton rôle</span>
                    <span style={valueStyle}>{monMembership.role}</span>
                  </div>

                  <div style={infoRowStyle}>
                    <span style={labelStyle}>Directeur</span>
                    <span style={valueStyle}>Oui</span>
                  </div>

                  <div style={infoRowStyle}>
                    <span style={labelStyle}>Sous-directeur</span>
                    <span style={valueStyle}>Oui</span>
                  </div>

                  <div style={infoRowStyle}>
                    <span style={labelStyle}>Autres rôles</span>
                    <span style={valueStyle}>Non</span>
                  </div>
                </div>

                <div style={boxStyle}>
                  <h2 style={{ marginTop: 0, marginBottom: "12px" }}>
                    Budget entreprise
                  </h2>

                  <div style={infoRowStyle}>
                    <span style={labelStyle}>Argent disponible</span>
                    <span style={valueStyle}>
                      {entreprise.argent.toLocaleString("fr-FR")} €
                    </span>
                  </div>

                  <p style={{ ...smallTextStyle, marginTop: "12px" }}>
                    Quand le camion est enregistré, le prix est retiré directement de la société.
                  </p>
                </div>

                <div style={boxStyle}>
                  <h2 style={{ marginTop: 0, marginBottom: "12px" }}>
                    Infos camion
                  </h2>

                  <p style={smallTextStyle}>
                    Ici le directeur remplit tout à la main : marque, modèle, technique, prix, photo et preuve d’achat.
                  </p>
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

const formCardStyle = {
  background: "rgba(255,255,255,0.08)",
  borderRadius: "16px",
  padding: "20px",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(4px)",
  boxShadow: "0 0 18px rgba(0,0,0,0.28)",
};

const fieldGroupStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
  minWidth: 0,
};

const labelInputStyle = {
  fontSize: "14px",
  fontWeight: "bold",
  opacity: 0.92,
};

const inputStyle = {
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box" as const,
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  outline: "none",
};

const textareaStyle = {
  width: "100%",
  maxWidth: "100%",
  minHeight: "120px",
  boxSizing: "border-box" as const,
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  outline: "none",
  resize: "vertical" as const,
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
  justifyContent: "center",
};