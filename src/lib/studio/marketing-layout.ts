import type { MarketingSectionInput } from "@/lib/studio/schemas";

type Locale = "de" | "en";

/**
 * Map editor sections to Payload's `sections` blocks array for one locale
 * write. Same contract as story-layout's toPayloadLayout, plus:
 * - required localized subfields (pageHeader.title, ctaLink.label) must be
 *   present on EN writes → self-heal with `en || de`
 * - serviceOffers.items is a LOCALIZED array: DE and EN are independent;
 *   EN sends items only when itemsEn is non-empty, else omits the key
 */
export function toMarketingSections(sections: MarketingSectionInput[], locale: Locale): unknown[] {
  return sections.map((section) => {
    const base: Record<string, unknown> = { blockType: section.blockType };
    if (section.id) base.id = section.id;
    switch (section.blockType) {
      case "pageHeader":
        return {
          ...base,
          ...localizedKey("label", locale, section.labelDe ?? null, section.labelEn),
          title: locale === "de" ? section.titleDe : section.titleEn || section.titleDe,
          ...localizedKey("intro", locale, section.introDe ?? null, section.introEn),
        };
      case "portraitFigure":
        return {
          ...base,
          photo: section.photoId,
          ...localizedKey("caption", locale, section.captionDe ?? null, section.captionEn),
        };
      case "editorialProse":
        return {
          ...base,
          ...localizedKey("eyebrow", locale, section.eyebrowDe ?? null, section.eyebrowEn),
          ...localizedKey("title", locale, section.titleDe ?? null, section.titleEn),
          ...localizedKey("body1", locale, section.body1De ?? null, section.body1En),
          ...localizedKey("pullQuote", locale, section.pullQuoteDe ?? null, section.pullQuoteEn),
          ...localizedKey("body2", locale, section.body2De ?? null, section.body2En),
          ...localizedKey("credits", locale, section.creditsDe ?? null, section.creditsEn),
        };
      case "ctaLink":
        return {
          ...base,
          label: locale === "de" ? section.labelDe : section.labelEn || section.labelDe,
          target: section.target,
        };
      case "serviceOffers":
        if (locale === "de") return { ...base, items: section.itemsDe };
        return section.itemsEn?.length ? { ...base, items: section.itemsEn } : base;
    }
  });
}

function localizedKey(
  key: string,
  locale: Locale,
  de: unknown,
  en: unknown,
): Record<string, unknown> {
  if (locale === "de") return { [key]: de };
  return en === undefined || en === "" ? {} : { [key]: en };
}

export function hasEnglishMarketingContent(sections: MarketingSectionInput[]): boolean {
  return sections.some((section) => {
    switch (section.blockType) {
      case "pageHeader":
        return hasText(section.labelEn) || hasText(section.titleEn) || hasText(section.introEn);
      case "portraitFigure":
        return hasText(section.captionEn);
      case "editorialProse":
        return (
          hasText(section.eyebrowEn) ||
          hasText(section.titleEn) ||
          Boolean(section.body1En) ||
          hasText(section.pullQuoteEn) ||
          Boolean(section.body2En) ||
          hasText(section.creditsEn)
        );
      case "ctaLink":
        return hasText(section.labelEn);
      case "serviceOffers":
        return Boolean(section.itemsEn?.length);
    }
  });
}

function hasText(value: string | undefined): boolean {
  return Boolean(value && value !== "");
}
