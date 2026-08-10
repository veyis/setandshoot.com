 
import "dotenv/config";
import { appendFileSync } from "node:fs";
import { sql } from "@payloadcms/db-postgres";
import { getPayload } from "payload";
import config from "@payload-config";

const OUT = "scripts/experiments/studio-e2e-cleanup.out";
const log = (...p: unknown[]) => appendFileSync(OUT, p.join(" ") + "\n");
const EMAIL = process.env.TEST_EMAIL ?? "studio-smoketest-1306@example.com";

const resolved = await config;
const stories = resolved.collections.find((c: any) => c.slug === "stories");
if (stories) (stories.hooks as any).afterChange = [];

const payload = await getPayload({ config });

// 0. delete smoke-test photos uploaded during the e2e run
const smokePhotos = await payload.find({
  collection: "photos",
  where: { filename: { contains: "studio-smoke-test-bitte-loeschen" } },
  limit: 100,
  overrideAccess: true,
});
for (const doc of smokePhotos.docs) {
  await payload.delete({ collection: "photos", id: doc.id, overrideAccess: true });
}
log(`deleted ${smokePhotos.docs.length} smoke-test photo(s)`);

// 1. delete the smoke-test story (by slug, draft only)
const found = await payload.find({
  collection: "stories",
  where: { slug: { equals: "studio-smoke-test-bitte-loeschen" } },
  limit: 1,
  overrideAccess: true,
});
if (found.docs[0]) {
  await payload.delete({ collection: "stories", id: found.docs[0].id, overrideAccess: true });
  log("deleted story", String(found.docs[0].id));
} else log("no smoke-test story found");

// 2. delete the test admin: payload users row, then neon_auth rows
const users = await payload.find({
  collection: "users",
  where: { email: { equals: EMAIL } },
  limit: 1,
  overrideAccess: true,
});
if (users.docs[0]) {
  await payload.delete({ collection: "users", id: users.docs[0].id, overrideAccess: true });
  log("deleted payload user", String(users.docs[0].id));
} else log("no payload user row");

const del1 = await payload.db.drizzle.execute(
  sql`DELETE FROM neon_auth.session WHERE "userId" IN (SELECT id FROM neon_auth."user" WHERE lower(email) = lower(${EMAIL}))`,
);
const del2 = await payload.db.drizzle.execute(
  sql`DELETE FROM neon_auth.account WHERE "userId" IN (SELECT id FROM neon_auth."user" WHERE lower(email) = lower(${EMAIL}))`,
);
const del3 = await payload.db.drizzle.execute(
  sql`DELETE FROM neon_auth."user" WHERE lower(email) = lower(${EMAIL})`,
);
log(
  "neon_auth deleted: sessions",
  String(del1.rowCount),
  "accounts",
  String(del2.rowCount),
  "users",
  String(del3.rowCount),
);
process.exit(0);
