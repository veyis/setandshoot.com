# Landing Page + Sample Photos — Design Spec

**Date:** 2026-05-18
**Status:** Draft for review
**Spec author:** brainstorming session

## Goal

Replace the minimal type-only landing page (`src/app/(site)/[locale]/page.tsx`) with a portfolio-first, photo-driven landing experience, and seed the Payload `Photos` collection with ~10 stock placeholder images so the page is visually alive in development before real shoots arrive.

End state: visitors land on a rotating hero photo, see a highlights strip, three story cards (one real-seeded + two coming-soon slots), an about teaser, and a closing booking CTA — all driven by Payload data so replacing seeded content with real content via `/admin` requires no code change.

## Non-goals

- ISR / cache tags — the page stays `force-dynamic` for now; cache layer comes in a later iteration.
- Real seed stories beyond 1 — the other two teaser slots are intentionally empty-state.
- Imagery licensing automation. Stock photo URLs are hardcoded and the seed script downloads them on demand; we do not store an OSS mirror.
- Mobile-specific photo crops — `focalPoint` from Payload is good enough for now.
- A separate portrait/about photoshoot. About teaser uses one of the seed photos (or falls back to a typographic-only layout if no suitable portrait is in the set).

## Photo seed (`scripts/seed/photos.ts`, `pnpm seed:photos`)

Single Node script that runs Payload's local API:

1. Ensure two `Tag` documents exist: one with slug `seed` (every seeded photo carries this for later cleanup) and one with slug `portrait` (used by the About teaser query). Create if missing.
2. For each of 10 hardcoded Unsplash photo URLs (CC0, redistribution-licensed):
   - Download into `public/media/seeds/<slug>.jpg`. If file already exists at expected SHA256, skip the download.
   - Call `payload.create({ collection: "photos", data, file })`. Payload generates `thumbnail` (480×360), `feed` (1400w), and `full` (2560w) variants automatically and writes them to `public/media/`.
   - Photo data includes: `alt` (DE+EN), `tags: [seedTag.id]`, plus flags per photo (`isHighlight`, `isCover`, focal point if needed).
3. Create one `Story` document, slug `pre-saison-vc-wiesbaden-vs-schwerin`:
   - Title localized DE/EN.
   - `publishedAt` ≈ 3 weeks before today.
   - `_status: "published"`.
   - 3 photos attached as gallery, one of them flagged `isCover: true`.

**The 10 photos break down as:**

| #   | Role                                                  | Flags                                        |
| --- | ----------------------------------------------------- | -------------------------------------------- |
| 1–5 | Hero rotation + highlights                            | `isHighlight: true`                          |
| 6–8 | Story gallery (Pre-Saison)                            | `isHighlight: false`; #6 has `isCover: true` |
| 9   | Portrait (about teaser)                               | tags `[seed, portrait]`                      |
| 10  | Action overflow (highlights + booking CTA background) | `isHighlight: true`                          |

