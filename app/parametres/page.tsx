import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Menu from "@/app/components/Menu";
import { prisma } from "@/lib/prisma";
import ParametresForm from "./ParametresForm";

const ROLES_AUTORISES = ["DIRECTEUR", "SOUS_DIRECTEUR"];

export default async function ParametresPage() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { steamId },
  });

  if (!user) {
    redirect("/societe");
  }

  const membership = await prisma.entrepriseMembre.findUnique({
    where: {
      userId: user.id,
    },
    include: {
      entreprise: true,
    },
  });

  if (!membership) {
    redirect("/societe");
  }

  if (!ROLES_AUTORISES.includes(membership.role)) {
    redirect("/monentreprise");
  }

  const entreprise = membership.entreprise;

  if (!entreprise) {
    redirect("/societe");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage:
          "linear-gradient(rgba(10,15,25,0.72), rgba(10,15,25,0.82)), url('/truck.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "white",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          gap: "24px",
          padding: "24px",
        }}
      >
        <Menu />

        <main>
          <div
            style={{
              background: "rgba(0,0,0,0.45)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(8px)",
              borderRadius: "20px",
              padding: "28px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ marginBottom: "24px" }}>
              <h1
                style={{
                  fontSize: "2rem",
                  fontWeight: 800,
                  marginBottom: "8px",
                }}
              >
                Paramètres entreprise
              </h1>
              <p style={{ color: "rgba(255,255,255,0.75)", margin: 0 }}>
                Gérez le Discord et les webhooks de votre société.
              </p>
              <p
                style={{
                  marginTop: "10px",
                  color: "#60a5fa",
                  fontWeight: 600,
                }}
              >
                Société : {entreprise.nom} [{entreprise.abreviation}]
              </p>
            </div>

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
                discordWebhookDepart:
                  entreprise.discordWebhookDepart ?? "",
                discordWebhookMaintenance:
                  entreprise.discordWebhookMaintenance ?? "",
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}