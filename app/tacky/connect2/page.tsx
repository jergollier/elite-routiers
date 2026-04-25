"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function TackyConnectContent() {
  const params = useSearchParams();
  const requestId = params.get("requestId");
  const code = params.get("code");

  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    try {
      setLoading(true);
      setMessage(null);
      setMessageType(null);

      if (!requestId || !code) {
        setMessage("Lien Tacky invalide. Relance la connexion depuis le client.");
        setMessageType("error");
        return;
      }

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

      let data: any = null;

      try {
        data = await res.json();
      } catch {
        setMessage("Réponse serveur invalide.");
        setMessageType("error");
        return;
      }

      if (!res.ok || !data?.success) {
        setMessage(data?.error || "Impossible de lier le Tacky.");
        setMessageType("error");
        return;
      }

      setMessage("Tacky lié avec succès. Tu peux retourner sur le client.");
      setMessageType("success");
    } catch {
      setMessage("Erreur serveur pendant la connexion.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  const canConnect = Boolean(requestId && code) && !loading;

  return (
    <main style={mainStyle}>
      <div style={overlayStyle} />

      <section style={cardStyle}>
        <div style={badgeStyle}>Elite Routiers</div>

        <h1 style={titleStyle}>Connexion Tacky</h1>

        <p style={subtitleStyle}>
          Relie ton Tacky Elite Routiers à ton compte du site.
        </p>

        <div style={deviceBoxStyle}>
          <span style={labelStyle}>Code appareil</span>
          <strong style={codeStyle}>{code || "Inconnu"}</strong>
        </div>

        {!requestId || !code ? (
          <div style={errorBoxStyle}>
            Lien invalide. Relance la connexion depuis ton application Tacky.
          </div>
        ) : (
          <button
            type="button"
            onClick={handleConnect}
            disabled={!canConnect}
            style={{
              ...buttonStyle,
              opacity: canConnect ? 1 : 0.55,
              cursor: canConnect ? "pointer" : "not-allowed",
            }}
          >
            {loading ? "Connexion..." : "Lier mon Tacky"}
          </button>
        )}

        {message && (
          <div
            style={{
              ...messageStyle,
              background:
                messageType === "success"
                  ? "rgba(34,197,94,0.14)"
                  : "rgba(239,68,68,0.14)",
              border:
                messageType === "success"
                  ? "1px solid rgba(34,197,94,0.35)"
                  : "1px solid rgba(239,68,68,0.35)",
              color: messageType === "success" ? "#86efac" : "#fecaca",
            }}
          >
            {message}
          </div>
        )}

        <div style={actionsStyle}>
          <Link href="/societe" style={secondaryButtonStyle}>
            Retour au site
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function TackyConnectPage() {
  return (
    <Suspense
      fallback={
        <main style={mainStyle}>
          <div style={overlayStyle} />
          <section style={cardStyle}>
            <h1 style={titleStyle}>Chargement...</h1>
          </section>
        </main>
      }
    >
      <TackyConnectContent />
    </Suspense>
  );
}

const mainStyle: React.CSSProperties = {
  minHeight: "100vh",
  backgroundImage:
    "linear-gradient(135deg, rgba(2,6,23,0.86), rgba(15,23,42,0.72)), url('/truck.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  position: "relative",
};

const overlayStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(circle at top right, rgba(245,158,11,0.20), transparent 34%), radial-gradient(circle at bottom left, rgba(37,99,235,0.18), transparent 36%)",
};

const cardStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "100%",
  maxWidth: "520px",
  background: "rgba(0,0,0,0.58)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "24px",
  padding: "30px",
  backdropFilter: "blur(10px)",
  boxShadow: "0 20px 70px rgba(0,0,0,0.55)",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-flex",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(245,158,11,0.14)",
  border: "1px solid rgba(245,158,11,0.32)",
  color: "#fbbf24",
  fontWeight: 800,
  fontSize: "13px",
  marginBottom: "18px",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "38px",
  fontWeight: 950,
};

const subtitleStyle: React.CSSProperties = {
  margin: "12px 0 22px",
  opacity: 0.82,
  lineHeight: 1.6,
};

const deviceBoxStyle: React.CSSProperties = {
  padding: "18px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.10)",
  marginBottom: "18px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  opacity: 0.68,
  fontSize: "13px",
  marginBottom: "8px",
  textTransform: "uppercase",
  letterSpacing: "0.12em",
};

const codeStyle: React.CSSProperties = {
  fontSize: "34px",
  color: "#fbbf24",
  letterSpacing: "0.08em",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 18px",
  borderRadius: "14px",
  border: "none",
  background: "linear-gradient(135deg, #f59e0b, #d97706)",
  color: "white",
  fontWeight: 900,
  fontSize: "15px",
  boxShadow: "0 0 22px rgba(245,158,11,0.32)",
};

const secondaryButtonStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "13px 18px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "white",
  fontWeight: 800,
  textDecoration: "none",
  display: "inline-flex",
  justifyContent: "center",
};

const actionsStyle: React.CSSProperties = {
  marginTop: "14px",
};

const messageStyle: React.CSSProperties = {
  marginTop: "16px",
  padding: "14px",
  borderRadius: "14px",
  fontWeight: 800,
  lineHeight: 1.5,
};

const errorBoxStyle: React.CSSProperties = {
  padding: "14px",
  borderRadius: "14px",
  background: "rgba(239,68,68,0.14)",
  border: "1px solid rgba(239,68,68,0.35)",
  color: "#fecaca",
  fontWeight: 800,
};