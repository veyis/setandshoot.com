import { describe, it, expect } from "vitest";
import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  PAYLOAD_SECRET: z.string().min(32),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEON_AUTH_BASE_URL: z.string().url(),
  NEON_AUTH_COOKIE_SECRET: z.string().min(32),
  SENTRY_DSN: optionalUrl,
  NEXT_PUBLIC_SENTRY_DSN: optionalUrl,
});

const validBase = {
  DATABASE_URL: "postgres://u:p@h/d",
  PAYLOAD_SECRET: "x".repeat(32),
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  NEON_AUTH_BASE_URL: "https://ep-xxx.neonauth.eu-central-1.aws.neon.tech/neondb/auth",
  NEON_AUTH_COOKIE_SECRET: "y".repeat(32),
};

describe("env schema", () => {
  it("accepts a valid configuration", () => {
    expect(envSchema.parse(validBase)).toMatchObject({
      NODE_ENV: "development",
      NEON_AUTH_BASE_URL: validBase.NEON_AUTH_BASE_URL,
    });
  });

  it("rejects missing DATABASE_URL", () => {
    const { DATABASE_URL: _, ...rest } = validBase;
    expect(() => envSchema.parse(rest)).toThrow();
  });

  it("rejects a short payload secret", () => {
    expect(() => envSchema.parse({ ...validBase, PAYLOAD_SECRET: "tooshort" })).toThrow();
  });

  it("rejects a short Neon Auth cookie secret", () => {
    expect(() => envSchema.parse({ ...validBase, NEON_AUTH_COOKIE_SECRET: "tooshort" })).toThrow();
  });

  it("rejects a non-URL site URL", () => {
    expect(() => envSchema.parse({ ...validBase, NEXT_PUBLIC_SITE_URL: "not-a-url" })).toThrow();
  });

  it("rejects a non-URL Neon Auth base URL", () => {
    expect(() => envSchema.parse({ ...validBase, NEON_AUTH_BASE_URL: "not-a-url" })).toThrow();
  });
});
