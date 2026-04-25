export default function TelechargementPage() {
  const version = "1.0.0";

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.9)), url('/truck.jpg')",
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
            fontSize: "38px",
            fontWeight: 900,
            marginBottom: "10px",
          }}
        >
          Télécharger le Tacky Elite Routiers
        </h1>

        <div style={{ opacity: 0.7, marginBottom: "25px" }}>
          Version actuelle : {version}
        </div>

        <div
          style={{
            background: "rgba(0,0,0,0.45)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(6px)",
            borderRadius: "20px",
            padding: "25px",
          }}
        >
          <p style={{ marginBottom: "20px", lineHeight: 1.6 }}>
            Le <strong>Tacky Elite Routiers</strong> envoie automatiquement vos
            données de conduite vers le site et permet un suivi en temps réel
            (livraisons, distance, activité chauffeur…).
          </p>

          <a
            href="https://evsucubtev4fgabq.public.blob.vercel-storage.com/Elite%20Routier%20Tacky%20Setup%201.0.0.exe"
            style={{
              display: "inline-block",
              padding: "14px 24px",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              borderRadius: "12px",
              color: "white",
              fontWeight: "bold",
              textDecoration: "none",
              fontSize: "16px",
              boxShadow: "0 0 20px rgba(34,197,94,0.4)",
            }}
          >
            Télécharger le Tacky
          </a>

          <div
            style={{
              marginTop: "25px",
              fontSize: "14px",
              opacity: 0.85,
              lineHeight: 1.6,
            }}
          >
            <p style={{ fontWeight: "bold" }}>Installation :</p>
            <ul>
              <li>Télécharger le fichier</li>
              <li>Lancer l'installation</li>
              <li>Ouvrir le Tacky</li>
              <li>Cliquer sur "Se connecter"</li>
              <li>Lancer ETS2 ou ATS</li>
            </ul>
          </div>

          <div
            style={{
              marginTop: "20px",
              padding: "15px",
              borderRadius: "12px",
              background: "rgba(59,130,246,0.12)",
              border: "1px solid rgba(59,130,246,0.3)",
              fontSize: "14px",
            }}
          >
            💡 Le Tacky se mettra bientôt à jour automatiquement.  
            Tu n'auras plus besoin de revenir ici pour télécharger les nouvelles versions.
          </div>
        </div>
      </div>
    </main>
  );
}