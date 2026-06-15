import { z } from "zod";

// 50 MB. The client uploads originals directly to R2 via a presigned PUT, so the
// old ~4.5 MB Vercel function-body limit no longer applies.
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const TEMP_PREFIX = "tmp/";

export function isAllowedMime(contentType: string): boolean {
  return (ALLOWED_MIME as readonly string[]).includes(contentType);
}

/** Reduce an uploaded filename to a safe object-key segment (no paths/unsafe chars). */
export function sanitizeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? name;
  const cleaned = base
    .replace(/[^a-zA-Z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+/, "")
    .replace(/-\./g, ".")
    .slice(0, 200);
  return cleaned || "upload";
}

/** Guard finalize against reading arbitrary R2 keys — only our temp objects. */
export function isTempKey(key: string): boolean {
  return (
    typeof key === "string" &&
    key.startsWith(TEMP_PREFIX) &&
    key.length > TEMP_PREFIX.length &&
    !key.includes("..") &&
    !key.includes("//")
  );
}

export const presignSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  contentType: z.string().trim().min(1),
  size: z.number().int().positive(),
});

export const finalizeSchema = z.object({
  tempKey: z.string().trim().min(1),
});

export type PresignInput = z.infer<typeof presignSchema>;
export type FinalizeInput = z.infer<typeof finalizeSchema>;

export const photoMetaSchema = z.object({
  id: z.number().int().positive(),
  altDe: z.string().trim().min(1).max(300),
  altEn: z.string().trim().max(300).optional(),
  published: z.boolean(),
  isHighlight: z.boolean(),
  isCover: z.boolean(),
  tagIds: z.array(z.number().int().positive()).optional(),
});

export type PhotoMetaInput = z.infer<typeof photoMetaSchema>;

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const storyCreateSchema = z.object({
  slug: z.string().trim().min(3).max(120).regex(SLUG_PATTERN),
  titleDe: z.string().trim().min(1).max(200),
});

export const storyMetaSchema = z.object({
  id: z.number().int().positive(),
  titleDe: z.string().trim().min(1).max(200),
  titleEn: z.string().trim().max(200).optional(),
  competitionId: z.number().int().positive().nullable().optional(),
  homeTeamId: z.number().int().positive().nullable().optional(),
  awayTeamId: z.number().int().positive().nullable().optional(),
  venue: z.string().trim().max(200).optional(),
  playedAt: z.iso.date().optional(),
  result: z.string().trim().max(50).optional(),
});

export type StoryCreateInput = z.infer<typeof storyCreateSchema>;
export type StoryMetaInput = z.infer<typeof storyMetaSchema>;

/** Minimal Lexical envelope check; deep validation is the editor's job. */
export const richTextValueSchema = z.looseObject({ root: z.unknown() });

const photoId = z.number().int().positive();
const blockId = z.string().min(1).optional();

export const storyBlockSchema = z.discriminatedUnion("blockType", [
  z.object({ id: blockId, blockType: z.literal("fullBleedPhoto"), photoId }),
  z.object({
    id: blockId,
    blockType: z.literal("diptych"),
    photoLeftId: photoId,
    photoRightId: photoId,
    ratio: z.enum(["50-50", "60-40"]),
  }),
  z.object({ id: blockId, blockType: z.literal("triptych"), photoIds: z.array(photoId).length(3) }),
  z.object({
    id: blockId,
    blockType: z.literal("insetPortrait"),
    photoId,
    textDe: richTextValueSchema.optional(),
    textEn: richTextValueSchema.optional(),
  }),
  z.object({
    id: blockId,
    blockType: z.literal("sequence"),
    photoIds: z.array(photoId).min(2).max(6),
    captionDe: z.string().trim().max(500).optional(),
    captionEn: z.string().trim().max(500).optional(),
  }),
  z.object({
    id: blockId,
    blockType: z.literal("pullQuote"),
    quoteDe: z.string().trim().min(1).max(500),
    quoteEn: z.string().trim().max(500).optional(),
    attributionDe: z.string().trim().max(200).optional(),
    attributionEn: z.string().trim().max(200).optional(),
  }),
  z.object({
    id: blockId,
    blockType: z.literal("textParagraph"),
    textDe: richTextValueSchema,
    textEn: richTextValueSchema.optional(),
  }),
]);

export const storyContentSchema = z.object({
  id: z.number().int().positive(),
  coverPhotoId: photoId.nullable(),
  summaryDe: richTextValueSchema.optional(),
  summaryEn: richTextValueSchema.optional(),
  blocks: z.array(storyBlockSchema).max(50),
});

export type StoryBlockInput = z.infer<typeof storyBlockSchema>;
export type StoryContentInput = z.infer<typeof storyContentSchema>;

