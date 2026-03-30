export default function Home() {
  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <img
        src="/bg.jpg"
        alt="fond"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
          zIndex: 1,
        }}
      />

      <button
        style={{
          position: "relative",
          zIndex: 2,
          backgroundColor: "#171a21",
          color: "white",
          padding: "18px 40px",
          borderRadius: "10px",
          fontSize: "20px",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
        }}
      >
        <img
          src="/steam.svg"
          alt="Steam"
          style={{ width: "28px", height: "28px" }}
        />
        Connexion avec Steam
      </button>
    </div>
  );
}