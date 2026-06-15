import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional());
const optionalStr = z.preprocess(emptyToUndefined, z.string().min(1).optional());

/** Cloudflare R2 storage vars — must be all set or all unset. */
const R2_KEYS = [
  "R2_BUCKET",
  "R2_ENDPOINT",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_PUBLIC_BASE_URL",
] as const;

export const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().url(),
    PAYLOAD_SECRET: z.string().min(32, "PAYLOAD_SECRET must be ≥ 32 chars"),
    NEXT_PUBLIC_SITE_URL: z.string().url(),
    NEON_AUTH_BASE_URL: z.string().url(),
    NEON_AUTH_COOKIE_SECRET: z.string().min(32, "NEON_AUTH_COOKIE_SECRET must be ≥ 32 chars"),
    SENTRY_DSN: optionalUrl,
    NEXT_PUBLIC_SENTRY_DSN: optionalUrl,
    R2_BUCKET: optionalStr,
    R2_ENDPOINT: optionalUrl,
    R2_ACCESS_KEY_ID: optionalStr,
    R2_SECRET_ACCESS_KEY: optionalStr,
    R2_PUBLIC_BASE_URL: optionalUrl,
    RESEND_API_KEY: optionalStr,
  })
  .superRefine((data, ctx) => {
    const isSet = (k: (typeof R2_KEYS)[number]) => {
      const v = (data as Record<string, unknown>)[k];
      return v != null && v !== "";
    };
    const present = R2_KEYS.filter(isSet);
    if (present.length !== 0 && present.length !== R2_KEYS.length) {
      const missing = R2_KEYS.filter((k) => !isSet(k));
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [missing[0]!],
        message: `R2 storage is partially configured (${present.length}/${R2_KEYS.length}). Set all of ${R2_KEYS.join(", ")} or none. Missing: ${missing.join(", ")}.`,
      });
    }
  });

export type Env = z.infer<typeof envSchema>;
