// Shared helpers for studio server actions. NOT a "use server" file — Next
// only allows async-function exports there, so the sync helper and the
// result type live here and the action files import them.
import "server-only";
import { auth } from "@/lib/auth/server";

type Err = "forbidden" | "validation" | "server" | "slug_taken";
export type StoryActionResult = { ok: true; id?: number } | { ok: false; error: Err };

export async function requireAdminSession(): Promise<boolean> {
  const { data: session } = await auth.getSession();
  return session?.user?.role === "admin";
}

export function isUniqueViolation(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return message.includes("unique") || message.includes("duplicate");
}
