import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MarqueCamion, RoleEntreprise } from "@prisma/client";

const MARQUES_ETS2 = [
  { value: MarqueCamion.RENAULT, label: "Renault" },
  { value: MarqueCamion.SCANIA, label: "Scania" },
  { value: MarqueCamion.VOLVO, label: "Volvo" },
  { value: MarqueCamion.MAN, label: "MAN" },
  { value: MarqueCamion.DAF, label: "DAF" },
  { value: MarqueCamion.MERCEDES, label: "Mercedes-Benz" },
  { value: MarqueCamion.IVECO, label: "Iveco" },
];

const MARQUES_ATS = [
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

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ModifierCamionPage({ params }: Props) {
  const { id } = await params;
  const camionId = Number(id);

  if (!Number.isInteger(camionId) || camionId <= 0) {
    notFound();
  }

  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { steamId },
  });

  if (!user) {
    redirect("/");
  }

  const monMembership = await prisma.entrepriseMembre.findUnique({
    where: {
      userId: user.id,
    },
    include: {
      entreprise: true,
    },
  });

  if (!monMembership) {
    redirect("/societe");
  }

  const entreprise = monMembership.entreprise;

  if (!entreprise) {
    redirect("/societe");
  }

  const peutModifierCamion =
    monMembership.role === RoleEntreprise.DIRECTEUR ||
    monMembership.role === RoleEntreprise.SOUS_DIRECTEUR;

  const camion = await prisma.camion.findFirst({
    where: {
      id: camionId,
      entrepriseId: monMembership.entrepriseId,
      actif: true,
    },
  });

  if (!camion) {
    notFound();
  }

  async function modifierCamion(formData: FormData) {
    "use server";

    const { id } = await params;
    const camionId = Number(id);

    if (!Number.isInteger(camionId) || camionId <= 0) {
      notFound();
    }

    const cookieStore = await cookies();
    const steamId = cookieStore.get("steamId")?.value;

    if (!steamId) {
      redirect("/");
    }

    const user = await prisma.user.findUnique({
      where: { steamId },
    });

    if (!user) {
      redirect("/");
    }

    const membership = await prisma.entrepriseMembre.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!membership) {
      redirect("/societe");
    }

    const autorise =
      membership.role === RoleEntreprise.DIRECTEUR ||
      membership.role === RoleEntreprise.SOUS_DIRECTEUR;

    if (!autorise) {
      redirect("/camions");
    }

    const ancienCamion = await prisma.camion.findFirst({
      where: {
        id: camionId,
        entrepriseId: membership.entrepriseId,
        actif: true,
      },
    });

    if (!ancienCamion) {
      notFound();
    }

    const entrepriseActuelle = await prisma.entreprise.findUnique({
      where: { id: membership.entrepriseId },
    });

    if (!entrepriseActuelle) {
      redirect("/societe");
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
    const accessoiresExterieur = String(
      formData.get("accessoiresExterieur") || ""
    ).trim();
    const accessoiresInterieur = String(
      formData.get("accessoiresInterieur") || ""
    ).trim();
    const nouveauPrix = toNumber(formData.get("prixAchat"), 0);

    if (!marqueValue || !modele || nouveauPrix <= 0) {
      redirect(`/camions/${camionId}/modifier`);
    }

    const marque = Object.values(MarqueCamion).includes(
      marqueValue as MarqueCamion
    )
      ? (marqueValue as MarqueCamion)
      : null;

    if (!marque) {
      redirect(`/camions/${camionId}/modifier`);
    }

    const ancienPrix = ancienCamion.prixAchat ?? 0;
    const differencePrix = nouveauPrix - ancienPrix;

    if (differencePrix > 0 && entrepriseActuelle.argent < differencePrix) {
      redirect(`/camions/${camionId}/modifier`);
    }

    const operations = [
      prisma.camion.update({
        where: { id: camionId },
        data: {
          marque,
          modele,
          cabine: cabine || null,
          chassis: chassis || null,
          moteur: moteur || null,
          transmission: transmission || null,
          peinture: peinture || null,
          image: image || "/truck.jpg",
          preuveAchat: preuveAchat || null,
          prixAchat: nouveauPrix,
          accessoiresExterieur: accessoiresExterieur || null,
          accessoiresInterieur: accessoiresInterieur || null,
        },
      }),
    ];

    if (differencePrix !== 0) {
      operations.push(
        prisma.entreprise.update({
          where: { id: membership.entrepriseId },
          data: {
            argent:
              differencePrix > 0
                ? { decrement: differencePrix }
                : { increment: Math.abs(differencePrix) },
          },
        }) as never
      );

      operations.push(
        prisma.finance.create({
          data: {
            entrepriseId: membership.entrepriseId,
            chauffeurId: null,
            type: "MODIFICATION_CAMION",
            description: `Modification du camion ${marque} ${modele}`,
            montant: -differencePrix,
          },
        }) as never
      );
    }

    await prisma.$transaction(operations);

    revalidatePath("/camions");
    revalidatePath(`/camions/${camionId}`);
    revalidatePath(`/camions/${camionId}/modifier`);
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
                <h1 style={{ margin: 0, fontSize: "34px" }}>Modifier le camion</h1>
                <p
                  style={{
                    marginTop: "8px",
                    marginBottom: 0,
                    opacity: 0.88,
                    lineHeight: 1.5,
                  }}
                >
                  Modification du camion de l’entreprise {entreprise.nom}
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
                {!peutModifierCamion ? (
                  <div style={boxStyle}>
                    <h2 style={{ marginTop: 0 }}>Accès refusé</h2>
                    <p style={smallTextStyle}>
                      Seul le directeur ou le sous-directeur peut modifier un camion.
                    </p>
                  </div>
                ) : (
                  <form action={modifierCamion} style={formCardStyle}>
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
                          defaultValue={camion.marque}
                          style={whiteSelectStyle}
                          required
                        >
                          <optgroup label="ETS2">
                            {MARQUES_ETS2.map((item) => (
                              <option
                                key={item.value}
                                value={item.value}
                                style={whiteOptionStyle}
                              >
                                {item.label}
                              </option>
                            ))}
                          </optgroup>

                          <optgroup label="ATS">
                            {MARQUES_ATS.map((item) => (
                              <option
                                key={item.value}
                                value={item.value}
                                style={whiteOptionStyle}
                              >
                                {item.label}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>

                      <div style={fieldGroupStyle}>
                        <label style={labelInputStyle}>Modèle</label>
                        <input
                          name="modele"
                          type="text"
                          defaultValue={camion.modele}
                          required
                          style={inputStyle}
                        />
                      </div>

                      <div style={fieldGroupStyle}>
                        <label style={labelInputStyle}>Cabine</label>
                        <input
                          name="cabine"
                          type="text"
                          defaultValue={camion.cabine || ""}
                          style={inputStyle}
                        />
                      </div>

                      <div style={fieldGroupStyle}>
                        <label style={labelInputStyle}>Châssis</label>
                        <input
                          name="chassis"
                          type="text"
                          defaultValue={camion.chassis || ""}
                          style={inputStyle}
                        />
                      </div>

                      <div style={fieldGroupStyle}>
                        <label style={labelInputStyle}>Moteur</label>
                        <input
                          name="moteur"
                          type="text"
                          defaultValue={camion.moteur || ""}
                          style={inputStyle}
                        />
                      </div>

                      <div style={fieldGroupStyle}>
                        <label style={labelInputStyle}>Transmission</label>
                        <input
                          name="transmission"
                          type="text"
                          defaultValue={camion.transmission || ""}
                          style={inputStyle}
                        />
                      </div>

                      <div style={fieldGroupStyle}>
                        <label style={labelInputStyle}>Peinture</label>
                        <input
                          name="peinture"
                          type="text"
                          defaultValue={camion.peinture || ""}
                          style={inputStyle}
                        />
                      </div>

                      <div style={fieldGroupStyle}>
                        <label style={labelInputStyle}>Prix total payé (€)</label>
                        <input
                          name="prixAchat"
                          type="number"
                          min="1"
                          defaultValue={camion.prixAchat ?? 0}
                          required
                          style={inputStyle}
                        />
                      </div>

                      <div style={fieldGroupStyle}>
                        <label style={labelInputStyle}>Photo du camion (URL)</label>
                        <input
                          name="image"
                          type="text"
                          defaultValue={camion.image || ""}
                          style={inputStyle}
                        />
                      </div>

                      <div style={fieldGroupStyle}>
                        <label style={labelInputStyle}>
                          Preuve d’achat (URL image)
                        </label>
                        <input
                          name="preuveAchat"
                          type="text"
                          defaultValue={camion.preuveAchat || ""}
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    <div style={{ ...boxStyle, marginTop: "20px" }}>
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
                          <label style={labelInputStyle}>
                            Accessoires extérieurs
                          </label>
                          <textarea
                            name="accessoiresExterieur"
                            defaultValue={camion.accessoiresExterieur || ""}
                            style={textareaStyle}
                          />
                        </div>

                        <div style={fieldGroupStyle}>
                          <label style={labelInputStyle}>
                            Accessoires intérieurs
                          </label>
                          <textarea
                            name="accessoiresInterieur"
                            defaultValue={camion.accessoiresInterieur || ""}
                            style={textareaStyle}
                          />
                        </div>
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
                        Enregistrer les modifications
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
                    Qui peut modifier
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
                    Si tu modifies le prix total, la différence est ajustée sur
                    l’argent de la société.
                  </p>
                </div>

                <div style={boxStyle}>
                  <h2 style={{ marginTop: 0, marginBottom: "12px" }}>
                    Infos camion
                  </h2>

                  <p style={smallTextStyle}>
                    Ici tu modifies les infos du camion déjà acheté : marque,
                    modèle, technique, prix, photo, preuve d’achat et accessoires.
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

const whiteSelectStyle = {
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box" as const,
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "#ffffff",
  color: "#111111",
  outline: "none",
};

const whiteOptionStyle = {
  background: "#ffffff",
  color: "#111111",
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