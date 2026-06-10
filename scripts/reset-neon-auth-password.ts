/**
 * Reset a Neon Auth user's password locally (dev/recovery).
 * Does not touch Payload CMS credentials.
 *
 * Usage:
 *   pnpm neon:reset-password <email> <new-password>
 */
import { sql } from "@payloadcms/db-postgres";
import { getPayload } from "payload";
import config from "@payload-config";

/**
 * The reset flow calls the app's own /api/auth routes, so it needs the dev
 * server's real origin. Next picks the next free port (3000 → 3001 → …) when
 * 3000 is taken, so probe candidate localhost ports and use the first that
 * answers /api/health. Non-localhost origins (e.g. production) are used as-is.
 */
async function resolveSiteUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const url = new URL(configured);
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (!isLocal) return configured;

  const startPort = Number(url.port) || 3000;
  const ports = Array.from({ length: 11 }, (_, i) => startPort + i);
  for (const port of ports) {
    const base = `${url.protocol}//${url.hostname}:${port}`;
    try {
      const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(1000) });
      if (res.ok) {
        if (port !== startPort) console.log(`Detected dev server on port ${port}`);
        return base;
      }
    } catch {
      // nothing listening on this port — try the next one
    }
  }
  throw new Error(
    `No running dev server found on ${url.hostname}:${ports[0]}-${ports[ports.length - 1]}. ` +
      "Start it with `pnpm dev` first.",
  );
}

const email = process.argv[2]?.trim().toLowerCase();
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error("Usage: pnpm neon:reset-password <email> <new-password>");
  process.exit(1);
}

const siteUrl = await resolveSiteUrl();

const payload = await getPayload({ config });

const userRows = await payload.db.drizzle.execute(
  sql`SELECT id::text AS id FROM neon_auth."user" WHERE lower(email) = lower(${email})`,
);
const userId = userRows.rows[0]?.id as string | undefined;
if (!userId) {
  console.error(`No Neon Auth user found for ${email}`);
  await payload.destroy();
  process.exit(1);
}

const resetRequest = await fetch(`${siteUrl}/api/auth/request-password-reset`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: siteUrl },
  body: JSON.stringify({
    email,
    redirectTo: `${siteUrl}/reset-password`,
  }),
});

if (!resetRequest.ok) {
  console.error("request-password-reset failed:", await resetRequest.text());
  await payload.destroy();
  process.exit(1);
}

const tokenRows = await payload.db.drizzle.execute(
  sql`
    SELECT identifier
    FROM neon_auth.verification
    WHERE identifier LIKE 'reset-password:%'
      AND value = ${userId}
    ORDER BY "createdAt" DESC
    LIMIT 1
  `,
);

const identifier = tokenRows.rows[0]?.identifier as string | undefined;
if (!identifier?.startsWith("reset-password:")) {
  console.error("No reset token found after request-password-reset");
  await payload.destroy();
  process.exit(1);
}

const token = identifier.slice("reset-password:".length);
const resetResponse = await fetch(`${siteUrl}/api/auth/reset-password`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: siteUrl },
  body: JSON.stringify({ token, newPassword: String(newPassword) }),
});

if (!resetResponse.ok) {
  console.error("reset-password failed:", await resetResponse.text());
  await payload.destroy();
  process.exit(1);
}

console.log(`Neon Auth password updated for ${email}`);
console.log(`Sign in at ${siteUrl}/sign-in (this is separate from Payload /admin login).`);

await payload.destroy();
