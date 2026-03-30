export default function Home() {
  return (
    <main
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundImage: "url('/truck.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <button
        style={{
          backgroundColor: "#171a21",
          color: "white",
          padding: "18px 40px",
          borderRadius: "10px",
          fontSize: "22px",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
        }}
      >
        <img
          src="/steam.svg"
          alt="Steam"
          style={{ width: "28px", height: "28px" }}
        />
        Connexion avec Steam
      </button>
    </main>
  );
}