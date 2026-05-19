# Hero Elevation — Design Spec

**Date:** 2026-05-19
**Owner:** Belin Akguel site (`setandshoot.com`)
**Surface:** `/` (home, both locales)
**Component:** `src/components/landing/hero-scene.tsx` and downstream

---

## 1. Intent

Elevate the landing-page hero to a top-tier, cinematic, magazine-cover read for a
professional sports photographer — without throwing away the working rotation,
ScrollTrigger pinning, reduced-motion handling, or e2e coverage.

The new hero is a **Slate × Cover hybrid**: documentary film-slate framing
(letterbox bars, mono masthead, frame counter, hairline progress strip) wearing
magazine-cover typography (oversized two-line Fraunces title with a red period as
a signature, red kicker rule, mono camera-spec lower-third).

Each of the four photos carries its own kicker and camera spec line that fades
with the photo, so the rotation reads as a **photo essay**, not a slideshow.

The hero remains full-bleed, full-height, and pinned via ScrollTrigger; the
existing photo set, image pipeline, and reduced-motion behavior are preserved.

---

## 2. Composition

### 2.1 Desktop (≥ 768 px)

Layout layers, bottom-to-top:

| z   | Layer          | Notes                                                                                                                                                                                                      |
| --- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | Photo stack    | 4 full-bleed photos, only active is fully opaque, others held in DOM for crossfade.                                                                                                                        |
| 1   | Scrim gradient | `linear-gradient(to top, rgba(11,14,19,.85) 0%, rgba(11,14,19,.2) 50%, rgba(11,14,19,.35) 100%)`.                                                                                                          |
| 2   | Letterbox bars | Solid `#000`, top and bottom, height `4.5%` of section height.                                                                                                                                             |
| 3   | Progress strip | 1 px full-width, sits on the **top edge of the bottom letterbox bar** — the line is the divider between photo and bar. Fill = `--accent-signal`, animates 0 → 100% per active photo via React key remount. |
| 4   | UI overlay     | Masthead, cover title, kicker, camera spec, CTAs, scroll cue.                                                                                                                                              |

Hero section height: `min-height: 80vh; height: 100dvh;` (unchanged).

Section role: `<section role="region" aria-label="Belin Akguel — sports photography hero">`.

#### Masthead (top, inside the section)

Anchored at `top: 7%` of section height, full-width row, `padding-inline: 3%`,
`display: flex; justify-content: space-between; align-items: center`.

- **Left:** mono label = `t("home.hero.masthead.left")` — content `"belin akguel · sports photography"` (en) / `"belin akguel · sportfotografie"` (de).
- **Right:** mono counter = `t("home.hero.masthead.counter", { current, total })` — content `"Reel · {current} ⁄ {total}"` (en) / `"Reel · {current} ⁄ {total}"` (de). Uses fraction slash U+2044 (`⁄`), not regular `/`.

Mono style: `font: 500 11px/1 var(--font-mono); letter-spacing: .22em; text-transform: uppercase; color: rgba(244,241,234,.85)`.
The right counter dims to `rgba(244,241,234,.55)` after first 6 seconds (subtle
restraint — the counter is informational, not headline).

#### Cover title block (bottom-left)

Anchored at `bottom: 22%`, `left: 3%`, `right: 3%`.

1. **Red kicker** — a 26 px × 1.5 px red rule (`background: var(--accent-signal)`)
   followed by 10 px gap, then a mono red line of text.
   - The mono red text is **per-photo** (rotates with active frame).
   - Mono style: same as masthead, color `var(--accent-signal)`.
   - Form: `{kicker} — {location}` (e.g. `Bundesliga · Berlin Volleys — Berlin, 2026`).
2. **Cover title** — two-line Fraunces serif, separated by `<br/>`.
   - Line 1: `belin`
   - Line 2: `akguel.` — final `.` is wrapped in `<span class="accent">` and colored `var(--accent-signal)`.
   - Style: `font: 500 clamp(3rem, 8.5vw, 8.5rem)/0.86 var(--font-display); letter-spacing: -0.035em; color: var(--ink);`.
   - Title is **static across rotations**; it is the brand. Animated only on first load.
3. **Camera spec** — mono line below the title, top margin 14 px.
   - **Per-photo** (rotates with active frame).
   - Style: `font: 500 11px/1.4 var(--font-mono); letter-spacing: .18em; text-transform: uppercase; color: rgba(244,241,234,.6);`.
   - Form: `{cameraSpec}` (e.g. `Sony A1 · 70–200 f/2.8 · 1/2000 s`).

