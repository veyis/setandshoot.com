import { describe, it, expect } from "vitest";
import { toMarketingSections, hasEnglishMarketingContent } from "@/lib/studio/marketing-layout";
import type { MarketingSectionInput } from "@/lib/studio/schemas";

const para = (t: string) => ({ root: { type: "root", children: [{ type: "text", text: t }] } });

// DE-only submission: no EN values anywhere.
const deOnly: MarketingSectionInput[] = [
  { id: "s1", blockType: "pageHeader", labelDe: "Label", titleDe: "Titel" },
  { blockType: "ctaLink", labelDe: "Kontakt", target: "/contact" },
  { id: "s3", blockType: "portraitFigure", photoId: 7, captionDe: "Bild" },
  { id: "s4", blockType: "editorialProse", titleDe: "Prosa", body1De: para("de") },
  { id: "s5", blockType: "serviceOffers", itemsDe: [{ title: "Spieltag", body: "Reportage" }] },
];

describe("toMarketingSections de", () => {
  it("maps ids, structure and DE values; clears empty optional DE values with null", () => {
    const de = toMarketingSections(deOnly, "de");
    expect(de[0]).toMatchObject({
      id: "s1",
      blockType: "pageHeader",
      label: "Label",
      title: "Titel",
      intro: null, // unset optional DE value → null clear
    });
    expect(de[1]).not.toHaveProperty("id"); // new section → id omitted
    expect(de[1]).toMatchObject({ blockType: "ctaLink", label: "Kontakt", target: "/contact" });
    expect(de[2]).toMatchObject({ id: "s3", photo: 7, caption: "Bild" });
    expect(de[3]).toMatchObject({ id: "s4", title: "Prosa", body1: para("de") });
    expect(de[3]).toMatchObject({ eyebrow: null, pullQuote: null, body2: null, credits: null });
    expect(de[4]).toMatchObject({ id: "s5", items: [{ title: "Spieltag", body: "Reportage" }] });
  });

  it("clears a removed portrait photo with null", () => {
    const de = toMarketingSections([{ blockType: "portraitFigure", photoId: null }], "de");
    expect(de[0]).toMatchObject({ photo: null });
  });
});

describe("toMarketingSections en", () => {
  it("keeps ids/structure and OMITS unset EN values", () => {
    const en = toMarketingSections(deOnly, "en");
    expect(en[0]).toMatchObject({ id: "s1", blockType: "pageHeader" });
    expect(en[0]).not.toHaveProperty("label");
    expect(en[0]).not.toHaveProperty("intro");
    expect(en[3]).not.toHaveProperty("body1"); // rich text EN unset → omit, never null
    expect(en[3]).not.toHaveProperty("title");
  });

  it("self-heals required localized fields with en || de", () => {
    const en = toMarketingSections(deOnly, "en");
    // pageHeader.title is required+localized → falls back to DE
    expect(en[0]).toMatchObject({ title: "Titel" });
    // ctaLink.label is required+localized → falls back to DE
    expect(en[1]).toMatchObject({ label: "Kontakt" });
    const withEn = toMarketingSections(
      [
        { id: "s1", blockType: "pageHeader", titleDe: "Titel", titleEn: "Title" },
        { blockType: "ctaLink", labelDe: "Kontakt", labelEn: "Contact", target: "/contact" },
      ],
      "en",
    );
    expect(withEn[0]).toMatchObject({ title: "Title" });
    expect(withEn[1]).toMatchObject({ label: "Contact" });
  });

  it("lets non-localized subfields ride along", () => {
    const en = toMarketingSections(deOnly, "en");
    expect(en[1]).toMatchObject({ target: "/contact" });
    expect(en[2]).toMatchObject({ photo: 7 });
  });

  it("maps EN values when present", () => {
    const en = toMarketingSections(
      [
        {
          id: "s4",
          blockType: "editorialProse",
          titleDe: "Prosa",
          body1De: para("de"),
          body1En: para("en"),
          creditsEn: "Credits EN",
        },
      ],
      "en",
    );
    expect(en[0]).toMatchObject({ id: "s4", body1: para("en"), credits: "Credits EN" });
  });

  it("serviceOffers: per-locale arrays — EN omits items unless itemsEn is non-empty", () => {
    const sections: MarketingSectionInput[] = [
      { id: "s5", blockType: "serviceOffers", itemsDe: [{ title: "DE", body: "de" }] },
      {
        id: "s6",
        blockType: "serviceOffers",
        itemsDe: [{ title: "DE", body: "de" }],
        itemsEn: [{ title: "EN", body: "en" }],
      },
      {
        id: "s7",
        blockType: "serviceOffers",
        itemsDe: [{ title: "DE", body: "de" }],
        itemsEn: [],
      },
    ];
    const de = toMarketingSections(sections, "de");
    expect(de[0]).toMatchObject({ items: [{ title: "DE", body: "de" }] });
    expect(de[1]).toMatchObject({ items: [{ title: "DE", body: "de" }] });
    const en = toMarketingSections(sections, "en");
    expect(en[0]).not.toHaveProperty("items"); // itemsEn absent → omit
    expect(en[1]).toMatchObject({ id: "s6", items: [{ title: "EN", body: "en" }] });
    expect(en[2]).not.toHaveProperty("items"); // itemsEn empty → omit
  });
});

describe("hasEnglishMarketingContent", () => {
  it("false for DE-only submissions", () => {
    expect(hasEnglishMarketingContent(deOnly)).toBe(false);
  });
  it("true when any EN text field is present", () => {
    expect(
      hasEnglishMarketingContent([{ blockType: "pageHeader", titleDe: "Titel", titleEn: "Title" }]),
    ).toBe(true);
    expect(
      hasEnglishMarketingContent([
        { blockType: "ctaLink", labelDe: "Kontakt", labelEn: "Contact", target: "/" },
      ]),
    ).toBe(true);
  });
  it("true when any EN rich text is present", () => {
    expect(hasEnglishMarketingContent([{ blockType: "editorialProse", body2En: para("en") }])).toBe(
      true,
    );
  });
  it("serviceOffers: true only for non-empty itemsEn", () => {
    expect(
      hasEnglishMarketingContent([
        { blockType: "serviceOffers", itemsDe: [{ title: "T", body: "B" }], itemsEn: [] },
      ]),
    ).toBe(false);
    expect(
      hasEnglishMarketingContent([
        {
          blockType: "serviceOffers",
          itemsDe: [{ title: "T", body: "B" }],
          itemsEn: [{ title: "E", body: "n" }],
        },
      ]),
    ).toBe(true);
  });
});
