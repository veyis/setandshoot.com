import { describe, it, expect } from "vitest";
import { altFor } from "@/lib/studio/localized";

describe("altFor", () => {
  it("returns a plain string as-is for any locale", () => {
    expect(altFor("Torjubel", "de")).toBe("Torjubel");
    expect(altFor("Torjubel", "en")).toBe("Torjubel");
  });

  it("picks the requested locale from a localized object", () => {
    const value = { de: "Torjubel", en: "Goal celebration" };
    expect(altFor(value, "de")).toBe("Torjubel");
    expect(altFor(value, "en")).toBe("Goal celebration");
  });

  it("returns empty string for missing values", () => {
    expect(altFor(null, "de")).toBe("");
    expect(altFor(undefined, "en")).toBe("");
    expect(altFor({ de: "nur deutsch" }, "en")).toBe("");
  });
});
