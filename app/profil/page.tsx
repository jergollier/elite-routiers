import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";

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
    <main style={page}>
      <div style={overlay} />

      <Link href="/societe" style={topButton}>
        ← Société
      </Link>

      <div style={container}>
        <section style={hero}>
          <div style={heroLeft}>
            <div style={avatarBox}>
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar" style={avatar} />
              ) : (
                <span style={{ fontSize: "2.4rem" }}>🚛</span>
              )}
            </div>

            <div>
              <div style={smallText}>Elite Routiers • Profil chauffeur</div>

              <h1 style={title}>{user.username || "Chauffeur"}</h1>

              <div style={tags}>
                <Tag>{entrepriseActuelle}</Tag>
                <Tag>{roleActuel}</Tag>
                <Tag>{user.jeuPrincipal || "Jeu non renseigné"}</Tag>
              </div>
            </div>
          </div>

          <div style={heroRight}>
            <StatBox label="DLC ETS2" value={dlcsETS2.length.toString()} />
            <StatBox label="DLC ATS" value={dlcsATS.length.toString()} />
            <StatBox label="Micro" value={user.micro ? "Oui" : "Non"} />
          </div>
        </section>

        <section style={grid2}>
          <Card title="Identité chauffeur" icon="👤">
            <InfoRow label="Pseudo Steam" value={user.username || "Non renseigné"} />
            <InfoRow label="Âge" value={user.age?.toString() || "Non renseigné"} />
            <InfoRow label="Région" value={user.region || "Non renseignée"} />
            <InfoRow label="Steam ID" value={user.steamId} />
          </Card>

          <Card title="Entreprise actuelle" icon="🏢">
            <InfoRow label="Entreprise" value={entrepriseActuelle} />
            <InfoRow label="Rôle" value={roleActuel} />
            <InfoRow label="Jeu principal" value={user.jeuPrincipal || "Non renseigné"} />
            <InfoRow
              label="Transport préféré"
              value={user.typeTransportPrefere || "Non renseigné"}
            />
          </Card>
        </section>

        <section style={gridMain}>
          <Card title="Profil de conduite" icon="🛣️">
            <InfoRow label="Style de conduite" value={styleConduiteAffichage} />

            <div style={descriptionBox}>
              {user.descriptionChauffeur || "Aucune description renseignée."}
            </div>

            <div style={actions}>
              <Link href="/societe" style={btn}>
                Retour
              </Link>

              <Link href="/chauffeur" style={btnBlue}>
                Espace chauffeur
              </Link>

              <Link href="/profil/modifier" style={btnGreen}>
                Modifier le profil
              </Link>
            </div>
          </Card>

          <Card title="DLC du joueur" icon="🧩">
            <DlcBlock title="Euro Truck Simulator 2" items={dlcsETS2.map((d) => d.nomDlc)} />
            <DlcBlock title="American Truck Simulator" items={dlcsATS.map((d) => d.nomDlc)} />
          </Card>
        </section>
      </div>
    </main>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: ReactNode;
}) {
  return (
    <section style={card}>
      <h2 style={cardTitle}>
        <span>{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={infoRow}>
      <span style={infoLabel}>{label}</span>
      <strong style={infoValue}>{value}</strong>
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return <span style={tag}>{children}</span>;
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={statBox}>
      <strong style={statValue}>{value}</strong>
      <span style={statLabel}>{label}</span>
    </div>
  );
}

function DlcBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <h3 style={dlcTitle}>{title}</h3>

      {items.length > 0 ? (
        <div style={dlcList}>
          {items.map((item) => (
            <div key={item} style={dlcItem}>
              ✓ {item}
            </div>
          ))}
        </div>
      ) : (
        <div style={empty}>Aucun DLC renseigné</div>
      )}
    </div>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  backgroundImage: "url('/truck.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundAttachment: "fixed",
  color: "white",
  padding: "24px",
  position: "relative",
};

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background:
    "linear-gradient(135deg, rgba(0,0,0,0.88), rgba(5,15,30,0.7), rgba(0,0,0,0.9))",
  zIndex: 0,
};

const container: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
  maxWidth: "1250px",
  margin: "0 auto",
  display: "grid",
  gap: "22px",
  paddingTop: "58px",
};