export const settingsSchema = z.object({
  defaultWatermark: z.boolean(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  homeFeaturedCount: z.number().int().min(1).max(6),
});

export const impressumSchema = z.object({
  legalName: z.string().trim().min(1).max(200),
  addressLine1: z.string().trim().min(1).max(200),
  addressLine2: z.string().trim().max(200).optional(),
  postalCode: z.string().trim().min(1).max(20),
  city: z.string().trim().min(1).max(100),
  country: z.string().trim().min(1).max(100),
  email: z.email(),
  phone: z.string().trim().max(50).optional(),
  ustIdNr: z.string().trim().max(50).optional(),
  responsibleForContent: z.string().trim().max(200).optional(),
  additionalNotesDe: z.string().trim().max(5000).optional(),
  additionalNotesEn: z.string().trim().max(5000).optional(),
});

export const datenschutzSchema = z.object({
  titleDe: z.string().trim().min(1).max(200),
  titleEn: z.string().trim().max(200).optional(),
  introDe: richTextValueSchema.optional(),
  introEn: richTextValueSchema.optional(),
  bodyDe: richTextValueSchema.optional(),
  bodyEn: richTextValueSchema.optional(),
  lastUpdated: z.iso.date(),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
export type ImpressumInput = z.infer<typeof impressumSchema>;
export type DatenschutzInput = z.infer<typeof datenschutzSchema>;

// Absent id = create, present id = update.
const taxonomyId = z.number().int().positive().optional();
const tierEnum = z.enum(["bundesliga", "2-bundesliga", "regional", "youth"]);

export const teamSchema = z.object({
  id: taxonomyId,
  name: z.string().trim().min(1).max(200),
  shortName: z.string().trim().max(50).optional(),
  city: z.string().trim().max(100).optional(),
  tier: tierEnum.nullable().optional(),
  published: z.boolean(),
});

export const competitionSchema = z.object({
  id: taxonomyId,
  name: z.string().trim().min(1).max(200),
  season: z.string().trim().min(1).max(50),
  tier: tierEnum.nullable().optional(),
  published: z.boolean(),
});

export const tagSchema = z.object({
  id: taxonomyId,
  nameDe: z.string().trim().min(1).max(100),
  nameEn: z.string().trim().max(100).optional(),
  slug: z.string().trim().min(1).max(120).regex(SLUG_PATTERN),
  published: z.boolean(),
});

export const taxonomyDeleteSchema = z.object({
  collection: z.enum(["teams", "competitions", "tags"]),
  id: z.number().int().positive(),
});

export type TeamInput = z.infer<typeof teamSchema>;
export type CompetitionInput = z.infer<typeof competitionSchema>;
export type TagInput = z.infer<typeof tagSchema>;
export type TaxonomyDeleteInput = z.infer<typeof taxonomyDeleteSchema>;

const serviceOfferItem = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(2000),
});

export const marketingSectionSchema = z.discriminatedUnion("blockType", [
  z.object({
    id: blockId,
    blockType: z.literal("pageHeader"),
    labelDe: z.string().trim().max(200).optional(),
    labelEn: z.string().trim().max(200).optional(),
    titleDe: z.string().trim().min(1).max(300),
    titleEn: z.string().trim().max(300).optional(),
    introDe: z.string().trim().max(2000).optional(),
    introEn: z.string().trim().max(2000).optional(),
  }),
  z.object({
    id: blockId,
    blockType: z.literal("portraitFigure"),
    photoId: photoId.nullable(),
    captionDe: z.string().trim().max(500).optional(),
    captionEn: z.string().trim().max(500).optional(),
  }),
  z.object({
    id: blockId,
    blockType: z.literal("editorialProse"),
    eyebrowDe: z.string().trim().max(200).optional(),
    eyebrowEn: z.string().trim().max(200).optional(),
    titleDe: z.string().trim().max(500).optional(),
    titleEn: z.string().trim().max(500).optional(),
    body1De: richTextValueSchema.optional(),
    body1En: richTextValueSchema.optional(),
    pullQuoteDe: z.string().trim().max(500).optional(),
    pullQuoteEn: z.string().trim().max(500).optional(),
    body2De: richTextValueSchema.optional(),
    body2En: richTextValueSchema.optional(),
    creditsDe: z.string().trim().max(1000).optional(),
    creditsEn: z.string().trim().max(1000).optional(),
  }),
  z.object({
    id: blockId,
    blockType: z.literal("ctaLink"),
    labelDe: z.string().trim().min(1).max(200),
    labelEn: z.string().trim().max(200).optional(),
    target: z.enum([
      "/contact",
      "/about",
      "/athletes",
      "/services",
      "/highlights",
      "/stories",
      "/",
    ]),
  }),
  z.object({
    id: blockId,
    blockType: z.literal("serviceOffers"),
    itemsDe: z.array(serviceOfferItem).max(20),
    itemsEn: z.array(serviceOfferItem).max(20).optional(),
  }),
]);

export const marketingPageSchema = z.object({
  slug: z.enum(["aboutPage", "servicesPage", "contactPage", "athletesPage", "highlightsPage"]),
  sections: z.array(marketingSectionSchema).max(30),
});

export type MarketingSectionInput = z.infer<typeof marketingSectionSchema>;
export type MarketingPageInput = z.infer<typeof marketingPageSchema>;
