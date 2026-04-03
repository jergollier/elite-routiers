import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

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

  async function updateEntreprise(formData: FormData) {
    "use server";

    const cookieStore = await cookies();
    const steamId = cookieStore.get("steamId")?.value;

    if (!steamId) {
      return;
    }

    const entrepriseIdFromForm = Number(formData.get("entrepriseId"));
    if (!entrepriseIdFromForm || Number.isNaN(entrepriseIdFromForm)) {
      return;
    }

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

    if (!entreprise) {
      return;
    }

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

    if (!nom || !abreviationBrute || !jeu || !typeTransport) {
      return;
    }

    const abreviation = abreviationBrute.toUpperCase().slice(0, 3);

    if (!["ETS2", "ATS"].includes(jeu)) {
      return;
    }

    await prisma.entreprise.update({
      where: { id: entrepriseIdFromForm },
      data: {
        nom,
        abreviation,
        jeu,
        typeTransport,
      },
    });

    revalidatePath(`/entreprise/${entrepriseIdFromForm}/gestion`);
    revalidatePath("/mon-entreprise");
    revalidatePath("/societe");
    revalidatePath(`/entreprise/${entrepriseIdFromForm}`);
  }

  const argentSociete = 125000;
  const cuveMax = 10000;
  const cuveActuelle = 6200;
  const cuvePourcent = Math.max(
    0,
    Math.min(100, (cuveActuelle / cuveMax) * 100)
  );

  const prochaineExtension = cuveMax < 50000 ? cuveMax + 5000 : cuveMax;
  const extensionDisponible = cuveMax < 50000;

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

                  <div>
                    <label style={labelStyle}>Jeu</label>
                    <select
                      name="jeu"
                      defaultValue={entreprise.jeu}
                      style={inputStyle}
                      disabled={!peutModifierInfos}
                    >
                      <option value="ETS2">ETS2</option>
                      <option value="ATS">ATS</option>
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Type de transport</label>
                    <input
                      name="typeTransport"
                      defaultValue={entreprise.typeTransport}
                      style={inputStyle}
                      disabled={!peutModifierInfos}
                    />
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

              <div style={emptyCardStyle}>
                Aucune candidature affichée pour le moment.
                <br />
                On branchera ici les candidatures à accepter ou refuser.
              </div>
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

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <button type="button" style={btnPrimaryLarge}>
                  Remplir la cuve
                </button>

                {extensionDisponible ? (
                  <button type="button" style={btnDarkLarge}>
                    Acheter extension +5000 L ({prochaineExtension.toLocaleString("fr-FR")} L) - 20 000 €
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
                    Capacité maximale atteinte
                  </button>
                )}
              </div>
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