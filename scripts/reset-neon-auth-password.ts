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

const email = process.argv[2]?.trim().toLowerCase();
const newPassword = process.argv[3];
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

if (!email || !newPassword) {
  console.error("Usage: pnpm neon:reset-password <email> <new-password>");
  process.exit(1);
}

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
