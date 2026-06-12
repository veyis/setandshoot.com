# Studio Phase 2b Implementation Plan — Story content editor (blocks + rich text)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the Studio story editor: a beginner-friendly "Inhalt" section on `/studio/stories/[id]` with the visual block builder (all 7 story layout block types), inline rich text via the spike-proven `RichTextMini`, the story summary, and a cover-photo picker.

**Architecture:** Same Studio pattern (server-only data module + `"use server"` action + client form). One save writes DE first, then EN conditionally — semantics proven by the live experiment (`scripts/experiments/block-locale.ts`).

**Verified write contracts (from the experiment — these are LAW for this plan):**

1. Blocks are matched by their string `id`. Existing blocks keep their `id` in every write; new blocks omit it (Payload assigns one).
2. A locale-`de` write of the full `layout` array sets structure + DE-localized subfield values. A locale-`en` write of the SAME array (same ids, same order) sets only the EN values of localized subfields; DE values survive.
3. Reorder/delete/add happen in the DE write; EN values follow their block ids automatically. Deleting a block deletes all its locales. New blocks have empty EN values (renderer falls back to DE).
4. **A locale-`en` update MUST include `title`** (required localized field) or it throws ValidationError when no EN title exists. The data layer self-heals: EN writes always send `title: existingTitleEn || titleDe`.
5. The EN write is SKIPPED entirely when the submission contains no EN content at all.

