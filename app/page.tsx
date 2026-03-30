import { cookies } from "next/headers";

export default function Home() {
  const cookieStore = cookies() as any;
  const steamId = cookieStore.get("steamId")?.value;

  return (
    <div style={{ width: "100vw", height: "100vh", backgroundImage: "url('/truck.jpg')", backgroundSize: "cover", backgroundPosition: "center", position: "relative" }}>
      {!steamId ? (
        <a href="/api/steam/login"
          style={{
            position: "absolute", bottom: "120px", left: "50%", transform: "translateX(-50%)",
            display: "flex", alignItems: "center", gap: "12px", background: "#000", color: "white",
            padding: "18px 45px", borderRadius: "999px", fontSize: "1.3rem", fontWeight: "bold",
            boxShadow: "0 0 20px rgba(0,200,255,0.6)", transition: "all 0.3s ease"
          }}
          onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 0 30px rgba(0,200,255,1)"}
          onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 0 20px rgba(0,200,255,0.6)"}
        >
          <img src="/steam.png" alt="Steam" style={{ width: "32px", height: "32px", objectFit: "contain" }}/>
          Se connecter avec Steam
        </a>
      ) : (
        <div style={{
          position: "absolute", bottom: "120px", left: "50%", transform: "translateX(-50%)",
          display: "flex", alignItems: "center", gap: "16px", background: "#000", color: "white",
          padding: "18px 28px", borderRadius: "999px", fontSize: "1.1rem", boxShadow: "0 10px 30px rgba(0,0,0,0.9)",
          border: "1px solid rgba(255,255,255,0.2)"
        }}>
          <span>Connecté avec Steam</span>
          <span style={{ opacity: 0.8 }}>ID : {steamId}</span>
          <a href="/api/steam/logout" style={{ color:"white", textDecoration:"none", border:"1px solid rgba(255,255,255,0.25)", padding:"8px 14px", borderRadius:"999px"}}>Déconnexion</a>
        </div>
      )}
    </div>
  );
}