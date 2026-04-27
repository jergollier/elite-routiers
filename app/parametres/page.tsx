import type { CSSProperties } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ParametresForm from "./ParametresForm";

export const dynamic = "force-dynamic";

const ROLES_AUTORISES = ["DIRECTEUR", "SOUS_DIRECTEUR"];

export default async function ParametresPage() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) redirect("/");

  const user = await prisma.user.findUnique({
    where: { steamId },
  });

  if (!user) redirect("/societe");

  const membership = await prisma.entrepriseMembre.findUnique({
    where: { userId: user.id },
    include: { entreprise: true },
  });

  if (!membership) redirect("/societe");

  if (!ROLES_AUTORISES.includes(membership.role)) {
    redirect("/monentreprise");
  }

  const entreprise = membership.entreprise;

  return (
    <main style={mainStyle}>
      <div style={overlayStyle} />
      <div style={radialOverlayStyle} />

      <div style={pageStyle}>
        <div style={topButtonRowStyle}>
          <Link href="/societe" style={profileButtonStyle}>
            🏠 Accueil
          </Link>
        </div>

        <section style={heroStyle}>
          <div style={heroLeftStyle}>
            <img
              src={user.avatar || "/truck.jpg"}
              alt={user.username || "Profil Steam"}
              style={avatarStyle}
            />

            <div>
              <div style={kickerStyle}>Elite Routiers • Paramètres</div>

              <h1 style={titleStyle}>
                {user.username || "Chauffeur Elite Routiers"}
              </h1>

              <p style={subtitleStyle}>
                Configuration Discord et webhooks de la société.
              </p>

              <div style={tagRowStyle}>
                <Tag>{entreprise.nom}</Tag>
                <Tag>[{entreprise.abreviation}]</Tag>
                <Tag>{membership.role.replace("_", " ")}</Tag>
              </div>
            </div>
          </div>

          <div style={companyBoxStyle}>
            <span style={companyLabelStyle}>Société active</span>
            <strong style={companyNameStyle}>
              {entreprise.nom} [{entreprise.abreviation}]
            </strong>
            <span style={companyHintStyle}>Accès direction</span>
          </div>
        </section>

        <section style={panelStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <div style={kickerStyle}>Centre de configuration</div>

              <h2 style={sectionTitleStyle}>Gestion Discord</h2>

              <p style={sectionSubtitleStyle}>
                Ajoutez vos liens Discord et vos webhooks pour automatiser les
                notifications de livraisons, achats, ventes, recrutements,
                départs et maintenances.
              </p>
            </div>

            <span style={roleBadgeStyle}>
              Accès {membership.role.replace("_", " ")}
            </span>
          </div>

          <div style={separatorStyle} />

          <ParametresForm
            entreprise={{
              discordUrl: entreprise.discordUrl ?? "",
              discordWebhookLivraison:
                entreprise.discordWebhookLivraison ?? "",
              discordWebhookAchatCamion:
                entreprise.discordWebhookAchatCamion ?? "",
              discordWebhookVenteCamion:
                entreprise.discordWebhookVenteCamion ?? "",
              discordWebhookRecrutement:
                entreprise.discordWebhookRecrutement ?? "",
              discordWebhookDepart: entreprise.discordWebhookDepart ?? "",
              discordWebhookMaintenance:
                entreprise.discordWebhookMaintenance ?? "",
            }}
          />
        </section>
      </div>
    </main>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span style={tagStyle}>{children}</span>;
}

const mainStyle: CSSProperties = {
  minHeight: "100vh",
  backgroundImage:
    "linear-gradient(180deg, rgba(3,7,18,0.15), rgba(3,7,18,0.55) 520px), url('/truck.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center top",
  backgroundAttachment: "fixed",
  color: "white",
  padding: "22px",
  position: "relative",
  fontFamily: "Arial, sans-serif",
};

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  pointerEvents: "none",
  background:
    "linear-gradient(135deg, rgba(3,7,18,0.25), rgba(8,13,28,0.20), rgba(3,7,18,0.35))",
  zIndex: 0,
};

const radialOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  pointerEvents: "none",
  background:
    "radial-gradient(circle at 52% 0%, rgba(245,158,11,0.16), transparent 34%), radial-gradient(circle at 80% 18%, rgba(37,99,235,0.12), transparent 25%)",
  zIndex: 0,
};

const pageStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  maxWidth: "1250px",
  margin: "0 auto",
  display: "grid",
  gap: "22px",
};

const topButtonRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
  flexWrap: "wrap",
};

const profileButtonStyle: CSSProperties = {
  color: "white",
  textDecoration: "none",
  fontWeight: 950,
  padding: "12px 18px",
  borderRadius: "999px",
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  border: "1px solid rgba(147,197,253,0.45)",
  boxShadow: "0 0 24px rgba(37,99,235,0.34)",
  backdropFilter: "blur(12px)",
};

const heroStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "25px",
  padding: "32px",
  borderRadius: "30px",
  background: "rgba(8,13,28,0.22)",
  border: "1px solid rgba(255,255,255,0.18)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.25)",
};

const heroLeftStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "22px",
  flexWrap: "wrap",
};

const avatarStyle: CSSProperties = {
  width: "112px",
  height: "112px",
  borderRadius: "26px",
  objectFit: "cover",
  border: "1px solid rgba(147,197,253,0.26)",
  boxShadow: "0 0 30px rgba(37,99,235,0.22)",
  background: "rgba(255,255,255,0.08)",
};

const kickerStyle: CSSProperties = {
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  fontSize: "0.82rem",
  fontWeight: 950,
  color: "#60a5fa",
  textShadow: "0 4px 14px rgba(0,0,0,0.9)",
};

const titleStyle: CSSProperties = {
  margin: "8px 0 6px",
  fontSize: "3rem",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.05em",
  textShadow: "0 6px 24px rgba(0,0,0,0.95)",
};

const subtitleStyle: CSSProperties = {
  margin: "0 0 16px",
  color: "rgba(255,255,255,0.82)",
  fontWeight: 700,
};

const tagRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
};

const tagStyle: CSSProperties = {
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(37,99,235,0.16)",
  border: "1px solid rgba(96,165,250,0.28)",
  color: "#dbeafe",
  fontWeight: 900,
  fontSize: "0.85rem",
};

const companyBoxStyle: CSSProperties = {
  minWidth: "270px",
  borderRadius: "22px",
  padding: "20px",
  background:
    "linear-gradient(135deg, rgba(37,99,235,0.20), rgba(37,99,235,0.07))",
  border: "1px solid rgba(147,197,253,0.28)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  boxShadow: "0 0 24px rgba(37,99,235,0.18)",
};

const companyLabelStyle: CSSProperties = {
  opacity: 0.78,
  fontSize: "13px",
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  fontWeight: 900,
};

const companyNameStyle: CSSProperties = {
  fontSize: "24px",
  color: "#dbeafe",
  marginTop: "8px",
};

const companyHintStyle: CSSProperties = {
  opacity: 0.7,
  fontSize: "13px",
  marginTop: "6px",
  fontWeight: 800,
};

const panelStyle: CSSProperties = {
  padding: "18px",
  borderRadius: "26px",
  background: "rgba(8,13,28,0.25)",
  border: "1px solid rgba(255,255,255,0.18)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.25)",
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
  alignItems: "flex-start",
  marginBottom: "18px",
};

const sectionTitleStyle: CSSProperties = {
  margin: "8px 0 6px",
  fontSize: "1.8rem",
  fontWeight: 950,
};

const sectionSubtitleStyle: CSSProperties = {
  margin: 0,
  maxWidth: "820px",
  color: "rgba(255,255,255,0.68)",
  fontWeight: 750,
  lineHeight: 1.6,
};

const roleBadgeStyle: CSSProperties = {
  color: "#86efac",
  fontSize: "13px",
  background: "rgba(34,197,94,0.12)",
  border: "1px solid rgba(34,197,94,0.28)",
  borderRadius: "999px",
  padding: "10px 14px",
  fontWeight: 950,
  whiteSpace: "nowrap",
};

const separatorStyle: CSSProperties = {
  height: "1px",
  background:
    "linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)",
  margin: "22px 0",
};