So highlights has 6 distinct photos (5 + #10); the hero rotator uses 5; the story has 3; the about teaser has 1; the booking CTA uses 1 (overlaps with #10).

**Idempotency:** seed script checks for an existing Photo with the same filename before creating. Re-running is safe in CI and in dev refresh.

**Cleanup later:** real photos are added via `/admin`; seeded photos can be filtered out by their `seed` tag (or simply deleted via the Payload admin once real content lands).

## Page architecture

```
src/app/(site)/[locale]/page.tsx           (server, force-dynamic)
└── Renders 5 sections, fetches data via Promise.all of 4 payload.find calls.

src/components/landing/
├── hero-rotator.tsx           (client, "use client")
├── highlights-strip.tsx       (server, presentational)
├── stories-teaser.tsx         (server, presentational)
├── about-teaser.tsx           (server, presentational)
└── booking-cta.tsx            (server, presentational)
```

Data fetch in the page server component:

```ts
const [heroPhotos, highlightPhotos, recentStories, portraitPhotos] = await Promise.all([
  payload.find({
    collection: "photos",
    where: { isHighlight: { equals: true } },
    limit: 5,
    sort: "-updatedAt",
    locale,
  }),
  payload.find({
    collection: "photos",
    where: { isHighlight: { equals: true } },
    limit: 8,
    sort: "-updatedAt",
    locale,
  }),
  payload.find({
    collection: "stories",
    where: { _status: { equals: "published" } },
    limit: 3,
    sort: "-publishedAt",
    locale,
    depth: 2,
  }),
  payload.find({
    collection: "photos",
    where: { tags: { in: [portraitTagId] } },
    limit: 1,
    locale,
  }),
]);
```

Each section is told its result count and renders the appropriate fallback.

## Section details

### Hero rotator (client)

- Fullscreen (`min-h-[80vh] h-screen`), photos crossfade every 6s with a 1s fade.
- Two stacked `<Image>` layers, opacity toggled in React state — no animation library.
- First photo `priority`; rest lazy with `fetchpriority="low"`.
- `prefers-reduced-motion`: rotation pauses, only photo #1 displays.
- Overlay (bottom-left, generous padding):
  - Name "belin akguel" in serif 7xl/8xl.
  - Tagline (existing `site.tagline` key).
  - Camera-spec mono line `f/2.8 · 1/2000s · ISO 6400` (kept from current design).
  - CTAs: "Stories entdecken" (accent-red) + "Anfrage stellen" (outlined).
- Gradient scrim on the bottom 50% (`linear-gradient(to top, canvas/85, transparent 50%)`) so text is readable on any photo.
- Dot indicators bottom-right; 5 dots, accent-red on active. Click jumps. Arrow keys when focused.
- **Empty state (0 photos):** the rotator returns just the overlay block on a plain `bg-canvas` background — visually identical to the current landing page.

### Highlights strip (server)

- Section header: "Highlights" serif, muted small-caps subtitle "Einzelmomente" / "Single moments".
- Mobile: horizontal scroll, `overflow-x-auto scroll-snap-x`, photos sized `w-[60vw]`.
- `lg:` 4-column grid.
- Each tile square crop, focal-point centered, `next/image` with `sizes="(min-width: 1024px) 25vw, 60vw"`.
- Hover: 1.02 scale, accent-red ring.
- "Alle ansehen →" / "View all →" link to `/highlights`.
- **Empty state (<3 photos):** section hidden entirely.

### Stories teaser (server)

- Section header + tagline.
- 3-column grid on `lg:`, stacked on mobile.
- Card: cover photo `aspect-[4/5]`, match meta in mono (`YYYY.MM.DD · Home vs. Away`), title in serif, full-card link to `/stories/[slug]`.
- **Empty state for unfilled slots:** dashed-border rectangle, muted "Bald verfügbar" / "Coming soon" text, no link.
- **Empty state with 0 stories:** single coming-soon card spanning 3 columns.

### About teaser (server)

- Two columns on `lg:` (portrait 40% / copy 60%); stacked on mobile.
- Portrait `aspect-[3/4]`, 90% saturation.
- Copy: 2 paragraphs from new message keys `home.about.body1` and `home.about.body2`.
- CTA: "Mehr über mich →" / "More about me →" → `/about`.
- **Empty state (no portrait):** typographic-only — section heading, 2 paragraphs, CTA, no photo column.

### Booking CTA (server)

- Full-width band, background photo (the seed action shot), scrim `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55))`.
- Centered headline in serif: "Halle gebucht?" / "Got a court date?"
- Sub: "Spiel, Saison, Porträt — ich begleite es bildlich." / "Match, season, portrait — I'll cover it."
- Button: accent-red `bg-accent`, label "Anfrage stellen" / "Get a quote", → `/contact`.

## Translations

New keys added to `src/messages/de.json` and `en.json`:

```
home.highlights.title
home.highlights.subtitle
home.highlights.viewAll
home.stories.title
home.stories.subtitle
home.stories.comingSoon
home.about.title
home.about.body1
home.about.body2
home.about.cta
home.cta.title
home.cta.subtitle
home.cta.button
```

The hero overlay reuses existing `site.tagline`, `home.ctaStories`, `home.ctaBooking`.

## Image rendering

- All images render through `next/image`.
- Source URLs come from Payload's generated variant set (Photo.sizes.thumbnail.url / .feed.url / .full.url).
- `sizes` prop per section: hero `100vw`, highlights `(min-width: 1024px) 25vw, 60vw`, story card `(min-width: 1024px) 33vw, 90vw`, portrait `(min-width: 1024px) 40vw, 90vw`, CTA background `100vw`.
- All have explicit `alt` (from `Photo.alt`, localized).

## Testing

- **Unit (Vitest):** new `tests/unit/components/landing/hero-rotator.test.tsx`:
  - Advances index every interval tick (fake timers).
  - Pauses when `prefers-reduced-motion` is set.
  - Dot click jumps to that index.
  - Requires `vitest.config.ts` updates: widen `include` glob to `tests/unit/**/*.test.{ts,tsx}`, switch environment to `jsdom` (install `jsdom` + `@testing-library/react` as devDeps).
- **E2E (Playwright):** new spec or extend `tests/e2e/smoke.spec.ts`:
  - `/` renders the hero overlay (assert "belin akguel" visible, tagline visible).
  - At least one `<img>` element from Payload media is present.
  - "Highlights" section heading present.
  - "Stories" section heading present.
  - srcset of the first hero image includes `_feed.` (Payload feed variant) — catches regressions where someone bypasses next/image.

## File changes

```
new:
  scripts/seed/photos.ts
  src/components/landing/hero-rotator.tsx
  src/components/landing/highlights-strip.tsx
  src/components/landing/stories-teaser.tsx
  src/components/landing/about-teaser.tsx
  src/components/landing/booking-cta.tsx
  tests/unit/components/landing/hero-rotator.test.tsx
  tests/unit/setup-jsdom.ts                       (vitest setupFiles for window.matchMedia stub)
  public/media/seeds/.gitkeep
  public/media/seeds/<10 photos>.jpg              (committed)

modified:
  src/app/(site)/[locale]/page.tsx                (full rewrite)
  src/messages/de.json                            (new home.* keys)
  src/messages/en.json                            (new home.* keys)
  package.json                                    (new "seed:photos" script, add jsdom + @testing-library/react devDeps)
  vitest.config.ts                                (widen glob to {ts,tsx}, switch env to jsdom)
  tests/e2e/smoke.spec.ts                         (extend with landing asserts)
```

## Success criteria

1. `pnpm seed:photos` runs cleanly from a fresh `payload migrate` state and idempotently re-runs.
2. `/` renders a rotating hero photo crossfading every 6s, with overlay name + tagline + CTAs.
3. Scrolling reveals 6 highlights, 1 real story + 2 coming-soon cards, an about teaser with portrait + 2 paragraphs + CTA, and a closing booking CTA band.
4. `prefers-reduced-motion: reduce` set in DevTools → hero rotation pauses, only photo #1 shows.
5. All 4 verification gate steps green: lint, typecheck, vitest, playwright.
6. Lighthouse run on `/` shows LCP < 2.5s on simulated 4G — the priority preload of hero photo #1 should make this achievable on a dev build.

## Open questions resolved during brainstorm

- **Photo source:** Stock CC0 from Unsplash (decision: A, "Stock volleyball placeholders").
- **Goal:** Portfolio-first impression.
- **Hero treatment:** Rotating hero (3–5 photos).
- **Below-hero sections:** All four — highlights strip, stories teaser, about teaser, closing CTA.
- **Photo wiring:** Seed Payload Photos collection (data-driven).
- **Approach:** Lean seed — 1 real story, 2 coming-soon slots.

## Risks & tradeoffs

- **Stock photos in git:** ~10 JPEGs at 1–2MB each = ~15MB committed. Acceptable for a portfolio site; if it grows, move to LFS or a separate CDN bucket.
- **Hero LCP:** 5 photos in a rotator can hurt LCP if not careful. Mitigated by `priority` only on photo #1 and `fetchpriority="low"` on 2–5. Need to verify with Lighthouse during implementation.
- **Story empty-state honesty:** showing 2 "coming soon" cards is honest but visually weaker than 3 real cards. If the visual weakness bothers us in practice, we can flip to approach B (3 real seeded stories) before launch.
- **About portrait quality:** stock portraits often feel generic; if the chosen Unsplash portrait reads as obviously-not-Belin, we'll fall back to the typographic-only About teaser.

## Out-of-scope follow-ups

- Filter UI on the highlights strip (by tag, season, team).
- Real photoshoot import workflow + bulk uploader.
- ISR + `revalidateTag("photos")` from a Payload `afterChange` hook so the landing page becomes statically generated and revalidates on content change.
- Custom-tuned focal-point cropping per breakpoint.
- A11y deep pass on the hero rotator (live region for slide changes).
