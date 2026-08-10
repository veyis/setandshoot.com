import "server-only";
import { getPayload } from "payload";
import config from "@/payload/payload.config";
import { altFor, richTextFor, type LocalizedText } from "@/lib/studio/localized";
import { toPayloadLayout, hasEnglishContent } from "@/lib/studio/story-layout";
import type { StoryBlockInput, StoryContentInput } from "@/lib/studio/schemas";
import type { Story } from "@/payload-types";

export type StudioStoryContent = {
  id: number;
  coverPhotoId: number | null;
  summaryDe: unknown;
  summaryEn: unknown;
  blocks: StoryBlockInput[];
};

function asId(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "id" in value) return (value as { id: number }).id;
  return null;
}

function asIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.map(asId).filter((id): id is number => id !== null);
}

function textFor(value: unknown, locale: "de" | "en"): string {
  return altFor(value as LocalizedText, locale);
}

 
function toEditorBlock(raw: any): StoryBlockInput | null {
  // Payload returns id: string | null; the schema rejects null — normalize.
  const id: string | undefined = raw?.id ?? undefined;
  switch (raw?.blockType) {
    case "fullBleedPhoto": {
      const photoId = asId(raw.photo);
      return photoId ? { id, blockType: "fullBleedPhoto", photoId } : null;
    }
    case "diptych": {
      const photoLeftId = asId(raw.photoLeft);
      const photoRightId = asId(raw.photoRight);
      return photoLeftId && photoRightId
        ? {
            id,
            blockType: "diptych",
            photoLeftId,
            photoRightId,
            ratio: raw.ratio === "60-40" ? "60-40" : "50-50",
          }
        : null;
    }
    case "triptych": {
      const photoIds = asIds(raw.photos);
      return photoIds.length === 3 ? { id, blockType: "triptych", photoIds } : null;
    }
    case "insetPortrait": {
      const photoId = asId(raw.photo);
      if (!photoId) return null;
      return {
        id,
        blockType: "insetPortrait",
        photoId,
        textDe: (richTextFor(raw.text, "de") ?? undefined) as never,
        textEn: (richTextFor(raw.text, "en") ?? undefined) as never,
      } as StoryBlockInput;
    }
    case "sequence": {
      const photoIds = asIds(raw.photos);
      if (photoIds.length < 2) return null;
      return {
        id,
        blockType: "sequence",
        photoIds,
        captionDe: textFor(raw.caption, "de") || undefined,
        captionEn: textFor(raw.caption, "en") || undefined,
      };
    }
    case "pullQuote":
      return {
        id,
        blockType: "pullQuote",
        quoteDe: textFor(raw.quote, "de"),
        quoteEn: textFor(raw.quote, "en") || undefined,
        attributionDe: textFor(raw.attribution, "de") || undefined,
        attributionEn: textFor(raw.attribution, "en") || undefined,
      };
    case "textParagraph": {
      const textDe = richTextFor(raw.text, "de");
      if (!textDe) return null;
      return {
        id,
        blockType: "textParagraph",
        textDe: textDe as never,
        textEn: (richTextFor(raw.text, "en") as never) ?? undefined,
      };
    }
    default:
      return null;
  }
}
 

export async function getStudioStoryContent(id: number): Promise<StudioStoryContent | null> {
  const payload = await getPayload({ config });
  const story = (await payload
    .findByID({ collection: "stories", id, depth: 0, locale: "all", overrideAccess: true })
    .catch(() => null)) as Story | null;
  if (!story) return null;
  return {
    id: story.id,
    coverPhotoId: asId(story.coverPhoto),
    summaryDe: richTextFor(story.summary, "de"),
    summaryEn: richTextFor(story.summary, "en"),
    blocks: (story.layout ?? []).map(toEditorBlock).filter((b): b is StoryBlockInput => b !== null),
  };
}

export async function updateStudioStoryContent(input: StoryContentInput): Promise<void> {
  const payload = await getPayload({ config });
  await payload.update({
    collection: "stories",
    id: input.id,
    locale: "de",
    overrideAccess: true,
    data: {
      coverPhoto: input.coverPhotoId,
      summary: (input.summaryDe ?? null) as never,
      layout: toPayloadLayout(input.blocks, "de") as never,
    },
  });
  if (!hasEnglishContent({ blocks: input.blocks, summaryEn: input.summaryEn })) return;
  // EXPERIMENT FINDING 1: EN writes must carry the required localized title.
  const current = (await payload.findByID({
    collection: "stories",
    id: input.id,
    depth: 0,
    locale: "all",
    overrideAccess: true,
  })) as Story;
  const titleEn = altFor(current.title as LocalizedText, "en");
  const titleDe = altFor(current.title as LocalizedText, "de");
  // Re-read DE write result for fresh block ids of NEW blocks: EN values can
  // only attach to ids, so map submitted blocks to the persisted order.
  const persisted = (current.layout ?? []) as { id?: string | null }[];
  const blocksWithIds = input.blocks.map((block, index) => ({
    ...block,
    id: block.id ?? persisted[index]?.id ?? undefined,
  }));
  await payload.update({
    collection: "stories",
    id: input.id,
    locale: "en",
    overrideAccess: true,
    data: {
      title: titleEn || titleDe,
      ...(input.summaryEn ? { summary: input.summaryEn as never } : {}),
      layout: toPayloadLayout(blocksWithIds, "en") as never,
    },
  });
}
