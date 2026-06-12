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

import { richTextFor } from "@/lib/studio/localized";

describe("richTextFor", () => {
  const doc = { root: { type: "root", children: [] } };
  it("returns a plain rich-text doc as-is (has root)", () => {
    expect(richTextFor(doc, "en")).toBe(doc);
  });
  it("unwraps locale-all objects", () => {
    expect(richTextFor({ de: doc, en: null }, "de")).toBe(doc);
    expect(richTextFor({ de: doc, en: null }, "en")).toBeNull();
  });
  it("returns null for nullish", () => {
    expect(richTextFor(null, "de")).toBeNull();
    expect(richTextFor(undefined, "en")).toBeNull();
  });
});
