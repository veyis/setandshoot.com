import "./globals.css";
import { fraunces, inter, jetbrainsMono } from "@/lib/design/fonts";

export const metadata = {
  title: "Belin Akguel — Volleyball-Fotografie",
  description: "Cinematic volleyball photography from Bremen.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
