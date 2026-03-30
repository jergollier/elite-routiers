import "./globals.css";

export const metadata = {
  title: "Elite Routiers",
  description: "Elite Routiers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}