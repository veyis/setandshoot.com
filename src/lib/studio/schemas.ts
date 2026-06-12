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
