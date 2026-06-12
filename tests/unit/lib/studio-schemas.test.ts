import { describe, it, expect } from "vitest";
import { photoMetaSchema } from "@/lib/studio/schemas";

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