#### CTAs (bottom-left, below the cover title)

Anchored at `bottom: 10%`, `left: 3%`.

Two chips inline, gap 8 px:

- **Primary** — `Stories →` — `background: var(--accent-signal); color: var(--bg-canvas); font: 500 11px/1 mono; letter-spacing: .2em; text-transform: uppercase; padding: 12px 16px;` — hover darkens to `--accent-signal/90`.
- **Ghost** — `Book a shoot` — `border: 1px solid rgba(244,241,234,.45); color: var(--ink); padding: 12px 16px; font: same as primary;` — hover: border + text fade to `var(--accent-signal)`.

Both chips render as `<Link>` from `next/link` with hrefs `/stories` and `/contact`.

#### Scroll cue

Unchanged from current `ScrollCue` component; rendered last as overlay.

---

### 2.2 Mobile (< 768 px) — "Slate-Light"

The letterbox bars are removed on portrait. They were a 16:9-frame device and on
a 390 × 844 frame they squeeze the photo and force the type to fight them.

Layout layers:

| z   | Layer        | Notes                                                                                                                                                                               |
| --- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | Photo stack  | Same.                                                                                                                                                                               |
| 1   | Scrim        | Slightly heavier in the bottom 30% to support sticky CTA: `linear-gradient(to top, rgba(11,14,19,.95) 0%, rgba(11,14,19,.55) 35%, rgba(11,14,19,.05) 60%, rgba(11,14,19,.4) 100%)`. |
| 2   | Top hairline | 1 px full-width `rgba(244,241,234,.12)` at `top: 0`. Replaces letterbox.                                                                                                            |
| 3   | UI overlay   | Masthead (single line), title block, sticky CTA bar.                                                                                                                                |

- **Masthead** at `top: 6%`. Left = `"belin akguel"`, right = `"01⁄04"`.
- **Title block** at `bottom: 24%`. Title font size `clamp(2.8rem, 11vw, 4.2rem)` (caps at ~67 px). Camera spec line shown.
- **Sticky CTA bar** — pinned at the bottom edge of the hero section (`position: absolute; bottom: 0; left: 0; right: 0`), `padding: 12px 14px max(22px, env(safe-area-inset-bottom));` (the bottom buffer covers iOS home indicator), `background: linear-gradient(to top, rgba(11,14,19,.97), rgba(11,14,19,.85));` with a `1px` top hairline `rgba(244,241,234,.12)`. Two chips, grid `1.4fr / 1fr`, gap 8 px. The bar lives _inside_ the hero section (not page-level fixed), so it disappears the moment the hero scrolls off — preventing it from competing with sections below.
- Progress strip on mobile: rendered just above the sticky CTA bar (positioned via a CSS variable `--hero-cta-h` set by the sticky CTA component on mount), so it visually merges with the top hairline of the sticky CTA bar — same "the line is the divider" detail as desktop.

---

## 3. Motion language

### 3.1 Photo transition — Dissolve + Depth

The signature motion. Per active-index change:

- **Opacity**: `0 → 1` over `1800 ms` using `cubic-bezier(.6, .05, .4, 1)`.
- **Blur**: `filter: blur(8px) → blur(0)` over `1800 ms` (same curve).
- **Scale**: `transform: scale(1.10) → scale(1.0)` over `11000 ms` using `cubic-bezier(.5, 0, .2, 1)` — longer than opacity, so the active frame keeps breathing after dissolve completes (this is the Ken Burns layer).

The per-photo Ken Burns variants (1–4, current `transform-origin` and translate
offsets) are preserved on top of the scale so each frame breathes asymmetrically.

**Mobile blur reduction**: `@media (max-width: 768px)` reduces blur start from
`8px` to `4px`. Same duration. Keeps the depth read without taxing low-end GPUs.

**Reduced motion**: blur and scale are dropped; transition becomes opacity 0 → 1
over 200 ms only.

### 3.2 Type rotation (kicker + camera spec)

When `activeIndex` changes:

- 0 ms — outgoing kicker + camera spec begin opacity `1 → 0` over `300 ms`.
- 400 ms — incoming kicker + camera spec begin opacity `0 → 1` over `600 ms`.

The 400 ms gap lets the photo establish first, then the metadata "labels"
catch up — the documentary read.

