# Studio Phase 2a Implementation Plan — Stories list + metadata editor + publish

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Studio story workflow minus the block builder: create a story, edit its metadata (DE/EN title, teams, competition, date, venue, result), and publish/unpublish — per `docs/superpowers/specs/2026-06-12-studio-design.md` "Phase 2 — the centerpiece". The visual block builder + mini Lexical editor are **Phase 2b** (see "Phase 2b outline + spike" at the end).

**Architecture:** Same pattern as Phase 1: server-only data modules + `"use server"` actions in `src/lib/studio/`, pages under `src/app/(site)/[locale]/(auth)/studio/stories/`, admin session check at every entry point, `overrideAccess: true` after the check. The stories collection's existing `beforeChange` hook manages `publishedAt`; the `afterChange` hook (`revalidateStory`) busts `/stories` caches — no new cache code.

**Tech Stack:** Next.js 16 App Router, Payload 3 Local API, next-intl, Zod 4, sonner, Vitest, Playwright.

**Conventions (same as Phase 1 plan — read its header):** typedRoutes `as any` escape hatch with eslint-disable comment for new hrefs; design tokens (`font-display`, `text-ink`, `text-ink-muted`, `border-hairline`, `bg-canvas`, `focus:ring-accent`); `fieldClass` input style from `src/components/studio/photo-card.tsx`; lefthook on commit.

**Key collection facts (verified):**

- `stories` fields: `slug` (required, unique, shared across locales), `title` (required, **localized**), `competition`/`homeTeam`/`awayTeam` (relationship ids at depth 0), `venue`, `playedAt` (date), `result`, `featured`, `published`. `summary` (richText) and `layout` (blocks) are **out of scope for 2a** — do not touch them in updates (Payload leaves omitted fields unchanged).
- `beforeChange` hook (`src/payload/collections/stories.ts:24-33`): sets `publishedAt` on first publish, clears it on unpublish. Send only `published`; never send `publishedAt`.
- Teams/competitions are NOT localized; `Team.name`, `Competition.name`+`season` are plain strings.

**File map:**

