import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import Menu from "@/app/components/Menu";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import {
  MarqueRemorque,
  RoleEntreprise,
  StatutRemorque,
  TypeRemorque,
} from "@prisma/client";

const MARQUES_REMORQUE_ETS2 = [
  { value: MarqueRemorque.KRONE, label: "Krone" },
  { value: MarqueRemorque.SCHMITZ, label: "Schmitz Cargobull" },
  { value: MarqueRemorque.KOGEL, label: "Kögel" },
  { value: MarqueRemorque.WIELTON, label: "Wielton" },
  { value: MarqueRemorque.LAMBERET, label: "Lamberet" },
  { value: MarqueRemorque.CHEREAU, label: "Chereau" },
  { value: MarqueRemorque.FRUEHAUF, label: "Fruehauf" },
  { value: MarqueRemorque.FAYMONVILLE, label: "Faymonville" },
  { value: MarqueRemorque.NOOTEBOOM, label: "Nooteboom" },
];

const MARQUES_REMORQUE_ATS = [
  { value: MarqueRemorque.UTILITY, label: "Utility" },
  { value: MarqueRemorque.GREAT_DANE, label: "Great Dane" },
  { value: MarqueRemorque.WABASH, label: "Wabash" },
  { value: MarqueRemorque.FONTAINE, label: "Fontaine" },
];

const TYPES_ETS2 = [
  { value: TypeRemorque.FRIGO, label: "Frigo" },
  { value: TypeRemorque.CITERNE, label: "Citerne" },
  { value: TypeRemorque.PLATEAU, label: "Plateau" },
  { value: TypeRemorque.BACHEE, label: "Bâchée" },
  { value: TypeRemorque.BENNE, label: "Benne" },
  { value: TypeRemorque.PORTE_ENGINS, label: "Porte-engins" },
  { value: TypeRemorque.PORTE_CONTENEUR, label: "Porte-conteneur" },
  { value: TypeRemorque.TAUTLINER, label: "Tautliner" },
];

const TYPES_ATS = [
  { value: TypeRemorque.FOURGON, label: "Fourgon" },
  { value: TypeRemorque.PLATEAU, label: "Flatbed / Plateau" },
  { value: TypeRemorque.LOWBOY, label: "Lowboy" },
  { value: TypeRemorque.CITERNE, label: "Citerne" },
  { value: TypeRemorque.PORTE_CONTENEUR, label: "Porte-conteneur" },
  { value: TypeRemorque.BENNE, label: "Benne" },
];

