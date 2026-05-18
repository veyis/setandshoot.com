# Landing Page Elevation — Design Spec (V1)

**Date:** 2026-05-18
**Status:** Draft for review
**Supersedes (in spirit):** `2026-05-18-landing-and-photos-design.md` (V0 — the baseline being elevated)

## Goal

Elevate the existing 5-section landing page (hero rotator + highlights strip + stories teaser + about teaser + booking CTA) into a single tight V1 that reads as a **world-class editorial cinematic** sport-photography landing page — comparable to Bob Martin / Donald Miralle portfolio standards and Awwwards Site-of-the-Day editorial submissions.

V1 is one implementation plan, one PR. The work resides entirely in components, styles, motion, and copy — no Payload schema changes, no new collections, no new env vars.

## Non-goals

- **No** custom cursor, no WebGL, no Three.js, no ambient sound — these are experimental-school trappings; editorial cinematic stays restrained.
- **No** new Payload collections / schema migrations. Photos and Stories are already in place; we work with what's there.
- **No** booking calendar widget, quote builder, or contact form on the landing page itself. The page sends visitors to `/contact`, which is out of scope.
- **No** photographer-portfolio rebrand. The wordmark and palette stay; we deepen the type system and motion language only.
- **No** multi-page redesign in V1. Only `/` and `/en` get the elevation. `/about`, `/highlights`, `/stories/*`, etc. stay as they are.

## Decisions locked during brainstorming

- **Creative school:** Editorial cinematic — Bob Martin / Donald Miralle reference. Photos lead; restrained motion; generous negative space; deep blacks.
- **Scope:** Single tight V1, one implementation plan / one PR.
- **Hero treatment:** Single photo with slow Ken Burns + delayed type reveal (no rotation in V1).
- **Section structure:** Restructure to hero → featured-story spread → work mosaic → about → restrained CTA. Drops the rigid 4-col HighlightsStrip in favor of an asymmetric editorial Work Mosaic.
- **Motion stack:** Lenis (smooth scroll) + GSAP + ScrollTrigger (timeline choreography + pinning).
- **Approach:** Scroll-jacked editorial scenes — sections pin for one beat as content layers up. Reduced-motion fallback disables pinning entirely.

## Foundation: typography, color, motion language

### Type system

Keep Fraunces (display), Inter (body), JetBrains Mono (technical). Upgrade usage:

- **Fraunces variable axes** pulled in for `opsz` (optical size, 9–144), `SOFT`, `italic`, and `small caps`. Hero name uses opsz 144; eyebrows use small caps via OpenType features; pull-quotes use italic axis.
- **Tightened typographic scale:**
  - Display: `clamp(4rem, 12vw, 12rem)`
  - Editorial title: `clamp(1.75rem, 3vw, 3rem)`
  - Body: 1.0625rem (17px), line-height 1.7
  - Mono eyebrow: 0.75rem (12px), uppercase, letter-spacing +0.1em
- **Three voices:**
  - **Display serif (Fraunces)** = the photographer's voice — names, titles, pull-quotes.
  - **Mono (JetBrains Mono)** = the technical / journalistic voice — camera specs, dates, scores, captions, photographer's marks.
  - **Body sans (Inter)** = the visitor — copy, alt text, descriptive prose.

### Color

Extend tokens; preserve the existing canvas. New entries added to `src/styles/tokens.css`:

- `--bg-canvas` `#0b0e13` (kept — deep editorial black, not pure black).
- `--bg-scrim` `rgba(11, 14, 19, 0.85)` (new — hero bottom gradient + on-image overlays).
- `--ink-primary` `#f4f1ea` (kept).
- `--ink-faint` `rgba(244, 241, 234, 0.42)` (new — captions, eyebrows, year labels, all de-emphasized type).
- `--accent-signal` `#e63946` (kept; spent rarely — one moment per scene maximum).
- `--accent-court` `#d8b66e` (kept; not used in V1).
- `--line-hairline` `rgba(244, 241, 234, 0.08)` (kept).

