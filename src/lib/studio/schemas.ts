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
