import { prisma } from "@/lib/prisma";

export default async function ClassementGlobalPage() {
  const entreprises = await prisma.entreprise.findMany({
    include: {
      _count: {
        select: {
          membres: true,
          camions: true,
        },
      },
    },
    orderBy: {
      argent: "desc",
    },
  });

  return (
    <main style={{
      minHeight: "100vh",
      backgroundImage: "url('/truck.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      color: "white",
      padding: "40px",
    }}>
      <h1 style={{ fontSize: "40px", marginBottom: "30px" }}>
        Classement des entreprises
      </h1>

      <table style={{
        width: "100%",
        borderCollapse: "collapse",
        background: "rgba(0,0,0,0.5)",
        borderRadius: "10px",
        overflow: "hidden",
      }}>
        <thead>
          <tr>
            <th style={th}>#</th>
            <th style={th}>Entreprise</th>
            <th style={th}>Argent</th>
            <th style={th}>Membres</th>
            <th style={th}>Camions</th>
          </tr>
        </thead>

        <tbody>
          {entreprises.map((e, index) => (
            <tr key={e.id}>
              <td style={td}>{index + 1}</td>
              <td style={td}>{e.nom}</td>
              <td style={td}>{e.argent.toLocaleString("fr-FR")} €</td>
              <td style={td}>{e._count.membres}</td>
              <td style={td}>{e._count.camions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

const th = {
  padding: "14px",
  borderBottom: "1px solid rgba(255,255,255,0.2)",
};

const td = {
  padding: "14px",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
};