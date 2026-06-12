"use server";

import { requireAdminSession, type StoryActionResult } from "@/lib/studio/actions/shared";
import {
  datenschutzSchema,
  impressumSchema,
  marketingPageSchema,
  settingsSchema,
} from "@/lib/studio/schemas";
import {
  updateStudioDatenschutz,
  updateStudioImpressum,
  updateStudioSettings,
} from "@/lib/studio/globals";
import { updateMarketingPage } from "@/lib/studio/marketing-pages";

export async function updateSettingsAction(input: unknown): Promise<StoryActionResult> {
  if (!(await requireAdminSession())) return { ok: false, error: "forbidden" };
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation" };
  try {
    await updateStudioSettings(parsed.data);
    return { ok: true };
  } catch {
    return { ok: false, error: "server" };
  }
}

export async function updateImpressumAction(input: unknown): Promise<StoryActionResult> {
  if (!(await requireAdminSession())) return { ok: false, error: "forbidden" };
  const parsed = impressumSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation" };
  try {
    await updateStudioImpressum(parsed.data);
    return { ok: true };
  } catch {
    return { ok: false, error: "server" };
  }
}

export async function updateDatenschutzAction(input: unknown): Promise<StoryActionResult> {
  if (!(await requireAdminSession())) return { ok: false, error: "forbidden" };
  const parsed = datenschutzSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation" };
  try {
    await updateStudioDatenschutz(parsed.data);
    return { ok: true };
  } catch {
    return { ok: false, error: "server" };
  }
}

export async function updateMarketingPageAction(input: unknown): Promise<StoryActionResult> {
  if (!(await requireAdminSession())) return { ok: false, error: "forbidden" };
  const parsed = marketingPageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation" };
  try {
    await updateMarketingPage(parsed.data);
    return { ok: true };
  } catch {
    return { ok: false, error: "server" };
  }
}
