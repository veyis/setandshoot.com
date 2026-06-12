import type { StoryBlockInput, StoryContentInput } from "@/lib/studio/schemas";

type Locale = "de" | "en";

/**
 * Map editor blocks to Payload's layout array for one locale write.
 * Contract (proven in scripts/experiments/block-locale.ts):
 * - keep `id` for existing blocks, omit for new ones
 * - de: send DE values; clear empty optional values with null
 * - en: send EN values; OMIT unset EN values entirely (never null — that
 *   would erase, while omission leaves the locale untouched)
 * - non-localized subfields (photos, ratio) ride along in both writes
 */
export function toPayloadLayout(blocks: StoryBlockInput[], locale: Locale): unknown[] {
  return blocks.map((block) => {
    const base: Record<string, unknown> = { blockType: block.blockType };
    if (block.id) base.id = block.id;
    switch (block.blockType) {
      case "fullBleedPhoto":
        return { ...base, photo: block.photoId };
      case "diptych":
        return {
          ...base,
          photoLeft: block.photoLeftId,
          photoRight: block.photoRightId,
          ratio: block.ratio,
        };
      case "triptych":
        return { ...base, photos: block.photoIds };
      case "insetPortrait":
        return {
          ...base,
          photo: block.photoId,
          ...localized(locale, block.textDe ?? null, block.textEn),
        };
      case "sequence":
        return {
          ...base,
          photos: block.photoIds,
          ...localizedKey("caption", locale, block.captionDe ?? null, block.captionEn),
        };
      case "pullQuote":
        return {
          ...base,
          ...localizedKey("quote", locale, block.quoteDe, block.quoteEn),
          ...localizedKey("attribution", locale, block.attributionDe ?? null, block.attributionEn),
        };
      case "textParagraph":
        return { ...base, ...localized(locale, block.textDe, block.textEn) };
    }
  });
}

function localized(locale: Locale, de: unknown, en: unknown): Record<string, unknown> {
  return localizedKey("text", locale, de, en);
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

export function hasEnglishContent(input: {
  blocks: StoryBlockInput[];
  summaryEn: StoryContentInput["summaryEn"];
}): boolean {
  if (input.summaryEn) return true;
  return input.blocks.some((block) => {
    switch (block.blockType) {
      case "insetPortrait":
      case "textParagraph":
        return Boolean(block.textEn);
      case "sequence":
        return Boolean(block.captionEn && block.captionEn !== "");
      case "pullQuote":
        return Boolean(
          (block.quoteEn && block.quoteEn !== "") ||
          (block.attributionEn && block.attributionEn !== ""),
        );
      default:
        return false;
    }
  });
}
