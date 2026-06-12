import { z } from "zod";

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
