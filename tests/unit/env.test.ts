import { describe, it, expect } from "vitest";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url().optional(),
  PAYLOAD_SECRET: z.string().min(32),
  BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

const validBase = {
  PAYLOAD_SECRET: "x".repeat(32),
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: "https://api.setandshoot.com",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test",
};

describe("env schema", () => {
  it("accepts a valid configuration with Supabase", () => {
    expect(envSchema.parse(validBase)).toMatchObject({
      NODE_ENV: "development",
      NEXT_PUBLIC_SUPABASE_URL: "https://api.setandshoot.com",
    });
  });

  it("accepts optional DATABASE_URL", () => {
    expect(
      envSchema.parse({
        ...validBase,
        DATABASE_URL: "postgres://u:p@h/d",
      }),
    ).toMatchObject({ DATABASE_URL: "postgres://u:p@h/d" });
  });

  it("rejects missing Supabase URL", () => {
    const { NEXT_PUBLIC_SUPABASE_URL: _, ...rest } = validBase;
    expect(() => envSchema.parse(rest)).toThrow();
  });

  it("rejects a short payload secret", () => {
    expect(() =>
      envSchema.parse({
        ...validBase,
        PAYLOAD_SECRET: "tooshort",
      }),
    ).toThrow();
  });

  it("rejects a non-URL site URL", () => {
    expect(() =>
      envSchema.parse({
        ...validBase,
        NEXT_PUBLIC_SITE_URL: "not-a-url",
      }),
    ).toThrow();
  });
});
