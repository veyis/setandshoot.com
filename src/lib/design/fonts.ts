import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";

export const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  // Hero LCP uses weight 400/500 roman only; italic loads on demand for later scenes.
  weight: ["400", "500"],
  style: ["normal", "italic"],
  preload: true,
  adjustFontFallback: true,
});

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500"],
  preload: true,
  adjustFontFallback: true,
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["400"],
  preload: false,
  adjustFontFallback: true,
});
