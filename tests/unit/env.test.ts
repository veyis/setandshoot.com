import { describe, it, expect } from "vitest";
import { envSchema } from "@/env-schema";

const validBase = {
  DATABASE_URL: "postgres://u:p@h/d",
  PAYLOAD_SECRET: "x".repeat(32),
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  NEON_AUTH_BASE_URL: "https://ep-xxx.neonauth.eu-central-1.aws.neon.tech/neondb/auth",
  NEON_AUTH_COOKIE_SECRET: "y".repeat(32),
};

const allR2 = {
  R2_BUCKET: "bucket",
  R2_ENDPOINT: "https://endpoint.example.com",
  R2_ACCESS_KEY_ID: "key",
  R2_SECRET_ACCESS_KEY: "secret",
  R2_PUBLIC_BASE_URL: "https://cdn.example.com",
};

describe("env schema", () => {
  it("accepts a valid configuration", () => {
    expect(envSchema.parse(validBase)).toMatchObject({ NODE_ENV: "development" });
  });
  it("rejects missing DATABASE_URL", () => {
    const { DATABASE_URL: _drop, ...rest } = validBase;
    expect(() => envSchema.parse(rest)).toThrow();
  });
  it("rejects a short payload secret", () => {
    expect(() => envSchema.parse({ ...validBase, PAYLOAD_SECRET: "tooshort" })).toThrow();
  });
  it("rejects a short Neon Auth cookie secret", () => {
    expect(() => envSchema.parse({ ...validBase, NEON_AUTH_COOKIE_SECRET: "short" })).toThrow();
  });
  it("rejects a non-URL site URL", () => {
    expect(() => envSchema.parse({ ...validBase, NEXT_PUBLIC_SITE_URL: "not-a-url" })).toThrow();
  });
  it("accepts no R2 vars (all unset)", () => {
    expect(() => envSchema.parse(validBase)).not.toThrow();
  });
  it("accepts all 5 R2 vars set", () => {
    expect(() => envSchema.parse({ ...validBase, ...allR2 })).not.toThrow();
  });
  it("rejects partial R2 config and names the missing vars", () => {
    const result = envSchema.safeParse({
      ...validBase,
      R2_BUCKET: "bucket",
      R2_ENDPOINT: "https://endpoint.example.com",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]!.message).toMatch(/R2_ACCESS_KEY_ID/);
    }
  });
  it("accepts RESEND_API_KEY on its own", () => {
    expect(() => envSchema.parse({ ...validBase, RESEND_API_KEY: "re_test" })).not.toThrow();
  });
});