const topButton: React.CSSProperties = {
  position: "absolute",
  top: "24px",
  right: "24px",
  zIndex: 5,
  padding: "12px 18px",
  borderRadius: "999px",
  color: "white",
  textDecoration: "none",
  fontWeight: 900,
  background: "linear-gradient(135deg, rgba(37,99,235,0.95), rgba(14,165,233,0.75))",
  border: "1px solid rgba(255,255,255,0.25)",
  boxShadow: "0 15px 35px rgba(0,0,0,0.45)",
  backdropFilter: "blur(10px)",
};

const hero: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "24px",
  alignItems: "center",
  padding: "28px",
  borderRadius: "26px",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))",
  border: "1px solid rgba(255,255,255,0.16)",
  boxShadow: "0 25px 70px rgba(0,0,0,0.5)",
  backdropFilter: "blur(12px)",
};

const heroLeft: React.CSSProperties = {
  display: "flex",
  gap: "22px",
  alignItems: "center",
  flexWrap: "wrap",
};

const heroRight: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(110px, 1fr))",
  gap: "12px",
};

const avatarBox: React.CSSProperties = {
  width: "110px",
  height: "110px",
  borderRadius: "26px",
  overflow: "hidden",
  display: "grid",
  placeItems: "center",
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.2)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.55)",
};

const avatar: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const smallText: React.CSSProperties = {
  opacity: 0.72,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  fontSize: "0.78rem",
  fontWeight: 800,
};

const title: React.CSSProperties = {
  margin: "8px 0 12px",
  fontSize: "clamp(2rem, 4vw, 3.6rem)",
  lineHeight: 1,
};

const tags: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const tag: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.14)",
  fontWeight: 800,
  fontSize: "0.85rem",
};

const statBox: React.CSSProperties = {
  padding: "16px",
  borderRadius: "18px",
  background: "rgba(0,0,0,0.35)",
  border: "1px solid rgba(255,255,255,0.12)",
  textAlign: "center",
};

const statValue: React.CSSProperties = {
  display: "block",
  fontSize: "1.6rem",
};

const statLabel: React.CSSProperties = {
  opacity: 0.68,
  fontSize: "0.8rem",
};

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "22px",
};

const gridMain: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.1fr 0.9fr",
  gap: "22px",
  alignItems: "start",
};

const card: React.CSSProperties = {
  padding: "22px",
  borderRadius: "24px",
  background: "rgba(0,0,0,0.55)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 18px 50px rgba(0,0,0,0.42)",
  backdropFilter: "blur(10px)",
};

const cardTitle: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  alignItems: "center",
  margin: "0 0 18px",
  fontSize: "1.25rem",
};

const infoRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
  padding: "12px 0",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const infoLabel: React.CSSProperties = {
  opacity: 0.62,
};

const infoValue: React.CSSProperties = {
  textAlign: "right",
};

const descriptionBox: React.CSSProperties = {
  marginTop: "14px",
  minHeight: "130px",
  padding: "16px",
  borderRadius: "18px",
  lineHeight: 1.7,
  whiteSpace: "pre-wrap",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.1)",
};

const actions: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginTop: "18px",
};

const btn: React.CSSProperties = {
  padding: "11px 16px",
  borderRadius: "14px",
  color: "white",
  textDecoration: "none",
  fontWeight: 900,
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.14)",
};

const btnBlue: React.CSSProperties = {
  ...btn,
  background: "linear-gradient(135deg, rgba(37,99,235,0.95), rgba(59,130,246,0.65))",
};

const btnGreen: React.CSSProperties = {
  ...btn,
  background: "linear-gradient(135deg, rgba(34,197,94,0.95), rgba(22,163,74,0.65))",
};

const dlcTitle: React.CSSProperties = {
  margin: "0 0 10px",
  fontSize: "1rem",
};

const dlcList: React.CSSProperties = {
  display: "grid",
  gap: "8px",
  maxHeight: "230px",
  overflowY: "auto",
  paddingRight: "6px",
};

const dlcItem: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.09)",
  fontWeight: 700,
};

const empty: React.CSSProperties = {
  opacity: 0.65,
  padding: "10px 12px",
};