"use client";

export default function DemissionButton() {
  const handleClick = async () => {
    const confirm = window.confirm(
      "⚠️ Es-tu sûr de vouloir quitter l'entreprise ?"
    );

    if (!confirm) return;

    await fetch("/api/entreprise/demission", {
      method: "POST",
    });

    window.location.href = "/societe";
  };

  return (
    <button
      onClick={handleClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "160px",
        padding: "14px 18px",
        borderRadius: "12px",
        background: "#991b1b",
        color: "white",
        fontWeight: "bold",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 0 20px rgba(0,0,0,0.25)",
        cursor: "pointer",
      }}
    >
      Démissionner
    </button>
  );
}