The cover title (`belin / akguel.`) does **not** rotate. It is the brand.

### 3.3 First-load reveal

Photo is `priority`-loaded; it appears at 0 ms with no opacity animation.

Type stagger (each element starts at the listed offset, `opacity 0 → 1`,
`transform translateY(12px) → 0`, `clip-path` mask reveal where noted, ease-out
`cubic-bezier(.16, 1, .3, 1)`):

| Offset  | Element                  | Animation                                           |
| ------- | ------------------------ | --------------------------------------------------- |
| 600 ms  | Red kicker rule          | scaleX 0 → 1 over 600 ms (left origin)              |
| 700 ms  | Kicker text              | opacity 0 → 1 + translateY                          |
| 900 ms  | Title line 1 (`belin`)   | mask `clip-path: inset(0 0 100% 0) → 0` over 700 ms |
| 1080 ms | Title line 2 (`akguel.`) | same mask reveal, 700 ms                            |
| 1500 ms | Camera spec              | opacity + translateY                                |
| 1700 ms | CTA chips                | opacity + translateY, 80 ms inter-chip stagger      |

Total perceived intro: **~2.4 s**, vs the current 3.4 s. Faster but still
intentional; the title lines arriving in sequence is the premium detail.

Masthead and progress strip fade in at 200 ms via `opacity 0 → 1` (no transform);
they belong to the frame, not the content.

**Reduced motion**: every reveal becomes a 200 ms opacity-only fade with no
mask, no translate. Masthead/progress appear immediately.

### 3.4 Rotation pause coverage

The current code pauses the rotation interval when the section leaves the
viewport (IntersectionObserver). Extend this:

- Also pause on `document.visibilityState === "hidden"` (tab switch).
- Resume only when **both** viewport visibility and document visibility return.

---

## 4. Data model

Extend `LandingPhoto` in `src/lib/landing/photos.ts`:

```ts
export type LandingPhoto = {
  // ...existing fields (id, src, width, height, objectPosition, alt, isHero, isHighlight)
  /** Per-photo hero metadata. Must be present whenever `isHero === true`. */
  hero?: {
    kicker: Record<Locale, string>; // e.g. "Bundesliga · Berlin Volleys"
    cameraSpec: Record<Locale, string>; // e.g. "Sony A1 · 70-200 f/2.8 · 1/2000 s"
    location: Record<Locale, string>; // e.g. "Berlin, 2026"
  };
};
```

TypeScript cannot conditionally require `hero` based on `isHero`, so the field
is structurally optional and the invariant is enforced by `getHeroPhotos`:
`getHeroPhotos` throws in development if a hero-tagged photo is missing the
block, and falls back to the existing `home.hero.cameraSpec` translation +
empty kicker + empty location in production.

`ResolvedLandingPhoto` (the locale-resolved shape returned by `getHeroPhotos`)
gains three resolved string fields: `kicker`, `cameraSpec`, `location`. The
hero passes the locale-resolved photo array straight to the components — no
new lookups at render time.

**Initial content** (4 photos, en + de):

| Photo | Kicker (en)                  | Kicker (de)                       | Camera spec                       | Location      |
| ----- | ---------------------------- | --------------------------------- | --------------------------------- | ------------- |
| spike | Outside hitter · peak moment | Außenangriff · Peak-Moment        | Sony A1 · 70–200 f/2.8 · 1/2000 s | Berlin, 2026  |
| block | Double block · low angle     | Doppelblock · Untersicht          | Sony A1 · 24–70 f/2.8 · 1/1600 s  | Hamburg, 2026 |
| serve | Jump serve · full extension  | Sprungaufschlag · volle Streckung | Sony A1 · 70–200 f/2.8 · 1/2500 s | Munich, 2026  |
| dig   | Floor dig · worm's-eye       | Bodenabwehr · Bodenperspektive    | Sony A1 · 16–35 f/2.8 · 1/1250 s  | Berlin, 2026  |

Final wording is editorial — final values land with the user during
implementation. The above is a working draft.

Existing `alt` is unchanged; it remains the screen-reader text. The new visible
kicker / spec / location are display strings, not a11y strings.

---

## 5. Component architecture

Move from a flat `src/components/landing/hero-scene.tsx` to a folder:

