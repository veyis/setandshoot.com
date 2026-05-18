import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalString = z.preprocess(emptyToUndefined, z.string().min(1).optional());
const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional());

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  /** Direct Postgres URL (e.g. Payload). Optional while using Supabase client APIs only. */
  DATABASE_URL: optionalUrl,
  PAYLOAD_SECRET: z.string().min(32, "PAYLOAD_SECRET must be ≥ 32 chars"),
  BLOB_READ_WRITE_TOKEN: optionalString,
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  /** Server-only — never expose to the browser */
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  SENTRY_DSN: optionalUrl,
  NEXT_PUBLIC_SENTRY_DSN: optionalUrl,
});

const envInput = {
  ...process.env,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SERVICE_ROLE_KEY,
};

const parsed = schema.safeParse(envInput);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
export type Env = z.infer<typeof schema>;
