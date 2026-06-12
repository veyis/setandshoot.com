import { z } from "zod";

// 4 MB — Vercel rejects serverless request bodies over ~4.5 MB platform-side.
// Follow-up: presigned direct-to-R2 upload to lift the cap.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

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
