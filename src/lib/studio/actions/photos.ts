"use server";

import { auth } from "@/lib/auth/server";
import { photoMetaSchema } from "@/lib/studio/schemas";
import { updatePhotoMeta } from "@/lib/studio/photos";

// "use server" modules may only export async functions — Next's server-action
// transform registers every export as a server reference, so even type-only
// exports can leave dangling runtime bindings in the production build.
type ActionResult = { ok: true } | { ok: false; error: "forbidden" | "validation" | "server" };

export async function updatePhotoMetaAction(input: unknown): Promise<ActionResult> {
  // Server actions are public POST endpoints — re-check the session here,
  // never rely on the proxy gate alone.
  const { data: session } = await auth.getSession();
  if (session?.user?.role !== "admin") {
    return { ok: false, error: "forbidden" };
  }

  const parsed = photoMetaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "validation" };
  }

  try {
    await updatePhotoMeta(parsed.data);
    return { ok: true };
  } catch {
    return { ok: false, error: "server" };
  }
}
