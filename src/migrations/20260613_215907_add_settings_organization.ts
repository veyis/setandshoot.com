import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."settings" ADD COLUMN IF NOT EXISTS "organization_instagram" varchar;
    ALTER TABLE "payload"."settings" ADD COLUMN IF NOT EXISTS "organization_linkedin" varchar;
    ALTER TABLE "payload"."settings" ADD COLUMN IF NOT EXISTS "organization_email" varchar;
    ALTER TABLE "payload"."settings" ADD COLUMN IF NOT EXISTS "organization_phone" varchar;
    ALTER TABLE "payload"."settings" ADD COLUMN IF NOT EXISTS "organization_city" varchar DEFAULT 'Bremen';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."settings" DROP COLUMN IF EXISTS "organization_instagram";
    ALTER TABLE "payload"."settings" DROP COLUMN IF EXISTS "organization_linkedin";
    ALTER TABLE "payload"."settings" DROP COLUMN IF EXISTS "organization_email";
    ALTER TABLE "payload"."settings" DROP COLUMN IF EXISTS "organization_phone";
    ALTER TABLE "payload"."settings" DROP COLUMN IF EXISTS "organization_city";
  `)
}