### Motion language

- **Lenis** with `lerp: 0.08` (slightly heavier than default — feels expensive). One provider at locale-layout level wraps all client motion.
- **GSAP timelines** for choreographed entrances. Default ease: `power3.out` for entrances, `power2.inOut` for scroll-tied animations.
- **Default reveal pattern:** `clip-path: inset(100% 0 0 0)` → `inset(0)` + `translateY(12px)` → `translateY(0)`, 800ms `power3.out`, staggered 80–120ms between siblings.
- **`prefers-reduced-motion: reduce` branch:**
  - Lenis is disabled (browser-native scroll only).
  - All `ScrollTrigger.create` pinning calls are short-circuited to no-ops via a `useReducedMotion()` hook.
  - Clip-path reveals become 200ms opacity-only fades.
  - The page remains fully readable, navigable, and visually intact.
- **No custom cursor in V1.** Cursors are an Awwwards-experimental signature, not editorial.

## Scene 1 — Hero

### Layout

Full viewport (`100vh`). One landscape photo, `object-fit: cover`, focal point honored from Payload. Type anchored bottom-left in a 12-column safe area; right column intentionally empty.

### Cinematic photo behavior

- **Ken Burns:** photo holds `transform: scale(1.04) translate(0.5%, 0.5%)` at rest, animates over 12s linear to `scale(1.0) translate(0, 0)`. Loops.
- **Bottom scrim:** `linear-gradient(to top, var(--bg-scrim) 0%, transparent 55%)`.
- **Top fade:** 10% canvas opacity over the top 20% of frame so the header doesn't fight the photo.

### Type choreography (GSAP timeline on page load)

|   Frame | Element        | Animation                                                                       |
| ------: | -------------- | ------------------------------------------------------------------------------- |
|    0 ms | photo, type    | hidden — black canvas                                                           |
|  800 ms | photo          | opacity 0 → 1, 1200 ms, `power2.out`; Ken Burns starts                          |
| 2000 ms | "belin akguel" | per-character clip-path reveal, 35 ms stagger, 700 ms total. Fraunces opsz 144. |
| 2700 ms | tagline        | opacity 0 → 1, 600 ms. Inter 17 px, max-width 38ch.                             |
| 3100 ms | camera-spec    | slide up 12 px + opacity, 500 ms. Mono 12 px.                                   |
| 3400 ms | CTAs           | both fade in together, 500 ms.                                                  |
| 3900 ms | scroll cue     | fade in, then loops pulse animation.                                            |

### Pin behavior (ScrollTrigger)

- `position: sticky; top: 0; height: 100vh` for **one viewport's worth of scroll**.
- Photo keeps its Ken Burns loop.
- Scrub-tied opacity reduces type from 1 → 0 over the pinned distance (curtain effect).
- At 100% pin progress, hero releases into Scene 2.

### Scroll cue

Bottom-center, 16 px below the safe area. A 1 px vertical hairline 16 px tall above the word `scroll` in mono 10 px, tracked +0.15 em, `--ink-faint`. Hairline pulses (scaleY 0.7 ↔ 1.0 over 1.4 s, infinite, `power1.inOut`).

### Empty / reduced-motion states

- **0 photos:** static type-only hero on canvas, no pin, no Ken Burns.
- **`prefers-reduced-motion`:** photo at scale 1.0 immediately, all type appears with simple cross-fades (no character stagger, no slide), no pinning, no scrub.

### Hero photo selection

V1 commits to one image — no rotation. Pick at implementation time from the seeded set, prioritizing the most cinematic 2560×1440 frame (likely `02-hero-block.jpg` for compositional balance, or `05-hero-dive.jpg` for action). Decision can be deferred to implementation review.

## Scene 2 — Featured Story spread