```
src/components/landing/hero/
  HeroScene.tsx          // orchestrator
  HeroPhotoStack.tsx     // photo dissolve + blur + Ken Burns
  HeroSlateFrame.tsx     // letterbox bars, masthead, progress strip
  HeroCoverTitle.tsx     // kicker, two-line title, camera spec
  HeroStickyCTA.tsx      // mobile sticky CTA bar; renders desktop chips when ≥md
  hero-motion.css        // keyframes + variant transforms (extracted from globals.css)
  index.ts               // re-exports HeroScene
```

Roles:

- **`HeroScene`** — state (`activeIndex`, `inView`, `tabVisible`), rotation
  interval, IntersectionObserver, `visibilitychange` listener, `usePinnedScene`,
  `useReducedMotion`. Renders the section element and composes the other four.
  Target ≤ 120 LOC.

- **`HeroPhotoStack`** — receives `photos`, `activeIndex`, `reducedMotion`.
  Renders the photo layers, sets `data-active` / `data-variant` attributes, drives
  the dissolve + blur + Ken Burns purely from CSS. Also issues a
  `<link rel="preload" as="image">` for the next photo in queue (`photos[(i+1) % n]`)
  so the dissolve never reveals a half-decoded image. Target ≤ 100 LOC.

- **`HeroSlateFrame`** — receives `current`, `total`, `t` (translations),
  `reducedMotion`. Renders letterbox bars (desktop), top hairline (mobile),
  masthead row, hairline progress strip with React `key={current}` to remount
  the fill animation. Target ≤ 80 LOC.

- **`HeroCoverTitle`** — receives the active photo's `kicker`, `cameraSpec`,
  `location`, and `firstLoad` flag. Renders the kicker rule + text, the static
  two-line cover title (only animates on `firstLoad`), and the camera-spec line.
  Owns the kicker/spec crossfade on rotation. Target ≤ 100 LOC.

- **`HeroStickyCTA`** — receives the two CTA configs. On mobile breakpoint,
  renders the sticky bottom bar inside the hero section. On desktop, renders the
  inline chips at `bottom: 10%`. Single component, breakpoint-conditional
  styling. Target ≤ 70 LOC.

- **`hero-motion.css`** — co-located stylesheet imported by `HeroScene`. Contains
  the `.hero-photo` dissolve + blur transition, the four Ken Burns variants,
  the progress-fill keyframe, the line-by-line title mask reveal, and the
  reduced-motion overrides. The current hero CSS in `globals.css` (lines 80–189)
  is removed.

### 5.1 Import path migration

The only consumer of the hero is `src/app/(site)/[locale]/page.tsx`:

```ts
// before
import { HeroScene } from "@/components/landing/hero-scene";

// after
import { HeroScene } from "@/components/landing/hero";
```

The `index.ts` re-export keeps the call site clean.

---

## 6. Accessibility

- Section is a labeled `region`.
- Non-active photos: `aria-hidden="true"` (preserved from current).
- Photo `alt` text: existing per-locale strings, unchanged. Per-photo kicker /
  spec are visible-only display, not a11y duplicates.
- Reduced motion: dissolve, blur, scale, mask reveal, kicker rule scale-in, type
  translateY all removed. Only 200 ms opacity remains. Letterbox bars stay
  (they are visual structure, not motion).
- Keyboard arrows / Space pause / live region announcer — **out of scope for v1**.
  Subtle controls (progress strip + counter) are sufficient. v2 candidate if
  user feedback asks for it.
- Color contrast: mono metadata (`rgba(244,241,234,.6)`) over scrim
  (`rgba(11,14,19,.85)`) → ≥ 7:1 in the bottom 30% of the frame where it sits.
  AA passes.
- Focus: CTA chips inherit focus styles from existing global outline rules.
- Glyphs used: `·` (U+00B7 middle dot) and `⁄` (U+2044 fraction slash) — both
  in every system font stack. Mockups used `⊹` (U+22B9); production uses `·`.

---

## 7. Performance

- **LCP**: photo 0 keeps `priority`. Next/Image continues to serve AVIF / WebP.
- **Preload chain**: after every rotation, prefetch `photos[(i+1) % n]` via
  `<link rel="preload" as="image" href={...}>` injected once and updated on tick.
- **GPU**: `will-change: opacity, filter, transform` is set **only** on the
  currently-active and incoming layers (not all 4). Removed on transition end via
  `transitionend` listener.
- **Mobile blur**: `filter: blur(4px) → 0` (vs `8px → 0` on desktop). Half the
  fragment cost.
- **Reduced motion**: blur and scale are dropped entirely; the photo layer
  becomes a pure opacity crossfade.
