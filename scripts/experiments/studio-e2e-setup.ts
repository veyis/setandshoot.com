import "dotenv/config";
import { appendFileSync } from "node:fs";
import { sql } from "@payloadcms/db-postgres";
import { getPayload } from "payload";
import config from "@payload-config";

const OUT = "scripts/experiments/studio-e2e-setup.out";
const log = (...p: unknown[]) => appendFileSync(OUT, p.join(" ") + "\n");

const SITE = "https://setandshoot.com";
const EMAIL = process.env.TEST_EMAIL!;
const PASSWORD = process.env.TEST_PASSWORD!;

const res = await fetch(`${SITE}/api/auth/sign-up/email`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: SITE },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: "Studio Smoketest" }),
});
log("signup status:", res.status, (await res.text()).slice(0, 200));

const payload = await getPayload({ config });
const upd = await payload.db.drizzle.execute(
  sql`UPDATE neon_auth."user" SET role = 'admin', "emailVerified" = true WHERE lower(email) = lower(${EMAIL})`,
);
log("promoted rows:", String(upd.rowCount));
const check = await payload.db.drizzle.execute(
  sql`SELECT id::text AS id, role, "emailVerified" FROM neon_auth."user" WHERE lower(email) = lower(${EMAIL})`,
);
log("user:", JSON.stringify(check.rows[0]));
process.exit(0);
