import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import type { CSSProperties, ReactNode } from "react";
import { prisma } from "@/lib/prisma";

const DLC_ETS2 = [
  "Going East",
  "Scandinavia",
  "Vive la France",
  "Italia",
  "Beyond the Baltic Sea",
  "Road to the Black Sea",
  "Iberia",
  "West Balkans",
  "Greece",
];

const DLC_ATS = [
  "Arizona",
  "New Mexico",
  "Oregon",
  "Washington",
  "Utah",
  "Idaho",
  "Colorado",
  "Wyoming",
  "Montana",
  "Texas",
  "Oklahoma",
  "Kansas",
  "Nebraska",
  "Arkansas",
  "Missouri",
];

export default async function ModifierProfilPage() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) redirect("/");

  const user = await prisma.user.findUnique({
    where: { steamId },
    include: {
      dlcs: {
        orderBy: [{ jeu: "asc" }, { nomDlc: "asc" }],
      },
      entreprisesCreees: true,
    },
  });

  if (!user) redirect("/");

  const membershipActif = await prisma.entrepriseMembre.findUnique({
    where: { userId: user.id },
    include: { entreprise: true },
  });

  const entreprisePossedee = user.entreprisesCreees ?? null;

  const entrepriseActuelle =
    entreprisePossedee?.nom ??
    membershipActif?.entreprise?.nom ??
    "Aucune entreprise";

  const dlcsUserETS2 = new Set(
    user.dlcs.filter((dlc) => dlc.jeu === "ETS2").map((dlc) => dlc.nomDlc)
  );

  const dlcsUserATS = new Set(
    user.dlcs.filter((dlc) => dlc.jeu === "ATS").map((dlc) => dlc.nomDlc)
  );

  async function sauvegarderProfil(formData: FormData) {
    "use server";

    const cookieStore = await cookies();
    const steamId = cookieStore.get("steamId")?.value;

    if (!steamId) redirect("/");

    const user = await prisma.user.findUnique({
      where: { steamId },
      select: { id: true },
    });

    if (!user) redirect("/");

    const ageValue = formData.get("age")?.toString().trim() || "";
    const region = formData.get("region")?.toString().trim() || null;
    const micro = formData.get("micro") === "oui";
    const jeuPrincipal = formData.get("jeuPrincipal")?.toString().trim() || null;
    const styleConduite =
      formData.get("styleConduite")?.toString().trim() || null;
    const typeTransportPrefere =
      formData.get("typeTransportPrefere")?.toString().trim() || null;
    const descriptionChauffeur =
      formData.get("descriptionChauffeur")?.toString().trim() || null;

    const age =
      ageValue === "" || Number.isNaN(Number(ageValue))
        ? null
        : Number(ageValue);

    const dlcsETS2 = formData
      .getAll("dlcsETS2")
      .map((value) => value.toString());

    const dlcsATS = formData
      .getAll("dlcsATS")
      .map((value) => value.toString());

    const nouveauxDlcs = [
      ...dlcsETS2.map((nomDlc) => ({
        userId: user.id,
        jeu: "ETS2",
        nomDlc,
      })),
      ...dlcsATS.map((nomDlc) => ({
        userId: user.id,
        jeu: "ATS",
        nomDlc,
      })),
    ];

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          age,
          region,
          micro,
          jeuPrincipal,
          styleConduite,
          typeTransportPrefere,
          descriptionChauffeur,
        },
      });

      await tx.userDlc.deleteMany({
        where: { userId: user.id },
      });

      if (nouveauxDlcs.length > 0) {
        await tx.userDlc.createMany({
          data: nouveauxDlcs,
        });
      }
    });

    revalidatePath("/profil");
    revalidatePath("/profil/modifier");
    redirect("/profil");
  }

  return (
    <main style={mainStyle}>
      <div style={overlayStyle} />
      <div style={radialOverlayStyle} />

      <div style={pageStyle}>
        <div style={topButtonRowStyle}>
          <Link href="/profil" style={profileButtonStyle}>
            ← Retour profil
          </Link>
        </div>

        <form action={sauvegarderProfil} style={formStyle}>
          <section style={heroStyle}>
            <div style={heroLeftStyle}>
              <img
                src={user.avatar || "/truck.jpg"}
                alt="Avatar chauffeur"
                style={avatarStyle}
              />

              <div>
                <div style={kickerStyle}>Elite Routiers • Profil chauffeur</div>

                <h1 style={titleStyle}>Modifier mon profil</h1>

                <p style={subtitleStyle}>
                  Gérez vos informations personnelles et préférences de jeu.
                </p>

                <div style={tagRowStyle}>
                  <Tag>{user.username || "Pseudo"}</Tag>
                  <Tag>{entrepriseActuelle}</Tag>
                  <Tag>{user.jeuPrincipal || "Jeu non renseigné"}</Tag>
                </div>
              </div>
            </div>

            <div style={statsStyle}>
              <Stat value={dlcsUserETS2.size.toString()} label="DLC ETS2" />
              <Stat value={dlcsUserATS.size.toString()} label="DLC ATS" />
              <Stat value={user.micro ? "Oui" : "Non"} label="Micro" />
            </div>
          </section>

          <section style={panelStyle}>
            <div style={splitStyle}>
              <Card title="👤 Informations générales">
                <ReadOnlyRow
                  label="Pseudo Steam"
                  value={user.username || "Non renseigné"}
                />

                <ReadOnlyRow
                  label="Entreprise actuelle"
                  value={entrepriseActuelle}
                />

                <div style={doubleInputStyle}>
                  <Field label="Âge">
                    <input
                      name="age"
                      type="number"
                      min="0"
                      defaultValue={user.age ?? ""}
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Région">
                    <input
                      name="region"
                      type="text"
                      defaultValue={user.region ?? ""}
                      style={inputStyle}
                    />
                  </Field>
                </div>

                <Field label="Micro">
                  <div style={choiceGridStyle}>
                    <Choice
                      name="micro"
                      value="oui"
                      checked={user.micro === true}
                      label="Oui"
                    />
                    <Choice
                      name="micro"
                      value="non"
                      checked={user.micro === false}
                      label="Non"
                    />
                  </div>
                </Field>
              </Card>

              <Card title="🚚 Profil routier">
                <Field label="Jeu principal">
                  <div style={choiceGrid3Style}>
                    <Choice
                      name="jeuPrincipal"
                      value="ETS2"
                      checked={user.jeuPrincipal === "ETS2"}
                      label="ETS2"
                    />
                    <Choice
                      name="jeuPrincipal"
                      value="ATS"
                      checked={user.jeuPrincipal === "ATS"}
                      label="ATS"
                    />
                    <Choice
                      name="jeuPrincipal"
                      value="LES_DEUX"
                      checked={user.jeuPrincipal === "LES_DEUX"}
                      label="Les deux"
                    />
                  </div>
                </Field>

                <Field label="Style de conduite">
                  <div style={choiceGridStyle}>
                    <Choice
                      name="styleConduite"
                      value="RP"
                      checked={user.styleConduite === "RP"}
                      label="RP"
                    />
                    <Choice
                      name="styleConduite"
                      value="SEMI_RP"
                      checked={user.styleConduite === "SEMI_RP"}
                      label="Semi-RP"
                    />
                  </div>
                </Field>

                <Field label="Transport préféré">
                  <div style={choiceGrid3Style}>
                    <Choice
                      name="typeTransportPrefere"
                      value="GENERAL"
                      checked={user.typeTransportPrefere === "GENERAL"}
                      label="Général"
                    />
                    <Choice
                      name="typeTransportPrefere"
                      value="FRIGORIFIQUE"
                      checked={user.typeTransportPrefere === "FRIGORIFIQUE"}
                      label="Frigorifique"
                    />
                    <Choice
                      name="typeTransportPrefere"
                      value="CITERNE"
                      checked={user.typeTransportPrefere === "CITERNE"}
                      label="Citerne"
                    />
                    <Choice
                      name="typeTransportPrefere"
                      value="CONVOI_EXCEPTIONNEL"
                      checked={
                        user.typeTransportPrefere === "CONVOI_EXCEPTIONNEL"
                      }
                      label="Convoi exceptionnel"
                    />
                    <Choice
                      name="typeTransportPrefere"
                      value="BENNE"
                      checked={user.typeTransportPrefere === "BENNE"}
                      label="Benne"
                    />
                    <Choice
                      name="typeTransportPrefere"
                      value="FORESTIER"
                      checked={user.typeTransportPrefere === "FORESTIER"}
                      label="Forestier"
                    />
                    <Choice
                      name="typeTransportPrefere"
                      value="CONTENEUR"
                      checked={user.typeTransportPrefere === "CONTENEUR"}
                      label="Conteneur"
                    />
                  </div>
                </Field>

                <Field label="Présentation chauffeur">
                  <textarea
                    name="descriptionChauffeur"
                    defaultValue={user.descriptionChauffeur ?? ""}
                    rows={7}
                    style={textareaStyle}
                  />
                </Field>
              </Card>
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={sectionTitleStyle}>🧩 DLC possédés</h2>

            <div style={splitStyle}>
              <Card title="🚛 DLC ETS2">
                <div style={checkboxGridStyle}>
                  {DLC_ETS2.map((dlc) => (
                    <label key={dlc} style={checkboxItemStyle}>
                      <input
                        type="checkbox"
                        name="dlcsETS2"
                        value={dlc}
                        defaultChecked={dlcsUserETS2.has(dlc)}
                      />
                      <span>{dlc}</span>
                    </label>
                  ))}
                </div>
              </Card>

              <Card title="🇺🇸 DLC ATS">
                <div style={checkboxGridStyle}>
                  {DLC_ATS.map((dlc) => (
                    <label key={dlc} style={checkboxItemStyle}>
                      <input
                        type="checkbox"
                        name="dlcsATS"
                        value={dlc}
                        defaultChecked={dlcsUserATS.has(dlc)}
                      />
                      <span>{dlc}</span>
                    </label>
                  ))}
                </div>
              </Card>
            </div>
          </section>

          <div style={actionsStyle}>
            <Link href="/profil" style={cancelButtonStyle}>
              ✕ Annuler
            </Link>

            <button type="submit" style={saveButtonStyle}>
              💾 Enregistrer le profil
            </button>
          </div>
        </form>
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

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <div style={fieldLabelStyle}>{label}</div>
      <div style={readOnlyStyle}>{value}</div>
    </div>
  );
}