| File                                                          | Action | Responsibility                                                                                                                                      |
| ------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/studio/schemas.ts`                                   | Modify | add `storyMetaSchema`, `storyCreateSchema`, `SLUG_PATTERN`                                                                                          |
| `tests/unit/lib/studio-schemas.test.ts`                       | Modify | tests for both new schemas                                                                                                                          |
| `src/lib/studio/stories.ts`                                   | Create | server-only: `listStudioStories`, `getStudioStoryMeta`, `listStoryOptions`, `createStudioStory`, `updateStudioStoryMeta`, `setStudioStoryPublished` |
| `src/lib/studio/actions/stories.ts`                           | Create | `"use server"`: create/updateMeta/setPublished actions                                                                                              |
| `src/app/(site)/[locale]/(auth)/studio/stories/page.tsx`      | Create | stories list + create form                                                                                                                          |
| `src/app/(site)/[locale]/(auth)/studio/stories/[id]/page.tsx` | Create | metadata editor page (server)                                                                                                                       |
| `src/components/studio/story-create-form.tsx`                 | Create | client: slug+title form → createStoryAction → redirect                                                                                              |
| `src/components/studio/story-meta-form.tsx`                   | Create | client: metadata form + publish toggle                                                                                                              |
| `src/app/(site)/[locale]/(auth)/studio/layout.tsx`            | Modify | add Stories nav link                                                                                                                                |
| `src/app/(site)/[locale]/(auth)/studio/page.tsx`              | Modify | activate the Stories dashboard card                                                                                                                 |
| `src/messages/de.json`, `src/messages/en.json`                | Modify | new `studio.*` keys                                                                                                                                 |
| `tests/e2e/studio.spec.ts`                                    | Modify | gate test for `/studio/stories`                                                                                                                     |

---

### Task 1: i18n keys

**Files:** Modify `src/messages/de.json`, `src/messages/en.json`

- [ ] **Step 1:** Add to the `studio` namespace in `de.json`:

```json
"navStories": "Stories",
"storiesTitle": "Stories",
"storiesEmpty": "Noch keine Stories.",
"newStoryTitle": "Neue Story",
"fieldSlug": "Slug (URL, z. B. vcw-potsdam-2026)",
"fieldTitleDe": "Titel (Deutsch)",
"fieldTitleEn": "Titel (Englisch)",
"fieldCompetition": "Wettbewerb",
"fieldHomeTeam": "Heim",
"fieldAwayTeam": "Gast",
"fieldVenue": "Spielort",
"fieldPlayedAt": "Datum",
"fieldResult": "Ergebnis",
"noSelection": "— keine Auswahl —",
"create": "Anlegen",
"creating": "Legt an …",
"slugTaken": "Dieser Slug ist bereits vergeben.",
"slugInvalid": "Nur Kleinbuchstaben, Zahlen und Bindestriche.",
"editStory": "Bearbeiten",
"publishedBadge": "Veröffentlicht",
"draftBadge": "Entwurf",
"publish": "Veröffentlichen",
"unpublish": "Verbergen",
"viewLive": "Live ansehen"
```

- [ ] **Step 2:** English equivalents in `en.json`:

```json
"navStories": "Stories",
"storiesTitle": "Stories",
"storiesEmpty": "No stories yet.",
"newStoryTitle": "New story",
"fieldSlug": "Slug (URL, e.g. vcw-potsdam-2026)",
"fieldTitleDe": "Title (German)",
"fieldTitleEn": "Title (English)",
"fieldCompetition": "Competition",
"fieldHomeTeam": "Home",
"fieldAwayTeam": "Away",
"fieldVenue": "Venue",
"fieldPlayedAt": "Date",
"fieldResult": "Result",
"noSelection": "— none —",
"create": "Create",
"creating": "Creating …",
"slugTaken": "This slug is already taken.",
"slugInvalid": "Lowercase letters, numbers and hyphens only.",
"editStory": "Edit",
"publishedBadge": "Published",
"draftBadge": "Draft",
"publish": "Publish",
"unpublish": "Unpublish",
"viewLive": "View live"
```

- [ ] **Step 3:** `pnpm test && pnpm format` → green. Commit: `feat(studio): add story editor i18n messages`

---

### Task 2: Schemas (TDD)

**Files:** Modify `src/lib/studio/schemas.ts`, `tests/unit/lib/studio-schemas.test.ts`

- [ ] **Step 1:** Append tests:

```ts
import { storyCreateSchema, storyMetaSchema } from "@/lib/studio/schemas";

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
  const base = { id: 1, titleDe: "Titel", published: false };
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
  });
});
```

- [ ] **Step 2:** Run → fails (missing exports).
- [ ] **Step 3:** Implement in `schemas.ts` (append):

```ts
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const storyCreateSchema = z.object({
  slug: z.string().trim().min(3).max(120).regex(SLUG_PATTERN),
  titleDe: z.string().trim().min(1).max(200),
});

export const storyMetaSchema = z.object({
  id: z.number().int().positive(),
  titleDe: z.string().trim().min(1).max(200),
  titleEn: z.string().trim().max(200).optional(),
  competitionId: z.number().int().positive().nullable().optional(),
  homeTeamId: z.number().int().positive().nullable().optional(),
  awayTeamId: z.number().int().positive().nullable().optional(),
  venue: z.string().trim().max(200).optional(),
  playedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  result: z.string().trim().max(50).optional(),
  published: z.boolean(),
});

export type StoryCreateInput = z.infer<typeof storyCreateSchema>;
export type StoryMetaInput = z.infer<typeof storyMetaSchema>;
```

(`nullable()` on relation ids: `null` means "clear the relation"; `undefined` means "not submitted". The form always submits all three with explicit null for "— none —".)

- [ ] **Step 4:** Run → pass. Commit: `feat(studio): add story schemas`

---

### Task 3: Stories data layer

**Files:** Create `src/lib/studio/stories.ts`

- [ ] **Step 1:** Implement (mirror `photos.ts` style):

```ts
import "server-only";
import { getPayload } from "payload";
import config from "@/payload/payload.config";
import { photoSrc, resolvePhoto } from "@/lib/payload/media";
import { altFor, type LocalizedText } from "@/lib/studio/localized";
import type { Story } from "@/payload-types";
import type { StoryCreateInput, StoryMetaInput } from "@/lib/studio/schemas";

