import { describe, it, expect } from "vitest";
import { photoMetaSchema } from "@/lib/studio/schemas";
import { storyCreateSchema, storyMetaSchema } from "@/lib/studio/schemas";

const base = { id: 7, altDe: "Torjubel", published: false, isHighlight: false, isCover: false };

describe("photoMetaSchema", () => {
  it("accepts valid input without altEn or tagIds", () => {
    const result = photoMetaSchema.parse({ ...base, altDe: "Torjubel nach dem 2:1" });
    expect(result.altEn).toBeUndefined();
    expect(result.tagIds).toBeUndefined();
    expect(result.altDe).toBe("Torjubel nach dem 2:1");
  });

  it("trims and accepts altEn when present", () => {
    const result = photoMetaSchema.parse({ ...base, altEn: "  Goal celebration  " });
    expect(result.altEn).toBe("Goal celebration");
  });

  it("accepts tagIds as positive integers", () => {
    const result = photoMetaSchema.parse({ ...base, tagIds: [1, 2, 3] });
    expect(result.tagIds).toEqual([1, 2, 3]);
  });

  it("rejects an empty altDe", () => {
    expect(() => photoMetaSchema.parse({ ...base, altDe: "   " })).toThrow();
  });

  it("rejects a non-integer id", () => {
    expect(() => photoMetaSchema.parse({ ...base, id: 1.5 })).toThrow();
  });

  it("rejects non-integer tagIds", () => {
    expect(() => photoMetaSchema.parse({ ...base, tagIds: ["a"] })).toThrow();
  });
});

describe("storyCreateSchema", () => {
  it("accepts slug + German title", () => {
    const r = storyCreateSchema.parse({ slug: "vcw-potsdam-2026", titleDe: "VCW – Potsdam" });
    expect(r.slug).toBe("vcw-potsdam-2026");
  });
  it("rejects uppercase/space/umlaut slugs", () => {
    for (const slug of ["VCW-2026", "vcw 2026", "vcw_2026", "spül"]) {
      expect(() => storyCreateSchema.parse({ slug, titleDe: "ok" })).toThrow();
    }
  });
});

describe("storyMetaSchema", () => {
  const base = { id: 1, titleDe: "Titel", published: false };
  it("accepts minimal input; optional fields default undefined", () => {
    const r = storyMetaSchema.parse(base);
    expect(r.competitionId).toBeUndefined();
    expect(r.playedAt).toBeUndefined();
  });
  it("accepts full input with nullable relation clears", () => {
    const r = storyMetaSchema.parse({
      ...base,
      titleEn: "Title",
      competitionId: 2,
      homeTeamId: null,
      awayTeamId: 4,
      venue: "Halle",
      playedAt: "2026-05-01",
      result: "3:1",
    });
    expect(r.homeTeamId).toBeNull();
  });
  it("rejects bad playedAt", () => {
    expect(() => storyMetaSchema.parse({ ...base, playedAt: "01.05.2026" })).toThrow();
    expect(() => storyMetaSchema.parse({ ...base, playedAt: "2026-13-99" })).toThrow();
    expect(storyMetaSchema.parse({ ...base, playedAt: "2026-05-01" }).playedAt).toBe("2026-05-01");
  });
});
