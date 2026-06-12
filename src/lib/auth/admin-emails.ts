/** Comma-separated admin emails from env (not validated in env.ts — optional). */
let cached: Set<string> | null = null;

export function getAdminEmails(): Set<string> {
  // Env is fixed for the lifetime of a serverless instance; parse once.
  if (cached) return cached;
  const raw = process.env.ADMIN_EMAILS ?? "";
  cached = new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
  return cached;
}

export function isAdminEmail(email: string): boolean {
  return getAdminEmails().has(email.trim().toLowerCase());
}
