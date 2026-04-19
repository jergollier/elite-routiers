import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

const JEUX = [
  { value: "ETS2", label: "ETS2" },
  { value: "ATS", label: "ATS" },
  { value: "LES_DEUX", label: "Les deux" },
];

const TYPES_TRANSPORT = [
  { value: "GENERAL", label: "Général" },
  { value: "CITERNE", label: "Citerne" },
  { value: "CONVOI_EXCEPTIONNEL", label: "Convoi exceptionnel" },
  { value: "FRIGO", label: "Frigo" },
  { value: "BENNE", label: "Benne" },
  { value: "PLATEAU", label: "Plateau" },
  { value: "LIVESTOCK", label: "Bétail" },
];

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function formatJeu(jeu: string) {
  if (jeu === "LES_DEUX") return "Les deux";
  return jeu;
}

function formatTypeTransport(type: string) {
  const found = TYPES_TRANSPORT.find((t) => t.value === type);
  return found ? found.label : type;
}

function formatExperience(experience: string) {
  if (experience === "DEBUTANT") return "Débutant";
  if (experience === "INTERMEDIAIRE") return "Intermédiaire";
  if (experience === "EXPERIMENTE") return "Expérimenté";
  return experience;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export default async function GestionEntreprisePage({ params }: Props) {
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

  const entreprise = await prisma.entreprise.findUnique({
    where: { id: entrepriseId },
    include: {
      owner: true,
      membres: {
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      candidatures: {
        where: {
          statut: "EN_ATTENTE",
        },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      _count: {
        select: {
          membres: true,
        },
      },
    },
  });

  if (!entreprise) {
    notFound();
  }

  const membreActuel = entreprise.membres.find(
    (membre) => membre.user?.steamId === steamId
  );

  if (!membreActuel) {
    redirect("/societe");
  }

  const rolesAutorises = [
    "DIRECTEUR",
    "SOUS_DIRECTEUR",
    "CHEF_EQUIPE",
    "CHEF_ATELIER",
  ];

  if (!rolesAutorises.includes(membreActuel.role)) {
    redirect("/mon-entreprise");
  }

  const peutModifierInfos =
    membreActuel.role === "DIRECTEUR" ||
    membreActuel.role === "SOUS_DIRECTEUR";

  const peutGererCuve =
    membreActuel.role === "DIRECTEUR" ||
    membreActuel.role === "SOUS_DIRECTEUR" ||
    membreActuel.role === "CHEF_ATELIER";

  const peutGererCandidatures =
    membreActuel.role === "DIRECTEUR" ||
    membreActuel.role === "SOUS_DIRECTEUR" ||
    membreActuel.role === "CHEF_EQUIPE";

  async function updateEntreprise(formData: FormData) {
    "use server";

    const cookieStore = await cookies();
    const steamId = cookieStore.get("steamId")?.value;

    if (!steamId) return;

    const entrepriseIdFromForm = Number(formData.get("entrepriseId"));
    if (!entrepriseIdFromForm || Number.isNaN(entrepriseIdFromForm)) return;

    const entreprise = await prisma.entreprise.findUnique({
      where: { id: entrepriseIdFromForm },
      include: {
        membres: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!entreprise) return;

    const membreActuel = entreprise.membres.find(
      (membre) => membre.user?.steamId === steamId
    );

    if (
      !membreActuel ||
      !["DIRECTEUR", "SOUS_DIRECTEUR"].includes(membreActuel.role)
    ) {
      return;
    }

    const nom = (formData.get("nom") as string)?.trim();
    const abreviationBrute = (formData.get("abreviation") as string)?.trim();
    const jeu = (formData.get("jeu") as string)?.trim();
    const typeTransport = (formData.get("typeTransport") as string)?.trim();

    if (!nom || !abreviationBrute || !jeu || !typeTransport) return;

    const abreviation = abreviationBrute.toUpperCase().slice(0, 3);

    if (!JEUX.some((j) => j.value === jeu)) return;
    if (!TYPES_TRANSPORT.some((t) => t.value === typeTransport)) return;

    let banniereUrl = entreprise.banniere ?? null;

    const banniereFile = formData.get("banniereFile");

    if (banniereFile instanceof File && banniereFile.size > 0) {
      if (!ALLOWED_TYPES.includes(banniereFile.type)) {
        return;
      }

      if (banniereFile.size > MAX_FILE_SIZE) {
        return;
      }

      const extension =
        banniereFile.type === "image/png"
          ? "png"
          : banniereFile.type === "image/webp"
          ? "webp"
          : "jpg";

      const safeNom = slugify(nom) || "societe";
      const fileName = `entreprises/${safeNom}-${entrepriseIdFromForm}-${Date.now()}.${extension}`;

      const blob = await put(fileName, banniereFile, {
        access: "public",
      });

      banniereUrl = blob.url;
    }

    await prisma.entreprise.update({
      where: { id: entrepriseIdFromForm },
      data: {
        nom,
        abreviation,
        jeu,
        typeTransport,
        banniere: banniereUrl,
      },
    });

    revalidatePath(`/entreprise/${entrepriseIdFromForm}/gestion`);
    revalidatePath("/mon-entreprise");
    revalidatePath("/societe");
    revalidatePath(`/entreprise/${entrepriseIdFromForm}`);
  }

  async function updateRecrutement(formData: FormData) {
    "use server";

    const cookieStore = await cookies();
    const steamId = cookieStore.get("steamId")?.value;

    if (!steamId) return;

    const entrepriseIdFromForm = Number(formData.get("entrepriseId"));
    const recrutementValue = formData.get("recrutement");

    if (!entrepriseIdFromForm || Number.isNaN(entrepriseIdFromForm)) return;

    const entreprise = await prisma.entreprise.findUnique({
      where: { id: entrepriseIdFromForm },
      include: {
        membres: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!entreprise) return;

    const membreActuel = entreprise.membres.find(
      (membre) => membre.user?.steamId === steamId
    );

    if (
      !membreActuel ||
      !["DIRECTEUR", "SOUS_DIRECTEUR"].includes(membreActuel.role)
    ) {
      return;
    }

    const recrutement = recrutementValue === "true";

    await prisma.entreprise.update({
      where: { id: entrepriseIdFromForm },
      data: {
        recrutement,
      },
    });

    revalidatePath(`/entreprise/${entrepriseIdFromForm}/gestion`);
    revalidatePath("/mon-entreprise");
    revalidatePath("/societe");
    revalidatePath(`/entreprise/${entrepriseIdFromForm}`);
  }

  async function remplirCuve(formData: FormData) {
    "use server";

    const cookieStore = await cookies();
    const steamId = cookieStore.get("steamId")?.value;

    if (!steamId) return;

    const entrepriseIdFromForm = Number(formData.get("entrepriseId"));
    const mode = String(formData.get("mode") || "");
    const quantiteDemandee = Number(formData.get("quantite") || 0);

    if (!entrepriseIdFromForm || Number.isNaN(entrepriseIdFromForm)) return;

    const entreprise = await prisma.entreprise.findUnique({
      where: { id: entrepriseIdFromForm },
      include: {
        membres: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!entreprise) return;

    const membreActuel = entreprise.membres.find(
      (membre) => membre.user?.steamId === steamId
    );

    if (
      !membreActuel ||
      !["DIRECTEUR", "SOUS_DIRECTEUR", "CHEF_ATELIER"].includes(
        membreActuel.role
      )
    ) {
      return;
    }

    let nouvelleValeur = entreprise.cuveActuelle;

    if (mode === "plein") {
      nouvelleValeur = entreprise.cuveMax;
    } else if (mode === "quantite") {
      const quantite = Math.max(0, Math.floor(quantiteDemandee));
      nouvelleValeur = Math.min(
        entreprise.cuveActuelle + quantite,
        entreprise.cuveMax
      );
    } else {
      return;
    }

    await prisma.entreprise.update({
      where: { id: entrepriseIdFromForm },
      data: {
        cuveActuelle: nouvelleValeur,
      },
    });

    revalidatePath(`/entreprise/${entrepriseIdFromForm}/gestion`);
    revalidatePath("/mon-entreprise");
  }

  async function acheterExtensionCuve(formData: FormData) {
    "use server";

    const cookieStore = await cookies();
    const steamId = cookieStore.get("steamId")?.value;

    if (!steamId) return;

    const entrepriseIdFromForm = Number(formData.get("entrepriseId"));

    if (!entrepriseIdFromForm || Number.isNaN(entrepriseIdFromForm)) return;

    const entreprise = await prisma.entreprise.findUnique({
      where: { id: entrepriseIdFromForm },
      include: {
        membres: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!entreprise) return;

    const membreActuel = entreprise.membres.find(
      (membre) => membre.user?.steamId === steamId
    );

    if (
      !membreActuel ||
      !["DIRECTEUR", "SOUS_DIRECTEUR", "CHEF_ATELIER"].includes(
        membreActuel.role
      )
    ) {
      return;
    }

    if (entreprise.cuveMax >= 50000) return;
    if (entreprise.argent < 20000) return;

    const nouveauMax = Math.min(entreprise.cuveMax + 5000, 50000);

    await prisma.entreprise.update({
      where: { id: entrepriseIdFromForm },
      data: {
        cuveMax: nouveauMax,
        argent: entreprise.argent - 20000,
      },
    });

    revalidatePath(`/entreprise/${entrepriseIdFromForm}/gestion`);
    revalidatePath("/mon-entreprise");
  }

  async function accepterCandidature(formData: FormData) {
    "use server";

    const cookieStore = await cookies();
    const steamId = cookieStore.get("steamId")?.value;

    if (!steamId) return;

    const candidatureId = Number(formData.get("candidatureId"));
    const entrepriseIdFromForm = Number(formData.get("entrepriseId"));

    if (!candidatureId || Number.isNaN(candidatureId)) return;
    if (!entrepriseIdFromForm || Number.isNaN(entrepriseIdFromForm)) return;

    const entreprise = await prisma.entreprise.findUnique({
      where: { id: entrepriseIdFromForm },
      include: {
        membres: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!entreprise) return;

    const membreActuel = entreprise.membres.find(
      (membre) => membre.user?.steamId === steamId
    );

    if (
      !membreActuel ||
      !["DIRECTEUR", "SOUS_DIRECTEUR", "CHEF_EQUIPE"].includes(
        membreActuel.role
      )
    ) {
      return;
    }

    const candidature = await prisma.entrepriseCandidature.findUnique({
      where: { id: candidatureId },
    });

    if (!candidature) return;
    if (candidature.entrepriseId !== entrepriseIdFromForm) return;
    if (candidature.statut !== "EN_ATTENTE") return;

    const membreExiste = await prisma.entrepriseMembre.findUnique({
      where: {
        userId: candidature.userId,
      },
    });

    if (!membreExiste) {
      await prisma.entrepriseMembre.create({
        data: {
          userId: candidature.userId,
          entrepriseId: entrepriseIdFromForm,
          role: "CHAUFFEUR",
        },
      });
    }

    await prisma.entrepriseCandidature.update({
      where: { id: candidatureId },
      data: {
        statut: "ACCEPTEE",
      },
    });

    revalidatePath(`/entreprise/${entrepriseIdFromForm}/gestion`);
    revalidatePath(`/entreprise/${entrepriseIdFromForm}`);
    revalidatePath("/mon-entreprise");
    revalidatePath("/societe");
  }

  async function refuserCandidature(formData: FormData) {
    "use server";

    const cookieStore = await cookies();
    const steamId = cookieStore.get("steamId")?.value;

    if (!steamId) return;

    const candidatureId = Number(formData.get("candidatureId"));
    const entrepriseIdFromForm = Number(formData.get("entrepriseId"));

    if (!candidatureId || Number.isNaN(candidatureId)) return;
    if (!entrepriseIdFromForm || Number.isNaN(entrepriseIdFromForm)) return;

    const entreprise = await prisma.entreprise.findUnique({
      where: { id: entrepriseIdFromForm },
      include: {
        membres: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!entreprise) return;

    const membreActuel = entreprise.membres.find(
      (membre) => membre.user?.steamId === steamId
    );

    if (
      !membreActuel ||
      !["DIRECTEUR", "SOUS_DIRECTEUR", "CHEF_EQUIPE"].includes(
        membreActuel.role
      )
    ) {
      return;
    }

    const candidature = await prisma.entrepriseCandidature.findUnique({
      where: { id: candidatureId },
    });

    if (!candidature) return;
    if (candidature.entrepriseId !== entrepriseIdFromForm) return;
    if (candidature.statut !== "EN_ATTENTE") return;

    await prisma.entrepriseCandidature.update({
      where: { id: candidatureId },
      data: {
        statut: "REFUSEE",
      },
    });

    revalidatePath(`/entreprise/${entrepriseIdFromForm}/gestion`);
    revalidatePath(`/entreprise/${entrepriseIdFromForm}`);
  }

  const argentSociete = entreprise.argent;
  const cuveMax = entreprise.cuveMax;
  const cuveActuelle = entreprise.cuveActuelle;
  const cuvePourcent = Math.max(
    0,
    Math.min(100, (cuveActuelle / cuveMax) * 100)
  );

  const prochaineExtension = cuveMax < 50000 ? cuveMax + 5000 : cuveMax;
  const extensionDisponible = cuveMax < 50000;
  const peutAcheterExtension = extensionDisponible && argentSociete >= 20000;

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
          background: "rgba(0, 0, 0, 0.60)",
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
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>
            Elite Routiers
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontWeight: "bold" }}>
              Bureau : {entreprise.nom}
            </span>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(255,255,255,0.08)",
                padding: "8px 14px",
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
              <span>
                {entreprise.recrutement
                  ? "Recrutement ouvert"
                  : "Recrutement fermé"}
              </span>
            </div>

            <Link href="/mon-entreprise" style={headerButtonStyle}>
              Retour
            </Link>
          </div>
        </header>

        <div
          style={{
            padding: "20px",
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: "20px",
            flex: 1,
          }}
        >
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div style={boxStyle}>
              <h2 style={{ marginTop: 0, marginBottom: "18px" }}>
                Informations entreprise
              </h2>

              <form
                action={updateEntreprise}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <input type="hidden" name="entrepriseId" value={entreprise.id} />

                <div
                  style={{
                    width: "100%",
                    minHeight: "210px",
                    borderRadius: "16px",
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: entreprise.banniere
                      ? `linear-gradient(rgba(0,0,0,0.20), rgba(0,0,0,0.45)), url('${entreprise.banniere}') center/cover no-repeat`
                      : "linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.45)), url('/truck.jpg') center/cover no-repeat",
                    display: "flex",
                    alignItems: "flex-end",
                    padding: "18px",
                    boxSizing: "border-box",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "22px", fontWeight: "bold" }}>
                      {entreprise.nom}
                    </div>
                    <div style={{ fontSize: "13px", opacity: 0.9 }}>
                      [{entreprise.abreviation}] • {formatJeu(entreprise.jeu)}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: "16px",
                    borderRadius: "14px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
                    Bannière de la société
                  </div>

                  <div style={{ fontSize: "14px", opacity: 0.92 }}>
                    Taille conseillée : <strong>1500 x 500 px</strong>
                  </div>
                  <div style={{ fontSize: "14px", opacity: 0.92 }}>
                    Ratio conseillé : <strong>3:1</strong>
                  </div>
                  <div style={{ fontSize: "14px", opacity: 0.92 }}>
                    Formats acceptés : <strong>JPG, PNG, WEBP</strong>
                  </div>
                  <div style={{ fontSize: "14px", opacity: 0.92 }}>
                    Poids maximum : <strong>4 Mo</strong>
                  </div>

                  <input
                    type="file"
                    name="banniereFile"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    style={{
                      ...inputStyle,
                      marginTop: "14px",
                      padding: "10px",
                    }}
                    disabled={!peutModifierInfos}
                  />

                  <div
                    style={{
                      marginTop: "10px",
                      fontSize: "13px",
                      opacity: 0.8,
                      lineHeight: 1.5,
                    }}
                  >
                    Choisis une nouvelle image seulement si tu veux remplacer la
                    bannière actuelle.
                  </div>
                </div>

                <div style={gridTwoStyle}>
                  <div>
                    <label style={labelStyle}>Nom</label>
                    <input
                      name="nom"
                      defaultValue={entreprise.nom}
                      style={inputStyle}
                      disabled={!peutModifierInfos}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Abréviation</label>
                    <input
                      name="abreviation"
                      defaultValue={entreprise.abreviation}
                      maxLength={3}
                      style={inputStyle}
                      disabled={!peutModifierInfos}
                    />
                  </div>

                  <div style={fullWidthStyle}>
                    <label style={labelStyle}>Jeu</label>

                    <div style={choiceGridStyle}>
                      {JEUX.map((jeu) => (
                        <label key={jeu.value} style={choiceCardStyle}>
                          <input
                            type="radio"
                            name="jeu"
                            value={jeu.value}
                            defaultChecked={entreprise.jeu === jeu.value}
                            disabled={!peutModifierInfos}
                          />
                          <span>{jeu.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={fullWidthStyle}>
                    <label style={labelStyle}>Type de transport</label>

                    <div style={choiceGridStyle}>
                      {TYPES_TRANSPORT.map((type) => (
                        <label key={type.value} style={choiceCardStyle}>
                          <input
                            type="radio"
                            name="typeTransport"
                            value={type.value}
                            defaultChecked={
                              entreprise.typeTransport === type.value
                            }
                            disabled={!peutModifierInfos}
                          />
                          <span>{type.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={infoCardStyle}>
                    <div style={labelStyle}>Directeur</div>
                    <div style={valueStyle}>
                      {entreprise.owner?.username || "Utilisateur Steam"}
                    </div>
                  </div>

                  <div style={infoCardStyle}>
                    <div style={labelStyle}>Membres</div>
                    <div style={valueStyle}>{entreprise._count.membres}</div>
                  </div>

                  <div style={infoCardStyle}>
                    <div style={labelStyle}>Jeu actuel</div>
                    <div style={valueStyle}>{formatJeu(entreprise.jeu)}</div>
                  </div>

                  <div style={infoCardStyle}>
                    <div style={labelStyle}>Transport actuel</div>
                    <div style={valueStyle}>
                      {formatTypeTransport(entreprise.typeTransport)}
                    </div>
                  </div>
                </div>

                {peutModifierInfos ? (
                  <button type="submit" style={btnPrimaryLarge}>
                    💾 Enregistrer les modifications
                  </button>
                ) : (
                  <div style={emptyCardStyle}>
                    Seuls le directeur et le sous-directeur peuvent modifier ces
                    informations.
                  </div>
                )}
              </form>

              {membreActuel.role === "DIRECTEUR" && (
                <button type="button" style={btnDeleteEntreprise}>
                  ❌ Supprimer l’entreprise
                </button>
              )}
            </div>

            <div style={boxStyle}>
              <h2 style={{ marginTop: 0, marginBottom: "18px" }}>Membres</h2>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  maxHeight: "560px",
                  overflowY: "auto",
                  paddingRight: "4px",
                }}
              >
                {entreprise.membres.length > 0 ? (
                  entreprise.membres.map((membre) => (
                    <div
                      key={membre.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        padding: "12px",
                        borderRadius: "10px",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          minWidth: "220px",
                        }}
                      >
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "999px",
                            overflow: "hidden",
                            background: "rgba(255,255,255,0.08)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            flexShrink: 0,
                          }}
                        >
                          {membre.user?.avatar ? (
                            <img
                              src={membre.user.avatar}
                              alt="Avatar Steam"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "12px",
                                opacity: 0.7,
                              }}
                            >
                              ?
                            </div>
                          )}
                        </div>

                        <div>
                          <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                            {membre.user?.username || "Utilisateur Steam"}
                          </div>

                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: "bold",
                              color:
                                membre.role === "DIRECTEUR"
                                  ? "#facc15"
                                  : membre.role === "SOUS_DIRECTEUR"
                                  ? "#60a5fa"
                                  : membre.role === "CHEF_EQUIPE"
                                  ? "#22c55e"
                                  : membre.role === "CHEF_ATELIER"
                                  ? "#f59e0b"
                                  : "#c084fc",
                            }}
                          >
                            {membre.role.replaceAll("_", " ")}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <button type="button" style={btnWarning}>
                          ⚠️ Avertissement
                        </button>

                        <button type="button" style={btnPrimary}>
                          🎖️ Rôle
                        </button>

                        <button type="button" style={btnDanger}>
                          ❌ Exclure
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={emptyCardStyle}>Aucun membre dans la société.</div>
                )}
              </div>
            </div>
          </section>

          <aside
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div style={boxStyle}>
              <h2 style={{ marginTop: 0, marginBottom: "18px" }}>Candidatures</h2>

              {entreprise.candidatures.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    maxHeight: "420px",
                    overflowY: "auto",
                    paddingRight: "4px",
                  }}
                >
                  {entreprise.candidatures.map((candidature) => (
                    <div
                      key={candidature.id}
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        borderRadius: "12px",
                        padding: "14px",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
                        {candidature.user?.username || "Utilisateur Steam"}
                      </div>

                      <div style={miniTextStyle}>
                        Âge : {candidature.age ?? "Non renseigné"}
                      </div>
                      <div style={miniTextStyle}>
                        Région : {candidature.region || "Non renseignée"}
                      </div>
                      <div style={miniTextStyle}>
                        Jeu : {formatJeu(candidature.jeuPrincipal)}
                      </div>
                      <div style={miniTextStyle}>
                        Expérience : {formatExperience(candidature.experience)}
                      </div>
                      <div style={miniTextStyle}>
                        Micro : {candidature.micro ? "Oui" : "Non"}
                      </div>
                      <div style={miniTextStyle}>
                        Disponibilités :{" "}
                        {candidature.disponibilites || "Non renseignées"}
                      </div>

                      <div style={{ marginTop: "10px" }}>
                        <div style={labelStyle}>Motivation</div>
                        <div style={textBlockStyle}>{candidature.motivation}</div>
                      </div>

                      {candidature.message && (
                        <div style={{ marginTop: "10px" }}>
                          <div style={labelStyle}>Message</div>
                          <div style={textBlockStyle}>{candidature.message}</div>
                        </div>
                      )}

                      {peutGererCandidatures ? (
                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                            marginTop: "14px",
                            flexWrap: "wrap",
                          }}
                        >
                          <form action={accepterCandidature}>
                            <input
                              type="hidden"
                              name="candidatureId"
                              value={candidature.id}
                            />
                            <input
                              type="hidden"
                              name="entrepriseId"
                              value={entreprise.id}
                            />
                            <button type="submit" style={btnAccept}>
                              ✅ Accepter
                            </button>
                          </form>

                          <form action={refuserCandidature}>
                            <input
                              type="hidden"
                              name="candidatureId"
                              value={candidature.id}
                            />
                            <input
                              type="hidden"
                              name="entrepriseId"
                              value={entreprise.id}
                            />
                            <button type="submit" style={btnDanger}>
                              ❌ Refuser
                            </button>
                          </form>
                        </div>
                      ) : (
                        <div style={{ ...miniTextStyle, marginTop: "12px" }}>
                          Tu n’as pas les droits pour gérer les candidatures.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={emptyCardStyle}>
                  Aucune candidature en attente pour le moment.
                </div>
              )}
            </div>

            <div style={boxStyle}>
              <h2 style={{ marginTop: 0, marginBottom: "18px" }}>
                Cuve de la société
              </h2>

              <div
                style={{
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  padding: "14px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  marginBottom: "14px",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    opacity: 0.8,
                    marginBottom: "6px",
                  }}
                >
                  Argent de la société
                </div>

                <div style={{ fontSize: "24px", fontWeight: "bold" }}>
                  {argentSociete.toLocaleString("fr-FR")} €
                </div>
              </div>

              <div
                style={{
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  padding: "14px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  marginBottom: "14px",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    opacity: 0.9,
                    marginBottom: "10px",
                  }}
                >
                  {cuveActuelle.toLocaleString("fr-FR")} L /{" "}
                  {cuveMax.toLocaleString("fr-FR")} L
                </div>

                <div
                  style={{
                    width: "100%",
                    height: "24px",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.10)",
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    style={{
                      width: `${cuvePourcent}%`,
                      height: "100%",
                      background:
                        "linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #22c55e 100%)",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "8px",
                    fontSize: "13px",
                    opacity: 0.8,
                  }}
                >
                  <span>0</span>
                  <span>{cuveMax.toLocaleString("fr-FR")}</span>
                </div>
              </div>

              <form
                action={remplirCuve}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                <input type="hidden" name="entrepriseId" value={entreprise.id} />
                <input type="hidden" name="mode" value="plein" />

                {peutGererCuve ? (
                  <button type="submit" style={btnPrimaryLarge}>
                    Remplir la cuve à fond
                  </button>
                ) : (
                  <button
                    type="button"
                    style={{
                      ...btnPrimaryLarge,
                      opacity: 0.5,
                      cursor: "not-allowed",
                    }}
                    disabled
                  >
                    Remplir la cuve à fond
                  </button>
                )}
              </form>

              <form
                action={remplirCuve}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                <input type="hidden" name="entrepriseId" value={entreprise.id} />
                <input type="hidden" name="mode" value="quantite" />

                <label style={labelStyle}>Ajouter une quantité</label>
                <input
                  type="number"
                  name="quantite"
                  min={1}
                  max={cuveMax - cuveActuelle}
                  placeholder="Exemple : 500"
                  style={inputStyle}
                  disabled={!peutGererCuve}
                />

                {peutGererCuve ? (
                  <button type="submit" style={btnPrimaryLarge}>
                    Ajouter la quantité
                  </button>
                ) : (
                  <button
                    type="button"
                    style={{
                      ...btnPrimaryLarge,
                      opacity: 0.5,
                      cursor: "not-allowed",
                    }}
                    disabled
                  >
                    Ajouter la quantité
                  </button>
                )}
              </form>

              <form
                action={acheterExtensionCuve}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <input type="hidden" name="entrepriseId" value={entreprise.id} />

                {peutGererCuve && peutAcheterExtension ? (
                  <button type="submit" style={btnDarkLarge}>
                    Acheter extension +5000 L (
                    {prochaineExtension.toLocaleString("fr-FR")} L) - 20 000 €
                  </button>
                ) : (
                  <button
                    type="button"
                    style={{
                      ...btnDarkLarge,
                      opacity: 0.5,
                      cursor: "not-allowed",
                    }}
                    disabled
                  >
                    {cuveMax >= 50000
                      ? "Capacité maximale atteinte"
                      : argentSociete < 20000
                      ? "Pas assez d’argent pour l’extension"
                      : "Extension indisponible"}
                  </button>
                )}
              </form>
            </div>

            <div style={boxStyle}>
              <h2 style={{ marginTop: 0, marginBottom: "18px" }}>Recrutement</h2>

              <form
                action={updateRecrutement}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <input type="hidden" name="entrepriseId" value={entreprise.id} />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      background: entreprise.recrutement
                        ? "rgba(34,197,94,0.18)"
                        : "rgba(255,255,255,0.08)",
                      border: entreprise.recrutement
                        ? "1px solid rgba(34,197,94,0.45)"
                        : "1px solid rgba(255,255,255,0.10)",
                      borderRadius: "10px",
                      padding: "12px",
                      cursor: peutModifierInfos ? "pointer" : "default",
                      fontWeight: "bold",
                      opacity: peutModifierInfos ? 1 : 0.7,
                    }}
                  >
                    <input
                      type="radio"
                      name="recrutement"
                      value="true"
                      defaultChecked={entreprise.recrutement === true}
                      disabled={!peutModifierInfos}
                    />
                    <span>Ouvert</span>
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      background:
                        entreprise.recrutement === false
                          ? "rgba(239,68,68,0.18)"
                          : "rgba(255,255,255,0.08)",
                      border:
                        entreprise.recrutement === false
                          ? "1px solid rgba(239,68,68,0.45)"
                          : "1px solid rgba(255,255,255,0.10)",
                      borderRadius: "10px",
                      padding: "12px",
                      cursor: peutModifierInfos ? "pointer" : "default",
                      fontWeight: "bold",
                      opacity: peutModifierInfos ? 1 : 0.7,
                    }}
                  >
                    <input
                      type="radio"
                      name="recrutement"
                      value="false"
                      defaultChecked={entreprise.recrutement === false}
                      disabled={!peutModifierInfos}
                    />
                    <span>Fermé</span>
                  </label>
                </div>

                <div
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                    padding: "14px",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      opacity: 0.8,
                      marginBottom: "6px",
                    }}
                  >
                    Statut actuel
                  </div>

                  <div style={{ fontWeight: "bold", fontSize: "16px" }}>
                    {entreprise.recrutement
                      ? "Recrutement ouvert"
                      : "Recrutement fermé"}
                  </div>
                </div>

                {peutModifierInfos ? (
                  <button type="submit" style={btnPrimaryLarge}>
                    💾 Enregistrer le recrutement
                  </button>
                ) : (
                  <div style={emptyCardStyle}>
                    Seuls le directeur et le sous-directeur peuvent modifier le
                    recrutement.
                  </div>
                )}
              </form>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

const boxStyle = {
  background: "rgba(0, 0, 0, 0.45)",
  borderRadius: "16px",
  padding: "20px",
  backdropFilter: "blur(6px)",
  boxShadow: "0 0 20px rgba(0,0,0,0.4)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const gridTwoStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "14px",
};

const fullWidthStyle = {
  gridColumn: "1 / -1",
};

const infoCardStyle = {
  background: "rgba(255,255,255,0.08)",
  borderRadius: "12px",
  padding: "14px",
  border: "1px solid rgba(255,255,255,0.08)",
};

const labelStyle = {
  display: "block",
  fontSize: "13px",
  opacity: 0.8,
  marginBottom: "6px",
};

const valueStyle = {
  fontWeight: "bold",
  fontSize: "16px",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  outline: "none",
  boxSizing: "border-box" as const,
};

const choiceGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: "10px",
};

const choiceCardStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "10px",
  padding: "12px",
  cursor: "pointer",
  fontWeight: "bold",
};

const emptyCardStyle = {
  background: "rgba(255,255,255,0.08)",
  borderRadius: "12px",
  padding: "14px",
  border: "1px solid rgba(255,255,255,0.08)",
  lineHeight: 1.6,
  opacity: 0.9,
};

const headerButtonStyle = {
  padding: "10px 16px",
  background: "#171a21",
  borderRadius: "10px",
  color: "white",
  textDecoration: "none",
  fontWeight: "bold",
  border: "1px solid rgba(255,255,255,0.12)",
};

const btnPrimary = {
  padding: "6px 10px",
  borderRadius: "6px",
  border: "none",
  background: "#2563eb",
  color: "white",
  cursor: "pointer",
  fontWeight: "bold",
};

const btnWarning = {
  padding: "6px 10px",
  borderRadius: "6px",
  border: "none",
  background: "#f59e0b",
  color: "black",
  cursor: "pointer",
  fontWeight: "bold",
};

const btnDanger = {
  padding: "6px 10px",
  borderRadius: "6px",
  border: "none",
  background: "#ef4444",
  color: "white",
  cursor: "pointer",
  fontWeight: "bold",
};

const btnPrimaryLarge = {
  padding: "12px 16px",
  borderRadius: "10px",
  border: "none",
  background: "#2563eb",
  color: "white",
  cursor: "pointer",
  fontWeight: "bold",
};

const btnDarkLarge = {
  padding: "12px 16px",
  borderRadius: "10px",
  border: "none",
  background: "#171a21",
  color: "white",
  cursor: "pointer",
  fontWeight: "bold",
};

const btnDeleteEntreprise = {
  marginTop: "20px",
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  background: "#dc2626",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
  width: "100%",
};

const btnAccept = {
  padding: "8px 12px",
  borderRadius: "8px",
  border: "none",
  background: "#22c55e",
  color: "white",
  cursor: "pointer",
  fontWeight: "bold",
};

const miniTextStyle = {
  fontSize: "13px",
  opacity: 0.9,
  marginBottom: "4px",
};

const textBlockStyle = {
  background: "rgba(0,0,0,0.25)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  padding: "10px",
  lineHeight: 1.5,
  whiteSpace: "pre-wrap" as const,
};