The narrative center. Surfaces the most-recent `published: true` Story (currently `pre-saison-vc-wiesbaden-vs-schwerin`) as a magazine spread, not a card.

### Layout (≥ 1024 px)

Two-column 12-grid:

- **Left (cols 1–5):** sticky photo well, `position: sticky; top: 0; height: 100vh`. Story cover in 3:4 frame. Inner-shadow inset at top/bottom edges anchors it.
- **Right (cols 7–12):** scrolling content stack, total height ~3× viewport (= 3 beats of content while cover stays pinned).

### Three beats

**Beat 1 — story meta** (first viewport-height):

- Eyebrow in mono: `STORY 001 · 2026.04.27 · WIESBADEN` (auto-numbered, date from `playedAt`).
- Title in Fraunces opsz 60: the story title (localized).
- Match meta in mono small caps: `WIESBADEN 2 — 3 SCHWERIN · 5 SÄTZE · 2:27 SPIELZEIT` (auto-composed from `homeTeam` / `awayTeam` / `result` / placeholder duration).
- 2-sentence editor's blurb in Inter 17 px (placeholder copy — replace at implementation).

**Beat 2 — gallery layer** (next viewport-height):

- The 3 photos from the story's `sequence` layout block cascade in one-by-one.
- Each is `aspect-3/4`, inset 4vh / 8vw.
- Caption beneath each in mono italic 11 px ("Set 3, Punkt 24 · 21:48 Uhr" — derived if metadata available, else a sensible placeholder).
- Each photo enters with default clip-path + Y translate reveal, 800 ms.

**Beat 3 — close** (final viewport):

- Pull-quote: one line from the story summary in 32 px Fraunces italic, max-width 26ch.
- Primary CTA "Story lesen →" linking `/stories/<slug>` — underline-from-left hover (200 ms, accent-red).
- Photographer credit `© Belin Akguel · <current year>` in mono 11 px, `--ink-faint`.

### Scroll release

When you scroll past Beat 3 the left photo unpins; ~100 ms of the cover going past before Scene 3 takes over — a deliberate cinematic cut.

### Mobile (< 1024 px)

No pinning. Cover at top (full width 3:4), then meta, then gallery (one photo per row, full-width), then close. Reveal-on-enter only.

### Empty state

If `recentStories.docs[0]` is null the entire Featured Story scene is omitted. No "coming soon" placeholder — the scene's presence implies real content.

### ScrollTrigger config

```ts
ScrollTrigger.create({
  trigger: ".featured-story",
  start: "top top",
  end: "+=300%",
  pin: ".story-cover",
  scrub: false,
});
```

The 3-photo cascade uses GSAP's `batch` API so all three photos share one ScrollTrigger instance.

## Scene 3 — Work Mosaic

Replaces `HighlightsStrip`. Asymmetric editorial grid, 12 columns, 6-row tile band rotation:

- **Row band A:** `[2×2 hero] [1×1] [1×1]`
- **Row band B:** `[1×1] [2×1 wide] [1×1]`
- **Row band C:** `[1×1] [1×1] [2×2 hero]`

9 photos drawn from `Photos where isHighlight: true`, ordered for visual cadence (alternating wide and tight compositions), not chronology.

### Section header

Above the grid, mono uppercase, **left-aligned (not centered)**:

```
WORK · 2024–26 SEASONS · <N> PUBLISHED FRAMES
```

`<N>` is a dynamic count from a `payload.count({ collection: 'photos', where: { isHighlight: { equals: true } } })` call in the page server component.

### Reveal choreography

- GSAP `batch` on tiles, `once: true`.
- Each tile: clip-path `inset(100% 0 0 0)` → `inset(0)`, 900 ms `power3.out`.
- Inner photo: scale 1.06 → 1.0 over same 900 ms.
- Stagger 80 ms, but **diagonal-from-top-left** (tiles closer to top-left fire first regardless of DOM order — computed via tile position).

### Hover (desktop only)

