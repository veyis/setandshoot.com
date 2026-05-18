import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_bookings_locale" AS ENUM('de', 'en');
  CREATE TABLE "payload"."bookings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"organization" varchar,
  	"message" varchar NOT NULL,
  	"locale" "payload"."enum_bookings_locale" DEFAULT 'de' NOT NULL,
  	"customer_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "bookings_id" integer;
  CREATE INDEX "bookings_customer_id_idx" ON "payload"."bookings" USING btree ("customer_id");
  CREATE INDEX "bookings_updated_at_idx" ON "payload"."bookings" USING btree ("updated_at");
  CREATE INDEX "bookings_created_at_idx" ON "payload"."bookings" USING btree ("created_at");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_bookings_fk" FOREIGN KEY ("bookings_id") REFERENCES "payload"."bookings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_bookings_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("bookings_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."bookings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."bookings" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_bookings_fk";
  
  DROP INDEX "payload"."payload_locked_documents_rels_bookings_id_idx";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "bookings_id";
  DROP TYPE "payload"."enum_bookings_locale";`)
}
