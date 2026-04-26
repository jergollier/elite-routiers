import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import type { CSSProperties } from "react";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { MarqueCamion, RoleEntreprise, StatutCamion } from "@prisma/client";

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

export default async function AcheterCamionPage() {
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

  if (!monMembership) redirect("/societe");

  const entreprise = monMembership.entreprise;

  if (!entreprise) redirect("/societe");

  const peutAjouterCamion =
    monMembership.role === RoleEntreprise.DIRECTEUR ||
    monMembership.role === RoleEntreprise.SOUS_DIRECTEUR;

  async function ajouterCamion(formData: FormData) {
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

    if (!autorise) redirect("/camions");

    const marqueValue = String(formData.get("marque") || "").trim();
    const modele = String(formData.get("modele") || "").trim();
    const cabine = String(formData.get("cabine") || "").trim();
    const chassis = String(formData.get("chassis") || "").trim();
    const moteur = String(formData.get("moteur") || "").trim();
    const transmission = String(formData.get("transmission") || "").trim();
    const peinture = String(formData.get("peinture") || "").trim();
    const prixAchat = toNumber(formData.get("prixAchat"), 0);

    const imageFile = formData.get("image") as File | null;
    const preuveAchatFile = formData.get("preuveAchat") as File | null;

    let imageUrl = "/truck.jpg";
    let preuveAchatUrl: string | null = null;

    if (!marqueValue || !modele || prixAchat <= 0) {
      redirect("/camions/acheter");
    }

    const marque = Object.values(MarqueCamion).includes(
      marqueValue as MarqueCamion
    )
      ? (marqueValue as MarqueCamion)
      : null;

    if (!marque) redirect("/camions/acheter");

    const safeModele = modele
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (imageFile instanceof File && imageFile.size > 0) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

      if (!allowedTypes.includes(imageFile.type)) {
        redirect("/camions/acheter");
      }

      const extension =
        imageFile.type === "image/png"
          ? "png"
          : imageFile.type === "image/webp"
          ? "webp"
          : "jpg";

      const fileName = `camions/${membership.entrepriseId}-${safeModele}-${Date.now()}.${extension}`;

      const blob = await put(fileName, imageFile, {
        access: "public",
      });

      imageUrl = blob.url;
    }

    if (preuveAchatFile instanceof File && preuveAchatFile.size > 0) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

      if (!allowedTypes.includes(preuveAchatFile.type)) {
        redirect("/camions/acheter");
      }

      const extension =
        preuveAchatFile.type === "image/png"
          ? "png"
          : preuveAchatFile.type === "image/webp"
          ? "webp"
          : "jpg";

      const fileName = `camions/preuves/${membership.entrepriseId}-${safeModele}-${Date.now()}.${extension}`;

      const blob = await put(fileName, preuveAchatFile, {
        access: "public",
      });

      preuveAchatUrl = blob.url;
    }

    const entrepriseActuelle = await prisma.entreprise.findUnique({
      where: { id: membership.entrepriseId },
    });

    if (!entrepriseActuelle) redirect("/societe");

    if (entrepriseActuelle.argent < prixAchat) {
      redirect("/camions/acheter");
    }

    const positionInitiale =
      entrepriseActuelle.villeETS2 ||
      entrepriseActuelle.villeATS ||
      "Maison mère";

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
          image: imageUrl,
          preuveAchat: preuveAchatUrl,
          prixAchat,
          accessoiresExterieur: null,
          accessoiresInterieur: null,
          kilometrage: 0,
          etat: 100,
          carburant: 100,
          positionActuelle: positionInitiale,
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
    <main style={page}>
      <div style={overlay} />

      <Link href="/societe" style={topButton}>
        🏢 Société
      </Link>

      <div style={container}>
        <section style={hero}>
          <div>
            <div style={smallText}>Elite Routiers • Achat flotte</div>

            <h1 style={title}>Ajouter un camion</h1>

            <p style={subtitle}>
              Enregistrement manuel d’un véhicule pour l’entreprise{" "}
              <strong>{entreprise.nom}</strong>.
            </p>

            <div style={tags}>
              <Tag>Budget : {entreprise.argent.toLocaleString("fr-FR")} €</Tag>
              <Tag>Rôle : {monMembership.role}</Tag>
              <Tag>{peutAjouterCamion ? "Autorisé" : "Accès limité"}</Tag>
            </div>
          </div>

          <div style={heroPanel}>
            <span style={panelLabel}>Fonds disponibles</span>
            <strong style={panelMoney}>
              {entreprise.argent.toLocaleString("fr-FR")} €
            </strong>
            <span style={panelHint}>
              Le prix du camion sera retiré automatiquement.
            </span>
          </div>
        </section>

        <form action={ajouterCamion} style={layout}>
          <section style={mainCard}>
            {!peutAjouterCamion ? (
              <div style={accessDenied}>
                <h2 style={{ marginTop: 0 }}>Accès refusé</h2>

                <p style={muted}>
                  Seul le directeur ou le sous-directeur peut ajouter un camion.
                </p>

                <Link href="/camions" style={btnBlue}>
                  ← Retour camions
                </Link>
              </div>
            ) : (
              <>
                <div style={sectionHeader}>
                  <div>
                    <div style={smallText}>Fiche technique</div>
                    <h2 style={sectionTitle}>Informations du camion</h2>
                  </div>

                  <Link href="/camions" style={btnDark}>
                    ← Retour camions
                  </Link>
                </div>

                <div style={formGrid}>
                  <Field label="Marque">
                    <select
                      name="marque"
                      defaultValue=""
                      style={select}
                      required
                    >
                      <option value="" disabled>
                        Choisir une marque
                      </option>

                      <optgroup label="ETS2">
                        {MARQUES_ETS2.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </optgroup>

                      <optgroup label="ATS">
                        {MARQUES_ATS.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </Field>

                  <Field label="Modèle">
                    <input
                      name="modele"
                      type="text"
                      placeholder="Exemple : S 770"
                      required
                      style={input}
                    />
                  </Field>

                  <Field label="Cabine">
                    <input
                      name="cabine"
                      type="text"
                      placeholder="Exemple : Topline"
                      style={input}
                    />
                  </Field>

                  <Field label="Châssis">
                    <input
                      name="chassis"
                      type="text"
                      placeholder="Exemple : 6x4"
                      style={input}
                    />
                  </Field>

                  <Field label="Moteur">
                    <input
                      name="moteur"
                      type="text"
                      placeholder="Exemple : 770 ch"
                      style={input}
                    />
                  </Field>

                  <Field label="Transmission">
                    <input
                      name="transmission"
                      type="text"
                      placeholder="Exemple : Automatique"
                      style={input}
                    />
                  </Field>

                  <Field label="Peinture">
                    <input
                      name="peinture"
                      type="text"
                      placeholder="Exemple : Blanc nacré"
                      style={input}
                    />
                  </Field>

                  <Field label="Prix du camion (€)">
                    <input
                      name="prixAchat"
                      type="number"
                      min="1"
                      placeholder="Exemple : 185000"
                      required
                      style={input}
                    />
                  </Field>
                </div>

                <div style={actions}>
                  <button type="submit" style={submitButton}>
                    ✅ Enregistrer le camion
                  </button>

                  <Link href="/camions" style={btnDark}>
                    Annuler
                  </Link>
                </div>
              </>
            )}
          </section>

          <aside style={sidePanel}>
            <InfoCard title="Autorisation" icon="🔐">
              <InfoLine label="Ton rôle" value={monMembership.role} />
              <InfoLine label="Directeur" value="Oui" />
              <InfoLine label="Sous-directeur" value="Oui" />
              <InfoLine label="Autres rôles" value="Non" />
            </InfoCard>

            <InfoCard title="Photo du camion" icon="📸">
              <UploadBox
                name="image"
                label="Photo principale"
                text="Ajoute l’image visible sur la fiche camion."
              />
            </InfoCard>

            <InfoCard title="Preuve d’achat" icon="🧾">
              <UploadBox
                name="preuveAchat"
                label="Document / capture"
                text="Ajoute la preuve d’achat du camion."
              />
            </InfoCard>
          </aside>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={field}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span style={tag}>{children}</span>;
}

function InfoCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <section style={infoCard}>
      <h3 style={infoTitle}>
        <span>{icon}</span>
        {title}
      </h3>

      {children}
    </section>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={infoLine}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function UploadBox({
  name,
  label,
  text,
}: {
  name: string;
  label: string;
  text: string;
}) {
  return (
    <label style={uploadBox}>
      <span style={uploadTitle}>{label}</span>
      <span style={uploadIcon}>☁️</span>
      <span style={uploadText}>{text}</span>

      <input
        name={name}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={fileInput}
      />
    </label>
  );
}

const page: CSSProperties = {
  minHeight: "100vh",
  backgroundImage: "url('/truck.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundAttachment: "fixed",
  color: "white",
  padding: "24px",
  position: "relative",
};

const overlay: CSSProperties = {
  position: "fixed",
  inset: 0,
  background:
    "linear-gradient(135deg, rgba(0,0,0,0.9), rgba(5,18,34,0.74), rgba(0,0,0,0.94))",
  zIndex: 0,
};

const topButton: CSSProperties = {
  position: "absolute",
  top: "24px",
  right: "24px",
  zIndex: 5,
  padding: "12px 18px",
  borderRadius: "999px",
  color: "white",
  textDecoration: "none",
  fontWeight: 900,
  background:
    "linear-gradient(135deg, rgba(37,99,235,0.95), rgba(14,165,233,0.75))",
  border: "1px solid rgba(255,255,255,0.25)",
  boxShadow: "0 15px 35px rgba(0,0,0,0.45)",
  backdropFilter: "blur(10px)",
};

const container: CSSProperties = {
  position: "relative",
  zIndex: 1,
  maxWidth: "1320px",
  margin: "0 auto",
  display: "grid",
  gap: "22px",
  paddingTop: "62px",
};

const hero: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "24px",
  padding: "30px",
  borderRadius: "30px",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.13), rgba(255,255,255,0.04))",
  border: "1px solid rgba(255,255,255,0.16)",
  boxShadow: "0 25px 70px rgba(0,0,0,0.52)",
  backdropFilter: "blur(13px)",
};

