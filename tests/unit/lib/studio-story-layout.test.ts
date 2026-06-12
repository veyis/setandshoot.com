import { describe, it, expect } from "vitest";
import { toPayloadLayout, hasEnglishContent } from "@/lib/studio/story-layout";
import type { StoryContentInput } from "@/lib/studio/schemas";

const para = (t: string) => ({ root: { type: "root", children: [{ type: "text", text: t }] } });

const blocks: StoryContentInput["blocks"] = [
  { id: "b1", blockType: "textParagraph", textDe: para("de"), textEn: para("en") },
  { blockType: "pullQuote", quoteDe: "Zitat", quoteEn: "Quote", attributionDe: "A" },
  { id: "b3", blockType: "diptych", photoLeftId: 1, photoRightId: 2, ratio: "50-50" },
  { id: "b4", blockType: "sequence", photoIds: [1, 2, 3], captionDe: "Serie" },
];

describe("toPayloadLayout de", () => {
  it("maps ids, structure and DE values; clears empty optional DE values with null", () => {
    const de = toPayloadLayout(blocks, "de");
    expect(de[0]).toMatchObject({ id: "b1", blockType: "textParagraph", text: para("de") });
    expect(de[1]).not.toHaveProperty("id");
    expect(de[1]).toMatchObject({ quote: "Zitat", attribution: "A" });
    expect(de[2]).toMatchObject({ id: "b3", photoLeft: 1, photoRight: 2, ratio: "50-50" });
    expect(de[3]).toMatchObject({ photos: [1, 2, 3], caption: "Serie" });
  });
});

describe("toPayloadLayout en", () => {
  it("keeps ids/structure, maps EN values, OMITS unset EN values", () => {
    const en = toPayloadLayout(blocks, "en");
    expect(en[0]).toMatchObject({ id: "b1", text: para("en") });
    expect(en[1]).toMatchObject({ quote: "Quote" });
    expect(en[1]).not.toHaveProperty("attribution"); // attributionEn unset → omit, never null
    expect(en[3]).not.toHaveProperty("caption");
    // non-localized subfields ride along unchanged (harmless, same values)
    expect(en[2]).toMatchObject({ photoLeft: 1, photoRight: 2 });
  });
});

describe("hasEnglishContent", () => {
  it("true when any EN field present", () => {
    expect(hasEnglishContent({ blocks, summaryEn: undefined })).toBe(true);
  });
  it("false for DE-only submissions", () => {
    const deOnly = blocks.map((b) => {
      const { textEn, quoteEn, attributionEn, captionEn, ...rest } = b as never as Record<
        string,
        unknown
      >;
      void textEn;
      void quoteEn;
      void attributionEn;
      void captionEn;
      return rest;
    }) as StoryContentInput["blocks"];
    expect(hasEnglishContent({ blocks: deOnly, summaryEn: undefined })).toBe(false);
    expect(hasEnglishContent({ blocks: deOnly, summaryEn: para("s") })).toBe(true);
  });
});
