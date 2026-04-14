"use client";

import { useState } from "react";

export default function TackyConnectPage() {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/tacky/create", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erreur de connexion");
        return;
      }

      setToken(data.token);
    } catch {
      setError("Erreur serveur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 40, color: "white", background: "#111", minHeight: "100vh" }}>
      <h1>Connexion Tacky Elite Routiers</h1>
      <p>Reliez votre tacky à votre compte du site.</p>

      <button
        onClick={handleConnect}
        style={{
          padding: "10px 16px",
          background: "#cc8700",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: "bold",
        }}
        disabled={loading}
      >
        {loading ? "Connexion..." : "Lier mon tacky"}
      </button>

      {error && <p style={{ color: "#ff6b6b", marginTop: 20 }}>{error}</p>}

      {token && (
        <div style={{ marginTop: 20 }}>
          <p>Token de liaison :</p>
          <code
            style={{
              display: "inline-block",
              padding: 10,
              background: "#222",
              borderRadius: 8,
              color: "#ffd27a",
            }}
          >
            {token}
          </code>
        </div>
      )}
    </div>
  );
}