import "./globals.css";
import Menu from "@/app/components/Menu";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body style={bodyStyle}>
        <div style={layoutStyle}>
          <Menu />

          <div style={contentStyle}>{children}</div>
        </div>
      </body>
    </html>
  );
}

const bodyStyle: React.CSSProperties = {
  margin: 0,
  padding: "20px",
  minHeight: "100vh",
  backgroundImage:
    "linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.8)), url('/truck.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  color: "white",
};

const layoutStyle: React.CSSProperties = {
  display: "flex",
  gap: "24px",
  alignItems: "flex-start",
};

const contentStyle: React.CSSProperties = {
  flex: 1,
};