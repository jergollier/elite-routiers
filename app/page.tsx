export default function Home() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundImage: "url('/truck.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        position: "relative",
      }}
    >
      <a
        href="#"
        style={{
          position: "absolute",
          bottom: "120px", // remonte le bouton
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: "15px",
          background: "#000000",
          color: "white",
          padding: "18px 45px",
          borderRadius: "999px",
          fontSize: "1.3rem",
          textDecoration: "none",
          fontWeight: "bold",
          boxShadow: "0 10px 30px rgba(0,0,0,0.9)",
          border: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        <img
          src="/steam.png"
          alt="Steam"
          style={{
            width: "32px",
            height: "32px",
            objectFit: "contain",
          }}
        />
        Se connecter avec Steam
      </a>
    </div>
  );
}