export type StudioStoryListItem = {
  id: number;
  slug: string;
  titleDe: string;
  titleEn: string;
  playedAt: string | null;
  published: boolean;
  coverThumbUrl: string | null;
  updatedAt: string;
};

export async function listStudioStories(): Promise<StudioStoryListItem[]> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "stories",
    sort: "-updatedAt",
    limit: 200,
    depth: 1, // resolve coverPhoto for thumbnails
    locale: "all",
    overrideAccess: true,
  });
  return docs.map((doc) => {
    const story = doc as Story;
    return {
      id: story.id,
      slug: story.slug,
      titleDe: altFor(story.title as LocalizedText, "de"),
      titleEn: altFor(story.title as LocalizedText, "en"),
      playedAt: story.playedAt ?? null,
      published: Boolean(story.published),
      coverThumbUrl: photoSrc(resolvePhoto(story.coverPhoto), "thumbnail"),
      updatedAt: story.updatedAt,
    };
  });
}

export type StudioStoryMeta = {
  id: number;
  slug: string;
  titleDe: string;
  titleEn: string;
  competitionId: number | null;
  homeTeamId: number | null;
  awayTeamId: number | null;
  venue: string;
  playedAt: string | null;
  result: string;
  published: boolean;
};

function relationId(value: Story["competition"]): number | null {
  if (typeof value === "number") return value;
  return value?.id ?? null;
}

export async function getStudioStoryMeta(id: number): Promise<StudioStoryMeta | null> {
  const payload = await getPayload({ config });
  const story = (await payload
    .findByID({ collection: "stories", id, depth: 0, locale: "all", overrideAccess: true })
    .catch(() => null)) as Story | null;
  if (!story) return null;
  return {
    id: story.id,
    slug: story.slug,
    titleDe: altFor(story.title as LocalizedText, "de"),
    titleEn: altFor(story.title as LocalizedText, "en"),
    competitionId: relationId(story.competition),
    homeTeamId: relationId(story.homeTeam),
    awayTeamId: relationId(story.awayTeam),
    venue: story.venue ?? "",
    playedAt: story.playedAt ? story.playedAt.slice(0, 10) : null,
    result: story.result ?? "",
    published: Boolean(story.published),
  };
}

export type StoryOption = { id: number; label: string };