const smallText: CSSProperties = {
  opacity: 0.72,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  fontSize: "0.78rem",
  fontWeight: 900,
};

const title: CSSProperties = {
  margin: "8px 0 10px",
  fontSize: "clamp(2.1rem, 4vw, 3.8rem)",
  lineHeight: 1,
};

const subtitle: CSSProperties = {
  margin: 0,
  maxWidth: "700px",
  opacity: 0.86,
  lineHeight: 1.6,
};

const tags: CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "16px",
};

const tag: CSSProperties = {
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.14)",
  fontWeight: 800,
  fontSize: "0.85rem",
};

const heroPanel: CSSProperties = {
  minWidth: "260px",
  padding: "20px",
  borderRadius: "24px",
  background: "rgba(0,0,0,0.38)",
  border: "1px solid rgba(255,255,255,0.13)",
  textAlign: "right",
};

const panelLabel: CSSProperties = {
  display: "block",
  opacity: 0.72,
  marginBottom: "8px",
};

const panelMoney: CSSProperties = {
  display: "block",
  fontSize: "2rem",
  color: "#22c55e",
};

const panelHint: CSSProperties = {
  display: "block",
  marginTop: "8px",
  opacity: 0.65,
  fontSize: "0.85rem",
};

const layout: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.35fr 0.65fr",
  gap: "22px",
  alignItems: "start",
};

