/**
 * Idempotent schema bootstrap.
 *
 * Runs once per server instance before the very first query (see
 * `src/db/index.ts`). A brand-new database — e.g. a fresh Vercel Postgres or
 * Neon instance — therefore gets every table it needs without anyone running
 * `drizzle-kit push` by hand. Every statement is safe to re-run, and all names
 * match what drizzle-kit generates, so the two never fight each other.
 *
 * The advisory lock serialises concurrent cold starts; it is released when the
 * implicit transaction of this multi-statement query ends.
 */
export const SCHEMA_SQL = `
SELECT pg_advisory_xact_lock(724501);

CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY NOT NULL,
  "email" text NOT NULL,
  "password_hash" text NOT NULL,
  "full_name" text NOT NULL,
  "student_number" text DEFAULT '' NOT NULL,
  "university" text DEFAULT '' NOT NULL,
  "class_name" text DEFAULT '' NOT NULL,
  "professor_name" text DEFAULT '' NOT NULL,
  "class_time" text DEFAULT '' NOT NULL,
  "bio" text DEFAULT '' NOT NULL,
  "role" text DEFAULT 'student' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "users_email_unique" UNIQUE("email")
);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "student_number" text DEFAULT '' NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "university" text DEFAULT '' NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "class_name" text DEFAULT '' NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "professor_name" text DEFAULT '' NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "class_time" text DEFAULT '' NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bio" text DEFAULT '' NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'student' NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

CREATE TABLE IF NOT EXISTS "files" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer,
  "name" text NOT NULL,
  "mime" text NOT NULL,
  "size" integer NOT NULL,
  "alt" text DEFAULT '' NOT NULL,
  "caption" text DEFAULT '' NOT NULL,
  "data" bytea NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
ALTER TABLE "files" ADD COLUMN IF NOT EXISTS "user_id" integer;

CREATE TABLE IF NOT EXISTS "items" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer,
  "slug" text NOT NULL,
  "title" text NOT NULL,
  "type" text NOT NULL,
  "course" text DEFAULT '' NOT NULL,
  "summary" text DEFAULT '' NOT NULL,
  "content" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "plain" text DEFAULT '' NOT NULL,
  "tags" text[] DEFAULT '{}' NOT NULL,
  "status" text DEFAULT 'draft' NOT NULL,
  "hidden_by_admin" boolean DEFAULT false NOT NULL,
  "moderation_note" text DEFAULT '' NOT NULL,
  "cover_file_id" integer,
  "published_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "items_slug_unique" UNIQUE("slug")
);
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "user_id" integer;
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "hidden_by_admin" boolean DEFAULT false NOT NULL;
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "moderation_note" text DEFAULT '' NOT NULL;

CREATE TABLE IF NOT EXISTS "reviews" (
  "id" serial PRIMARY KEY NOT NULL,
  "item_id" integer NOT NULL,
  "reviewer_name" text DEFAULT 'استاد راهنما' NOT NULL,
  "note" text DEFAULT '' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "sessions" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer,
  "token_hash" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "expires_at" timestamp NOT NULL,
  CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "user_id" integer;
DELETE FROM "sessions" WHERE "user_id" IS NULL OR "expires_at" < now();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'files_user_id_users_id_fk' AND conrelid = '"files"'::regclass) THEN
    ALTER TABLE "files" ADD CONSTRAINT "files_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'items_user_id_users_id_fk' AND conrelid = '"items"'::regclass) THEN
    ALTER TABLE "items" ADD CONSTRAINT "items_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'items_cover_file_id_files_id_fk' AND conrelid = '"items"'::regclass) THEN
    ALTER TABLE "items" ADD CONSTRAINT "items_cover_file_id_files_id_fk"
      FOREIGN KEY ("cover_file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_item_id_items_id_fk' AND conrelid = '"reviews"'::regclass) THEN
    ALTER TABLE "reviews" ADD CONSTRAINT "reviews_item_id_items_id_fk"
      FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_user_id_users_id_fk' AND conrelid = '"sessions"'::regclass) THEN
    ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
`;
