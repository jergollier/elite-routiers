"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function TackyConnectContent() {
  const params = useSearchParams();
  const requestId = params.get("requestId");
  const code = params.get("code");

  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    try {
      setLoading(true);
      setMessage(null);

      const res = await fetch("/api/tacky/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          code,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error ?? "Erreur");
        return;
      }

      setMessage("Tacky lié avec succès. Vous pouvez retourner sur le client.");
    } catch {
      setMessage("Erreur serveur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 40, color: "white", background: "#111", minHeight: "100vh" }}>
      <h1>Connexion Tacky Elite Routiers</h1>
      <p>Reliez votre tacky à votre compte du site.</p>
      <p>
        Code appareil : <strong>{code ?? "inconnu"}</strong>
      </p>

      <button
        onClick={handleConnect}
        disabled={!requestId || !code || loading}
        style={{
          padding: "10px 16px",
          background: "#cc8700",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        {loading ? "Connexion..." : "Lier mon tacky"}
      </button>

      {message && <p style={{ marginTop: 20 }}>{message}</p>}
    </div>
  );
}

export default function TackyConnectPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "white", background: "#111", minHeight: "100vh" }}>Chargement...</div>}>
      <TackyConnectContent />
    </Suspense>
  );
}