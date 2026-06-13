import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."about_page_locales" (
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."contact_page_locales" (
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."services_page_locales" (
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."athletes_page_locales" (
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."highlights_page_locales" (
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload"."about_page_locales" ADD CONSTRAINT "about_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."contact_page_locales" ADD CONSTRAINT "contact_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."contact_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."services_page_locales" ADD CONSTRAINT "services_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."services_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."athletes_page_locales" ADD CONSTRAINT "athletes_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."athletes_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."highlights_page_locales" ADD CONSTRAINT "highlights_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."highlights_page"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "about_page_locales_locale_parent_id_unique" ON "payload"."about_page_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "contact_page_locales_locale_parent_id_unique" ON "payload"."contact_page_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "services_page_locales_locale_parent_id_unique" ON "payload"."services_page_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "athletes_page_locales_locale_parent_id_unique" ON "payload"."athletes_page_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "highlights_page_locales_locale_parent_id_unique" ON "payload"."highlights_page_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."about_page_locales" CASCADE;
  DROP TABLE "payload"."contact_page_locales" CASCADE;
  DROP TABLE "payload"."services_page_locales" CASCADE;
  DROP TABLE "payload"."athletes_page_locales" CASCADE;
  DROP TABLE "payload"."highlights_page_locales" CASCADE;`)
}