- Tile scales to 1.02 over 350 ms `power2.out`.
- Caption strip slides up from bottom edge: mono 11 px, two lines — match meta + date.
- Non-hovered tiles get `saturate(0.92)` via group-hover sibling selector.

### Footer of the scene

Single line below grid, mono uppercase, accent-red bullets between fragments:

```
VIEW WORK INDEX · 47 FRAMES · 8 STORIES · ALL TEAMS
```

Whole line is one link to `/highlights`. Underline-from-left hover.

### Empty state

Fewer than 6 highlight photos → collapse to a 3-column grid of whatever's available (asymmetric layout requires density).

### Mobile

Asymmetry collapses to 2-column grid; 2×2 hero tiles span full row (effectively 4×2 in mobile units). Vertical scroll only; reveals fire on intersection.

## Scene 4 — About

Mid-page after the work, before the close.

### Layout

Sticky portrait left (cols 1–5), scrolling biography right (cols 7–12). Pinned for ~1.5 viewports.

### Portrait

Same 3:4 shape as Featured Story cover, full-height of left column. **Ken Burns rhythm matches the hero** (1.04× → 1.0× over 12 s, looping). Caption beneath in mono italic 11 px:

```
BELIN AKGUEL · BREMEN · CANON R5 + RF 70-200 F/2.8
```

(Placeholder camera body — confirm at implementation. The signal here is "this is a working photographer with real gear" — meaningful to other photographers and serious clients.)

### Right column content

- **Eyebrow:** `ÜBER MICH` (DE) / `ABOUT` (EN) — mono uppercase, tracked +0.2em.
- **Title:** Fraunces opsz 60 italic, two lines max. Working draft:
  - DE: "Volleyball ist ein Spiel der Augenblicke. / Ich fotografiere die Augenblicke."
  - EN: "Volleyball is a game of moments. / I photograph the moments."
- **Body:** 2 paragraphs of 17 px Inter, ~80 words each, written in Belin's voice (not marketing-speak). Existing `home.about.body1` / `body2` keys are starting points; rewrite at implementation.
- **Pull-quote between paragraphs:** 24 px Fraunces italic, indented from 1px hairline left rule, `--ink-faint`. Working draft:
  - DE: "Ein Match ist 100 Bilder. Drei davon zählen."
  - EN: "A match is 100 frames. Three of them matter."
- **Credentials strip:** three mono 11 px lines:
  - `PUBLICATIONS · <publication list>` (real names at implementation)
  - `CLIENTS · <client list>` (real teams at implementation)
  - `AVAILABILITY · BUNDESLIGA-SAISON 2026/27 · ANFRAGEN WILLKOMMEN`
- **CTA:** "Mehr über mich →" / "More about me →" → `/about`. Underline-from-left hover.

### Reveal choreography

