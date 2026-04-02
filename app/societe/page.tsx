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
          }}
        >
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>
            Elite Routiers
          </div>

          <span style={{ fontWeight: "bold" }}>
            Entreprises : {entreprises.length}
          </span>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "260px 1fr",
            gap: "20px",
            padding: "20px",
            flex: 1,
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
                marginBottom: "20px",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <h2 style={{ margin: 0 }}>Entreprises</h2>

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

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
              }}
            >
              {entreprises.map((entreprise) => (
                <div
                  key={entreprise.id}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    style={{
                      height: "100px",
                      backgroundImage: `url('${
                        entreprise.banniere || "/truck.jpg"
                      }')`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />

                  <div style={{ padding: "12px" }}>
                    <div style={{ fontWeight: "bold" }}>
                      {entreprise.nom}
                    </div>

                    <div
                      style={{
                        fontSize: "13px",
                        opacity: 0.8,
                        marginBottom: "10px",
                      }}
                    >
                      [{entreprise.abreviation}]
                    </div>

                    <Link
                      href={`/entreprise/${entreprise.id}`}
                      style={{
                        display: "block",
                        textAlign: "center",
                        padding: "10px",
                        background: "#171a21",
                        borderRadius: "8px",
                        color: "white",
                        textDecoration: "none",
                        fontWeight: "bold",
                      }}
                    >
                      Voir entreprise
                    </Link>
                  </div>
                </div>
              ))}

              {entreprises.length === 0 && (
                <div>Aucune entreprise pour le moment.</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}