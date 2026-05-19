import type { Locale } from "@/lib/i18n/config";

/** Optimized JPEGs under /images/landing — editorial stock + Gemini block frames. */
export type LandingPhotoRole = "spike" | "block" | "serve" | "block-alt";

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

/**
 * Narrative order: spike → block → serve → block (alt angle).
 * Spike and serve use real editorial stock; block frames use Gemini assets.
 */
export const LANDING_PHOTOS: LandingPhoto[] = [
  {
    id: "spike",
    src: "/images/landing/editorial-spike-real.jpg",
    width: 1588,
    height: 1131,
    objectPosition: "50% 35%",
    alt: {
      de: "Spike im Rauch — dramatische Hallenbeleuchtung",
      en: "Spike through arena smoke — dramatic stadium lighting",
    },
    isHighlight: true,
  },
  {
    id: "block",
    src: "/images/landing/hero-block.jpg",
    width: 2560,
    height: 1429,
    objectPosition: "50% 38%",
    alt: {
      de: "Doppelblock am Netz unter blauem Hallenlicht",
      en: "Double block at the net under blue arena light",
    },
    isHighlight: true,
  },
  {
    id: "serve",
    src: "/images/landing/editorial-serve-real.jpg",
    width: 2200,
    height: 1467,
    objectPosition: "55% 40%",
    alt: {
      de: "Sprungaufschlag — Peak-Moment vor schwarzem Hintergrund",
      en: "Jump serve — peak moment against a dark backdrop",
    },
    isHighlight: true,
  },
  {
    id: "block-alt",
    src: "/images/landing/hero-block-alt.jpg",
    width: 2560,
    height: 1429,
    objectPosition: "50% 40%",
    alt: {
      de: "Block am Netz — symmetrische Action aus der Froschperspektive",
      en: "Net block — symmetrical action from a low angle",
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
  return { ...serve, objectPosition: "50% 22%" };
}
