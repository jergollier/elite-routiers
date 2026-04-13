import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ParkingPage() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { steamId },
    include: {
      camionsPerso: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!user) {
    redirect("/");
  }

  const prixPlace = 100000;
  const placesTotales = user.parkingPlaces ?? 0;
  const placesUtilisees = user.camionsPerso.length;
  const placesLibres = placesTotales - placesUtilisees;

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "30px",
        color: "white",
      }}
    >
      <h1 style={{ fontSize: "32px", marginBottom: "20px" }}>
        Parking chauffeur
      </h1>

      <div
        style={{
          background: "rgba(0,0,0,0.65)",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "30px",
          maxWidth: "700px",
        }}
      >
        <p>
          <strong>Argent :</strong> {user.argent.toLocaleString("fr-FR")} €
        </p>
        <p>
          <strong>Places achetées :</strong> {placesTotales} / 5
        </p>
        <p>
          <strong>Places utilisées :</strong> {placesUtilisees}
        </p>
        <p>
          <strong>Places libres :</strong> {placesLibres}
        </p>

        {placesTotales < 5 && (
          <form
            action="/api/parking/acheter"
            method="POST"
            style={{ marginTop: "20px" }}
          >
            <button
              type="submit"
              style={{
                padding: "12px 18px",
                borderRadius: "10px",
                border: "none",
                background: "#22c55e",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Acheter une place ({prixPlace.toLocaleString("fr-FR")} €)
            </button>
          </form>
        )}

        {placesTotales >= 5 && (
          <p style={{ marginTop: "15px", color: "#f87171" }}>
            Tu as atteint le maximum de 5 places.
          </p>
        )}

        {user.argent < prixPlace && placesTotales < 5 && (
          <p style={{ marginTop: "15px", color: "#facc15" }}>
            Tu n’as pas assez d’argent pour acheter une place.
          </p>
        )}
      </div>

      <h2 style={{ fontSize: "24px", marginBottom: "15px" }}>
        Mes camions personnels
      </h2>

      {user.camionsPerso.length === 0 ? (
        <div
          style={{
            background: "rgba(0,0,0,0.65)",
            borderRadius: "16px",
            padding: "20px",
            maxWidth: "700px",
          }}
        >
          <p>Tu n’as encore aucun camion personnel.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "15px", maxWidth: "900px" }}>
          {user.camionsPerso.map((camion) => (
            <div
              key={camion.id}
              style={{
                background: "rgba(0,0,0,0.65)",
                borderRadius: "16px",
                padding: "20px",
              }}
            >
              <p>
                <strong>Marque :</strong> {camion.marque}
              </p>
              <p>
                <strong>Modèle :</strong> {camion.modele}
              </p>
              <p>
                <strong>Statut :</strong> {camion.statut}
              </p>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: "30px" }}>
        <Link
          href="/camion/acheter"
          style={{
            display: "inline-block",
            padding: "12px 18px",
            borderRadius: "10px",
            background: "#2563eb",
            color: "white",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Aller acheter un camion
        </Link>
      </div>
    </main>
  );
}