import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import Menu from "@/app/components/Menu";
import { prisma } from "@/lib/prisma";
import { RoleEntreprise, StatutCamion } from "@prisma/client";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

function formatMarque(marque: string) {
  switch (marque) {
    case "RENAULT":
      return "Renault";
    case "SCANIA":
      return "Scania";
    case "VOLVO":
      return "Volvo";
    case "MAN":
      return "MAN";
    case "DAF":
      return "DAF";
    case "MERCEDES":
      return "Mercedes-Benz";
    case "IVECO":
      return "Iveco";
    case "KENWORTH":
      return "Kenworth";
    case "PETERBILT":
      return "Peterbilt";
    case "FREIGHTLINER":
      return "Freightliner";
    case "INTERNATIONAL":
      return "International";
    case "MACK":
      return "Mack";
    case "WESTERN_STAR":
      return "Western Star";
    default:
      return marque;
  }
}

export default async function AttribuerCamionPage({ params }: Props) {
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

  const peutAttribuer =
    monMembership.role === RoleEntreprise.DIRECTEUR ||
    monMembership.role === RoleEntreprise.SOUS_DIRECTEUR;

  if (!peutAttribuer) {
    redirect("/camions");
  }

  const entreprise = await prisma.entreprise.findUnique({
    where: { id: monMembership.entrepriseId },
  });

  if (!entreprise) {
    redirect("/societe");
  }

  const camion = await prisma.camion.findFirst({
    where: {
      id: camionId,
      entrepriseId: monMembership.entrepriseId,
      actif: true,
    },
    include: {
      chauffeur: true,
    },
  });

  if (!camion) {
    notFound();
  }

  const membres = await prisma.entrepriseMembre.findMany({
    where: {
      entrepriseId: monMembership.entrepriseId,
    },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const chauffeurs = membres.filter((membre) => membre.user);

  async function attribuerCamion(formData: FormData) {
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

    const camion = await prisma.camion.findFirst({
      where: {
        id: camionId,
        entrepriseId: membership.entrepriseId,
        actif: true,
      },
    });

    if (!camion) {
      notFound();
    }

    const chauffeurIdValue = String(formData.get("chauffeurId") || "").trim();

    if (!chauffeurIdValue) {
      await prisma.camion.update({
        where: { id: camionId },
        data: {
          chauffeurId: null,
          statut: StatutCamion.DISPONIBLE,
        },
      });

      revalidatePath("/camions");
      revalidatePath(`/camions/${camionId}`);
      revalidatePath(`/camions/${camionId}/attribuer`);
      redirect("/camions");
    }

    const membreSelectionne = await prisma.entrepriseMembre.findFirst({
      where: {
        entrepriseId: membership.entrepriseId,
        userId: chauffeurIdValue,
      },
      include: {
        user: true,
      },
    });

    if (!membreSelectionne || !membreSelectionne.user) {
      redirect(`/camions/${camionId}/attribuer`);
    }

    await prisma.camion.update({
      where: { id: camionId },
      data: {
        chauffeurId: chauffeurIdValue,
        statut: StatutCamion.DISPONIBLE,
      },
    });

    revalidatePath("/camions");
    revalidatePath(`/camions/${camionId}`);
    revalidatePath(`/camions/${camionId}/attribuer`);
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
                <h1 style={{ margin: 0, fontSize: "34px" }}>Attribuer un camion</h1>
                <p
                  style={{
                    marginTop: "8px",
                    marginBottom: 0,
                    opacity: 0.88,
                    lineHeight: 1.5,
                  }}
                >
                  Choisis un chauffeur pour le camion {formatMarque(camion.marque)}{" "}
                  {camion.modele}
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
                <form action={attribuerCamion} style={formCardStyle}>
                  <div style={camionResumeStyle}>
                    <div
                      style={{
                        width: "220px",
                        maxWidth: "100%",
                        borderRadius: "14px",
                        overflow: "hidden",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <img
                        src={camion.image || "/truck.jpg"}
                        alt={`${formatMarque(camion.marque)} ${camion.modele}`}
                        style={{
                          width: "100%",
                          height: "160px",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h2 style={{ marginTop: 0, marginBottom: "8px" }}>
                        {formatMarque(camion.marque)} {camion.modele}
                      </h2>

                      <div style={infoRowStyle}>
                        <span style={labelStyle}>Chauffeur actuel</span>
                        <span style={valueStyle}>
                          {camion.chauffeur?.username || "Non attribué"}
                        </span>
                      </div>

                      <div style={infoRowStyle}>
                        <span style={labelStyle}>Statut</span>
                        <span style={valueStyle}>{camion.statut}</span>
                      </div>

                      <div style={infoRowStyle}>
                        <span style={labelStyle}>Entreprise</span>
                        <span style={valueStyle}>{entreprise.nom}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ ...boxStyle, marginTop: "20px" }}>
                    <h2 style={{ marginTop: 0, marginBottom: "16px" }}>
                      Liste des chauffeurs
                    </h2>

                    <div style={fieldGroupStyle}>
                      <label style={labelInputStyle}>Choisir un chauffeur</label>
                      <select
                        name="chauffeurId"
                        defaultValue={camion.chauffeurId || ""}
                        style={whiteSelectStyle}
                      >
                        <option value="" style={whiteOptionStyle}>
                          Non attribué
                        </option>

                        {chauffeurs.map((membre) => (
                          <option
                            key={membre.user.id}
                            value={membre.user.id}
                            style={whiteOptionStyle}
                          >
                            {membre.user.username || "Utilisateur sans pseudo"} —{" "}
                            {membre.role}
                          </option>
                        ))}
                      </select>
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
                      Enregistrer l’attribution
                    </button>

                    <Link href="/camions" style={secondaryButtonStyle}>
                      Annuler
                    </Link>
                  </div>
                </form>
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
                    Qui peut attribuer
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
                    Société
                  </h2>

                  <div style={infoRowStyle}>
                    <span style={labelStyle}>Entreprise</span>
                    <span style={valueStyle}>{entreprise.nom}</span>
                  </div>

                  <div style={infoRowStyle}>
                    <span style={labelStyle}>Nombre de chauffeurs</span>
                    <span style={valueStyle}>{chauffeurs.length}</span>
                  </div>
                </div>

                <div style={boxStyle}>
                  <h2 style={{ marginTop: 0, marginBottom: "12px" }}>
                    Infos
                  </h2>

                  <p style={smallTextStyle}>
                    Ici tu retrouves tous les chauffeurs de la société pour
                    attribuer ce camion à la bonne personne.
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

const camionResumeStyle = {
  display: "flex",
  gap: "18px",
  alignItems: "start",
  flexWrap: "wrap" as const,
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