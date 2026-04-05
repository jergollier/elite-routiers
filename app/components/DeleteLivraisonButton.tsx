"use client";

import { useState } from "react";

type Props = {
  livraisonId: string;
};

export default function DeleteLivraisonButton({ livraisonId }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Tu veux vraiment supprimer cette livraison ?"
    );

    if (!confirmed) return;

    try {
      setLoading(true);

      const res = await fetch("/api/livraisons/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          livraisonId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        alert(data.message || "Erreur suppression");
        return;
      }

      window.location.reload();
    } catch (error) {
      alert("Erreur suppression livraison");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      style={{
        marginTop: "8px",
        padding: "8px 12px",
        borderRadius: "8px",
        border: "1px solid rgba(255,255,255,0.12)",
        background: loading ? "#6b7280" : "#dc2626",
        color: "white",
        fontWeight: "bold",
        cursor: loading ? "not-allowed" : "pointer",
        width: "100%",
      }}
    >
      {loading ? "Suppression..." : "Supprimer"}
    </button>
  );
}