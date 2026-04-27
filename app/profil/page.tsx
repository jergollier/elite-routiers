import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) redirect("/");

  const user = await prisma.user.findUnique({
    where: { steamId },
    include: {
      dlcs: {
        orderBy: [{ jeu: "asc" }, { nomDlc: "asc" }],
      },
      entreprisesCreees: true,
    },
  });

  if (!user) redirect("/");

  const membershipActif = await prisma.entrepriseMembre.findUnique({
    where: { userId: user.id },
    include: { entreprise: true },
  });

  const entreprisePossedee = user.entreprisesCreees ?? null;

  const entrepriseActuelle =
    entreprisePossedee?.nom ??
    membershipActif?.entreprise?.nom ??
    "Aucune entreprise";

  const roleActuel = entreprisePossedee
    ? "DIRECTEUR"
    : membershipActif?.role ?? "Aucun rôle";

  const dlcsETS2 = user.dlcs.filter((d) => d.jeu === "ETS2");
  const dlcsATS = user.dlcs.filter((d) => d.jeu === "ATS");

  const styleConduiteAffichage =
    user.styleConduite === "RP"
      ? "RP"
      : user.styleConduite === "SEMI_RP"
      ? "Semi-RP"
      : "Non renseigné";

  return (
    <main style={mainStyle}>
      <div style={overlayStyle} />
      <div style={radialOverlayStyle} />

      <div style={pageStyle}>
        <div style={topButtonRowStyle}>
          <Link href="/societe" style={profileButtonStyle}>
            ← Société
          </Link>
        </div>

        <section style={heroStyle}>
          <div style={heroLeftStyle}>
            <img
              src={user.avatar || "/truck.jpg"}
              alt="Avatar chauffeur"
              style={avatarStyle}
            />

            <div>
              <div style={kickerStyle}>Elite Routiers • Profil chauffeur</div>

              <h1 style={titleStyle}>{user.username || "Chauffeur"}</h1>

              <p style={subtitleStyle}>
                Fiche chauffeur, préférences de conduite et DLC possédés.
              </p>

              <div style={tagRowStyle}>
                <Tag>{entrepriseActuelle}</Tag>
                <Tag>{roleActuel}</Tag>
                <Tag>{user.jeuPrincipal || "Jeu non renseigné"}</Tag>
              </div>
            </div>
          </div>

          <div style={statsStyle}>
            <Stat value={dlcsETS2.length.toString()} label="DLC ETS2" />
            <Stat value={dlcsATS.length.toString()} label="DLC ATS" />
            <Stat value={user.micro ? "Oui" : "Non"} label="Micro" />
          </div>
        </section>

        <section style={panelStyle}>
          <div style={splitStyle}>
            <Card title="👤 Identité chauffeur">
              <InfoRow label="Pseudo Steam" value={user.username || "Non renseigné"} />
              <InfoRow label="Âge" value={user.age?.toString() || "Non renseigné"} />
              <InfoRow label="Région" value={user.region || "Non renseignée"} />
              <InfoRow label="Micro" value={user.micro ? "Oui" : "Non"} />
            </Card>

            <Card title="🏢 Entreprise actuelle">
              <InfoRow label="Entreprise" value={entrepriseActuelle} />
              <InfoRow label="Rôle" value={roleActuel} />
              <InfoRow label="Jeu principal" value={user.jeuPrincipal || "Non renseigné"} />
              <InfoRow
                label="Transport préféré"
                value={user.typeTransportPrefere || "Non renseigné"}
              />
            </Card>
          </div>
        </section>

        <section style={panelStyle}>
          <div style={splitStyle}>
            <Card title="🛣️ Profil de conduite">
              <InfoRow label="Style de conduite" value={styleConduiteAffichage} />

              <div style={descriptionBoxStyle}>
                {user.descriptionChauffeur || "Aucune description renseignée."}
              </div>

              <div style={actionsInlineStyle}>
                <Link href="/societe" style={cancelButtonStyle}>
                  ← Retour
                </Link>

                <Link href="/chauffeur" style={blueButtonStyle}>
                  Espace chauffeur
                </Link>

                <Link href="/profil/modifier" style={greenButtonStyle}>
                  Modifier le profil
                </Link>
              </div>
            </Card>

            <Card title="🧩 DLC du joueur">
              <DlcBlock
                title="🚛 Euro Truck Simulator 2"
                items={dlcsETS2.map((d) => d.nomDlc)}
              />

              <DlcBlock
                title="🇺🇸 American Truck Simulator"
                items={dlcsATS.map((d) => d.nomDlc)}
              />
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={cardStyle}>
      <h3 style={cardTitleStyle}>{title}</h3>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={infoRowStyle}>
      <span style={infoLabelStyle}>{label}</span>
      <strong style={infoValueStyle}>{value}</strong>
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return <span style={tagStyle}>{children}</span>;
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={statBoxStyle}>
      <strong style={statValueStyle}>{value}</strong>
      <span style={statLabelStyle}>{label}</span>
    </div>
  );
}

function DlcBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <h3 style={dlcTitleStyle}>{title}</h3>

      {items.length > 0 ? (
        <div style={dlcListStyle}>
          {items.map((item) => (
            <div key={item} style={dlcItemStyle}>
              ✓ {item}
            </div>
          ))}
        </div>
      ) : (
        <div style={emptyStyle}>Aucun DLC renseigné</div>
      )}
    </div>
  );
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

const statsStyle: CSSProperties = {
  display: "flex",
  gap: "14px",
  flexWrap: "wrap",
};

const statBoxStyle: CSSProperties = {
  width: "110px",
  minHeight: "86px",
  display: "grid",
  placeItems: "center",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.065)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.22)",
};

const statValueStyle: CSSProperties = {
  fontSize: "1.75rem",
  lineHeight: 1,
  fontWeight: 950,
};

const statLabelStyle: CSSProperties = {
  fontSize: "0.78rem",
  color: "rgba(255,255,255,0.72)",
  fontWeight: 800,
  marginTop: "-16px",
};

const panelStyle: CSSProperties = {
  padding: "18px",
  borderRadius: "26px",
  background: "rgba(8,13,28,0.25)",
  border: "1px solid rgba(255,255,255,0.18)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.25)",
};

const splitStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "22px",
};

const cardStyle: CSSProperties = {
  padding: "20px",
  borderRadius: "20px",
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.12)",
};

const cardTitleStyle: CSSProperties = {
  margin: "0 0 22px",
  fontSize: "1.28rem",
  fontWeight: 950,
};

const infoRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
  padding: "13px 0",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const infoLabelStyle: CSSProperties = {
  color: "rgba(255,255,255,0.68)",
  fontWeight: 850,
};

const infoValueStyle: CSSProperties = {
  color: "white",
  textAlign: "right",
  fontWeight: 950,
};

const descriptionBoxStyle: CSSProperties = {
  marginTop: "14px",
  minHeight: "130px",
  padding: "16px",
  borderRadius: "16px",
  lineHeight: 1.7,
  whiteSpace: "pre-wrap",
  background: "rgba(255,255,255,0.075)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "rgba(255,255,255,0.86)",
  fontWeight: 750,
};

const actionsInlineStyle: CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginTop: "18px",
};

const cancelButtonStyle: CSSProperties = {
  padding: "13px 18px",
  borderRadius: "12px",
  color: "white",
  textDecoration: "none",
  fontWeight: 950,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.18)",
};

const blueButtonStyle: CSSProperties = {
  ...cancelButtonStyle,
  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  border: "1px solid rgba(147,197,253,0.45)",
  boxShadow: "0 0 24px rgba(37,99,235,0.34)",
};

const greenButtonStyle: CSSProperties = {
  ...cancelButtonStyle,
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  border: "1px solid rgba(74,222,128,0.45)",
  boxShadow: "0 0 24px rgba(34,197,94,0.28)",
};

const dlcTitleStyle: CSSProperties = {
  margin: "0 0 10px",
  fontSize: "1rem",
  fontWeight: 950,
  color: "#dbeafe",
};

const dlcListStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  maxHeight: "230px",
  overflowY: "auto",
  paddingRight: "6px",
};

const dlcItemStyle: CSSProperties = {
  padding: "10px 12px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.075)",
  border: "1px solid rgba(255,255,255,0.10)",
  fontWeight: 850,
};

const emptyStyle: CSSProperties = {
  color: "rgba(255,255,255,0.65)",
  padding: "10px 12px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.08)",
  fontWeight: 800,
};