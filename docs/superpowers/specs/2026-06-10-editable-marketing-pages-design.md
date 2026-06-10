# Editable Marketing Pages — Design (About pilot)

Date: 2026-06-10
Status: Proposed (pilot scope approved)

## Problem

Marketing pages (Home, About, Athletes, Services, Contact, Highlights) are bespoke
Next.js layouts whose copy lives in next-intl catalogs (`src/messages/de.json`,
`en.json`) and whose images come from code (`getAboutFallbackPhoto`). A
non-technical editor (Belin) cannot change any of it without a developer + deploy.

Goal: let the editor change **copy, images, and which sections show / in what order**
on these pages from `/admin`, in DE + EN, without touching code — starting with a
single pilot page (**About**), using a block pattern that generalizes to the rest.

## Non-goals

- No drag-and-drop visual page builder. Sections are predefined, styled blocks.
- The interactive Contact/booking form stays in code; only surrounding copy is editable.
- The Home (`/`) hero (GSAP/Lenis) is out of scope for this pilot — see Open Questions.
- No new CMS product; this reuses Payload globals + the existing block pattern.

## Approach

A Payload **global per page** holding a localized `sections` **blocks** field. The
page is rewritten to render those blocks in order via per-block components — the
same pattern Stories already use (`layout: blocks` → `src/components/story/story-blocks.tsx`).

Chosen over the alternative ("override next-intl strings from a global") because
that only handles copy; images + section show/hide/reorder require structured
content the page renders from directly.

### Data model — `aboutPage` global

`src/payload/globals/about-page.ts`, registered in `payload.config.ts` `globals: [...]`.

```
GlobalConfig {
  slug: "aboutPage",
  access: { read: () => true, update: canManageContent },  // matches existing globals
  admin: { group: "Pages" },
  fields: [
    { name: "sections", type: "blocks", blocks: marketingBlocks, label: "Sektionen" }
  ],
}
```

### Block library — `src/payload/blocks/marketing/`

Derived from the current About layout. Each is a `Block` (slug, interfaceName,
German labels, localized text fields), reusable across the other 5 pages.

| Block (`slug`)   | Fields                                                                                                                                          | Notes                     |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `pageHeader`     | `label` (text), `title` (text), `intro` (textarea) — all localized                                                                              | The `<header>` block      |
| `portraitFigure` | `photo` (relationship → `photos`), `caption` (text, localized)                                                                                  | Image from Photos library |
| `editorialProse` | `eyebrow` (text), `title` (text), `body1` (richText), `pullQuote` (text), `body2` (richText), `credits` (array of `{ line: text }`) — localized | The editorial column      |
| `ctaLink`        | `label` (text, localized), `target` (select of internal routes, e.g. `/contact`)                                                                | Internal link             |

All text fields `localized: true`; Payload localization (de default, en fallback)
is already configured. `richText` uses the existing `lexicalEditor`.

### Rendering & data flow

1. `de.json`/`en.json` remain the canonical **default copy** (unchanged).
2. A **seed** (`scripts/seed/about-page.ts`, idempotent) populates the `aboutPage`
   global's sections from those defaults if the global has no sections yet.
3. `about/page.tsx` is rewritten to: `getPayload()` → read `aboutPage` global at the
   request locale → render `sections` through a new `MarketingBlocks` renderer
   (`src/components/site/marketing-blocks.tsx`), one component per block slug, in order.
4. If the global has **no** sections (fresh DB pre-seed), the renderer falls back to
   the current next-intl-driven markup so the page is never blank.
5. An `afterChange` hook on the global revalidates `/[locale]/about` for both locales
   (mirror `src/payload/hooks/revalidate-story.ts`).

### Editor experience (`/admin` → Pages → About)

DE/EN locale tabs; edit copy inline; pick the portrait from the Photos library;
drag sections to reorder; remove a section to hide it; add a section from the block list.

## Caveats / constraints

- Bespoke layouts: hiding/removing is safe; **arbitrary reordering** of visually
  coupled pieces (portrait + caption) can look off. Each block keeps its designed
  styling; we do not promise pixel-perfect output in every permutation.
- `editorialProse.title` currently uses `" / "` → newline; in the CMS the editor
  types real line breaks (whitespace-pre-line preserved in the component).

## Testing

- **Unit** (vitest): `MarketingBlocks` renders each block type; respects order;
  falls back when `sections` is empty; skips unknown block slugs.
- **E2E** (playwright): extend `nav-pages` / add `about` assertions — seeded About
  renders its header title + intro + portrait `<img>`; page still returns 200.
- **Parity check**: after seeding, About matches the pre-change page (manual + screenshot).
- Admin-edit-to-live flow is not e2e-covered (needs the Neon Auth test user — same
  gap as the booking `test.fixme`).

## Rollout (after pilot ships)

The 4 blocks are reusable. Each remaining page gets its own global composing them,
plus at most 1–2 new blocks:

- Athletes, Services, Highlights → `pageHeader` + `editorialProse`/grid block + media.
- Contact → `pageHeader` + copy blocks around the existing (code) form.
- Home → deferred / copy-only (see below).

## Open questions

1. **Home page**: the hero is heavily animated (GSAP). Full block-editing is risky;
   propose copy-only there, or defer entirely. Decide at rollout time.
2. **richText vs plain text** for `body1`/`body2`: spec assumes richText for editor
   formatting; confirm that's wanted vs plain textarea (parity with today).
3. **Seed re-runs**: seed is create-if-empty only; it will not overwrite editor
   changes on later deploys. Confirm that's the desired safety behavior.
