export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Menu from "@/app/components/Menu";
import { prisma } from "@/lib/prisma";

function formatMarque(marque: string) {
  return marque
    .replace("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export default async function MarcheOccasionPage() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) {
    redirect("/");
  }

  const camions = await prisma.camion.findMany({
    where: {
      aVendre: true,
      actif: true,
    },
    include: {
      entreprise: true,
    },
    orderBy: {
      misEnVenteAt: "desc",
    },
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundImage: "url('/truck.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "white",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.68)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
          gap: "20px",
          padding: "20px",
        }}
      >
        <Menu />

        <section
          style={{
            flex: 1,
            background: "rgba(0,0,0,0.45)",
            borderRadius: "18px",
            padding: "24px",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1 style={{ margin: 0, fontSize: "34px" }}>
                Marché occasion
              </h1>
              <p style={{ opacity: 0.8 }}>
                Camions mis en vente par les entreprises.
              </p>
            </div>

            <Link href="/societe" style={backButton}>
              ← Retour accueil
            </Link>
          </div>

          {camions.length === 0 ? (
            <div
              style={{
                padding: "30px",
                borderRadius: "14px",
                background: "rgba(255,255,255,0.06)",
                textAlign: "center",
                opacity: 0.85,
              }}
            >
              Aucun camion en vente pour le moment.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: "16px",
              }}
            >
              {camions.map((camion) => (
                <article
                  key={camion.id}
                  style={{
                    background: "rgba(15,15,15,0.82)",
                    borderRadius: "16px",
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    style={{
                      height: "140px",
                      backgroundImage: `url('${camion.image || "/truck.jpg"}')`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />

                  <div style={{ padding: "14px" }}>
                    <h2 style={{ margin: 0, fontSize: "20px" }}>
                      {formatMarque(camion.marque)} {camion.modele}
                    </h2>

                    <p style={{ opacity: 0.8, fontSize: "13px" }}>
                      Vendu par : {camion.entreprise?.nom ?? "Entreprise"}
                    </p>

                    <div style={lineStyle}>
                      <span>Kilométrage</span>
                      <strong>{camion.kilometrage.toLocaleString("fr-FR")} km</strong>
                    </div>

                    <div style={lineStyle}>
                      <span>État</span>
                      <strong>{camion.etat}%</strong>
                    </div>

                    <div style={priceStyle}>
                      {(camion.prixVente ?? 0).toLocaleString("fr-FR")} €
                    </div>

                    <form action="/api/camions/acheter" method="POST">
                      <input type="hidden" name="camionId" value={camion.id} />

                      <button type="submit" style={buyButton}>
                        Acheter ce camion
                      </button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const backButton = {
  padding: "10px 14px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  textDecoration: "none",
  fontWeight: "bold",
};

const lineStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
  marginTop: "10px",
  fontSize: "14px",
};

const priceStyle = {
  marginTop: "16px",
  marginBottom: "12px",
  fontSize: "24px",
  fontWeight: "bold",
  color: "#fbbf24",
};

const buyButton = {
  width: "100%",
  padding: "12px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
};