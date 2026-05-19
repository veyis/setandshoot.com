import type { Locale } from "@/lib/i18n/config";

/** Every custom hero JPEG under /public/images/landing — audit checklist. */
export const HERO_IMAGE_FILES = [
  "hero-cover.jpg",
  "hero-joust.jpg",
  "hero-spike.jpg",
  "hero-set.jpg",
  "hero-block.jpg",
  "hero-serve.jpg",
  "hero-dig.jpg",
] as const;

/** Custom-generated landing frames under /images/landing. */
export type LandingPhotoRole = "cover" | "joust" | "spike" | "set" | "block" | "serve" | "dig";

export type LandingPhoto = {
  id: LandingPhotoRole;
  /** Path served from /public — optimized JPEG for LCP. */
  src: string;
  width: number;
  height: number;
  /** CSS object-position for full-bleed crops (overlay sits bottom-left). */
  objectPosition: string;
  alt: Record<Locale, string>;
  isHighlight: boolean;
};

/** Shared output dimensions — 3:2, generated at 1536×1024 then JPEG-compressed. */
const FRAME = { width: 1536, height: 1024 } as const;

/**
 * Narrative hero order — each frame a distinct peak moment.
 * All rotate in the landing hero crossfade and feed the work mosaic.
 */
export const LANDING_PHOTOS: LandingPhoto[] = [
  {
    id: "cover",
    src: "/images/landing/hero-cover.jpg",
    ...FRAME,
    objectPosition: "58% 40%",
    alt: {
      de: "Angriff im absoluten Peak — goldenes Randlicht, Cover-Moment des Jahres",
      en: "Attack at absolute peak — golden rim light, photo-of-the-year cover moment",
    },
    isHighlight: true,
  },
  {
    id: "joust",
    src: "/images/landing/hero-joust.jpg",
    ...FRAME,
    objectPosition: "52% 42%",
    alt: {
      de: "Netz-Duell — Angriff trifft Block in der Luft, Ball im letzten Millimeter",
      en: "Net joust — spike meets block mid-air, ball frozen between their hands",
    },
    isHighlight: true,
  },
  {
    id: "spike",
    src: "/images/landing/hero-spike.jpg",
    ...FRAME,
    objectPosition: "62% 40%",
    alt: {
      de: "Angreiferin schlägt am Netz — eingefrorener Peak-Moment, Hallenlicht von der Seite",
      en: "Outside hitter spiking at the net — frozen peak moment, sidelight from the arena",
    },
    isHighlight: true,
  },
  {
    id: "set",
    src: "/images/landing/hero-set.jpg",
    ...FRAME,
    objectPosition: "55% 38%",
    alt: {
      de: "Zuspielerin im Sprung — Ball an den Fingerspitzen, Cover-Moment",
      en: "Setter at full extension — ball on fingertips, magazine-cover moment",
    },
    isHighlight: true,
  },
  {
    id: "block",
    src: "/images/landing/hero-block.jpg",
    ...FRAME,
    objectPosition: "50% 38%",
    alt: {
      de: "Doppelblock am Netz — Froschperspektive, blaues Hallenlicht von oben",
      en: "Double block at the net — low angle, cool overhead arena light",
    },
    isHighlight: true,
  },
  {
    id: "serve",
    src: "/images/landing/hero-serve.jpg",
    ...FRAME,
    objectPosition: "58% 45%",
    alt: {
      de: "Sprungaufschlag — volle Streckung, langer Schatten auf dem Parkett",
      en: "Jump serve — full extension, long shadow across the court floor",
    },
    isHighlight: true,
  },
  {
    id: "dig",
    src: "/images/landing/hero-dig.jpg",
    ...FRAME,
    objectPosition: "52% 55%",
    alt: {
      de: "Hechtverteidigung über dem Parkett — Bodenperspektive, Ball im letzten Moment",
      en: "Floor dig — courtside worm's-eye view, ball inches from the wood",
    },
    isHighlight: true,
  },
];

export type ResolvedLandingPhoto = Omit<LandingPhoto, "alt"> & { alt: string };

export function getLandingPhotos(locale: Locale): ResolvedLandingPhoto[] {
  return LANDING_PHOTOS.map((photo) => ({
    ...photo,
    alt: photo.alt[locale] ?? photo.alt.de,
  }));
}

export function getHeroPhotos(locale: Locale): ResolvedLandingPhoto[] {
  return getLandingPhotos(locale);
}

export function getHighlightPhotos(locale: Locale): ResolvedLandingPhoto[] {
  return getLandingPhotos(locale).filter((p) => p.isHighlight);
}

/** Wide action frame for the closing booking band. */
export function getBookingBackgroundPhoto(locale: Locale): ResolvedLandingPhoto {
  const spike = getLandingPhotos(locale).find((p) => p.id === "spike");
  if (!spike) throw new Error("landing: spike photo missing");
  return spike;
}

/** Editorial crop for the about teaser when no CMS portrait exists. */
export function getAboutFallbackPhoto(locale: Locale): ResolvedLandingPhoto {
  const serve = getLandingPhotos(locale).find((p) => p.id === "serve");
  if (!serve) throw new Error("landing: serve photo missing");
  return { ...serve, objectPosition: "58% 30%" };
}
