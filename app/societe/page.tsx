export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Menu from "@/app/components/Menu";

export default async function SocietePage() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) {
    redirect("/");
  }

  const entreprises = await prisma.entreprise.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          membres: true,
        },
      },
    },
  });

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
          background: "rgba(0, 0, 0, 0.55)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          gap: "20px",
          padding: "20px",
        }}
      >
        <Menu />

        <section
          style={{
            background: "rgba(0, 0, 0, 0.45)",
            borderRadius: "16px",
            padding: "20px",
            backdropFilter: "blur(6px)",
            boxShadow: "0 0 20px rgba(0,0,0,0.4)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "32px" }}>Entreprises</h2>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Link
                href="/societe/classement"
                style={{
                  padding: "10px 16px",
                  background: "#2563eb",
                  borderRadius: "10px",
                  color: "white",
                  textDecoration: "none",
                  fontWeight: "bold",
                }}
              >
                Classement
              </Link>

              <Link
                href="/societe/create"
                style={{
                  padding: "10px 16px",
                  background: "#171a21",
                  borderRadius: "10px",
                  color: "white",
                  textDecoration: "none",
                  fontWeight: "bold",
                }}
              >
                + Créer une entreprise
              </Link>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: "16px",
            }}
          >
            {entreprises.map((entreprise) => (
              <div
                key={entreprise.id}
                style={{
                  background: "rgba(15,15,15,0.78)",
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: "255px",
                }}
              >
                <div
                  style={{
                    height: "95px",
                    backgroundImage: `url('${entreprise.banniere || "/truck.jpg"}')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />

                <div
                  style={{
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: "17px",
                      marginBottom: "4px",
                    }}
                  >
                    {entreprise.nom}
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      opacity: 0.85,
                      marginBottom: "10px",
                    }}
                  >
                    [{entreprise.abreviation}]
                  </div>

                  <div
                    style={{
                      fontSize: "13px",
                      opacity: 0.9,
                      marginBottom: "14px",
                    }}
                  >
                    🚛 Chauffeurs : {entreprise._count.membres}
                  </div>

                  <div
                    style={{
                      marginTop: "auto",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <Link
                      href={`/entreprise/${entreprise.id}`}
                      style={{
                        display: "block",
                        textAlign: "center",
                        padding: "9px",
                        background: "#171a21",
                        borderRadius: "8px",
                        color: "white",
                        textDecoration: "none",
                        fontWeight: "bold",
                        fontSize: "13px",
                      }}
                    >
                      Voir
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {entreprises.length === 0 && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  padding: "20px",
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: "12px",
                }}
              >
                Aucune entreprise pour le moment.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}