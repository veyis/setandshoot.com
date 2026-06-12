import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."_locales" AS ENUM('de', 'en');
  CREATE TYPE "payload"."enum_users_role" AS ENUM('admin', 'editor');
  CREATE TYPE "payload"."enum_stories_blocks_diptych_ratio" AS ENUM('50-50', '60-40');
  CREATE TYPE "payload"."enum_photos_watermark" AS ENUM('none', 'light', 'standard');
  CREATE TYPE "payload"."enum_teams_tier" AS ENUM('bundesliga', '2-bundesliga', 'regional', 'youth');
  CREATE TYPE "payload"."enum_competitions_tier" AS ENUM('bundesliga', '2-bundesliga', 'regional', 'youth');
  CREATE TABLE "payload"."users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "payload"."users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"role" "payload"."enum_users_role" DEFAULT 'editor' NOT NULL,
  	"name" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."stories_blocks_full_bleed_photo" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"photo_id" integer NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."stories_blocks_diptych" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"photo_left_id" integer NOT NULL,
  	"photo_right_id" integer NOT NULL,
  	"ratio" "payload"."enum_stories_blocks_diptych_ratio" DEFAULT '50-50',
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."stories_blocks_triptych" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."stories_blocks_inset_portrait" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"photo_id" integer NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."stories_blocks_inset_portrait_locales" (
  	"text" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."stories_blocks_sequence" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."stories_blocks_sequence_locales" (
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."stories_blocks_pull_quote" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."stories_blocks_pull_quote_locales" (
  	"quote" varchar NOT NULL,
  	"attribution" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."stories_blocks_text_paragraph" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."stories_blocks_text_paragraph_locales" (
  	"text" jsonb NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."stories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"competition_id" integer,
  	"home_team_id" integer,
  	"away_team_id" integer,
  	"venue" varchar,
  	"played_at" timestamp(3) with time zone,
  	"result" varchar,
  	"cover_photo_id" integer,
  	"featured" boolean DEFAULT false,
  	"featured_order" numeric,
  	"published" boolean DEFAULT false,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."stories_locales" (
  	"title" varchar NOT NULL,
  	"summary" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."stories_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"photos_id" integer
  );
  
  CREATE TABLE "payload"."photos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"story_id" integer,
  	"is_highlight" boolean DEFAULT false,
  	"is_cover" boolean DEFAULT false,
  	"order_in_story" numeric,
  	"watermark" "payload"."enum_photos_watermark" DEFAULT 'none',
  	"published" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_feed_url" varchar,
  	"sizes_feed_width" numeric,
  	"sizes_feed_height" numeric,
  	"sizes_feed_mime_type" varchar,
  	"sizes_feed_filesize" numeric,
  	"sizes_feed_filename" varchar,
  	"sizes_full_url" varchar,
  	"sizes_full_width" numeric,
  	"sizes_full_height" numeric,
  	"sizes_full_mime_type" varchar,
  	"sizes_full_filesize" numeric,
  	"sizes_full_filename" varchar
  );
  
  CREATE TABLE "payload"."photos_locales" (
  	"alt" varchar NOT NULL,
  	"caption" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."photos_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer
  );
  
  CREATE TABLE "payload"."teams" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"short_name" varchar,
  	"city" varchar,
  	"tier" "payload"."enum_teams_tier",
  	"published" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."competitions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"season" varchar NOT NULL,
  	"tier" "payload"."enum_competitions_tier",
  	"published" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."tags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"published" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."tags_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload"."payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"stories_id" integer,
  	"photos_id" integer,
  	"teams_id" integer,
  	"competitions_id" integer,
  	"tags_id" integer
  );
  
  CREATE TABLE "payload"."payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."impressum" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"legal_name" varchar NOT NULL,
  	"address_line1" varchar NOT NULL,
  	"address_line2" varchar,
  	"postal_code" varchar NOT NULL,
  	"city" varchar DEFAULT 'Bremen' NOT NULL,
  	"country" varchar DEFAULT 'Deutschland' NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar,
  	"ust_id_nr" varchar,
  	"responsible_for_content" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."impressum_locales" (
  	"additional_notes" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."datenschutz" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"last_updated" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."datenschutz_locales" (
  	"title" varchar DEFAULT 'Datenschutzerklärung' NOT NULL,
  	"intro" jsonb,
  	"body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"default_watermark" boolean DEFAULT false,
  	"accent_color" varchar DEFAULT '#E63946',
  	"home_featured_count" numeric DEFAULT 3,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload"."users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."stories_blocks_full_bleed_photo" ADD CONSTRAINT "stories_blocks_full_bleed_photo_photo_id_photos_id_fk" FOREIGN KEY ("photo_id") REFERENCES "payload"."photos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."stories_blocks_full_bleed_photo" ADD CONSTRAINT "stories_blocks_full_bleed_photo_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."stories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."stories_blocks_diptych" ADD CONSTRAINT "stories_blocks_diptych_photo_left_id_photos_id_fk" FOREIGN KEY ("photo_left_id") REFERENCES "payload"."photos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."stories_blocks_diptych" ADD CONSTRAINT "stories_blocks_diptych_photo_right_id_photos_id_fk" FOREIGN KEY ("photo_right_id") REFERENCES "payload"."photos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."stories_blocks_diptych" ADD CONSTRAINT "stories_blocks_diptych_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."stories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."stories_blocks_triptych" ADD CONSTRAINT "stories_blocks_triptych_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."stories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."stories_blocks_inset_portrait" ADD CONSTRAINT "stories_blocks_inset_portrait_photo_id_photos_id_fk" FOREIGN KEY ("photo_id") REFERENCES "payload"."photos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."stories_blocks_inset_portrait" ADD CONSTRAINT "stories_blocks_inset_portrait_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."stories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."stories_blocks_inset_portrait_locales" ADD CONSTRAINT "stories_blocks_inset_portrait_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."stories_blocks_inset_portrait"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."stories_blocks_sequence" ADD CONSTRAINT "stories_blocks_sequence_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."stories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."stories_blocks_sequence_locales" ADD CONSTRAINT "stories_blocks_sequence_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."stories_blocks_sequence"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."stories_blocks_pull_quote" ADD CONSTRAINT "stories_blocks_pull_quote_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."stories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."stories_blocks_pull_quote_locales" ADD CONSTRAINT "stories_blocks_pull_quote_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."stories_blocks_pull_quote"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."stories_blocks_text_paragraph" ADD CONSTRAINT "stories_blocks_text_paragraph_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."stories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."stories_blocks_text_paragraph_locales" ADD CONSTRAINT "stories_blocks_text_paragraph_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."stories_blocks_text_paragraph"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."stories" ADD CONSTRAINT "stories_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "payload"."competitions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."stories" ADD CONSTRAINT "stories_home_team_id_teams_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "payload"."teams"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."stories" ADD CONSTRAINT "stories_away_team_id_teams_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "payload"."teams"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."stories" ADD CONSTRAINT "stories_cover_photo_id_photos_id_fk" FOREIGN KEY ("cover_photo_id") REFERENCES "payload"."photos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."stories_locales" ADD CONSTRAINT "stories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."stories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."stories_rels" ADD CONSTRAINT "stories_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."stories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."stories_rels" ADD CONSTRAINT "stories_rels_photos_fk" FOREIGN KEY ("photos_id") REFERENCES "payload"."photos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."photos" ADD CONSTRAINT "photos_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "payload"."stories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."photos_locales" ADD CONSTRAINT "photos_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."photos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."photos_rels" ADD CONSTRAINT "photos_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."photos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."photos_rels" ADD CONSTRAINT "photos_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "payload"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."tags_locales" ADD CONSTRAINT "tags_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_stories_fk" FOREIGN KEY ("stories_id") REFERENCES "payload"."stories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_photos_fk" FOREIGN KEY ("photos_id") REFERENCES "payload"."photos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_teams_fk" FOREIGN KEY ("teams_id") REFERENCES "payload"."teams"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_competitions_fk" FOREIGN KEY ("competitions_id") REFERENCES "payload"."competitions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "payload"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."impressum_locales" ADD CONSTRAINT "impressum_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."impressum"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."datenschutz_locales" ADD CONSTRAINT "datenschutz_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."datenschutz"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "payload"."users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "payload"."users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "payload"."users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "payload"."users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "payload"."users" USING btree ("email");
  CREATE INDEX "stories_blocks_full_bleed_photo_order_idx" ON "payload"."stories_blocks_full_bleed_photo" USING btree ("_order");
  CREATE INDEX "stories_blocks_full_bleed_photo_parent_id_idx" ON "payload"."stories_blocks_full_bleed_photo" USING btree ("_parent_id");
  CREATE INDEX "stories_blocks_full_bleed_photo_path_idx" ON "payload"."stories_blocks_full_bleed_photo" USING btree ("_path");
  CREATE INDEX "stories_blocks_full_bleed_photo_photo_idx" ON "payload"."stories_blocks_full_bleed_photo" USING btree ("photo_id");
  CREATE INDEX "stories_blocks_diptych_order_idx" ON "payload"."stories_blocks_diptych" USING btree ("_order");
  CREATE INDEX "stories_blocks_diptych_parent_id_idx" ON "payload"."stories_blocks_diptych" USING btree ("_parent_id");
  CREATE INDEX "stories_blocks_diptych_path_idx" ON "payload"."stories_blocks_diptych" USING btree ("_path");
  CREATE INDEX "stories_blocks_diptych_photo_left_idx" ON "payload"."stories_blocks_diptych" USING btree ("photo_left_id");
  CREATE INDEX "stories_blocks_diptych_photo_right_idx" ON "payload"."stories_blocks_diptych" USING btree ("photo_right_id");
  CREATE INDEX "stories_blocks_triptych_order_idx" ON "payload"."stories_blocks_triptych" USING btree ("_order");
  CREATE INDEX "stories_blocks_triptych_parent_id_idx" ON "payload"."stories_blocks_triptych" USING btree ("_parent_id");
  CREATE INDEX "stories_blocks_triptych_path_idx" ON "payload"."stories_blocks_triptych" USING btree ("_path");
  CREATE INDEX "stories_blocks_inset_portrait_order_idx" ON "payload"."stories_blocks_inset_portrait" USING btree ("_order");
  CREATE INDEX "stories_blocks_inset_portrait_parent_id_idx" ON "payload"."stories_blocks_inset_portrait" USING btree ("_parent_id");
  CREATE INDEX "stories_blocks_inset_portrait_path_idx" ON "payload"."stories_blocks_inset_portrait" USING btree ("_path");
  CREATE INDEX "stories_blocks_inset_portrait_photo_idx" ON "payload"."stories_blocks_inset_portrait" USING btree ("photo_id");
  CREATE UNIQUE INDEX "stories_blocks_inset_portrait_locales_locale_parent_id_uniqu" ON "payload"."stories_blocks_inset_portrait_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "stories_blocks_sequence_order_idx" ON "payload"."stories_blocks_sequence" USING btree ("_order");
  CREATE INDEX "stories_blocks_sequence_parent_id_idx" ON "payload"."stories_blocks_sequence" USING btree ("_parent_id");
  CREATE INDEX "stories_blocks_sequence_path_idx" ON "payload"."stories_blocks_sequence" USING btree ("_path");
  CREATE UNIQUE INDEX "stories_blocks_sequence_locales_locale_parent_id_unique" ON "payload"."stories_blocks_sequence_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "stories_blocks_pull_quote_order_idx" ON "payload"."stories_blocks_pull_quote" USING btree ("_order");
  CREATE INDEX "stories_blocks_pull_quote_parent_id_idx" ON "payload"."stories_blocks_pull_quote" USING btree ("_parent_id");
  CREATE INDEX "stories_blocks_pull_quote_path_idx" ON "payload"."stories_blocks_pull_quote" USING btree ("_path");
  CREATE UNIQUE INDEX "stories_blocks_pull_quote_locales_locale_parent_id_unique" ON "payload"."stories_blocks_pull_quote_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "stories_blocks_text_paragraph_order_idx" ON "payload"."stories_blocks_text_paragraph" USING btree ("_order");
  CREATE INDEX "stories_blocks_text_paragraph_parent_id_idx" ON "payload"."stories_blocks_text_paragraph" USING btree ("_parent_id");
  CREATE INDEX "stories_blocks_text_paragraph_path_idx" ON "payload"."stories_blocks_text_paragraph" USING btree ("_path");
  CREATE UNIQUE INDEX "stories_blocks_text_paragraph_locales_locale_parent_id_uniqu" ON "payload"."stories_blocks_text_paragraph_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "stories_slug_idx" ON "payload"."stories" USING btree ("slug");
  CREATE INDEX "stories_competition_idx" ON "payload"."stories" USING btree ("competition_id");
  CREATE INDEX "stories_home_team_idx" ON "payload"."stories" USING btree ("home_team_id");
  CREATE INDEX "stories_away_team_idx" ON "payload"."stories" USING btree ("away_team_id");
  CREATE INDEX "stories_cover_photo_idx" ON "payload"."stories" USING btree ("cover_photo_id");
  CREATE INDEX "stories_updated_at_idx" ON "payload"."stories" USING btree ("updated_at");
  CREATE INDEX "stories_created_at_idx" ON "payload"."stories" USING btree ("created_at");
  CREATE UNIQUE INDEX "stories_locales_locale_parent_id_unique" ON "payload"."stories_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "stories_rels_order_idx" ON "payload"."stories_rels" USING btree ("order");
  CREATE INDEX "stories_rels_parent_idx" ON "payload"."stories_rels" USING btree ("parent_id");
  CREATE INDEX "stories_rels_path_idx" ON "payload"."stories_rels" USING btree ("path");
  CREATE INDEX "stories_rels_photos_id_idx" ON "payload"."stories_rels" USING btree ("photos_id");
  CREATE INDEX "photos_story_idx" ON "payload"."photos" USING btree ("story_id");
  CREATE INDEX "photos_updated_at_idx" ON "payload"."photos" USING btree ("updated_at");
  CREATE INDEX "photos_created_at_idx" ON "payload"."photos" USING btree ("created_at");
  CREATE UNIQUE INDEX "photos_filename_idx" ON "payload"."photos" USING btree ("filename");
  CREATE INDEX "photos_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "payload"."photos" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "photos_sizes_feed_sizes_feed_filename_idx" ON "payload"."photos" USING btree ("sizes_feed_filename");
  CREATE INDEX "photos_sizes_full_sizes_full_filename_idx" ON "payload"."photos" USING btree ("sizes_full_filename");
  CREATE UNIQUE INDEX "photos_locales_locale_parent_id_unique" ON "payload"."photos_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "photos_rels_order_idx" ON "payload"."photos_rels" USING btree ("order");
  CREATE INDEX "photos_rels_parent_idx" ON "payload"."photos_rels" USING btree ("parent_id");
  CREATE INDEX "photos_rels_path_idx" ON "payload"."photos_rels" USING btree ("path");
  CREATE INDEX "photos_rels_tags_id_idx" ON "payload"."photos_rels" USING btree ("tags_id");
  CREATE INDEX "teams_updated_at_idx" ON "payload"."teams" USING btree ("updated_at");
  CREATE INDEX "teams_created_at_idx" ON "payload"."teams" USING btree ("created_at");
  CREATE INDEX "competitions_updated_at_idx" ON "payload"."competitions" USING btree ("updated_at");
  CREATE INDEX "competitions_created_at_idx" ON "payload"."competitions" USING btree ("created_at");
  CREATE UNIQUE INDEX "tags_slug_idx" ON "payload"."tags" USING btree ("slug");
  CREATE INDEX "tags_updated_at_idx" ON "payload"."tags" USING btree ("updated_at");
  CREATE INDEX "tags_created_at_idx" ON "payload"."tags" USING btree ("created_at");
  CREATE UNIQUE INDEX "tags_locales_locale_parent_id_unique" ON "payload"."tags_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload"."payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload"."payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload"."payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload"."payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload"."payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload"."payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload"."payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_stories_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("stories_id");
  CREATE INDEX "payload_locked_documents_rels_photos_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("photos_id");
  CREATE INDEX "payload_locked_documents_rels_teams_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("teams_id");
  CREATE INDEX "payload_locked_documents_rels_competitions_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("competitions_id");
  CREATE INDEX "payload_locked_documents_rels_tags_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("tags_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload"."payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload"."payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload"."payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload"."payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload"."payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload"."payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload"."payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload"."payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload"."payload_migrations" USING btree ("created_at");
  CREATE UNIQUE INDEX "impressum_locales_locale_parent_id_unique" ON "payload"."impressum_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "datenschutz_locales_locale_parent_id_unique" ON "payload"."datenschutz_locales" USING btree ("_locale","_parent_id");`)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // The auto-generated teardown for this migration drops the entire `payload`
  // schema — every table (including `payload_migrations`) and all data — which
  // is effectively `DROP SCHEMA payload CASCADE` with no recovery path. Refuse
  // to run it so an accidental `migrate:down` can't destroy production.
  // To intentionally tear down, restore from a Neon branch/snapshot instead.
  throw new Error(
    "Refusing to roll back the initial migration: down() would drop the whole payload schema and all data. Restore from a Neon branch/snapshot instead.",
  );
}