function Choice({
  name,
  value,
  checked,
  label,
}: {
  name: string;
  value: string;
  checked: boolean;
  label: string;
}) {
  return (
    <label style={choiceItemStyle}>
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={checked}
      />
      <span>{label}</span>
    </label>
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
};

const topButtonRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  marginBottom: "18px",
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

const heroLeftStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "22px",
};

const avatarStyle: CSSProperties = {
  width: "112px",
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
  fontSize: "1.75rem",
  lineHeight: 1,
  fontWeight: 950,
};

const statLabelStyle: CSSProperties = {
  fontSize: "0.78rem",
  color: "rgba(255,255,255,0.72)",
  fontWeight: 800,
  marginTop: "-16px",
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

const sectionTitleStyle: CSSProperties = {
  margin: "0 0 18px",
  fontSize: "1.35rem",
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

const readOnlyStyle: CSSProperties = {
  ...inputStyle,
  display: "flex",
  alignItems: "center",
  background: "rgba(255,255,255,0.075)",
};

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "115px",
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

const doubleInputStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "18px",
};

const choiceGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
};

const choiceGrid3Style: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "12px",
};

const choiceItemStyle: CSSProperties = {
  minHeight: "48px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  borderRadius: "12px",
  padding: "0 14px",
  background: "rgba(255,255,255,0.085)",
  border: "1px solid rgba(255,255,255,0.16)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
};

const checkboxGridStyle: CSSProperties = {
  display: "grid",
  gap: "1px",
  borderRadius: "14px",
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.10)",
};

const checkboxItemStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  minHeight: "38px",
  padding: "0 12px",
  background: "rgba(255,255,255,0.085)",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  fontWeight: 850,
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
};

const cancelButtonStyle: CSSProperties = {
  minWidth: "180px",
  textAlign: "center",
  padding: "13px 22px",
  borderRadius: "12px",
  color: "white",
  textDecoration: "none",
  fontWeight: 950,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.18)",
};

const saveButtonStyle: CSSProperties = {
  minWidth: "230px",
  padding: "13px 22px",
  borderRadius: "12px",
  color: "white",
  fontWeight: 950,
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  border: "1px solid rgba(147,197,253,0.45)",
  boxShadow: "0 0 24px rgba(37,99,235,0.34)",
  cursor: "pointer",
};