const mainCard: CSSProperties = {
  padding: "24px",
  borderRadius: "28px",
  background: "rgba(0,0,0,0.58)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 18px 50px rgba(0,0,0,0.42)",
  backdropFilter: "blur(11px)",
};

const sectionHeader: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "14px",
  flexWrap: "wrap",
  marginBottom: "20px",
};

const sectionTitle: CSSProperties = {
  margin: "4px 0 0",
  fontSize: "1.45rem",
};

const formGrid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "16px",
};

const field: CSSProperties = {
  display: "grid",
  gap: "8px",
  minWidth: 0,
};

const labelStyle: CSSProperties = {
  fontSize: "0.88rem",
  fontWeight: 900,
  opacity: 0.9,
};

const input: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "13px 14px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.13)",
  background: "rgba(255,255,255,0.09)",
  color: "white",
  outline: "none",
};

const select: CSSProperties = {
  ...input,
  background: "#ffffff",
  color: "#111111",
};

const actions: CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginTop: "22px",
};

const submitButton: CSSProperties = {
  padding: "13px 18px",
  borderRadius: "14px",
  border: "none",
  background: "linear-gradient(135deg, #16a34a, #22c55e)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 0 16px rgba(34,197,94,0.42)",
};

const btnDark: CSSProperties = {
  padding: "12px 16px",
  borderRadius: "14px",
  color: "white",
  textDecoration: "none",
  fontWeight: 900,
  background: "rgba(255,255,255,0.09)",
  border: "1px solid rgba(255,255,255,0.13)",
};

const btnBlue: CSSProperties = {
  ...btnDark,
  background:
    "linear-gradient(135deg, rgba(37,99,235,0.95), rgba(59,130,246,0.65))",
};

const sidePanel: CSSProperties = {
  display: "grid",
  gap: "16px",
};

const infoCard: CSSProperties = {
  padding: "20px",
  borderRadius: "24px",
  background: "rgba(0,0,0,0.55)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
  backdropFilter: "blur(10px)",
};

const infoTitle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  margin: "0 0 14px",
};

const infoLine: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "10px 0",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const uploadBox: CSSProperties = {
  display: "grid",
  placeItems: "center",
  gap: "10px",
  padding: "22px",
  borderRadius: "18px",
  border: "1px dashed rgba(255,255,255,0.28)",
  background: "rgba(255,255,255,0.06)",
  cursor: "pointer",
  textAlign: "center",
};

const uploadTitle: CSSProperties = {
  fontWeight: 900,
};

const uploadIcon: CSSProperties = {
  fontSize: "2rem",
  opacity: 0.9,
};

const uploadText: CSSProperties = {
  opacity: 0.72,
  fontSize: "0.86rem",
  lineHeight: 1.5,
};

const fileInput: CSSProperties = {
  width: "100%",
  padding: "10px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.25)",
  color: "white",
};

const muted: CSSProperties = {
  margin: 0,
  opacity: 0.78,
  lineHeight: 1.6,
};

const accessDenied: CSSProperties = {
  padding: "24px",
  borderRadius: "22px",
  background: "rgba(239,68,68,0.14)",
  border: "1px solid rgba(239,68,68,0.35)",
};