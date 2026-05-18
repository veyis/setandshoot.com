import "./globals.css";

export const metadata = {
  title: "Belin Akguel — Volleyball-Fotografie",
  description: "Cinematic volleyball photography from Bremen.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
