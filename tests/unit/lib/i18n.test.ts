import { describe, it, expect } from "vitest";
import { isLocale, defaultLocale, locales } from "@/lib/i18n/config";

describe("i18n config", () => {
  it("recognizes supported locales", () => {
    expect(isLocale("de")).toBe(true);
    expect(isLocale("en")).toBe(true);
  });

  it("rejects unsupported locales", () => {
    expect(isLocale("fr")).toBe(false);
    expect(isLocale("")).toBe(false);
  });

  it("defaults to German", () => {
    expect(defaultLocale).toBe("de");
  });

  it("exposes exactly two locales", () => {
    expect(locales).toEqual(["de", "en"]);
  });
});
