export default function TelechargementPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.85)), url('/truck.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        padding: "40px 20px",
        color: "white",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontSize: "36px",
            fontWeight: 800,
            marginBottom: "20px",
          }}
        >
          Télécharger le Tacky Elite Routiers
        </h1>

        <div
          style={{
            background: "rgba(0,0,0,0.45)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(6px)",
            borderRadius: "20px",
            padding: "25px",
          }}
        >
          <p style={{ marginBottom: "20px" }}>
            Le Tacky permet d'envoyer automatiquement vos données de conduite
            vers le site Elite Routiers et de suivre votre activité en temps réel.
          </p>

          <a
            href="https://evsucubtev4fgabq.public.blob.vercel-storage.com/Elite%20Routier%20Tacky%20Setup%201.0.0.exe"
            style={{
              display: "inline-block",
              padding: "14px 22px",
              background: "#22c55e",
              borderRadius: "12px",
              color: "white",
              fontWeight: "bold",
              textDecoration: "none",
              fontSize: "16px",
            }}
          >
            Télécharger le Tacky
          </a>

          <div style={{ marginTop: "25px", fontSize: "14px", opacity: 0.8 }}>
            <p>Installation :</p>
            <ul>
              <li>Télécharger le fichier</li>
              <li>Lancer l'installation</li>
              <li>Ouvrir le Tacky</li>
              <li>Lancer votre jeu (ETS2 / ATS)</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}