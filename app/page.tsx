import background from "./truck.jpg";

export default function Home() {
  return (
    <main
      style={{
        width: "100vw",
        height: "100vh",
        backgroundImage: `url(${background.src})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        margin: 0,
      }}
    />
  );
}