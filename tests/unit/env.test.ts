import { describe, it, expect } from "vitest";
import { z } from "zod";

// Re-define the schema for the test so we can exercise it with synthetic input
// without triggering the side-effect parse in src/env.ts.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  PAYLOAD_SECRET: z.string().min(32),
  BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

describe("env schema", () => {
  it("accepts a valid configuration", () => {
    expect(
      envSchema.parse({
        DATABASE_URL: "postgres://u:p@h/d",
        PAYLOAD_SECRET: "x".repeat(32),
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      }),
    ).toMatchObject({ NODE_ENV: "development" });
  });

  it("rejects a short payload secret", () => {
    expect(() =>
      envSchema.parse({
        DATABASE_URL: "postgres://u:p@h/d",
        PAYLOAD_SECRET: "tooshort",
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      }),
    ).toThrow();
  });

  it("rejects a non-URL site URL", () => {
    expect(() =>
      envSchema.parse({
        DATABASE_URL: "postgres://u:p@h/d",
        PAYLOAD_SECRET: "x".repeat(32),
        NEXT_PUBLIC_SITE_URL: "not-a-url",
      }),
    ).toThrow();
  });
});