export async function listStoryOptions(): Promise<{
  competitions: StoryOption[];
  teams: StoryOption[];
}> {
  const payload = await getPayload({ config });
  const [competitions, teams] = await Promise.all([
    payload.find({
      collection: "competitions",
      sort: "name",
      limit: 200,
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({ collection: "teams", sort: "name", limit: 200, depth: 0, overrideAccess: true }),
  ]);
  return {
    competitions: competitions.docs.map((c) => ({ id: c.id, label: `${c.name} ${c.season}` })),
    teams: teams.docs.map((t) => ({ id: t.id, label: t.name })),
  };
}

export async function createStudioStory(input: StoryCreateInput): Promise<{ id: number }> {
  const payload = await getPayload({ config });
  const doc = await payload.create({
    collection: "stories",
    data: { slug: input.slug, title: input.titleDe, published: false },
    locale: "de",
    overrideAccess: true,
  });
  return { id: doc.id };
}

export async function updateStudioStoryMeta(input: StoryMetaInput): Promise<void> {
  const payload = await getPayload({ config });
  await payload.update({
    collection: "stories",
    id: input.id,
    data: {
      title: input.titleDe,
      competition: input.competitionId ?? null,
      homeTeam: input.homeTeamId ?? null,
      awayTeam: input.awayTeamId ?? null,
      venue: input.venue ?? null,
      playedAt: input.playedAt ?? null,
      result: input.result ?? null,
      published: input.published,
    },
    locale: "de",
    overrideAccess: true,
  });
  if (input.titleEn && input.titleEn.trim() !== "") {
    await payload.update({
      collection: "stories",
      id: input.id,
      data: { title: input.titleEn },
      locale: "en",
      overrideAccess: true,
    });
  }
}

export async function setStudioStoryPublished(id: number, published: boolean): Promise<void> {
  const payload = await getPayload({ config });
  // beforeChange hook on the collection manages publishedAt.
  await payload.update({
    collection: "stories",
    id,
    data: { published },
    locale: "de",
    overrideAccess: true,
  });
}
```

- [ ] **Step 2:** `pnpm typecheck` → pass. Commit: `feat(studio): add stories data layer`

---

### Task 4: Server actions

**Files:** Create `src/lib/studio/actions/stories.ts`

- [ ] **Step 1:** Implement (mirror `actions/photos.ts`; same `ActionResult` shape, plus `slug_taken`):

```ts
"use server";

import { auth } from "@/lib/auth/server";
import { storyCreateSchema, storyMetaSchema } from "@/lib/studio/schemas";
import {
  createStudioStory,
  setStudioStoryPublished,
  updateStudioStoryMeta,
} from "@/lib/studio/stories";

type Err = "forbidden" | "validation" | "server" | "slug_taken";
export type StoryActionResult = { ok: true; id?: number } | { ok: false; error: Err };

async function requireAdminSession(): Promise<boolean> {
  const { data: session } = await auth.getSession();
  return session?.user?.role === "admin";
}

function isUniqueViolation(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return message.includes("unique") || message.includes("duplicate");
}

export async function createStoryAction(input: unknown): Promise<StoryActionResult> {
  if (!(await requireAdminSession())) return { ok: false, error: "forbidden" };
  const parsed = storyCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation" };
  try {
    const { id } = await createStudioStory(parsed.data);
    return { ok: true, id };
  } catch (error) {
    return { ok: false, error: isUniqueViolation(error) ? "slug_taken" : "server" };
  }
}

export async function updateStoryMetaAction(input: unknown): Promise<StoryActionResult> {
  if (!(await requireAdminSession())) return { ok: false, error: "forbidden" };
  const parsed = storyMetaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation" };
  try {
    await updateStudioStoryMeta(parsed.data);
    return { ok: true };
  } catch {
    return { ok: false, error: "server" };
  }
}

export async function setStoryPublishedAction(input: {
  id: number;
  published: boolean;
}): Promise<StoryActionResult> {
  if (!(await requireAdminSession())) return { ok: false, error: "forbidden" };
  if (typeof input?.id !== "number" || typeof input?.published !== "boolean") {
    return { ok: false, error: "validation" };
  }
  try {
    await setStudioStoryPublished(input.id, input.published);
    return { ok: true };
  } catch {
    return { ok: false, error: "server" };
  }
}
```

- [ ] **Step 2:** `pnpm typecheck && pnpm lint` → pass. Commit: `feat(studio): add story actions`

---

### Task 5: Create form component

**Files:** Create `src/components/studio/story-create-form.tsx`

- [ ] **Step 1:** Client component: slug + German title inputs (reuse `fieldClass` styling from photo-card), client-side slug pattern check (show `slugInvalid`), submit → `createStoryAction` → on `{ok, id}` `router.push` to the editor (typedRoutes `as any`); on `slug_taken` show `t("slugTaken")` via sonner error toast; disable while submitting (`creating`). Auto-suggest slug from the title input (lowercase, umlauts ä→ae ö→oe ü→ue ß→ss, non-alphanumerics → hyphen, trim hyphens) but keep the slug field editable; stop auto-suggesting after the user edits the slug manually.
- [ ] **Step 2:** `pnpm typecheck && pnpm lint`. Commit: `feat(studio): add story create form`

---

### Task 6: Metadata editor form component

**Files:** Create `src/components/studio/story-meta-form.tsx`

- [ ] **Step 1:** Client component receiving `{ story: StudioStoryMeta; options: { competitions: StoryOption[]; teams: StoryOption[] } }` (type-only imports from the server module). Layout:
  - DE/EN title inputs side-by-side (grid `sm:grid-cols-2`), labels `fieldTitleDe`/`fieldTitleEn`.
  - Selects for competition/homeTeam/awayTeam with a `noSelection` empty option (value "" → null).
  - `venue` text, `playedAt` `<input type="date">` (value from `story.playedAt ?? ""`), `result` text.
  - Save button → `updateStoryMetaAction({ id, titleDe, titleEn: titleEn || undefined, competitionId, homeTeamId, awayTeamId, venue, playedAt: playedAt || undefined, result, published })` with sonner saved/saveError toasts; disabled while saving or when titleDe empty.
  - Publish section: current state badge (`publishedBadge`/`draftBadge`), a publish/unpublish button calling `setStoryPublishedAction` then `router.refresh()`, and when published a `viewLive` link to `/stories/{slug}` (typedRoutes `as any`, `target="_blank"`).
- [ ] **Step 2:** `pnpm typecheck && pnpm lint`. Commit: `feat(studio): add story metadata form`

---

### Task 7: Pages + nav + dashboard card

**Files:** Create `studio/stories/page.tsx`, `studio/stories/[id]/page.tsx`; modify `studio/layout.tsx`, `studio/page.tsx`

- [ ] **Step 1:** List page (`stories/page.tsx`, `force-dynamic`): `<StoryCreateForm />` on top; then list from `listStudioStories()` — each row: cover thumb (or placeholder box), DE title (EN title small underneath if present), playedAt date, published/draft badge, `editStory` link to `/studio/stories/${story.id}`. Empty state `storiesEmpty`.
- [ ] **Step 2:** Editor page (`stories/[id]/page.tsx`, `force-dynamic`): parse `params.id` as number (invalid → `notFound()`), `Promise.all([getStudioStoryMeta(id), listStoryOptions()])`, story null → `notFound()`; render `<StoryMetaForm story={...} options={...} />` with the slug shown read-only above the form (slug changes are out of scope — `/admin` for that).
- [ ] **Step 3:** `studio/layout.tsx`: add `navStories` link to `/studio/stories` between Übersicht and Fotos. `studio/page.tsx`: replace the dashed Stories placeholder card with an active Link card (same pattern as the Fotos card, body text reuse `cardStoriesTitle` + new body not needed — use `comingSoon` removal; keep Seiten placeholder unchanged).
- [ ] **Step 4:** `pnpm typecheck && pnpm lint && pnpm build` → pass. Commit: `feat(studio): add stories list and metadata editor pages`

---

### Task 8: E2E + full verification

**Files:** Modify `tests/e2e/studio.spec.ts`

- [ ] **Step 1:** Add gate test: unauthenticated `/studio/stories` → `/sign-in` with `next=%2Fstudio%2Fstories`.
- [ ] **Step 2:** `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm test:e2e` — all green (expect 2 skipped fixmes).
- [ ] **Step 3:** Commit: `test(studio): gate coverage for /studio/stories`

---

## Phase 2b outline + spike (separate plan, do NOT start without it)

2b = visual block builder for the 7 story layout blocks + mini Lexical editor. Before planning it, run this **timeboxed spike** (its outcome decides the rich-text approach):

1. Add exact-pinned deps matching `@payloadcms/richtext-lexical@3.84.1`'s internal version: `pnpm add lexical@0.41.0 @lexical/react@0.41.0 @lexical/link@0.41.0` (verify the pin via `node_modules/@payloadcms/richtext-lexical/package.json` → `dependencies.lexical` = 0.41.0).
2. Build a throwaway client component: `LexicalComposer` + `RichTextPlugin` + bold/italic/link toolbar; load a Payload-stored value via `editor.parseEditorState(JSON.stringify(value.root ? value : {root:...}))`; serialize with `editorState.toJSON()`.
3. Round-trip test against the canonical shape in `scripts/seed/about-page.ts` (`richParagraph()`): paragraph nodes carry `textFormat`, text nodes carry `format` bitmask (bold=1, italic=2), `mode`, `style`, `detail`, `version` — the serialized output must be accepted by Payload `update` and re-render identically via `@payloadcms/richtext-lexical/react`'s `<RichText>`.
4. Safety lock: a `collectNodeTypes(root)` walker; allowed set `{root, paragraph, text, linebreak, link, autolink}`; anything else → field renders read-only with an "Im erweiterten Editor bearbeiten" deep link to `/admin/collections/stories/{id}`.
5. If the spike fails (version conflicts, hydration issues, JSON drift): 2b falls back to "rich text links out to `/admin`" (spec's sanctioned alternative) and ships the block builder without inline rich text.

Block-builder notes for the 2b plan: `layout` blocks at depth 0 carry photo ids + stable block `id`s; updates must send the complete `layout` array (structure is shared across locales; localized subfields like `text`/`caption`/`quote` need per-locale updates keyed by block `id` — verify Payload 3.84 semantics with a manual Local API experiment BEFORE writing the plan). Reordering UI: up/down buttons, not drag-drop (simpler, accessible, beginner-friendly).
