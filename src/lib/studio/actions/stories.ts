"use server";

import { auth } from "@/lib/auth/server";
import { storyCreateSchema, storyMetaSchema } from "@/lib/studio/schemas";
import {
  createStudioStory,
  setStudioStoryPublished,
  updateStudioStoryMeta,
} from "@/lib/studio/stories";

type Err = "forbidden" | "validation" | "server" | "slug_taken";
export type StoryActionResult = { ok: true; id?: number } | { ok: false; error: Err };

async function requireAdminSession(): Promise<boolean> {
  const { data: session } = await auth.getSession();
  return session?.user?.role === "admin";
}

function isUniqueViolation(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return message.includes("unique") || message.includes("duplicate");
}

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
