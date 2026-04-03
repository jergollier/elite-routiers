import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import Menu from "@/app/components/Menu";
import { prisma } from "@/lib/prisma";

const MARQUES = [
  { value: "RENAULT", label: "Renault" },
  { value: "SCANIA", label: "Scania" },
  { value: "VOLVO", label: "Volvo" },
  { value: "MAN", label: "MAN" },
  { value: "DAF", label: "DAF" },
  { value: "MERCEDES", label: "Mercedes-Benz" },
  { value: "IVECO", label: "Iveco" },
  { value: "KENWORTH", label: "Kenworth" },
  { value: "PETERBILT", label: "Peterbilt" },
];

const STATUTS = [
  { value: "DISPONIBLE", label: "Disponible" },
  { value: "EN_MISSION", label: "En mission" },
  { value: "EN_MAINTENANCE", label: "En maintenance" },
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
    monMembership.role === "DIRECTEUR" ||
    monMembership.role === "SOUS_DIRECTEUR";

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
      membership.role === "DIRECTEUR" ||
      membership.role === "SOUS_DIRECTEUR";

    if (!autorise) {
      redirect("/camions");
    }

    const marque = String(formData.get("marque") || "").trim();
    const modele = String(formData.get("modele") || "").trim();
    const image = String(formData.get("image") || "").trim();
    const positionActuelle = String(formData.get("positionActuelle") || "").trim();
    const statut = String(formData.get("statut") || "DISPONIBLE").trim();

    const kilometrage = toNumber(formData.get("kilometrage"), 0);
    const etat = toNumber(formData.get("etat"), 100);
    const carburant = toNumber(formData.get("carburant"), 100);
    const vidangeRestante = toNumber(formData.get("vidangeRestante"), 60000);
    const revisionRestante = toNumber(formData.get("revisionRestante"), 120000);

    if (!marque || !modele) {
      redirect("/camions/acheter");
    }

    await prisma.camion.create({
      data: {
        entrepriseId: membership.entrepriseId,
        marque,
        modele,
        image: image || "/truck.jpg",
        kilometrage: Math.max(0, kilometrage),
        etat: Math.max(0, Math.min(100, etat)),
        carburant: Math.max(0, Math.min(100, carburant)),
        positionActuelle: positionActuelle || null,
        statut,
        vidangeRestante: Math.max(0, vidangeRestante),
        revisionRestante: Math.max(0, revisionRestante),
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
                  Saisie manuelle du camion pour l’entreprise {entreprise.nom}
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
                        <select name="marque" defaultValue="SCANIA" style={inputStyle}>
                          {MARQUES.map((marque) => (
                            <option key={marque.value} value={marque.value}>
                              {marque.label}
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
                        <label style={labelInputStyle}>Photo du camion (URL)</label>
                        <input
                          name="image"
                          type="text"
                          placeholder="https://..."
                          style={inputStyle}
                        />
                      </div>

                      <div style={fieldGroupStyle}>
                        <label style={labelInputStyle}>Statut</label>
                        <select
                          name="statut"
                          defaultValue="DISPONIBLE"
                          style={inputStyle}
                        >
                          {STATUTS.map((statut) => (
                            <option key={statut.value} value={statut.value}>
                              {statut.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={fieldGroupStyle}>
                        <label style={labelInputStyle}>Kilométrage</label>
                        <input
                          name="kilometrage"
                          type="number"
                          min="0"
                          defaultValue="0"
                          style={inputStyle}
                        />
                      </div>

                      <div style={fieldGroupStyle}>
                        <label style={labelInputStyle}>État (%)</label>
                        <input
                          name="etat"
                          type="number"
                          min="0"
                          max="100"
                          defaultValue="100"
                          style={inputStyle}
                        />
                      </div>

                      <div style={fieldGroupStyle}>
                        <label style={labelInputStyle}>Carburant (%)</label>
                        <input
                          name="carburant"
                          type="number"
                          min="0"
                          max="100"
                          defaultValue="100"
                          style={inputStyle}
                        />
                      </div>

                      <div style={fieldGroupStyle}>
                        <label style={labelInputStyle}>Position actuelle</label>
                        <input
                          name="positionActuelle"
                          type="text"
                          placeholder="Exemple : Lyon"
                          style={inputStyle}
                        />
                      </div>

                      <div style={fieldGroupStyle}>
                        <label style={labelInputStyle}>Vidange restante (km)</label>
                        <input
                          name="vidangeRestante"
                          type="number"
                          min="0"
                          defaultValue="60000"
                          style={inputStyle}
                        />
                      </div>

                      <div style={fieldGroupStyle}>
                        <label style={labelInputStyle}>Révision restante (km)</label>
                        <input
                          name="revisionRestante"
                          type="number"
                          min="0"
                          defaultValue="120000"
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
                    Ici, le responsable remplit manuellement tous les détails du
                    camion avant l’ajout dans le parc.
                  </p>

                  <p
                    style={{
                      ...smallTextStyle,
                      marginTop: "12px",
                    }}
                  >
                    La photo se met pour l’instant avec un lien image. Si tu veux,
                    juste après je te fais la vraie version avec upload depuis le PC.
                  </p>
                </div>

                <div style={boxStyle}>
                  <h2 style={{ marginTop: 0, marginBottom: "12px" }}>
                    Entreprise
                  </h2>

                  <div style={infoRowStyle}>
                    <span style={labelStyle}>Nom</span>
                    <span style={valueStyle}>{entreprise.nom}</span>
                  </div>

                  <div style={infoRowStyle}>
                    <span style={labelStyle}>Ajout autorisé</span>
                    <span style={valueStyle}>
                      {peutAjouterCamion ? "Oui" : "Non"}
                    </span>
                  </div>
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