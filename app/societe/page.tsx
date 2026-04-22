export const dynamic = "force-dynamic";

import Link from "next/link";

export default function SocietePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      <h1>Elite Routiers</h1>

      <p>✅ Le site fonctionne</p>

      <Link
        href="/"
        style={{
          padding: "10px 20px",
          background: "#2563eb",
          borderRadius: "10px",
          color: "white",
          textDecoration: "none",
        }}
      >
        Retour accueil
      </Link>
    </main>
  );
}