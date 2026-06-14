import { describe, expect, it } from "vitest";
import { seoCopy, type SeoPage } from "@/lib/seo/copy";

describe("seoCopy", () => {
  it("returns German copy for de", () => {
    const c = seoCopy("de", "about");
    expect(c.title).toMatch(/Volleyball-Fotografin/);
    expect(c.description.length).toBeGreaterThan(20);
  });
  it("returns English copy for en", () => {
    expect(seoCopy("en", "services").title).toMatch(/Services/);
  });
  it("falls back to German for an unknown locale", () => {
    expect(seoCopy("fr", "contact")).toEqual(seoCopy("de", "contact"));
  });
  it("covers every page key", () => {
    const pages: SeoPage[] = [
      "about",
      "services",
      "contact",
      "highlights",
      "athletes",
      "journal",
      "stories",
    ];
    for (const p of pages) {
      expect(seoCopy("de", p).title).toBeTruthy();
      expect(seoCopy("en", p).title).toBeTruthy();
    }
  });
});
