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
];

const CABINES = [
  "Cabine basse",
  "Cabine normale",
  "Cabine haute",
  "Cabine XL",
  "Sleeper",
  "Topline",
];

const CHASSIS = [
  "4x2",
  "6x2",
  "6x4",
  "8x4",
  "Châssis long",
  "Châssis moyen",
];

const MOTEURS = [
  "400 ch",
  "450 ch",
  "500 ch",
  "540 ch",
  "580 ch",
  "650 ch",
  "730 ch",
  "770 ch",
];

const TRANSMISSIONS = [
  "6 vitesses",
  "12 vitesses",
  "12+2 vitesses",
  "Automatique",
  "I-Shift",
  "Opticruise",
];

const PEINTURES = [
  "Blanc",
  "Noir",
  "Rouge",
  "Bleu",
  "Gris",
  "Jaune",
  "Personnalisée",
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

    if (!modele) {
      redirect("/camions/acheter");
    }

    const marque = Object.values(MarqueCamion).includes(marqueValue as MarqueCamion)
      ? (marqueValue as MarqueCamion)
      : MarqueCamion.SCANIA;

    await prisma.camion.create({
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
        kilometrage: 0,
        etat: 100,
        carburant: 100,
        positionActuelle: null,
        statut: StatutCamion.DISPONIBLE,
        vidangeRestante: 60000,
        revisionRestante: 120000,
        actif: true,
      },
    });

    revalidatePath("/camions");
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
                gridTemplateColumns: "1fr 320px",
                gap: "20px",
                alignItems: "start",
              }}
            >
              <section>
                {!peutAjouterCamion ? (
                  <div style={boxStyle}>
                    <h2 style={{ marginTop: 0 }}>Accès refusé</h2>
                    <p style={smallTextStyle}>
                      Seul le directeur ou le sous-directeur peut ajouter un camion.
                    </p>
                  </div>
                ) : (
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
                        <select
                          name="marque"
                          defaultValue={MarqueCamion.SCANIA}
                          style={inputStyle}
                        >
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
                        <select
                          name="cabine"
                          defaultValue="Cabine haute"
                          style={inputStyle}
                        >
                          {CABINES.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={fieldGroupStyle}>
                        <label style={labelInputStyle}>Châssis</label>
                        <select
                          name="chassis"
                          defaultValue="4x2"
                          style={inputStyle}
                        >
                          {CHASSIS.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={fieldGroupStyle}>
                        <label style={labelInputStyle}>Moteur</label>
                        <select
                          name="moteur"
                          defaultValue="500 ch"
                          style={inputStyle}
                        >
                          {MOTEURS.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={fieldGroupStyle}>
                        <label style={labelInputStyle}>Transmission</label>
                        <select
                          name="transmission"
                          defaultValue="Automatique"
                          style={inputStyle}
                        >
                          {TRANSMISSIONS.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={fieldGroupStyle}>
                        <label style={labelInputStyle}>Peinture</label>
                        <select
                          name="peinture"
                          defaultValue="Blanc"
                          style={inputStyle}
                        >
                          {PEINTURES.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
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
                    Infos camion
                  </h2>

                  <p style={smallTextStyle}>
                    Le directeur ou le sous-directeur remplit ici les informations
                    principales du camion et la preuve d’achat.
                  </p>
                </div>

                <div style={boxStyle}>
                  <h2 style={{ marginTop: 0, marginBottom: "12px" }}>
                    Suite prévue
                  </h2>

                  <p style={smallTextStyle}>
                    Après on fera une page à part pour ajouter les accessoires
                    intérieurs et extérieurs.
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
};

const labelInputStyle = {
  fontSize: "14px",
  fontWeight: "bold",
  opacity: 0.92,
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  outline: "none",
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