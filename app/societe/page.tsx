import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function SocietePage() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) {
    redirect("/");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundImage: "url('/truck.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <a
        href="/societe/create"
        style={{
          padding: "20px 30px",
          background: "#171a21",
          borderRadius: "10px",
          color: "white",
          fontWeight: "bold",
          textDecoration: "none",
          fontSize: "20px",
        }}
      >
        Créer une entreprise
      </a>
    </main>
  );
}