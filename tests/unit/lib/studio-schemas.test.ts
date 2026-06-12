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
  const base = { id: 1, titleDe: "Titel" };
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

import { storyContentSchema } from "@/lib/studio/schemas";

const para = { root: { type: "root", children: [] } };

describe("storyContentSchema", () => {
  it("accepts a full block set", () => {
    const r = storyContentSchema.parse({
      id: 1,
      coverPhotoId: 5,
      summaryDe: para,
      blocks: [
        { blockType: "fullBleedPhoto", photoId: 1 },
        { id: "abc", blockType: "diptych", photoLeftId: 1, photoRightId: 2, ratio: "60-40" },
        { blockType: "triptych", photoIds: [1, 2, 3] },
        { blockType: "insetPortrait", photoId: 4, textDe: para },
        { blockType: "sequence", photoIds: [1, 2], captionDe: "Serie" },
        { blockType: "pullQuote", quoteDe: "Zitat", attributionDe: "Autor" },
        { blockType: "textParagraph", textDe: para, textEn: para },
      ],
    });
    expect(r.blocks).toHaveLength(7);
  });
  it("rejects triptych without exactly 3 photos and sequence outside 2-6", () => {
    expect(() =>
      storyContentSchema.parse({
        id: 1,
        coverPhotoId: null,
        blocks: [{ blockType: "triptych", photoIds: [1, 2] }],
      }),
    ).toThrow();
    expect(() =>
      storyContentSchema.parse({
        id: 1,
        coverPhotoId: null,
        blocks: [{ blockType: "sequence", photoIds: [1] }],
      }),
    ).toThrow();
  });
  it("rejects textParagraph without DE text and pullQuote without DE quote", () => {
    expect(() =>
      storyContentSchema.parse({
        id: 1,
        coverPhotoId: null,
        blocks: [{ blockType: "textParagraph" }],
      }),
    ).toThrow();
    expect(() =>
      storyContentSchema.parse({
        id: 1,
        coverPhotoId: null,
        blocks: [{ blockType: "pullQuote", quoteDe: " " }],
      }),
    ).toThrow();
  });
});

import {
  settingsSchema,
  impressumSchema,
  datenschutzSchema,
  teamSchema,
  competitionSchema,
  tagSchema,
  taxonomyDeleteSchema,
  marketingPageSchema,
} from "@/lib/studio/schemas";

describe("settingsSchema", () => {
  const valid = { defaultWatermark: false, accentColor: "#E63946", homeFeaturedCount: 3 };
  it("accepts valid input", () => {
    expect(settingsSchema.parse(valid)).toEqual(valid);
  });
  it("rejects malformed hex colors", () => {
    for (const accentColor of ["E63946", "#E639", "#GGGGGG", "#E6394655"]) {
      expect(() => settingsSchema.parse({ ...valid, accentColor })).toThrow();
    }
  });
  it("rejects homeFeaturedCount outside 1-6 or non-integer", () => {
    for (const homeFeaturedCount of [0, 7, 2.5]) {
      expect(() => settingsSchema.parse({ ...valid, homeFeaturedCount })).toThrow();
    }
  });
});

describe("impressumSchema", () => {
  const valid = {
    legalName: "Belin Akgül Fotografie",
    addressLine1: "Straße 1",
    postalCode: "28195",
    city: "Bremen",
    country: "Deutschland",
    email: "mail@example.com",
  };
  it("accepts required fields; optionals default undefined", () => {
    const r = impressumSchema.parse(valid);
    expect(r.additionalNotesDe).toBeUndefined();
    expect(r.additionalNotesEn).toBeUndefined();
  });
  it("rejects a bad email and missing required fields", () => {
    expect(() => impressumSchema.parse({ ...valid, email: "not-an-email" })).toThrow();
    expect(() => impressumSchema.parse({ ...valid, legalName: " " })).toThrow();
  });
});

