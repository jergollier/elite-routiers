"use client";

import { useState } from "react";

type Props = {
  entreprise: {
    discordUrl: string;
    discordWebhookLivraison: string;
    discordWebhookAchatCamion: string;
    discordWebhookVenteCamion: string;
    discordWebhookRecrutement: string;
    discordWebhookDepart: string;
    discordWebhookMaintenance: string;
  };
};

type WebhookField = {
  key:
    | "discordWebhookLivraison"
    | "discordWebhookAchatCamion"
    | "discordWebhookVenteCamion"
    | "discordWebhookRecrutement"
    | "discordWebhookDepart"
    | "discordWebhookMaintenance";
  label: string;
};

const webhookFields: WebhookField[] = [
  { key: "discordWebhookLivraison", label: "Webhook livraisons" },
  { key: "discordWebhookAchatCamion", label: "Webhook achat camion" },
  { key: "discordWebhookVenteCamion", label: "Webhook vente camion" },
  { key: "discordWebhookRecrutement", label: "Webhook recrutement" },
  { key: "discordWebhookDepart", label: "Webhook départ chauffeur" },
  { key: "discordWebhookMaintenance", label: "Webhook maintenance" },
];

export default function ParametresForm({ entreprise }: Props) {
  const [form, setForm] = useState(entreprise);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, string>>({});

  function handleChange(
    key: keyof typeof form,
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSave() {
    try {
      setSaving(true);
      setMessage(null);
      setMessageType(null);

      const response = await fetch("/api/entreprise/parametres", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
  setMessage(
    data.details
      ? `${data.error || "Erreur"} (${data.details})`
      : data.error || "Erreur lors de l'enregistrement."
  );
  setMessageType("error");
  return;
}

      setMessage(data.message || "Paramètres enregistrés.");
      setMessageType("success");
    } catch (error) {
      console.error(error);
      setMessage("Erreur serveur.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest(webhookType: WebhookField["key"]) {
    const webhookUrl = form[webhookType];

    if (!webhookUrl.trim()) {
      setTestResults((prev) => ({
        ...prev,
        [webhookType]: "❌ Champ vide.",
      }));
      return;
    }

    try {
      setTestingKey(webhookType);
      setTestResults((prev) => ({
        ...prev,
        [webhookType]: "",
      }));

      const response = await fetch("/api/entreprise/webhook/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          webhookUrl,
          webhookType,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setTestResults((prev) => ({
          ...prev,
          [webhookType]: `❌ ${data.error || "Erreur webhook."}`,
        }));
        return;
      }

      setTestResults((prev) => ({
        ...prev,
        [webhookType]: `✅ ${data.message || "Webhook valide."}`,
      }));
    } catch (error) {
      console.error(error);
      setTestResults((prev) => ({
        ...prev,
        [webhookType]: "❌ Erreur serveur.",
      }));
    } finally {
      setTestingKey(null);
    }
  }

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <section
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          padding: "20px",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "16px", fontSize: "1.2rem" }}>
          Discord société
        </h2>

        <label style={{ display: "grid", gap: "8px" }}>
          <span style={{ fontWeight: 600 }}>Lien Discord société</span>
          <input
            type="text"
            value={form.discordUrl}
            onChange={(e) => handleChange("discordUrl", e.target.value)}
            placeholder="https://discord.gg/..."
            style={inputStyle}
          />
        </label>
      </section>

      <section
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          padding: "20px",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "16px", fontSize: "1.2rem" }}>
          Webhooks Discord
        </h2>

        <div style={{ display: "grid", gap: "18px" }}>
          {webhookFields.map((field) => (
            <div key={field.key} style={{ display: "grid", gap: "8px" }}>
              <label style={{ fontWeight: 600 }}>{field.label}</label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 120px",
                  gap: "10px",
                }}
              >
                <input
                  type="text"
                  value={form[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  style={inputStyle}
                />

                <button
                  type="button"
                  onClick={() => handleTest(field.key)}
                  disabled={testingKey === field.key}
                  style={{
                    ...buttonStyle,
                    background:
                      testingKey === field.key
                        ? "rgba(59,130,246,0.5)"
                        : "#2563eb",
                    cursor:
                      testingKey === field.key ? "not-allowed" : "pointer",
                  }}
                >
                  {testingKey === field.key ? "Test..." : "Tester"}
                </button>
              </div>

              {testResults[field.key] ? (
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.95rem",
                    color: testResults[field.key].startsWith("✅")
                      ? "#4ade80"
                      : "#f87171",
                  }}
                >
                  {testResults[field.key]}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            ...buttonStyle,
            background: saving ? "rgba(34,197,94,0.5)" : "#16a34a",
            cursor: saving ? "not-allowed" : "pointer",
            minWidth: "220px",
          }}
        >
          {saving ? "Enregistrement..." : "Enregistrer les paramètres"}
        </button>
      </div>

      {message ? (
        <div
          style={{
            padding: "14px 16px",
            borderRadius: "12px",
            fontWeight: 600,
            background:
              messageType === "success"
                ? "rgba(34,197,94,0.15)"
                : "rgba(239,68,68,0.15)",
            border:
              messageType === "success"
                ? "1px solid rgba(34,197,94,0.35)"
                : "1px solid rgba(239,68,68,0.35)",
            color: messageType === "success" ? "#4ade80" : "#f87171",
          }}
        >
          {message}
        </div>
      ) : null}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(0,0,0,0.35)",
  color: "white",
  outline: "none",
};

const buttonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "12px",
  padding: "12px 16px",
  color: "white",
  fontWeight: 700,
};