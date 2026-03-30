import Image from "next/image";
import fondsite from "./fondsite.jpg";

export default function Home() {
  return (
    <main
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <Image
        src={fondsite}
        alt="Fond du site"
        fill
        priority
        style={{
          objectFit: "cover",
          objectPosition: "center",
        }}
      />
    </main>
  );
}