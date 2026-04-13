import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import Menu from "@/app/components/Menu";

export default async function ProfilPage() {
  const cookieStore = await cookies();
  const steamId = cookieStore.get("steamId")?.value;

  if (!steamId) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { steamId },
    include: {
      dlcs: {
        orderBy: [{ jeu: "asc" }, { nomDlc: "asc" }],
      },
      memberships: {
        include: { entreprise: true },
        orderBy: { createdAt: "desc" },
      },
      entreprisesCreees: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    redirect("/");
  }

  const entreprisePossedee = user.entreprisesCreees[0] ?? null;
  const membershipActif = user.memberships[0] ?? null;

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
    <main
      style={{
        minHeight: "100vh",
        backgroundImage: "url('/truck.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        padding: "20px",
        color: "white",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "220px 1fr",
          gap: "20px",
        }}
      >
        <Menu />

        <div style={{ display: "grid", gap: "20px" }}>
          <section
            style={{
              background: "rgba(0,0,0,0.55)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "18px",
              backdropFilter: "blur(6px)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ padding: "24px" }}>
              <div style={{ opacity: 0.7 }}>Elite Routiers</div>

              <h1 style={{ margin: "5px 0", fontSize: "2rem" }}>
                Profil de {user.username || "Chauffeur"}
              </h1>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "10px",
                  flexWrap: "wrap",
                }}
              >
                <Tag>{entrepriseActuelle}</Tag>
                <Tag>{roleActuel}</Tag>
                <Tag>{user.jeuPrincipal || "Non renseigné"}</Tag>
              </div>
            </div>
          </section>

          <section
            style={{
              background: "rgba(0,0,0,0.55)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "18px",
              padding: "20px",
              backdropFilter: "blur(6px)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
              }}
            >
              <Card title="Informations générales">
                <InfoRow label="Pseudo" value={user.username || "Non renseigné"} />
                <InfoRow
                  label="Âge"
                  value={user.age?.toString() || "Non renseigné"}
                />
                <InfoRow
                  label="Région"
                  value={user.region || "Non renseignée"}
                />
                <InfoRow label="Micro" value={user.micro ? "Oui" : "Non"} />
              </Card>

              <Card title="Profil routier">
                <InfoRow label="Rôle" value={roleActuel} />
                <InfoRow label="Entreprise" value={entrepriseActuelle} />
                <InfoRow label="Jeu" value={user.jeuPrincipal || "Non renseigné"} />
                <InfoRow
                  label="Transport"
                  value={user.typeTransportPrefere || "Non renseigné"}
                />
              </Card>
            </div>
          </section>

          <section
            style={{
              background: "rgba(0,0,0,0.55)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "18px",
              padding: "20px",
              backdropFilter: "blur(6px)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 0.8fr",
                gap: "15px",
                alignItems: "start",
              }}
            >
              <Card title="Informations de conduite">
                <InfoRow label="Style" value={styleConduiteAffichage} />

                <div
                  style={{
                    marginTop: "12px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "10px",
                    padding: "12px",
                    lineHeight: "1.6",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {user.descriptionChauffeur || "Aucune description"}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginTop: "14px",
                  }}
                >
                  <Link href="/societe" style={btn}>
                    Retour
                  </Link>

                  <Link href="/chauffeur" style={btnBlue}>
                    Espace chauffeur
                  </Link>

                  <Link href="/profil/modifier" style={btnBlue}>
                    Modifier
                  </Link>
                </div>
              </Card>

              <Card title="DLC">
                <div
                  style={{
                    maxHeight: "360px",
                    overflowY: "auto",
                    paddingRight: "8px",
                    display: "grid",
                    gap: "12px",
                  }}
                >
                  <div>
                    <strong style={{ display: "block", marginBottom: "8px" }}>
                      ETS2
                    </strong>

                    {dlcsETS2.length > 0 ? (
                      dlcsETS2.map((d) => (
                        <ListLine key={d.id}>{d.nomDlc}</ListLine>
                      ))
                    ) : (
                      <EmptyText>Aucun DLC ETS2</EmptyText>
                    )}
                  </div>

                  <div>
                    <strong style={{ display: "block", marginBottom: "8px" }}>
                      ATS
                    </strong>

                    {dlcsATS.length > 0 ? (
                      dlcsATS.map((d) => (
                        <ListLine key={d.id}>{d.nomDlc}</ListLine>
                      ))
                    ) : (
                      <EmptyText>Aucun DLC ATS</EmptyText>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      style={{
        background: "rgba(0,0,0,0.35)",
        padding: "15px",
        borderRadius: "12px",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: "12px" }}>{title}</h3>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ opacity: 0.6 }}>{label}</div>
      <div style={{ fontWeight: "bold" }}>{value}</div>
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        background: "rgba(255,255,255,0.1)",
        padding: "5px 10px",
        borderRadius: "10px",
      }}
    >
      {children}
    </span>
  );
}

function ListLine({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        marginTop: "6px",
        opacity: 0.9,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "8px",
        padding: "8px 10px",
      }}
    >
      • {children}
    </div>
  );
}

function EmptyText({ children }: { children: ReactNode }) {
  return <div style={{ opacity: 0.7 }}>{children}</div>;
}

const btn: React.CSSProperties = {
  padding: "10px 20px",
  background: "rgba(255,255,255,0.1)",
  borderRadius: "10px",
  textDecoration: "none",
  color: "white",
};

const btnBlue: React.CSSProperties = {
  ...btn,
  background: "rgba(0,100,255,0.6)",
};