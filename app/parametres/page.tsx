import type { CSSProperties } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ParametresForm from "./ParametresForm";

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
    <main style={pageStyle}>
      <div style={contentStyle}>
        <section style={topCardStyle}>
          <div style={profileStyle}>
            <img
              src={user.avatar || "/truck.jpg"}
              alt={user.username || "Profil Steam"}
              style={avatarStyle}
            />

            <div>
              <p style={labelStyle}>Paramètres entreprise</p>
              <h1 style={titleStyle}>
                {user.username || "Chauffeur Elite Routiers"}
              </h1>
              <p style={subtitleStyle}>
                Configuration Discord et webhooks de la société.
              </p>
            </div>
          </div>

          <div style={rightStyle}>
            <div style={companyBoxStyle}>
              <span style={companyLabelStyle}>Société active</span>
              <strong style={companyNameStyle}>
                {entreprise.nom} [{entreprise.abreviation}]
              </strong>
            </div>

            <Link href="/societe" style={homeButtonStyle}>
              🏠 Accueil
            </Link>
          </div>
        </section>

        <section style={settingsCardStyle}>
          <div style={headerStyle}>
            <div>
              <p style={smallTitleStyle}>Centre de configuration</p>
              <h2 style={sectionTitleStyle}>Gestion Discord</h2>
              <p style={descriptionStyle}>
                Ajoutez vos liens Discord et vos webhooks pour automatiser les
                notifications de livraisons, achats, ventes, recrutements,
                départs et maintenances.
              </p>
            </div>

            <div style={roleBadgeStyle}>
              Accès {membership.role.replace("_", " ")}
            </div>
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

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  backgroundImage:
    "linear-gradient(rgba(5,8,15,0.68), rgba(5,8,15,0.82)), url('/truck.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundAttachment: "fixed",
  color: "#ffffff",
};

const contentStyle: CSSProperties = {
  width: "100%",
  maxWidth: "1280px",
  margin: "0 auto",
  padding: "32px",
  display: "grid",
  gap: "24px",
};

const topCardStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "18px",
  flexWrap: "wrap",
  padding: "26px",
  borderRadius: "24px",
  background:
    "linear-gradient(135deg, rgba(20,20,20,0.84), rgba(12,12,12,0.66))",
  border: "1px solid rgba(255,255,255,0.07)",
  backdropFilter: "blur(8px)",
  boxShadow:
    "0 0 24px rgba(0,0,0,0.65), inset 0 0 24px rgba(255,255,255,0.025)",
};

const profileStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "18px",
};

const avatarStyle: CSSProperties = {
  width: "82px",
  height: "82px",
  borderRadius: "22px",
  objectFit: "cover",
  border: "2px solid rgba(255,255,255,0.18)",
  boxShadow: "0 0 24px rgba(0,0,0,0.75)",
  background: "rgba(255,255,255,0.08)",
};

const labelStyle: CSSProperties = {
  margin: 0,
  color: "#fbbf24",
  fontSize: "13px",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
};

const titleStyle: CSSProperties = {
  margin: "6px 0",
  fontSize: "clamp(1.8rem, 3vw, 2.5rem)",
  fontWeight: 900,
  lineHeight: 1,
};

const subtitleStyle: CSSProperties = {
  margin: 0,
  color: "rgba(255,255,255,0.72)",
  fontSize: "15px",
};

const rightStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "14px",
  flexWrap: "wrap",
};

const companyBoxStyle: CSSProperties = {
  minWidth: "240px",
  padding: "13px 16px",
  borderRadius: "18px",
  background: "rgba(0,0,0,0.42)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const companyLabelStyle: CSSProperties = {
  display: "block",
  color: "rgba(255,255,255,0.55)",
  fontSize: "12px",
  fontWeight: 800,
  marginBottom: "5px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const companyNameStyle: CSSProperties = {
  display: "block",
  color: "#ffffff",
  fontSize: "16px",
};

const homeButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "13px 18px",
  borderRadius: "999px",
  background: "linear-gradient(135deg, #f59e0b, #d97706)",
  color: "#111827",
  fontWeight: 900,
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,0.18)",
  boxShadow: "0 0 18px rgba(245,158,11,0.28)",
};

const settingsCardStyle: CSSProperties = {
  padding: "30px",
  borderRadius: "26px",
  background:
    "linear-gradient(180deg, rgba(18,18,18,0.86), rgba(8,8,8,0.78))",
  border: "1px solid rgba(255,255,255,0.07)",
  backdropFilter: "blur(8px)",
  boxShadow:
    "0 0 26px rgba(0,0,0,0.65), inset 0 0 22px rgba(255,255,255,0.02)",
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  flexWrap: "wrap",
};

const smallTitleStyle: CSSProperties = {
  margin: "0 0 8px",
  color: "#fbbf24",
  fontSize: "13px",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "32px",
  fontWeight: 900,
};

const descriptionStyle: CSSProperties = {
  maxWidth: "820px",
  margin: "10px 0 0",
  color: "rgba(255,255,255,0.72)",
  lineHeight: 1.6,
};

const roleBadgeStyle: CSSProperties = {
  padding: "10px 14px",
  borderRadius: "999px",
  background: "rgba(34,197,94,0.12)",
  color: "#86efac",
  border: "1px solid rgba(34,197,94,0.28)",
  fontWeight: 900,
  fontSize: "13px",
};

const separatorStyle: CSSProperties = {
  height: "1px",
  background:
    "linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)",
  margin: "26px 0",
};