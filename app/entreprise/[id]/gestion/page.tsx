import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type Props = {
  params: {
    id: string;
  };
};

export default async function GestionEntreprise({ params }: Props) {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) redirect("/");

  const entrepriseId = Number(params.id);
  if (!entrepriseId) notFound();

  const entreprise = await prisma.entreprise.findUnique({
    where: { id: entrepriseId },
    include: {
      membres: {
        include: {
          user: true,
        },
      },
      _count: {
        select: {
          membres: true,
        },
      },
    },
  });

  if (!entreprise) notFound();

  // 🔒 Vérifier le rôle
  const membre = entreprise.membres.find(
    (m) => m.user.steamId === steamId
  );

  if (!membre) redirect("/societe");

  const rolesAutorises = [
    "DIRECTEUR",
    "SOUS_DIRECTEUR",
    "CHEF_EQUIPE",
    "CHEF_ATELIER",
  ];

  if (!rolesAutorises.includes(membre.role)) {
    redirect("/societe");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundImage: "url('/truck.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "white",
        padding: "20px",
      }}
    >
      <h1 style={{ marginBottom: "20px" }}>
        Gestion - {entreprise.nom}
      </h1>

      {/* INFOS */}
      <div style={box}>
        <h2>Infos entreprise</h2>
        <p><b>Nom :</b> {entreprise.nom}</p>
        <p><b>Abréviation :</b> [{entreprise.abreviation}]</p>
        <p>
          <b>Recrutement :</b>{" "}
          {entreprise.recrutement ? "Ouvert" : "Fermé"}
        </p>
      </div>

      {/* MEMBRES */}
      <div style={box}>
        <h2>Membres</h2>

        {entreprise.membres.map((m) => (
          <div key={m.id} style={ligne}>
            <span>{m.user.username || "Steam User"}</span>
            <span>{m.role}</span>
          </div>
        ))}
      </div>

      {/* STATS */}
      <div style={box}>
        <h2>Organisation</h2>
        <p><b>Total membres :</b> {entreprise._count.membres}</p>
        <p>
          <b>Recrutement :</b>{" "}
          {entreprise.recrutement ? "Actif" : "Fermé"}
        </p>
      </div>
    </main>
  );
}

const box = {
  background: "rgba(0,0,0,0.6)",
  padding: "20px",
  borderRadius: "12px",
  marginBottom: "20px",
};

const ligne = {
  display: "flex",
  justifyContent: "space-between",
  padding: "8px 0",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
};