**Spike-proven assets already on this branch (use, don't rebuild):**

- `src/components/studio/rich-text-mini.tsx` — `RichTextMini({ value, onChange, ariaLabel })`; emits Payload-shaped JSON. Caller must gate with `isSupportedRichText`.
- `src/lib/studio/lexical.ts` — `isSupportedRichText`, `collectNodeTypes`, `SUPPORTED_NODE_TYPES`.
- Pinned deps: `lexical@0.41.0`, `@lexical/react@0.41.0`, `@lexical/link@0.41.0`, `@lexical/headless@0.41.0`, `@lexical/utils@0.41.0`.

**Block field reference (from `src/payload/blocks/story-layout/` + payload-types.ts):**

| blockType        | Payload fields                                                              | Localized |
| ---------------- | --------------------------------------------------------------------------- | --------- |
| `fullBleedPhoto` | `photo` (id, required)                                                      | —         |
| `diptych`        | `photoLeft`, `photoRight` (ids, required), `ratio` (`"50-50"` \| `"60-40"`) | —         |
| `triptych`       | `photos` (ids, exactly 3)                                                   | —         |
| `insetPortrait`  | `photo` (id, required), `text` (richText)                                   | `text`    |
| `sequence`       | `photos` (ids, 2–6), `caption` (textarea)                                   | `caption` |
| `pullQuote`      | `quote` (textarea, required), `attribution` (text)                          | both      |
| `textParagraph`  | `text` (richText, required)                                                 | `text`    |

Story-level: `summary` (richText, localized, optional), `coverPhoto` (photo id).

**File map:**

| File                                                          | Action | Responsibility                                                                                                          |
| ------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------- |
| `src/lib/studio/schemas.ts`                                   | Modify | `richTextValueSchema`, `storyBlockSchema` (discriminated union), `storyContentSchema`                                   |
| `src/lib/studio/story-layout.ts`                              | Create | PURE mapping helpers: `toPayloadLayout(blocks, locale)`, `hasEnglishContent(input)` — no server-only, fully unit-tested |
| `src/lib/studio/localized.ts`                                 | Modify | add `richTextFor(value, locale)` (locale-`all` rich text unwrap)                                                        |
| `src/lib/studio/story-content.ts`                             | Create | server-only: `getStudioStoryContent(id)`, `updateStudioStoryContent(input)`                                             |
| `src/lib/studio/actions/stories.ts`                           | Modify | add `updateStoryContentAction`                                                                                          |
| `src/components/studio/photo-picker.tsx`                      | Create | client: single/ordered-multi photo picker over `StudioPhoto[]`                                                          |
| `src/components/studio/block-editor.tsx`                      | Create | client: one block's edit card (per-type fields, move/delete)                                                            |
| `src/components/studio/story-content-form.tsx`                | Create | client: blocks state + add-menu + summary + cover + save                                                                |
| `src/app/(site)/[locale]/(auth)/studio/stories/[id]/page.tsx` | Modify | fetch content + photos; render content form                                                                             |
| `src/messages/de.json` / `en.json`                            | Modify | content-editor keys                                                                                                     |
| `tests/unit/lib/studio-story-layout.test.ts`                  | Create | mapping helper tests (TDD)                                                                                              |
| `tests/unit/lib/studio-localized.test.ts`                     | Modify | `richTextFor` tests                                                                                                     |
| `tests/unit/lib/studio-schemas.test.ts`                       | Modify | content schema tests                                                                                                    |

---

### Task 1: Schemas + mapping helpers (TDD — the correctness core)

**Files:** Modify `src/lib/studio/schemas.ts`, `src/lib/studio/localized.ts`; create `src/lib/studio/story-layout.ts`; tests as in file map.

- [ ] **Step 1: Write failing tests** for all three pieces.

`tests/unit/lib/studio-schemas.test.ts` (append):

```ts
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
```

`tests/unit/lib/studio-story-layout.test.ts` (create):

```ts
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
```

`tests/unit/lib/studio-localized.test.ts` (append):

```ts
import { richTextFor } from "@/lib/studio/localized";

describe("richTextFor", () => {
  const doc = { root: { type: "root", children: [] } };
  it("returns a plain rich-text doc as-is (has root)", () => {
    expect(richTextFor(doc, "en")).toBe(doc);
  });
  it("unwraps locale-all objects", () => {
    expect(richTextFor({ de: doc, en: null }, "de")).toBe(doc);
    expect(richTextFor({ de: doc, en: null }, "en")).toBeNull();
  });
  it("returns null for nullish", () => {
    expect(richTextFor(null, "de")).toBeNull();
    expect(richTextFor(undefined, "en")).toBeNull();
  });
});
```

- [ ] **Step 2:** Run all three test files → fail (missing exports).
- [ ] **Step 3: Implement.**

`src/lib/studio/schemas.ts` (append):

```ts
/** Minimal Lexical envelope check; deep validation is the editor's job. */
export const richTextValueSchema = z.looseObject({ root: z.unknown() });

const photoId = z.number().int().positive();
const blockId = z.string().min(1).optional();

export const storyBlockSchema = z.discriminatedUnion("blockType", [
  z.object({ id: blockId, blockType: z.literal("fullBleedPhoto"), photoId }),
  z.object({
    id: blockId,
    blockType: z.literal("diptych"),
    photoLeftId: photoId,
    photoRightId: photoId,
    ratio: z.enum(["50-50", "60-40"]),
  }),
  z.object({ id: blockId, blockType: z.literal("triptych"), photoIds: z.array(photoId).length(3) }),
  z.object({
    id: blockId,
    blockType: z.literal("insetPortrait"),
    photoId,
    textDe: richTextValueSchema.optional(),
    textEn: richTextValueSchema.optional(),
  }),
  z.object({
    id: blockId,
    blockType: z.literal("sequence"),
    photoIds: z.array(photoId).min(2).max(6),
    captionDe: z.string().trim().max(500).optional(),
    captionEn: z.string().trim().max(500).optional(),
  }),
  z.object({
    id: blockId,
    blockType: z.literal("pullQuote"),
    quoteDe: z.string().trim().min(1).max(500),
    quoteEn: z.string().trim().max(500).optional(),
    attributionDe: z.string().trim().max(200).optional(),
    attributionEn: z.string().trim().max(200).optional(),
  }),
  z.object({
    id: blockId,
    blockType: z.literal("textParagraph"),
    textDe: richTextValueSchema,
    textEn: richTextValueSchema.optional(),
  }),
]);

export const storyContentSchema = z.object({
  id: z.number().int().positive(),
  coverPhotoId: photoId.nullable(),
  summaryDe: richTextValueSchema.optional(),
  summaryEn: richTextValueSchema.optional(),
  blocks: z.array(storyBlockSchema).max(50),
});

export type StoryBlockInput = z.infer<typeof storyBlockSchema>;
export type StoryContentInput = z.infer<typeof storyContentSchema>;
```

`src/lib/studio/localized.ts` (append):

```ts
/** Rich-text variant of altFor: a plain doc has `root`; locale-all wraps as {de,en}. */
export function richTextFor(value: unknown, locale: "de" | "en"): unknown {
  if (!value || typeof value !== "object") return null;
  if ("root" in value) return value;
  const wrapped = value as { de?: unknown; en?: unknown };
  return wrapped[locale] ?? null;
}
```

`src/lib/studio/story-layout.ts` (create — PURE, no server-only):

```ts
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
```

- [ ] **Step 4:** Run the three test files → pass. Full `pnpm test` → green.
- [ ] **Step 5:** Commit: `feat(studio): add story content schemas and layout mapping`

---

### Task 2: Content data layer + action

**Files:** Create `src/lib/studio/story-content.ts`; modify `src/lib/studio/actions/stories.ts`.

- [ ] **Step 1:** Create `src/lib/studio/story-content.ts`:

```ts
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

/* eslint-disable @typescript-eslint/no-explicit-any */
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
/* eslint-enable @typescript-eslint/no-explicit-any */

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
  if (!hasEnglishContent(input)) return;
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
```

- [ ] **Step 2:** Add to `src/lib/studio/actions/stories.ts`:

```ts
import { storyContentSchema } from "@/lib/studio/schemas";
import { updateStudioStoryContent } from "@/lib/studio/story-content";

export async function updateStoryContentAction(input: unknown): Promise<StoryActionResult> {
  if (!(await requireAdminSession())) return { ok: false, error: "forbidden" };
  const parsed = storyContentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation" };
  try {
    await updateStudioStoryContent(parsed.data);
    return { ok: true };
  } catch {
    return { ok: false, error: "server" };
  }
}
```

- [ ] **Step 3:** `pnpm typecheck && pnpm lint && pnpm test` → green. Commit: `feat(studio): add story content data layer and action`

---

### Task 3: i18n keys

**Files:** Modify `src/messages/de.json`, `src/messages/en.json` (append to `studio` namespace).

- [ ] **Step 1 (de):**

```json
"contentTitle": "Inhalt",
"summaryLabel": "Zusammenfassung",
"coverLabel": "Coverfoto",
"choosePhoto": "Foto wählen",
"changePhoto": "Foto ändern",
"removePhoto": "Entfernen",
"addBlock": "Block hinzufügen",
"moveUp": "Nach oben",
"moveDown": "Nach unten",
"removeBlock": "Block entfernen",
"blockFullBleedPhoto": "Großes Foto",
"blockDiptych": "Zwei Fotos",
"blockTriptych": "Drei Fotos",
"blockInsetPortrait": "Portrait + Text",
"blockSequence": "Fotoserie",
"blockPullQuote": "Zitat",
"blockTextParagraph": "Textabsatz",
"ratioLabel": "Verhältnis",
"captionLabel": "Bildunterschrift",
"quoteLabel": "Zitat",
"attributionLabel": "Zuschreibung",
"textDe": "Text (Deutsch)",
"textEn": "Text (Englisch)",
"photoLeftLabel": "Foto links",
"photoRightLabel": "Foto rechts",
"photosLabel": "Fotos (Reihenfolge = Klickreihenfolge)",
"lockedRichText": "Dieser Text enthält Formate, die hier nicht bearbeitet werden können.",
"openInAdmin": "Im erweiterten Editor bearbeiten",
"blocksEmpty": "Noch keine Blöcke. Füge den ersten hinzu.",
"photoMissing": "Bitte wähle alle Fotos aus, bevor du speicherst."
```

- [ ] **Step 2 (en):**

```json
"contentTitle": "Content",
"summaryLabel": "Summary",
"coverLabel": "Cover photo",
"choosePhoto": "Choose photo",
"changePhoto": "Change photo",
"removePhoto": "Remove",
"addBlock": "Add block",
"moveUp": "Move up",
"moveDown": "Move down",
"removeBlock": "Remove block",
"blockFullBleedPhoto": "Full-width photo",
"blockDiptych": "Two photos",
"blockTriptych": "Three photos",
"blockInsetPortrait": "Portrait + text",
"blockSequence": "Photo series",
"blockPullQuote": "Quote",
"blockTextParagraph": "Text paragraph",
"ratioLabel": "Ratio",
"captionLabel": "Caption",
"quoteLabel": "Quote",
"attributionLabel": "Attribution",
"textDe": "Text (German)",
"textEn": "Text (English)",
"photoLeftLabel": "Left photo",
"photoRightLabel": "Right photo",
"photosLabel": "Photos (order = click order)",
"lockedRichText": "This text contains formatting that can't be edited here.",
"openInAdmin": "Edit in the advanced editor",
"blocksEmpty": "No blocks yet. Add the first one.",
"photoMissing": "Please choose all photos before saving."
```

- [ ] **Step 3:** `pnpm test && pnpm format` → green. Commit: `feat(studio): add content editor i18n messages`

---

### Task 4: Photo picker component

**Files:** Create `src/components/studio/photo-picker.tsx`

- [ ] **Step 1:** Client component over `StudioPhoto[]` (type-only import). Two exports:
  - `PhotoPickerSingle({ photos, value, onChange, label })` — shows the selected photo's thumbnail (or a `choosePhoto` button); clicking toggles an inline panel (`border-hairline` box, NOT a portal — remember the header backdrop-filter trap; the studio pages have no fixed overlay need) with a 4-col thumbnail grid; clicking a photo selects it (`onChange(id)`) and closes; a `removePhoto` button clears (`onChange(null)`) when optional (`allowEmpty` prop).
  - `PhotoPickerMulti({ photos, value, onChange, min, max, label })` — same panel, stays open; clicking toggles membership; selected photos show a numbered badge (1-based order = click order); clicking a selected photo removes it (renumbering preserved by filtering).
  - Thumbnails: `next/image` with `photo.thumbUrl` (fall back to a filename box like `photo-card.tsx` does), `width={160} height={120}`, alt from `altDe || filename`.
- [ ] **Step 2:** `pnpm typecheck && pnpm lint`. Commit: `feat(studio): add photo picker`

---

### Task 5: Block editor card

**Files:** Create `src/components/studio/block-editor.tsx`

- [ ] **Step 1:** Client component `BlockEditor({ block, photos, onChange, onMoveUp, onMoveDown, onRemove, canMoveUp, canMoveDown, adminUrl })` where `block` is the client block model (see Task 6) and `onChange` replaces it. Card layout: header row with the localized block-type name (`block{PascalType}` key), move-up/move-down/remove buttons (disabled per `canMoveUp/Down`, `aria-label`s from i18n). Body per type:
  - `fullBleedPhoto`: `PhotoPickerSingle`
  - `diptych`: two `PhotoPickerSingle` (photoLeftLabel/photoRightLabel) + ratio `<select>` (50-50 / 60-40)
  - `triptych`: `PhotoPickerMulti` min=3 max=3
  - `sequence`: `PhotoPickerMulti` min=2 max=6 + DE/EN caption inputs side-by-side
  - `pullQuote`: DE/EN quote textareas + DE/EN attribution inputs (grid `sm:grid-cols-2`)
  - `insetPortrait` / `textParagraph`: `PhotoPickerSingle` (insetPortrait only) + **rich text DE/EN**: for each locale, if `isSupportedRichText(value)` render `RichTextMini` (labels `textDe`/`textEn`), else render the `lockedRichText` notice + `openInAdmin` link to `adminUrl`.
- [ ] **Step 2:** `pnpm typecheck && pnpm lint`. Commit: `feat(studio): add block editor card`

---

### Task 6: Content form + page wiring

**Files:** Create `src/components/studio/story-content-form.tsx`; modify `src/app/(site)/[locale]/(auth)/studio/stories/[id]/page.tsx`

- [ ] **Step 1:** `StoryContentForm({ content, photos, adminUrl })`:
  - Client block model is a DRAFT type, not `StoryBlockInput` (unset photos must be representable): same shapes but every photo id is `number | null`, photo-id arrays may be shorter than their minimum, plus `clientKey: string`. Define it locally in this file (e.g. `type DraftBlock = …` discriminated on `blockType`). Initialize from `content.blocks` with `crypto.randomUUID()` keys. State: `blocks: DraftBlock[]`, `summaryDe`, `summaryEn`, `coverPhotoId`, `saving`. A `isComplete(block)` helper decides saveability; `toInput(block): StoryBlockInput` strips `clientKey`/nulls on save.
  - Sections: `coverLabel` (PhotoPickerSingle, allowEmpty), `summaryLabel` (RichTextMini DE/EN with the same safety-lock gating as Task 5), blocks list (`BlockEditor` per block, `key=clientKey`), add-block menu (7 buttons with the block-name keys; new blocks get sensible empty defaults — diptych ratio "50-50", photos `null`/empty arrays — and **Save stays disabled with a `photoMissing` hint while any `isComplete(block)` is false**).
  - Save: map drafts through `toInput`, call `updateStoryContentAction({ id: content.id, coverPhotoId, summaryDe, summaryEn, blocks })`; toasts `saved`/`saveError`; `router.refresh()` on success.
  - Move up/down: immutable array swaps. Remove: filter by clientKey.
- [ ] **Step 2:** Page: also fetch `getStudioStoryContent(id)` and `listStudioPhotos()` in the existing `Promise.all`; render `<h2>{t("contentTitle")}</h2>` + `<StoryContentForm content={...} photos={...} adminUrl={\`/admin/collections/stories/${id}\`} />`below the meta form. content null →`notFound()`.
- [ ] **Step 3:** `pnpm typecheck && pnpm lint && pnpm build` → green. Commit: `feat(studio): add story content editor (blocks + summary + cover)`

---

### Task 7: Full verification + integration probe

- [ ] **Step 1:** `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm test:e2e` → all green (2 fixme skips expected).
- [ ] **Step 2:** Integration probe WITHOUT the browser (no admin credentials in this environment): temporary script `scripts/experiments/content-roundtrip.ts` modeled on `block-locale.ts` (strip afterChange hooks, create draft story, call `updateStudioStoryContent` directly with a 7-block payload incl. EN values, read back locale=all, assert structure + both locales, delete story, write results to `.out`). Run via `bash scripts/payload-cli.sh run …`. Must use TOP-LEVEL AWAIT (payload run does not wait for floating promises). Keep the script committed.
- [ ] **Step 3:** Commit: `test(studio): content editor integration probe`

---

## Out of scope (Phase 3 / follow-ups)

- Seiten/Stammdaten/Rechtliches/Einstellungen screens (Phase 3).
- Photo `caption` rich-text editing in the Fotos grid (uses the same RichTextMini — trivial later).
- Replacing the link toolbar's `window.prompt` with a popover.
- Drag-and-drop reordering (up/down buttons are the accessible v1).
- Clearing EN values back to DE-fallback from the Studio (omission semantics; `/admin` can clear).
