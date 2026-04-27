"use client";

import { useEffect, useState } from "react";

type Driver = {
  id: string;
  username: string | null;
  avatar: string | null;
  lastMapX: number | null;
  lastMapY: number | null;
  lastHeading?: number | null;
};

const MAP_MIN_X = -50000;
const MAP_MAX_X = 50000;
const MAP_MIN_Y = -50000;
const MAP_MAX_Y = 50000;

function toPercentX(x: number) {
  return ((x - MAP_MIN_X) / (MAP_MAX_X - MAP_MIN_X)) * 100;
}

function toPercentY(y: number) {
  return 100 - ((y - MAP_MIN_Y) / (MAP_MAX_Y - MAP_MIN_Y)) * 100;
}

export default function LiveMap() {
  const [drivers, setDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    async function fetchDrivers() {
      try {
        const res = await fetch("/api/tacky/live/list", {
          cache: "no-store",
        });

        const data = await res.json();
        setDrivers(data.drivers || []);
      } catch (error) {
        console.error("Erreur chargement live map :", error);
      }
    }

    fetchDrivers();
    const interval = setInterval(fetchDrivers, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={mapWrapperStyle}>
      <img src="/truck.jpg" alt="Carte live" style={mapImageStyle} />

      <div style={mapOverlayStyle} />

      {drivers.map((driver) => {
        const x = Number(driver.lastMapX);
        const y = Number(driver.lastMapY);

        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

        const left = Math.max(0, Math.min(100, toPercentX(x)));
        const top = Math.max(0, Math.min(100, toPercentY(y)));

        return (
          <div
  key={driver.id}
  style={{
    ...driverMarkerStyle,
    left: `${left}%`,
    top: `${top}%`,
    transform: `translate(-50%, -50%) rotate(${driver.lastHeading || 0}rad)`,
  }}
            title={driver.username || "Chauffeur"}
          >
            {driver.avatar ? (
              <img
                src={driver.avatar}
                alt={driver.username || "Chauffeur"}
                style={driverAvatarStyle}
              />
            ) : (
              <span style={driverDotStyle} />
            )}

            <div style={driverLabelStyle}>
              {driver.username || "Chauffeur"}
            </div>
          </div>
        );
      })}

      <div style={mapInfoStyle}>
        Chauffeurs en ligne : {drivers.length}
      </div>
    </div>
  );
}

const mapWrapperStyle: React.CSSProperties = {
  width: "100%",
  height: "420px",
  position: "relative",
  overflow: "hidden",
  borderRadius: "22px",
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(0,0,0,0.45)",
  boxShadow: "0 22px 60px rgba(0,0,0,0.45)",
};

const mapImageStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const mapOverlayStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(circle at center, rgba(34,197,94,0.08), rgba(0,0,0,0.42))",
  pointerEvents: "none",
};

const driverMarkerStyle: React.CSSProperties = {
  position: "absolute",
  transform: "translate(-50%, -50%)",
  zIndex: 10,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "5px",
};

const driverAvatarStyle: React.CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "50%",
  objectFit: "cover",
  border: "2px solid white",
  boxShadow: "0 0 18px #22c55e",
  background: "#22c55e",
};

const driverDotStyle: React.CSSProperties = {
  width: "18px",
  height: "18px",
  borderRadius: "50%",
  background: "#22c55e",
  border: "2px solid white",
  boxShadow: "0 0 18px #22c55e",
};

const driverLabelStyle: React.CSSProperties = {
  padding: "4px 8px",
  borderRadius: "999px",
  background: "rgba(0,0,0,0.72)",
  border: "1px solid rgba(255,255,255,0.18)",
  color: "white",
  fontSize: "0.72rem",
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const mapInfoStyle: React.CSSProperties = {
  position: "absolute",
  left: "14px",
  bottom: "14px",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(0,0,0,0.7)",
  border: "1px solid rgba(255,255,255,0.18)",
  color: "#bbf7d0",
  fontSize: "0.82rem",
  fontWeight: 900,
};