describe("datenschutzSchema", () => {
  const valid = { titleDe: "Datenschutzerklärung", lastUpdated: "2026-06-01" };
  it("accepts minimal input and optional rich text", () => {
    const r = datenschutzSchema.parse({ ...valid, introDe: para, bodyEn: para });
    expect(r.titleEn).toBeUndefined();
  });
  it("rejects empty titleDe and non-ISO lastUpdated", () => {
    expect(() => datenschutzSchema.parse({ ...valid, titleDe: " " })).toThrow();
    expect(() => datenschutzSchema.parse({ ...valid, lastUpdated: "01.06.2026" })).toThrow();
  });
});

describe("taxonomy schemas", () => {
  it("team/competition: id absent means create; tier enum enforced", () => {
    expect(teamSchema.parse({ name: "VCW", published: true }).id).toBeUndefined();
    expect(
      competitionSchema.parse({ id: 3, name: "Pokal", season: "2025/26", published: true }).id,
    ).toBe(3);
    expect(() => teamSchema.parse({ name: "VCW", tier: "oberliga", published: true })).toThrow();
    expect(teamSchema.parse({ name: "VCW", tier: "2-bundesliga", published: true }).tier).toBe(
      "2-bundesliga",
    );
  });
  it("competition requires season", () => {
    expect(() => competitionSchema.parse({ name: "Pokal", published: true })).toThrow();
  });
  it("tag: nameDe required, slug follows SLUG_PATTERN", () => {
    const r = tagSchema.parse({ nameDe: "Jubel", slug: "jubel", published: true });
    expect(r.nameEn).toBeUndefined();
    expect(() => tagSchema.parse({ nameDe: " ", slug: "jubel", published: true })).toThrow();
    for (const slug of ["Jubel", "jubel raus", "jubel_raus"]) {
      expect(() => tagSchema.parse({ nameDe: "Jubel", slug, published: true })).toThrow();
    }
  });
  it("taxonomyDeleteSchema whitelists the three collections", () => {
    expect(taxonomyDeleteSchema.parse({ collection: "tags", id: 1 }).collection).toBe("tags");
    expect(() => taxonomyDeleteSchema.parse({ collection: "stories", id: 1 })).toThrow();
  });
});

describe("marketingPageSchema", () => {
  it("accepts the five page slugs with a full section set", () => {
    const r = marketingPageSchema.parse({
      slug: "aboutPage",
      sections: [
        { id: "a", blockType: "pageHeader", titleDe: "Titel", labelDe: "L", introDe: "I" },
        { blockType: "portraitFigure", photoId: null, captionDe: "C" },
        { blockType: "editorialProse", body1De: para, titleDe: "T" },
        { blockType: "ctaLink", labelDe: "Kontakt", target: "/contact" },
        { blockType: "serviceOffers", itemsDe: [{ title: "T", body: "B" }] },
      ],
    });
    expect(r.sections).toHaveLength(5);
  });
  it("rejects unknown slugs and unknown block types", () => {
    expect(() => marketingPageSchema.parse({ slug: "settings", sections: [] })).toThrow();
    expect(() =>
      marketingPageSchema.parse({
        slug: "aboutPage",
        sections: [{ blockType: "fullBleedPhoto", photoId: 1 }],
      }),
    ).toThrow();
  });
  it("enforces required DE fields per block", () => {
    expect(() =>
      marketingPageSchema.parse({
        slug: "contactPage",
        sections: [{ blockType: "pageHeader", titleDe: " " }],
      }),
    ).toThrow();
    expect(() =>
      marketingPageSchema.parse({
        slug: "contactPage",
        sections: [{ blockType: "ctaLink", labelDe: "Los", target: "/nope" }],
      }),
    ).toThrow();
    expect(() =>
      marketingPageSchema.parse({
        slug: "servicesPage",
        sections: [{ blockType: "serviceOffers", itemsDe: [{ title: "T", body: " " }] }],
      }),
    ).toThrow();
  });
});
