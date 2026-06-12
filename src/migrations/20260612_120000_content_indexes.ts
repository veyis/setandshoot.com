import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Indexes for the published/featured/playedAt filters used by the public story
// and photo queries. IF NOT EXISTS so it's safe even where dev push already
// created them. Names match Payload's `{table}_{column}_idx` convention.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE INDEX IF NOT EXISTS "stories_published_idx" ON "payload"."stories" USING btree ("published");
  CREATE INDEX IF NOT EXISTS "stories_featured_idx" ON "payload"."stories" USING btree ("featured");
  CREATE INDEX IF NOT EXISTS "stories_played_at_idx" ON "payload"."stories" USING btree ("played_at");
  CREATE INDEX IF NOT EXISTS "photos_published_idx" ON "payload"."photos" USING btree ("published");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "payload"."stories_published_idx";
  DROP INDEX IF EXISTS "payload"."stories_featured_idx";
  DROP INDEX IF EXISTS "payload"."stories_played_at_idx";
  DROP INDEX IF EXISTS "payload"."photos_published_idx";`)
}
