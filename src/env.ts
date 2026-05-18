import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  PAYLOAD_SECRET: z.string().min(32, "PAYLOAD_SECRET must be ≥ 32 chars"),
  BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
export type Env = z.infer<typeof schema>;