- **CLS**: photo aspect ratio (`1536 / 1024`) set via Next/Image; container is
  `aspect-ratio`-locked. No layout shift on rotation.

---

## 8. Testing

### 8.1 Vitest (component)

`tests/components/hero-scene.test.tsx`:

1. Renders 4 photos; first photo has `data-active="true"`, others `"false"`.
2. After advancing `activeIndex` programmatically (via test seam — `intervalMs={1}` and `act`), the kicker and camera spec re-render with the next photo's strings.
3. With `data-reduced-motion="true"` on the section, `hero-motion.css` selectors that disable blur and scale match (smoke test for the cascade).
4. IntersectionObserver mock — when entry `isIntersecting=false`, the rotation does not advance after `intervalMs`.
5. `document.visibilityState='hidden'` event — same: rotation does not advance.

### 8.2 Playwright (e2e)

Extend the existing landing spec:

1. **Frame 1 snapshot** — at 500 ms (priority photo + reveal complete), screenshot matches stored baseline.
2. **Frame 2 snapshot** — at 7300 ms (one rotation past default 6500 ms hold), screenshot matches stored baseline; kicker and spec text differ from frame 1.
3. **Mobile sticky CTA** — `viewport: { width: 390, height: 844 }`, sticky bar visible at section bottom, contains both chips.
4. **Desktop no sticky CTA** — `viewport: { width: 1440, height: 900 }`, no sticky CTA bar present.
5. **Reduced motion** — `colorScheme: 'dark', reducedMotion: 'reduce'`, screenshot of frame 1 matches reduced-motion baseline (no blur, no transform).

The existing test for 5-scene + reduced-motion variant (`d28fa4c`) is updated
rather than replaced.

---

## 9. i18n

New `next-intl` keys (in `src/messages/en.json` and `src/messages/de.json`):

```json
{
  "home": {
    "hero": {
      "masthead": {
        "left": "belin akguel · sports photography",
        "counter": "Reel · {current} ⁄ {total}"
      }
    }
  }
}
```

Existing keys (`home.hero.cameraSpec`, `home.hero.scrollCue`, `home.ctaStories`,
`home.ctaBooking`) remain in place. `home.hero.cameraSpec` becomes a fallback for
photos that lack the new `hero.cameraSpec` field (defensive default — should not
trigger for the 4 seeded hero photos).

CTA labels are unchanged: `home.ctaStories` = `"Stories →"`, `home.ctaBooking` = `"Book a shoot"` / `"Shooting buchen"`.

---

## 10. Scope guardrails

**Kept (no changes)**

- `usePinnedScene` ScrollTrigger pinning behavior.
- `useReducedMotion` hook contract.
- `LandingImage` for photo rendering (Next/Image, AVIF/WebP, blur placeholder).
- 6500 ms default hold per photo.
- IntersectionObserver pause-when-off-screen pattern.
- `next-intl` locale routing.

**Changed**

- Hero CSS extracted from `globals.css` to `src/components/landing/hero/hero-motion.css`.
- `LandingPhoto` gains optional `hero` metadata block.
- One import path in `page.tsx` (`@/components/landing/hero-scene` → `@/components/landing/hero`).
- Dot indicators **removed** (progress + counter already communicate position).
- First-load reveal accelerated from ~3.4 s to ~2.4 s.

**Out of scope (v2 candidates)**

- Keyboard navigation (arrows / Space).
- Live-region announcer for active photo changes.
- Drag-to-scrub on mobile.
- Sound / video reel toggle.
- Click-on-progress-strip to jump.

---

## 11. Acceptance

The hero ships when:

1. All 4 photos rotate with the dissolve + blur transition; kicker and camera
   spec rotate with each photo; cover title stays static.
2. Mobile (≤ 767 px) shows no letterbox bars and a sticky bottom CTA bar that
   disappears when the hero scrolls off.
3. Letterbox bars + masthead + progress strip render on desktop with the
   progress strip sitting on the top edge of the bottom bar.
4. First-load reveal completes in ≤ 2.5 s; reduced-motion variant completes in
   ≤ 250 ms.
5. Photo[i+1] is preloaded before each rotation; no decode flash on transition.
6. Rotation pauses on viewport-off AND on tab-hidden.
7. All Vitest and Playwright cases above pass.
8. Lighthouse mobile performance ≥ 90 on `/` (same surface as today).