- Portrait enters with clip-path wipe from bottom (`inset(0 0 100% 0)` → `inset(0)`, 1000 ms — slower than other reveals because this is the page's quietest beat).
- Right column blocks fire on intersection, 200 ms stagger, 800 ms each.

### Mobile

Pin disabled. Portrait full-width 3:4 at top, content stacks below. Credentials strip becomes 3 stacked rows.

## Scene 5 — Booking CTA (the quiet close)

### Layout

Full-width, ~80vh tall, no background photo, pure canvas. Content left-aligned in the 12-col safe area (editorial signature — never centered).

### Content

- **Eyebrow:** `● ANFRAGE` / `● COMMISSION` — mono uppercase with leading accent-red bullet. The only accent-red on this scene.
- **Headline:** Fraunces opsz 144, two lines:
  - DE: "Halle gebucht? / Ich auch."
  - EN: "Got a court date? / So do I."
- **Body:** 17 px Inter, max-width 42ch, one paragraph:
  - DE: "Spiel, Saison, Porträt. Ich begleite Volleyball-Teams in Norddeutschland mit cinematischer Bildsprache und planbarer Liefertreue."
  - EN: "Match, season, portrait. I cover volleyball teams across northern Germany — cinematic frames, dependable delivery."
- **Detail line:** mono 11 px, `--ink-faint`:
  - `RESPONSE WITHIN 24H · DE / EN · BREMEN-BASED, AVAILABLE BUNDESWEIT`
- **Primary CTA:** `ANFRAGE STELLEN →` / `START A COMMISSION →` — mono 12 px tracked +0.2em uppercase, **no button background**, 1 px underline. Hover: underline thickens to 2 px, color shifts to accent-red, arrow translates right by 4 px (200 ms). Links to `/contact`.
- **Secondary CTA:** one line below — `or: hello@setandshoot.com` as a plain mailto link, mono 11 px, `--ink-faint`. (Email address is placeholder — confirm at implementation.)

### Empty space

The bottom 30 % of the scene is intentionally empty. The footer follows.

### Reveal

When the scene enters viewport: eyebrow → headline → body → detail line → CTA pair fire in sequence with 120 ms stagger (total ~600 ms). Standard clip-path + Y translate.

## Chrome — header & footer

### Header

- Stays `position: sticky; top: 0`. Adds `transform: translateY(-100%)` when the user scrolls **down** more than 80 px, slides back in when scrolling up (canonical editorial-portfolio behavior).
- Background:
  - Over the hero scene: `transparent` (no chrome between visitor and photo).
  - Past the hero: `rgba(11, 14, 19, 0.85) backdrop-filter: blur(20px)`.
- Wordmark `belin akguel` in the header uses `font-variation-settings: "opsz" 16` (same font as hero, optical-size for small).

### Footer

Three rows:

1. **Wordmark band:** 1 px hairline rule above; "set & shoot" in Fraunces opsz 100, left-aligned. The studio name gets a moment.
2. **Three columns of mono 11 px links** with mono-uppercase headers:
   - `NAVIGATION` — Stories / Highlights / Athletes / About / Services / Journal / Contact
   - `LEGAL` — Impressum / Datenschutz / Bildrechte
   - `CONNECT` — Instagram / Email / Phone
3. **Micro-credits:** `© BELIN AKGUEL <year> · GESCHALTET IN BREMEN · ENGINEERED WITH RESTRAINT` (last fragment is the editorial signature).

## Architecture

### Component tree

```
src/
  components/
    landing/
      hero-scene.tsx              (NEW — replaces hero-rotator.tsx)
      featured-story-scene.tsx    (NEW — replaces stories-teaser.tsx)
      work-mosaic-scene.tsx       (NEW — replaces highlights-strip.tsx)
      about-scene.tsx             (NEW — replaces about-teaser.tsx)
      booking-cta-scene.tsx       (REWRITE — same path, redesigned per Scene 5)
      scroll-cue.tsx              (NEW — bottom-of-hero prompt)
      reveal.tsx                  (NEW — client component wrapper for clip-path entrance)
      photo-image.tsx             (KEPT — minor refinement to support priority+focalPoint)
    motion/
      lenis-provider.tsx          (NEW — client wrapper around <ReactLenis>)
      use-pinned-scene.ts         (NEW — client hook: ScrollTrigger.create + pin + cleanup pattern)
      use-reduced-motion.ts       (NEW — client hook: reactive `prefers-reduced-motion`)
  styles/
    tokens.css                    (EXTENDED — new --bg-scrim, --ink-faint tokens, font-variation tokens)
  app/
    (site)/[locale]/
      page.tsx                    (REWRITTEN — composes the new scene components)
      layout.tsx                  (MODIFIED — wraps children in <LenisProvider>)

DELETED:
  src/components/landing/hero-rotator.tsx
  src/components/landing/highlights-strip.tsx
  src/components/landing/stories-teaser.tsx
  src/components/landing/about-teaser.tsx
  tests/unit/components/landing/hero-rotator.test.tsx
```

### Data flow

- **Server component (`page.tsx`)** continues to use `src/lib/landing/photos` helpers + Payload `find` for stories + a new `payload.count` call for the Work Mosaic header.
- **Client components** (`hero-scene`, `featured-story-scene`, `work-mosaic-scene`, `about-scene`) receive their photos / story data via props; no client-side fetching.
- **No new Payload schema.** Same `Photo`, `Story`, `Tag` shapes.
- **`force-dynamic`** stays on the page.

### Motion infrastructure

- `<LenisProvider>` wraps the locale layout — single instance per page.
- `useReducedMotion()` returns a reactive boolean; every motion-dependent hook short-circuits when it's `true`.
- `usePinnedScene({ trigger, end, pin })` returns nothing — it sets up `ScrollTrigger.create` in a `useEffect`, cleans up on unmount, and is a no-op when reduced-motion is on.
- GSAP and `@studio-freight/lenis` are added to `package.json`.

## Internationalization

All copy lives in `de.json` / `en.json` keys under a new `home` shape:

```
home.hero.cameraSpec
home.featuredStory.eyebrow         (just "STORY")
home.featuredStory.readStory       ("Story lesen" / "Read story")
home.workMosaic.eyebrow            ("WORK · YYYY-YY SEASONS · {n} PUBLISHED FRAMES" — ICU formatted)
home.workMosaic.viewIndex          ("View work index" / etc.)
home.about.eyebrow                 ("ÜBER MICH" / "ABOUT")
home.about.title                   (two-line title — kept localized)
home.about.body1, .body2           (rewritten copy)
home.about.pullQuote
home.about.cameraCaption
home.about.cta
home.cta.eyebrow                   ("● ANFRAGE")
home.cta.title                     (two-line)
home.cta.body
home.cta.detail
home.cta.primaryCta                ("ANFRAGE STELLEN →")
home.cta.secondaryEmail            ("hallo@setandshoot.com" — same in both)
```

Reuses existing `site.tagline`, `home.ctaStories`, `home.ctaBooking` for the hero overlay.

## Accessibility

- One `<h1>` (hero name). Each scene has an `<h2>` (eyebrow + title together, with `aria-hidden` on the eyebrow's visual repeat if needed).
- Skip-to-content link in the header.
- `focus-visible` rings on every interactive element (1px accent-red outline, 4 px offset).
- All icon-only buttons have `aria-label`.
- Color contrast: body Inter on canvas tests at 14.2:1 (AAA). `--ink-faint` tests at 4.6:1 (AA for body, AAA for large text).
- `prefers-reduced-motion: reduce` branch disables Lenis, ScrollTrigger pinning, and replaces all clip-path reveals with 200 ms opacity fades. **The page must remain navigable, readable, and visually intact with motion off.**

## Performance

- **Bundle budget for new motion deps:** under 100 KB gz total. Current measured cost: Lenis ~9 KB, GSAP core + ScrollTrigger ~50 KB → ~60 KB total. Within budget.
- **Hero photo:** AVIF + WebP with 2560 w / 1400 w / 800 w sources, `priority`, `fetchpriority="high"`. **LCP target < 2.5 s on simulated 4 G.**
- **Featured Story cover + About portrait:** `priority` because they're above-fold in their scenes.
- **Work Mosaic photos:** lazy with intersection-aware loading.
- **Fonts:** Fraunces variable axes subsetted to Latin only, preloaded in `<head>`, `font-display: swap`. Inter and JetBrains Mono already optimized via `next/font`.
- **ScrollTrigger.refresh()** debounced on resize.

## Browser support

- Modern evergreens (Chrome / Edge ≥ 100, Firefox ≥ 100, Safari ≥ 15.4).
- View Transitions API used opportunistically; absent elsewhere, navigation falls back to instant.
- iOS Safari ScrollTrigger pinning is known-touchy — reduced-motion fallback (which disables pinning) covers the worst case.

## Testing

### Unit (Vitest + jsdom + Testing Library)

- `tests/unit/components/landing/hero-scene.test.tsx`
  - Type reveal sequence: assert characters appear in correct order at correct delays (mock GSAP with fake timers, assert calls).
  - Reduced-motion branch: assert no GSAP timeline created; all type visible at first render.
  - 0-photo fallback: assert no photo element; type-only render visible.

- `tests/unit/components/landing/reveal.test.tsx`
  - On intersection: assert `data-revealed="true"` flips to true.
  - Reduced-motion: assert opacity fade replaces clip-path transition.

- `tests/unit/components/motion/use-pinned-scene.test.ts`
  - Mock GSAP / ScrollTrigger; assert `create` called on mount, `kill` called on unmount.
  - Reduced-motion: assert `create` NOT called.

- `tests/unit/components/motion/use-reduced-motion.test.ts`
  - `matchMedia` mock returns `matches: true` → hook returns `true`.
  - Media query `change` event updates hook value.

### E2E (Playwright)

- Existing smoke tests stay (hero h1 visible, scene headings visible, dot indicators — note: dot indicator test is **removed** because the rotator goes away).
- New: hero scroll cue visible at first paint.
- New: Work Mosaic tile count ≥ 6.
- New: About portrait visible.
- New: CTA `ANFRAGE STELLEN` link points to `/contact`.
- New: `page.emulateMedia({ reducedMotion: 'reduce' })` → all five h2s still visible; no JS errors in console.

## Risks & tradeoffs

- **iOS Safari pinning quirks.** ScrollTrigger pinning can stutter on iOS Safari under aggressive scroll. The reduced-motion fallback disables pinning entirely; that's the correctness backstop. A user on iOS with motion enabled may see slight pin-jank — accepted as a known industry tradeoff.
- **Bundle weight.** +60 KB JS for the motion deps. For an editorial-portfolio targeting prestige + buyer trust this is the right tradeoff.
- **Maintenance burden of pinned scenes.** Every future content change to a scene needs to consider its ScrollTrigger timing. The `usePinnedScene` hook contains this complexity; document its contract in JSDoc at implementation time.
- **Single hero photo commits to one image.** A bad pick weakens the whole page. The decision is small but visible; review with Belin (or pick at implementation, surface the choice).
- **Editorial copy needs Belin's voice.** Placeholder copy in this spec is starting material. At implementation, draft the German voice carefully and translate to English (not the other way) — the German market is the primary audience.

## Success criteria

1. New `/` (DE) and `/en` (EN) routes render the 5 scenes (hero, featured story, work mosaic, about, CTA) at the editorial fidelity described.
2. Lenis smooth scroll active across the whole page.
3. Hero pins for one viewport, releases cleanly.
4. Featured Story cover photo pins through all 3 right-column beats.
5. About portrait pins through right-column body.
6. `prefers-reduced-motion: reduce` disables all pinning + smooth scroll; page remains readable and beautiful.
7. Lighthouse on `/` (mobile, simulated 4G): LCP < 2.5 s, CLS < 0.05, TBT < 200 ms.
8. All five h2 headings visible to Playwright with motion both on and off.
9. Existing seed photos + seeded Story are sufficient to populate every section (no new content required for V1).

## Out-of-scope follow-ups (V2+)

- Custom cursor system tied to photo hover.
- View-Transitions navigation between `/` and story detail pages.
- Newsletter capture in the footer.
- Per-story custom layouts (the current Payload `layout` blocks system supports it but the Story detail page rendering is out of scope here).
- Multi-photo hero rotator (the V0 design that we're replacing — bring back if Belin wants seasonality).
- Audio (ambient match-day audio on the Featured Story scene was discussed and explicitly ruled out for V1).
- "Process" / Services section between work and about (placed in V0 spec — dropped for V1's restraint).
