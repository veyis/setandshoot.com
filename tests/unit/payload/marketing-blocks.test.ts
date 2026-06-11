import { describe, expect, it } from "vitest";
import { marketingBlocks } from "@/payload/blocks/marketing";

describe("marketingBlocks", () => {
  it("exposes the pilot block types", () => {
    const slugs = marketingBlocks.map((b) => b.slug).sort();
    expect(slugs).toEqual([
      "ctaLink",
      "editorialProse",
      "pageHeader",
      "portraitFigure",
      "serviceOffers",
    ]);
  });

  it("requires a title on the header and a label on the cta", () => {
    const header = marketingBlocks.find((b) => b.slug === "pageHeader");
    const cta = marketingBlocks.find((b) => b.slug === "ctaLink");
    expect(
      header?.fields.some(
        (f) => "name" in f && f.name === "title" && "required" in f && f.required,
      ),
    ).toBe(true);
    expect(
      cta?.fields.some((f) => "name" in f && f.name === "label" && "required" in f && f.required),
    ).toBe(true);
  });
});
