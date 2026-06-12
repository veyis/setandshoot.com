"use server";

import {
  isUniqueViolation,
  requireAdminSession,
  type StoryActionResult,
} from "@/lib/studio/actions/shared";
import {
  competitionSchema,
  tagSchema,
  taxonomyDeleteSchema,
  teamSchema,
} from "@/lib/studio/schemas";
import {
  deleteStudioTaxonomy,
  saveStudioCompetition,
  saveStudioTag,
  saveStudioTeam,
} from "@/lib/studio/taxonomies";

export async function saveTeamAction(input: unknown): Promise<StoryActionResult> {
  if (!(await requireAdminSession())) return { ok: false, error: "forbidden" };
  const parsed = teamSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation" };
  try {
    const { id } = await saveStudioTeam(parsed.data);
    return { ok: true, id };
  } catch {
    return { ok: false, error: "server" };
  }
}

export async function saveCompetitionAction(input: unknown): Promise<StoryActionResult> {
  if (!(await requireAdminSession())) return { ok: false, error: "forbidden" };
  const parsed = competitionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation" };
  try {
    const { id } = await saveStudioCompetition(parsed.data);
    return { ok: true, id };
  } catch {
    return { ok: false, error: "server" };
  }
}

export async function saveTagAction(input: unknown): Promise<StoryActionResult> {
  if (!(await requireAdminSession())) return { ok: false, error: "forbidden" };
  const parsed = tagSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation" };
  try {
    const { id } = await saveStudioTag(parsed.data);
    return { ok: true, id };
  } catch (error) {
    return { ok: false, error: isUniqueViolation(error) ? "slug_taken" : "server" };
  }
}

export async function deleteTaxonomyAction(input: unknown): Promise<StoryActionResult> {
  if (!(await requireAdminSession())) return { ok: false, error: "forbidden" };
  const parsed = taxonomyDeleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation" };
  try {
    await deleteStudioTaxonomy(parsed.data.collection, parsed.data.id);
    return { ok: true };
  } catch {
    return { ok: false, error: "server" };
  }
}
