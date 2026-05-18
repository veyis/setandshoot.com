// scripts/seed/photo-manifest.ts
export type PhotoManifestEntry = {
  /** filename inside public/media/seeds/ */
  file: string;
  altDe: string;
  altEn: string;
  isHighlight: boolean;
  isCover: boolean;
  /** ids of tag slugs to attach (resolved at seed time) */
  tagSlugs: string[];
  /** Pexels photo id (for attribution) */
  pexelsId: string;
  photographer: string;
};

export const SEED_TAG_SLUGS = ["seed", "portrait"] as const;

export const PHOTO_MANIFEST: PhotoManifestEntry[] = [
  {
    file: "01-hero-spike.jpg",
    altDe: "Angreiferin schlägt den Ball über das Netz",
    altEn: "Hitter spiking the ball over the net",
    isHighlight: true,
    isCover: false,
    tagSlugs: ["seed"],
    pexelsId: "6203581",
    photographer: "Pavel Danilyuk",
  },
  {
    file: "02-hero-block.jpg",
    altDe: "Doppelblock am Netz",
    altEn: "Two players blocking at the net",
    isHighlight: true,
    isCover: false,
    tagSlugs: ["seed"],
    pexelsId: "6203632",
    photographer: "Pavel Danilyuk",
  },
  {
    file: "03-hero-serve.jpg",
    altDe: "Sprungaufschlag im Volleyballspiel",
    altEn: "Jump serve in a volleyball match",
    isHighlight: true,
    isCover: false,
    tagSlugs: ["seed"],
    pexelsId: "6203561",
    photographer: "Pavel Danilyuk",
  },
  {
    file: "04-hero-celebration.jpg",
    altDe: "Mannschaft feiert einen Punkt",
    altEn: "Team celebrating a point",
    isHighlight: true,
    isCover: false,
    tagSlugs: ["seed"],
    pexelsId: "35514787",
    photographer: "Pexels community",
  },
  {
    file: "05-hero-dive.jpg",
    altDe: "Abwehrspielerin im Hechtsprung",
    altEn: "Libero diving for a dig",
    isHighlight: true,
    isCover: false,
    tagSlugs: ["seed"],
    pexelsId: "28554758",
    photographer: "Pexels community",
  },
  {
    file: "06-story-cover.jpg",
    altDe: "Cover-Bild: Spielerin vor leerer Tribüne",
    altEn: "Cover shot: player in front of an empty stand",
    isHighlight: false,
    isCover: true,
    tagSlugs: ["seed"],
    pexelsId: "31044958",
    photographer: "Pexels community",
  },
  {
    file: "07-story-set.jpg",
    altDe: "Zuspielerin stellt den Ball",
    altEn: "Setter delivering an assist",
    isHighlight: false,
    isCover: false,
    tagSlugs: ["seed"],
    pexelsId: "6180401",
    photographer: "Kampus Production",
  },
  {
    file: "08-story-aftermatch.jpg",
    altDe: "Spielerin auf der Bank nach dem Match",
    altEn: "Player on the bench after the match",
    isHighlight: false,
    isCover: false,
    tagSlugs: ["seed"],
    pexelsId: "12169229",
    photographer: "RDNE Stock project",
  },
  {
    file: "09-portrait.jpg",
    altDe: "Porträt einer Volleyballspielerin",
    altEn: "Portrait of a volleyball player",
    isHighlight: false,
    isCover: false,
    tagSlugs: ["seed", "portrait"],
    pexelsId: "6180398",
    photographer: "Kampus Production",
  },
  {
    file: "10-action-wide.jpg",
    altDe: "Spielszene im Weitwinkel",
    altEn: "Wide-angle match scene",
    isHighlight: true,
    isCover: false,
    tagSlugs: ["seed"],
    pexelsId: "9832120",
    photographer: "Tom Fisk",
  },
];
