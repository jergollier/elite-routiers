import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function MonEntreprisePage() {
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
          entreprise: {
            include: {
              membres: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user || user.memberships.length === 0) {
    redirect("/societe");
  }

  const membership = user.memberships[0];
  const entreprise = membership.entreprise as any;

  // FAKE DATA pour l’instant
  const argent = 125000;
  const cuveMax = 10000;
  const cuve = 6200;
  const pourcent = (cuve / cuveMax) * 100;

  const livraisons = [
    { id: 1, chauffeur: "RoutierMax", trajet: "Lyon → Marseille", gain: "12 500 €" },
    { id: 2, chauffeur: "Pierre_ETS2", trajet: "Paris → Lille", gain: "8 200 €" },
    { id: 3, chauffeur: "Camion59", trajet: "Bordeaux → Toulouse", gain: "6 900 €" },
  ];

  return (
    <main style={{ minHeight: "100vh", backgroundImage: "url('/truck.jpg')", backgroundSize: "cover" }}>
      <div style={{ background: "rgba(0,0,0,0.6)", minHeight: "100vh" }}>

        {/* HEADER */}
        <div style={{ padding: "20px", fontWeight: "bold" }}>
          {entreprise.nom} • {membership.role}
        </div>

        {/* BANNIERE + ARGENT */}
        <div style={{ padding: "20px" }}>
          <div
            style={{
              height: "200px",
              borderRadius: "12px",
              backgroundImage: `url('${entreprise.banniere || "/truck.jpg"}')`,
              backgroundSize: "cover",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "end",
              padding: "20px",
            }}
          >
            <h1>{entreprise.nom}</h1>
            <div style={{ fontSize: "24px", fontWeight: "bold" }}>
              {argent.toLocaleString()} €
            </div>
          </div>
        </div>

        {/* GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "250px 1fr 300px", gap: "20px", padding: "20px" }}>

          {/* MENU */}
          <div style={card}>
            <h3>Menu</h3>
            <Link href="/societe" style={btn}>Accueil</Link>
            <Link href="/mon-entreprise" style={btn}>Mon entreprise</Link>
            <Link href="/societe/create" style={btn}>Créer une entreprise</Link>
            <button style={btn}>Finance</button>
            <button style={btn}>Camion</button>
          </div>

          {/* LIVRAISONS */}
          <div style={card}>
            <h3>Livraisons</h3>

            {livraisons.map((l) => (
              <div key={l.id} style={box}>
                <b>{l.chauffeur}</b> • {l.trajet} • {l.gain}
              </div>
            ))}
          </div>

          {/* DROITE */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* CHAUFFEURS */}
            <div style={card}>
              <h3>Chauffeurs</h3>

              <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
                {entreprise.membres?.length > 0 ? (
                  entreprise.membres.map((membre: any) => (
                    <div key={membre.id} style={box}>
                      <div style={{ fontWeight: "bold" }}>
                        {membre.user?.username || "Utilisateur Steam"}
                      </div>
                      <div>{membre.role.replaceAll("_", " ")}</div>
                    </div>
                  ))
                ) : (
                  <div>Aucun chauffeur</div>
                )}
              </div>
            </div>

            {/* CUVE */}
            <div style={card}>
              <h3>Cuve</h3>

              <div>{cuve} / {cuveMax}</div>

              <div style={{
                height: "20px",
                background: "#333",
                borderRadius: "10px",
                overflow: "hidden"
              }}>
                <div style={{
                  width: `${pourcent}%`,
                  height: "100%",
                  background: "green"
                }} />
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}

const card = {
  background: "rgba(0,0,0,0.5)",
  padding: "15px",
  borderRadius: "12px",
};

const box = {
  background: "rgba(255,255,255,0.1)",
  padding: "10px",
  borderRadius: "10px",
};

const btn = {
  display: "block",
  marginBottom: "10px",
  padding: "10px",
  background: "#222",
  borderRadius: "8px",
  color: "white",
  textDecoration: "none",
};