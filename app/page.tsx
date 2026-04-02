import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  console.log("PAGE / steamId =", steamId);

  if (steamId) {
    redirect("/societe");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundImage: "url('/truck.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
        padding: "20px",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0, 0, 0, 0.25)",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "rgba(0, 0, 0, 0.45)",
          backdropFilter: "blur(4px)",
          padding: "30px",
          borderRadius: "16px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          zIndex: 1,
          boxShadow: "0 0 20px rgba(0, 0, 0, 0.8)",
        }}
      >
        <a
          href="/api/steam"
          style={{
            padding: "14px 20px",
            borderRadius: "8px",
            backgroundColor: "#171a21",
            color: "white",
            textDecoration: "none",
            fontWeight: "bold",
            textAlign: "center",
            width: "100%",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
          }}
        >
          Se connecter avec Steam
        </a>
      </div>
    </main>
  );
}