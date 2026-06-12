"use server";

import { storyContentSchema, storyCreateSchema, storyMetaSchema } from "@/lib/studio/schemas";
import {
  isUniqueViolation,
  requireAdminSession,
  type StoryActionResult,
} from "@/lib/studio/actions/shared";
import {
  createStudioStory,
  setStudioStoryPublished,
  updateStudioStoryMeta,
} from "@/lib/studio/stories";
import { updateStudioStoryContent } from "@/lib/studio/story-content";

export type { StoryActionResult };

export async function createStoryAction(input: unknown): Promise<StoryActionResult> {
  if (!(await requireAdminSession())) return { ok: false, error: "forbidden" };
  const parsed = storyCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation" };
  try {
    const { id } = await createStudioStory(parsed.data);
    return { ok: true, id };
  } catch (error) {
    return { ok: false, error: isUniqueViolation(error) ? "slug_taken" : "server" };
  }
}

export async function updateStoryMetaAction(input: unknown): Promise<StoryActionResult> {
  if (!(await requireAdminSession())) return { ok: false, error: "forbidden" };
  const parsed = storyMetaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation" };
  try {
    await updateStudioStoryMeta(parsed.data);
    return { ok: true };
  } catch {
    return { ok: false, error: "server" };
  }
}

export async function updateStoryContentAction(input: unknown): Promise<StoryActionResult> {
  if (!(await requireAdminSession())) return { ok: false, error: "forbidden" };
  const parsed = storyContentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation" };
  try {
    await updateStudioStoryContent(parsed.data);
    return { ok: true };
  } catch {
    return { ok: false, error: "server" };
  }
}

export async function setStoryPublishedAction(input: {
  id: number;
  published: boolean;
}): Promise<StoryActionResult> {
  if (!(await requireAdminSession())) return { ok: false, error: "forbidden" };
  if (typeof input?.id !== "number" || typeof input?.published !== "boolean") {
    return { ok: false, error: "validation" };
  }
  try {
    await setStudioStoryPublished(input.id, input.published);
    return { ok: true };
  } catch {
    return { ok: false, error: "server" };
  }
}
