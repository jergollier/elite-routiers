import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import Menu from "@/app/components/Menu";

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

  if (!steamId) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
  where: { steamId },
  include: {
    dlcs: {
      orderBy: [{ jeu: "asc" }, { nomDlc: "asc" }],
    },
    entreprisesCreees: true,
  },
});

if (!user) {
  redirect("/");
}

const membershipActif = await prisma.entrepriseMembre.findUnique({
  where: {
    userId: user.id,
  },
  include: {
    entreprise: true,
  },
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

    if (!steamId) {
      redirect("/");
    }

    const user = await prisma.user.findUnique({
      where: { steamId },
      select: { id: true },
    });

    if (!user) {
      redirect("/");
    }

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
    <main
      style={{
        minHeight: "100vh",
        backgroundImage: "url('/truck.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        padding: "20px",
        color: "white",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "220px minmax(0, 1fr)",
          gap: "20px",
          alignItems: "start",
        }}
      >
        <div>
          <Menu />
        </div>

        <form action={sauvegarderProfil} style={{ display: "grid", gap: "20px" }}>
          <section
            style={{
              background: "rgba(0,0,0,0.55)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "18px",
              backdropFilter: "blur(6px)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ padding: "24px" }}>
              <div style={{ opacity: 0.7 }}>Elite Routiers</div>

              <h1 style={{ margin: "5px 0", fontSize: "2rem" }}>
                Modifier mon profil
              </h1>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "10px",
                  flexWrap: "wrap",
                }}
              >
                <Tag>{user.username || "Pseudo non renseigné"}</Tag>
                <Tag>{entrepriseActuelle}</Tag>
                <Tag>Profil chauffeur</Tag>
              </div>
            </div>
          </section>

          <section
            style={{
              background: "rgba(0,0,0,0.55)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "18px",
              padding: "20px",
              backdropFilter: "blur(6px)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
              }}
            >
              <Card title="Informations générales">
                <ReadOnlyRow
                  label="Pseudo Steam"
                  value={user.username || "Non renseigné"}
                />

                <ReadOnlyRow
                  label="Entreprise actuelle"
                  value={entrepriseActuelle}
                />

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

                <Field label="Micro">
                  <div style={choiceGridStyle}>
                    <label style={choiceItemStyle}>
                      <input
                        type="radio"
                        name="micro"
                        value="oui"
                        defaultChecked={user.micro === true}
                      />
                      <span>Oui</span>
                    </label>

                    <label style={choiceItemStyle}>
                      <input
                        type="radio"
                        name="micro"
                        value="non"
                        defaultChecked={user.micro === false}
                      />
                      <span>Non</span>
                    </label>
                  </div>
                </Field>
              </Card>

              <Card title="Profil routier">
                <Field label="Jeu principal">
                  <div style={choiceGridStyle}>
                    <label style={choiceItemStyle}>
                      <input
                        type="radio"
                        name="jeuPrincipal"
                        value="ETS2"
                        defaultChecked={user.jeuPrincipal === "ETS2"}
                      />
                      <span>ETS2</span>
                    </label>

                    <label style={choiceItemStyle}>
                      <input
                        type="radio"
                        name="jeuPrincipal"
                        value="ATS"
                        defaultChecked={user.jeuPrincipal === "ATS"}
                      />
                      <span>ATS</span>
                    </label>

                    <label style={choiceItemStyle}>
                      <input
                        type="radio"
                        name="jeuPrincipal"
                        value="LES_DEUX"
                        defaultChecked={user.jeuPrincipal === "LES_DEUX"}
                      />
                      <span>Les deux</span>
                    </label>
                  </div>
                </Field>

                <Field label="Style de conduite">
                  <div style={choiceGridStyle}>
                    <label style={choiceItemStyle}>
                      <input
                        type="radio"
                        name="styleConduite"
                        value="RP"
                        defaultChecked={user.styleConduite === "RP"}
                      />
                      <span>RP</span>
                    </label>

                    <label style={choiceItemStyle}>
                      <input
                        type="radio"
                        name="styleConduite"
                        value="SEMI_RP"
                        defaultChecked={user.styleConduite === "SEMI_RP"}
                      />
                      <span>Semi-RP</span>
                    </label>
                  </div>
                </Field>

                <Field label="Transport préféré">
                  <div style={choiceGridStyle}>
                    <label style={choiceItemStyle}>
                      <input
                        type="radio"
                        name="typeTransportPrefere"
                        value="GENERAL"
                        defaultChecked={user.typeTransportPrefere === "GENERAL"}
                      />
                      <span>Général</span>
                    </label>

                    <label style={choiceItemStyle}>
                      <input
                        type="radio"
                        name="typeTransportPrefere"
                        value="FRIGORIFIQUE"
                        defaultChecked={
                          user.typeTransportPrefere === "FRIGORIFIQUE"
                        }
                      />
                      <span>Frigorifique</span>
                    </label>

                    <label style={choiceItemStyle}>
                      <input
                        type="radio"
                        name="typeTransportPrefere"
                        value="CITERNE"
                        defaultChecked={user.typeTransportPrefere === "CITERNE"}
                      />
                      <span>Citerne</span>
                    </label>

                    <label style={choiceItemStyle}>
                      <input
                        type="radio"
                        name="typeTransportPrefere"
                        value="CONVOI_EXCEPTIONNEL"
                        defaultChecked={
                          user.typeTransportPrefere === "CONVOI_EXCEPTIONNEL"
                        }
                      />
                      <span>Convoi exceptionnel</span>
                    </label>

                    <label style={choiceItemStyle}>
                      <input
                        type="radio"
                        name="typeTransportPrefere"
                        value="BENNE"
                        defaultChecked={user.typeTransportPrefere === "BENNE"}
                      />
                      <span>Benne</span>
                    </label>

                    <label style={choiceItemStyle}>
                      <input
                        type="radio"
                        name="typeTransportPrefere"
                        value="FORESTIER"
                        defaultChecked={user.typeTransportPrefere === "FORESTIER"}
                      />
                      <span>Forestier</span>
                    </label>

                    <label style={choiceItemStyle}>
                      <input
                        type="radio"
                        name="typeTransportPrefere"
                        value="CONTENEUR"
                        defaultChecked={user.typeTransportPrefere === "CONTENEUR"}
                      />
                      <span>Conteneur</span>
                    </label>
                  </div>
                </Field>

                <Field label="Présentation chauffeur">
                  <textarea
                    name="descriptionChauffeur"
                    defaultValue={user.descriptionChauffeur ?? ""}
                    rows={8}
                    style={textareaStyle}
                  />
                </Field>
              </Card>
            </div>
          </section>

          <section
            style={{
              background: "rgba(0,0,0,0.55)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "18px",
              padding: "20px",
              backdropFilter: "blur(6px)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
              }}
            >
              <Card title="DLC ETS2">
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

              <Card title="DLC ATS">
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

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <Link href="/profil" style={btnStyle}>
              Annuler
            </Link>

            <button type="submit" style={btnBlueStyle}>
              Enregistrer le profil
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        background: "rgba(0,0,0,0.35)",
        padding: "15px",
        borderRadius: "12px",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: "15px" }}>{title}</h3>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <div
        style={{
          opacity: 0.75,
          marginBottom: "6px",
          fontSize: "0.95rem",
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function ReadOnlyRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <div
        style={{
          opacity: 0.75,
          marginBottom: "6px",
          fontSize: "0.95rem",
        }}
      >
        {label}
      </div>
      <div
        style={{
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "10px",
          padding: "12px 14px",
          fontWeight: "bold",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        background: "rgba(255,255,255,0.1)",
        padding: "5px 10px",
        borderRadius: "10px",
      }}
    >
      {children}
    </span>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "10px",
  padding: "12px 14px",
  outline: "none",
  fontSize: "0.95rem",
  boxSizing: "border-box",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "vertical",
  minHeight: "140px",
  fontFamily: "inherit",
};

const choiceGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
};

const choiceItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  padding: "10px 12px",
  cursor: "pointer",
};

const checkboxGridStyle: React.CSSProperties = {
  display: "grid",
  gap: "10px",
};

const checkboxItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  padding: "10px 12px",
};

const btnStyle: React.CSSProperties = {
  padding: "10px 20px",
  background: "rgba(255,255,255,0.1)",
  borderRadius: "10px",
  textDecoration: "none",
  color: "white",
  border: "1px solid rgba(255,255,255,0.08)",
};

const btnBlueStyle: React.CSSProperties = {
  padding: "10px 20px",
  background: "rgba(0,100,255,0.6)",
  borderRadius: "10px",
  textDecoration: "none",
  color: "white",
  border: "1px solid rgba(255,255,255,0.08)",
  cursor: "pointer",
};