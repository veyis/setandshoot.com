import type { Locale } from "@/lib/i18n/config";

/** Cinematic hero loop (8s, 1280×720, H.264) — source: public/videos/mp_.mp4 */
export const HERO_VIDEO = {
  src: "/videos/mp_.mp4",
  poster: "/images/landing/editorial-spike-real.jpg",
  width: 1280,
  height: 720,
  objectPosition: "55% 42%",
} as const;

export function getHeroVideoAriaLabel(locale: Locale): string {
  return locale === "en"
    ? "Cinematic volleyball match footage in an indoor arena"
    : "Cinematische Volleyball-Szene in einer Sporthalle";
}
