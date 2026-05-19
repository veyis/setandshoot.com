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

export type LandingPhotoHeroMeta = {
  kicker: Record<Locale, string>;
  cameraSpec: Record<Locale, string>;
  location: Record<Locale, string>;
};

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
  /** Per-photo hero metadata. Present for every hero-rotation photo. */
  hero?: LandingPhotoHeroMeta;
};

/** Shared output dimensions — 3:2, generated at 1536×1024 then JPEG-compressed. */
const FRAME = { width: 1536, height: 1024 } as const;

/**
 * Narrative hero order — each frame a distinct peak moment.
 * All 7 rotate in the landing hero crossfade and feed the work mosaic.
 * `cover` leads as the photo-of-the-year lead.
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
    hero: {
      kicker: {
        en: "Cover frame · golden rim light",
        de: "Cover-Frame · goldenes Randlicht",
      },
      cameraSpec: {
        en: "Canon R5 · 70–200 f/2.8 · 1/2000 s",
        de: "Canon R5 · 70–200 f/2.8 · 1/2000 s",
      },
      location: {
        en: "Bremen, 2026",
        de: "Bremen, 2026",
      },
    },
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
    hero: {
      kicker: {
        en: "Net joust · ball between the hands",
        de: "Netz-Duell · Ball zwischen den Händen",
      },
      cameraSpec: {
        en: "Canon R5 · 70–200 f/2.8 · 1/1800 s",
        de: "Canon R5 · 70–200 f/2.8 · 1/1800 s",
      },
      location: {
        en: "Hamburg, 2026",
        de: "Hamburg, 2026",
      },
    },
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
    hero: {
      kicker: {
        en: "Outside hitter · peak moment",
        de: "Außenangriff · Peak-Moment",
      },
      cameraSpec: {
        en: "Canon R5 · 70–200 f/2.8 · 1/2000 s",
        de: "Canon R5 · 70–200 f/2.8 · 1/2000 s",
      },
      location: {
        en: "Bremen, 2026",
        de: "Bremen, 2026",
      },
    },
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
    hero: {
      kicker: {
        en: "Setter · ball on the fingertips",
        de: "Zuspielerin · Ball an den Fingerspitzen",
      },
      cameraSpec: {
        en: "Canon R5 · 24–70 f/2.8 · 1/1600 s",
        de: "Canon R5 · 24–70 f/2.8 · 1/1600 s",
      },
      location: {
        en: "Schwerin, 2026",
        de: "Schwerin, 2026",
      },
    },
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
    hero: {
      kicker: {
        en: "Double block · low angle",
        de: "Doppelblock · Untersicht",
      },
      cameraSpec: {
        en: "Canon R5 · 24–70 f/2.8 · 1/1600 s",
        de: "Canon R5 · 24–70 f/2.8 · 1/1600 s",
      },
      location: {
        en: "Hamburg, 2026",
        de: "Hamburg, 2026",
      },
    },
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
    hero: {
      kicker: {
        en: "Jump serve · full extension",
        de: "Sprungaufschlag · volle Streckung",
      },
      cameraSpec: {
        en: "Canon R5 · 70–200 f/2.8 · 1/2500 s",
        de: "Canon R5 · 70–200 f/2.8 · 1/2500 s",
      },
      location: {
        en: "Berlin, 2026",
        de: "Berlin, 2026",
      },
    },
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
    hero: {
      kicker: {
        en: "Floor dig · worm's-eye",
        de: "Bodenabwehr · Bodenperspektive",
      },
      cameraSpec: {
        en: "Canon R5 · 16–35 f/2.8 · 1/1250 s",
        de: "Canon R5 · 16–35 f/2.8 · 1/1250 s",
      },
      location: {
        en: "Bremen, 2026",
        de: "Bremen, 2026",
      },
    },
  },
];

export type ResolvedLandingPhoto = Omit<LandingPhoto, "alt" | "hero"> & {
  alt: string;
  kicker: string;
  cameraSpec: string;
  location: string;
};

function resolveHeroStrings(
  photo: LandingPhoto,
  locale: Locale,
): Pick<ResolvedLandingPhoto, "kicker" | "cameraSpec" | "location"> {
  if (!photo.hero) return { kicker: "", cameraSpec: "", location: "" };
  return {
    kicker: photo.hero.kicker[locale] ?? photo.hero.kicker.de,
    cameraSpec: photo.hero.cameraSpec[locale] ?? photo.hero.cameraSpec.de,
    location: photo.hero.location[locale] ?? photo.hero.location.de,
  };
}

export function getLandingPhotos(locale: Locale): ResolvedLandingPhoto[] {
  return LANDING_PHOTOS.map((photo) => {
    const { alt, hero: _hero, ...rest } = photo;
    return {
      ...rest,
      alt: alt[locale] ?? alt.de,
      ...resolveHeroStrings(photo, locale),
    };
  });
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