function toNumber(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default async function AcheterRemorquePage() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) redirect("/");

  const user = await prisma.user.findUnique({
    where: { steamId },
  });

  if (!user) redirect("/");

  const monMembership = await prisma.entrepriseMembre.findUnique({
    where: { userId: user.id },
    include: { entreprise: true },
  });

  if (!monMembership || !monMembership.entreprise) {
    redirect("/societe");
  }

  const entreprise = monMembership.entreprise;

  const peutAjouterRemorque =
    monMembership.role === RoleEntreprise.DIRECTEUR ||
    monMembership.role === RoleEntreprise.SOUS_DIRECTEUR;

  async function ajouterRemorque(formData: FormData) {
    "use server";

    const cookieStore = await cookies();
    const steamId = cookieStore.get("steamId")?.value;

    if (!steamId) redirect("/");

    const user = await prisma.user.findUnique({
      where: { steamId },
    });

    if (!user) redirect("/");

    const membership = await prisma.entrepriseMembre.findUnique({
      where: { userId: user.id },
    });

    if (!membership) redirect("/societe");

    const autorise =
      membership.role === RoleEntreprise.DIRECTEUR ||
      membership.role === RoleEntreprise.SOUS_DIRECTEUR;

    if (!autorise) redirect("/remorques");

    const marqueValue = String(formData.get("marque") || "").trim();
    const typeValue = String(formData.get("type") || "").trim();
    const modele = String(formData.get("modele") || "").trim();
    const jeu = String(formData.get("jeu") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const prixAchat = toNumber(formData.get("prixAchat"), 0);
    const imageFile = formData.get("image") as File | null;

    let imageUrl = "/truck.jpg";

    if (!marqueValue || !typeValue || !modele || !jeu || prixAchat <= 0) {
      redirect("/remorques/acheter");
    }

    const marque = Object.values(MarqueRemorque).includes(
      marqueValue as MarqueRemorque
    )
      ? (marqueValue as MarqueRemorque)
      : null;

    const type = Object.values(TypeRemorque).includes(typeValue as TypeRemorque)
      ? (typeValue as TypeRemorque)
      : null;

    if (!marque || !type) redirect("/remorques/acheter");

    if (imageFile instanceof File && imageFile.size > 0) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

      if (!allowedTypes.includes(imageFile.type)) {
        redirect("/remorques/acheter");
      }

      const extension =
        imageFile.type === "image/png"
          ? "png"
          : imageFile.type === "image/webp"
          ? "webp"
          : "jpg";

      const safeModele = modele
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const fileName = `remorques/${membership.entrepriseId}-${safeModele}-${Date.now()}.${extension}`;

      const blob = await put(fileName, imageFile, {
        access: "public",
      });

      imageUrl = blob.url;
    }

    const entrepriseActuelle = await prisma.entreprise.findUnique({
      where: { id: membership.entrepriseId },
    });

    if (!entrepriseActuelle) redirect("/societe");

    if (entrepriseActuelle.argent < prixAchat) {
      redirect("/remorques/acheter");
    }

    await prisma.$transaction([
      prisma.remorque.create({
        data: {
          entrepriseId: membership.entrepriseId,
          marque,
          modele,
          type,
          jeu,
          description: description || null,
          image: imageUrl,
          prixAchat,
          statut: StatutRemorque.DISPONIBLE,
          actif: true,
          pneusUsure: 0,
          pneusRestantsKm: 100000,
          degatsChassis: 0,
          degatsRoues: 0,
          degatsCaisse: 0,
          degatsCargaison: 0,
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
          type: "ACHAT_REMORQUE",
          description: `Achat remorque ${marque} ${modele}`,
          montant: -prixAchat,
        },
      }),
    ]);

    revalidatePath("/remorques");
    revalidatePath("/remorques/acheter");
    revalidatePath("/societe");
    redirect("/remorques");
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

        <div style={{ flex: 1, padding: "24px", minWidth: 0 }}>
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
                <h1 style={{ margin: 0, fontSize: "34px" }}>
                  Acheter une remorque
                </h1>
                <p
                  style={{
                    marginTop: "8px",
                    marginBottom: 0,
                    opacity: 0.88,
                    lineHeight: 1.5,
                  }}
                >
                  Achat manuel d’une remorque pour l’entreprise {entreprise.nom}
                </p>
              </div>

              <Link href="/remorques" style={secondaryButtonStyle}>
                ← Retour remorques
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
                {!peutAjouterRemorque ? (
                  <div style={boxStyle}>
                    <h2 style={{ marginTop: 0 }}>Accès refusé</h2>
                    <p style={smallTextStyle}>
                      Seul le directeur ou le sous-directeur peut acheter une
                      remorque.
                    </p>
                  </div>
                ) : (
                  <form action={ajouterRemorque} style={formCardStyle}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                        gap: "16px",
                      }}
                    >
                      <div style={fieldGroupStyle}>
                        <label style={labelInputStyle}>Jeu</label>
                        <select name="jeu" defaultValue="" style={whiteSelectStyle} required>
                          <option value="" disabled style={whiteOptionStyle}>
                            Choisir le jeu
                          </option>
                          <option value="ETS2" style={whiteOptionStyle}>
                            ETS2
                          </option>
                          <option value="ATS" style={whiteOptionStyle}>
                            ATS
                          </option>
                        </select>
                      </div>

                      <div style={fieldGroupStyle}>
                        <label style={labelInputStyle}>Marque</label>
                        <select
                          name="marque"
                          defaultValue=""
                          style={whiteSelectStyle}
                          required
                        >
                          <option value="" disabled style={whiteOptionStyle}>
                            Choisir une marque
                          </option>

                          <optgroup label="ETS2">
                            {MARQUES_REMORQUE_ETS2.map((item) => (
                              <option key={item.value} value={item.value} style={whiteOptionStyle}>
                                {item.label}
                              </option>
                            ))}
                          </optgroup>

                          <optgroup label="ATS">
                            {MARQUES_REMORQUE_ATS.map((item) => (
                              <option key={item.value} value={item.value} style={whiteOptionStyle}>
                                {item.label}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>

                      <div style={fieldGroupStyle}>
                        <label style={labelInputStyle}>Type de remorque</label>
                        <select name="type" defaultValue="" style={whiteSelectStyle} required>
                          <option value="" disabled style={whiteOptionStyle}>
                            Choisir un type
                          </option>

                          <optgroup label="ETS2">
                            {TYPES_ETS2.map((item) => (
                              <option key={`ets2-${item.value}`} value={item.value} style={whiteOptionStyle}>
                                {item.label}
                              </option>
                            ))}
                          </optgroup>

                          <optgroup label="ATS">
                            {TYPES_ATS.map((item) => (
                              <option key={`ats-${item.value}`} value={item.value} style={whiteOptionStyle}>
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
                          placeholder="Exemple : Cool Liner / Dry Van / Lowboy"
                          required
                          style={inputStyle}
                        />
                      </div>

                      <div style={fieldGroupStyle}>
                        <label style={labelInputStyle}>Prix de la remorque (€)</label>
                        <input
                          name="prixAchat"
                          type="number"
                          min="1"
                          placeholder="Exemple : 120000"
                          required
                          style={inputStyle}
                        />
                      </div>

                      <div style={fieldGroupStyle}>
                        <label style={labelInputStyle}>Photo de la remorque</label>
                        <input
                          name="image"
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    <div style={{ ...boxStyle, marginTop: "20px" }}>
                      <h2 style={{ marginTop: 0, marginBottom: "16px" }}>
                        Description
                      </h2>

                      <textarea
                        name="description"
                        placeholder="Exemple : remorque frigo pour transport alimentaire, double essieu, finition blanche..."
                        style={textareaStyle}
                      />
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
                        Acheter la remorque
                      </button>

                      <Link href="/remorques" style={secondaryButtonStyle}>
                        Annuler
                      </Link>
                    </div>
                  </form>
                )}
              </section>

              <aside style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={boxStyle}>
                  <h2 style={{ marginTop: 0, marginBottom: "12px" }}>Qui peut acheter</h2>

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
                    <span style={labelStyle}>Chauffeurs</span>
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
                    Quand la remorque est achetée, le prix est retiré directement
                    de l’argent société.
                  </p>
                </div>

                <div style={boxStyle}>
                  <h2 style={{ marginTop: 0, marginBottom: "12px" }}>
                    ETS2 / ATS
                  </h2>

                  <p style={smallTextStyle}>
                    Les marques et types sont séparés par jeu. ETS2 utilise les
                    remorques européennes, ATS utilise les remorques américaines.
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
  minHeight: "140px",
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