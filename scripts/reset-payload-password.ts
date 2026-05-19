/**
 * Legacy: set a Payload-local password on a CMS user record.
 * Normal sign-in uses Neon Auth only — prefer `pnpm neon:reset-password`.
 *
 * Usage:
 *   pnpm payload:reset-password <email> <new-password>
 */
import { getPayload } from "payload";
import config from "@payload-config";

const email = process.argv[2]?.trim().toLowerCase();
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error("Usage: pnpm payload:reset-password <email> <new-password>");
  process.exit(1);
}

const payload = await getPayload({ config });

const { docs } = await payload.find({
  collection: "users",
  where: { email: { equals: email } },
  limit: 1,
  depth: 0,
  overrideAccess: true,
});

const user = docs[0];
if (!user) {
  console.error(`No Payload user found for ${email}`);
  await payload.destroy();
  process.exit(1);
}

await payload.update({
  collection: "users",
  id: user.id,
  data: { password: newPassword },
  overrideAccess: true,
});

console.log(`Password updated for Payload user ${email} (id ${user.id})`);
await payload.destroy();
