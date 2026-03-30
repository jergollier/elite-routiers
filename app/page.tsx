export default function Home() {
  return (
    <main style={{
      height: "100vh",
      backgroundImage: "url('/ton-image.png')", // ← ton fond
      backgroundSize: "cover",
      backgroundPosition: "center",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "column"
    }}>
      
      {/* LOGO */}
      <img 
        src="/logo.png" 
        alt="Elite Routiers" 
        style={{ width: "400px", marginBottom: "40px" }}
      />

      {/* BOUTON STEAM */}
      <button
        style={{
          backgroundColor: "#171a21",
          color: "white",
          padding: "15px 30px",
          borderRadius: "8px",
          fontSize: "18px",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}
      >
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/8/83/Steam_icon_logo.svg" 
          width="24"
        />
        Connexion avec Steam
      </button>

    </main>
  );
}