import "server-only";
import { getPayload } from "payload";
import config from "@/payload/payload.config";
import { altFor, richTextFor, type LocalizedText } from "@/lib/studio/localized";
import { hasEnglishMarketingContent, toMarketingSections } from "@/lib/studio/marketing-layout";
import type { MarketingPageInput, MarketingSectionInput } from "@/lib/studio/schemas";

export type MarketingPageSlug = MarketingPageInput["slug"];

export type StudioMarketingPage = {
  slug: MarketingPageSlug;
  sections: MarketingSectionInput[];
};

const CTA_TARGETS = [
  "/contact",
  "/about",
  "/athletes",
  "/services",
  "/highlights",
  "/stories",
  "/",
] as const;

function asId(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "id" in value) return (value as { id: number }).id;
  return null;
}

function textFor(value: unknown, locale: "de" | "en"): string {
  return altFor(value as LocalizedText, locale);
}

/** Strip Payload's per-item ids — the editor regenerates arrays wholesale per locale. */
function toItems(value: unknown): { title: string; body: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      title: typeof item.title === "string" ? item.title : "",
      body: typeof item.body === "string" ? item.body : "",
    }));
}

/**
 * serviceOffers.items is localized: locale-all returns `{ de: [], en: [] }`,
 * a single-locale read returns a plain array (treated as DE for safety).
 */
function itemsByLocale(value: unknown): {
  de: { title: string; body: string }[];
  en: { title: string; body: string }[];
} {
  if (Array.isArray(value)) return { de: toItems(value), en: [] };
  const wrapped = (value ?? {}) as { de?: unknown; en?: unknown };
  return { de: toItems(wrapped.de), en: toItems(wrapped.en) };
}

function toEditorSection(raw: any): MarketingSectionInput | null {
  // Payload returns id: string | null; the schema rejects null — normalize.
  const id: string | undefined = raw?.id ?? undefined;
  switch (raw?.blockType) {
    case "pageHeader":
      return {
        id,
        blockType: "pageHeader",
        labelDe: textFor(raw.label, "de") || undefined,
        labelEn: textFor(raw.label, "en") || undefined,
        titleDe: textFor(raw.title, "de"),
        titleEn: textFor(raw.title, "en") || undefined,
        introDe: textFor(raw.intro, "de") || undefined,
        introEn: textFor(raw.intro, "en") || undefined,
      };
    case "portraitFigure":
      return {
        id,
        blockType: "portraitFigure",
        photoId: asId(raw.photo),
        captionDe: textFor(raw.caption, "de") || undefined,
        captionEn: textFor(raw.caption, "en") || undefined,
      };
    case "editorialProse":
      return {
        id,
        blockType: "editorialProse",
        eyebrowDe: textFor(raw.eyebrow, "de") || undefined,
        eyebrowEn: textFor(raw.eyebrow, "en") || undefined,
        titleDe: textFor(raw.title, "de") || undefined,
        titleEn: textFor(raw.title, "en") || undefined,
        body1De: (richTextFor(raw.body1, "de") ?? undefined) as never,
        body1En: (richTextFor(raw.body1, "en") ?? undefined) as never,
        pullQuoteDe: textFor(raw.pullQuote, "de") || undefined,
        pullQuoteEn: textFor(raw.pullQuote, "en") || undefined,
        body2De: (richTextFor(raw.body2, "de") ?? undefined) as never,
        body2En: (richTextFor(raw.body2, "en") ?? undefined) as never,
        creditsDe: textFor(raw.credits, "de") || undefined,
        creditsEn: textFor(raw.credits, "en") || undefined,
      } as MarketingSectionInput;
    case "ctaLink":
      return {
        id,
        blockType: "ctaLink",
        labelDe: textFor(raw.label, "de"),
        labelEn: textFor(raw.label, "en") || undefined,
        target: CTA_TARGETS.includes(raw.target) ? raw.target : "/contact",
      };
    case "serviceOffers": {
      const items = itemsByLocale(raw.items);
      return {
        id,
        blockType: "serviceOffers",
        itemsDe: items.de,
        itemsEn: items.en.length ? items.en : undefined,
      };
    }
    default:
      return null;
  }
}

export async function getMarketingPage(slug: MarketingPageSlug): Promise<StudioMarketingPage> {
  const payload = await getPayload({ config });
  const page = (await payload.findGlobal({
    slug,
    depth: 0,
    locale: "all",
    overrideAccess: true,
  })) as { sections?: unknown[] | null };
  return {
    slug,
    sections: (page.sections ?? [])
      .map(toEditorSection)
      .filter((section): section is MarketingSectionInput => section !== null),
  };
}

export async function updateMarketingPage(input: MarketingPageInput): Promise<void> {
  const payload = await getPayload({ config });
  await payload.updateGlobal({
    slug: input.slug,
    locale: "de",
    overrideAccess: true,
    data: { sections: toMarketingSections(input.sections, "de") as never },
  });
  if (!hasEnglishMarketingContent(input.sections)) return;
  // Re-read the DE write result for fresh ids of NEW sections: EN values can
  // only attach to ids, so map submitted sections to the persisted order.
  const current = (await payload.findGlobal({
    slug: input.slug,
    depth: 0,
    locale: "all",
    overrideAccess: true,
  })) as { sections?: { id?: string | null }[] | null };
  const persisted = current.sections ?? [];
  const sectionsWithIds = input.sections.map((section, index) => ({
    ...section,
    id: section.id ?? persisted[index]?.id ?? undefined,
  }));
  await payload.updateGlobal({
    slug: input.slug,
    locale: "en",
    overrideAccess: true,
    data: { sections: toMarketingSections(sectionsWithIds, "en") as never },
  });
}
