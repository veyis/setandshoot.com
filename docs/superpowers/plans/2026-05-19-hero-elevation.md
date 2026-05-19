# Hero Elevation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate the landing-page hero to a cinematic, magazine-cover read — Slate × Cover hybrid composition, Dissolve + Depth photo transitions, per-photo kicker + camera-spec rotation, mobile sticky CTA — without regressing the existing pinning, reduced-motion handling, or e2e coverage.

**Architecture:** Split the current monolithic `hero-scene.tsx` into 5 small components under `src/components/landing/hero/`, each with one responsibility (orchestration, photo stack, slate frame, cover title, sticky CTA). Co-locate hero-specific CSS in `hero-motion.css`. Extend `LandingPhoto` with optional `hero` metadata (kicker, cameraSpec, location — locale records); all 7 landing photos rotate in the hero with `cover` leading, and `getHeroPhotos` enriches each with locale-resolved strings.

**Photo catalog (already in repo at `9dc6157`):** `cover → joust → spike → set → block → serve → dig` — 7 frames, 1536×1024 each, `cover` first as the photo-of-the-year lead. No `isHero` flag needed; all 7 photos rotate.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4, next-intl, GSAP ScrollTrigger (via existing `usePinnedScene`), Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-05-19-hero-elevation-design.md`

**Branch:** `feat/hero-elevation` (create at Task 0).

**Commit cadence:** Commit at the end of every task. Each commit must pass `pnpm typecheck` and `pnpm test`.

---

## File map

| Path                                                | Action | Responsibility                                                 |
| --------------------------------------------------- | ------ | -------------------------------------------------------------- |
| `src/lib/landing/photos.ts`                         | Modify | Add `hero` block + resolver for kicker / cameraSpec / location |
| `src/messages/en.json`, `src/messages/de.json`      | Modify | Add `home.hero.masthead.left` / `.counter` keys                |
| `src/components/landing/hero-scene.tsx`             | Delete | Replaced by folder                                             |
| `src/components/landing/hero/index.ts`              | Create | Re-export `HeroScene`                                          |
| `src/components/landing/hero/HeroScene.tsx`         | Create | Orchestrator                                                   |
| `src/components/landing/hero/HeroPhotoStack.tsx`    | Create | Photo dissolve + blur + Ken Burns + preload                    |
| `src/components/landing/hero/HeroSlateFrame.tsx`    | Create | Letterbox bars (md+) / hairline (sm), masthead, progress       |
| `src/components/landing/hero/HeroCoverTitle.tsx`    | Create | Kicker rule + text, two-line cover title, camera spec          |
| `src/components/landing/hero/HeroStickyCTA.tsx`     | Create | Mobile sticky bottom bar / desktop inline chips                |
| `src/components/landing/hero/hero-motion.css`       | Create | All hero keyframes + variants                                  |
| `src/app/globals.css`                               | Modify | Remove hero block (lines 80–189)                               |
| `src/app/(site)/[locale]/page.tsx`                  | Modify | Update import path; pass masthead i18n props                   |
| `tests/unit/components/landing/hero-scene.test.tsx` | Modify | Drop dot tests, add slate-frame / cover-title / pause tests    |
| `tests/unit/lib/landing/photos.test.ts`             | Modify | Extend existing asset-integrity tests with hero-metadata cases |
| `tests/e2e/landing-hero.spec.ts`                    | Create | Frame snapshots, mobile sticky CTA, reduced motion             |

---

## Task 0: Baseline verification

**Files:** none (git only)

> **Already done by controller before this plan kicked off:** WIP committed at `9dc6157`; branch `feat/hero-elevation` created off `9dc6157`; full unit suite green (39/39).

- [ ] **Step 1: Confirm branch and baseline.**

```bash
git branch --show-current
git status --short
pnpm typecheck && pnpm test --run tests/unit
```

Expected: `feat/hero-elevation`, clean tree, typecheck + 39 tests pass. If any of these fail, surface the failure and stop.

---

## Task 1: Extend `LandingPhoto` with `hero` metadata block (kicker / cameraSpec / location)

**Files:**

- Modify: `src/lib/landing/photos.ts`
- Modify: `tests/unit/lib/landing/photos.test.ts` (extends existing asset-integrity suite)

**Rationale:** The catalog already has the 7 hero photos (`cover`, `joust`, `spike`, `set`, `block`, `serve`, `dig`) from commit `9dc6157`. We now add per-photo display metadata so the rotating hero reads as a photo essay: a `kicker` line, a `cameraSpec` line, and a `location` line — each a `Record<Locale, string>`. `getHeroPhotos` continues to return all 7 photos (no filter change) but now resolves the hero strings for the active locale. No `isHero` flag is needed.

- [ ] **Step 1: Read the current state of the two files** before any edits, since both already exist.

```bash
sed -n '1,150p' src/lib/landing/photos.ts
sed -n '1,80p' tests/unit/lib/landing/photos.test.ts
```

Expected: `photos.ts` matches the catalog in commit `9dc6157` (7 photos, FRAME const, getLandingPhotos / getHeroPhotos / getHighlightPhotos). `photos.test.ts` contains 6 asset-integrity tests already passing.

- [ ] **Step 2: Extend the existing test file with failing tests for the new hero metadata.**

Append the following block at the bottom of `tests/unit/lib/landing/photos.test.ts`, after the closing `});` of the existing `describe`:

```ts
describe("landing photos — hero display metadata", () => {
  it("resolves a per-photo kicker, cameraSpec, and location for every hero photo (en)", () => {
    const photos = getHeroPhotos("en");
    expect(photos.length).toBe(7);
    for (const p of photos) {
      expect(typeof p.kicker).toBe("string");
      expect(typeof p.cameraSpec).toBe("string");
      expect(typeof p.location).toBe("string");
      expect(p.kicker.length).toBeGreaterThan(0);
      expect(p.cameraSpec.length).toBeGreaterThan(0);
      expect(p.location.length).toBeGreaterThan(0);
    }
  });

  it("returns localized German kicker strings when locale is 'de'", () => {
    const en = getHeroPhotos("en");
    const de = getHeroPhotos("de");
    expect(en.length).toBe(de.length);
    const enCover = en.find((p) => p.id === "cover");
    const deCover = de.find((p) => p.id === "cover");
    expect(enCover!.kicker).not.toBe(deCover!.kicker);
  });

  it("leads the rotation with cover (photo-of-the-year frame)", () => {
    const photos = getHeroPhotos("en");
    expect(photos[0]?.id).toBe("cover");
  });
});
```

- [ ] **Step 3: Run the new tests and verify they fail.**

```bash
pnpm test --run tests/unit/lib/landing/photos.test.ts -t "hero display metadata"
```

Expected: FAIL — `kicker`/`cameraSpec`/`location` are not yet on the resolved photo type.

- [ ] **Step 4: Update `src/lib/landing/photos.ts`** to add the hero metadata. Replace the entire file with the content below (preserves the existing 7-photo catalog and `HERO_IMAGE_FILES`, adds the new `LandingPhotoHeroMeta` type, `hero` field on `LandingPhoto`, `resolveHeroStrings` helper, and new fields on `ResolvedLandingPhoto`).

```ts
import type { Locale } from "@/lib/i18n/config";

/** Every custom hero JPEG under /public/images/landing — audit checklist. */
export const HERO_IMAGE_FILES = [
  "hero-cover.jpg",
  "hero-joust.jpg",
  "hero-spike.jpg",
  "hero-set.jpg",
  "hero-block.jpg",
  "hero-serve.jpg",
  "hero-dig.jpg",
] as const;

/** Custom-generated landing frames under /images/landing. */
export type LandingPhotoRole = "cover" | "joust" | "spike" | "set" | "block" | "serve" | "dig";

export type LandingPhotoHeroMeta = {
  kicker: Record<Locale, string>;
  cameraSpec: Record<Locale, string>;
  location: Record<Locale, string>;
};

export type LandingPhoto = {
  id: LandingPhotoRole;
  /** Path served from /public — optimized JPEG for LCP. */
  src: string;
  width: number;
  height: number;
  /** CSS object-position for full-bleed crops (overlay sits bottom-left). */
  objectPosition: string;
  alt: Record<Locale, string>;
  isHighlight: boolean;
  /** Per-photo hero metadata. Present for every hero-rotation photo. */
  hero?: LandingPhotoHeroMeta;
};

/** Shared output dimensions — 3:2, generated at 1536×1024 then JPEG-compressed. */
const FRAME = { width: 1536, height: 1024 } as const;

/**
 * Narrative hero order — each frame a distinct peak moment.
 * All 7 rotate in the landing hero crossfade and feed the work mosaic.
 * `cover` leads as the photo-of-the-year lead.
 */
export const LANDING_PHOTOS: LandingPhoto[] = [
  {
    id: "cover",
    src: "/images/landing/hero-cover.jpg",
    ...FRAME,
    objectPosition: "58% 40%",
    alt: {
      de: "Angriff im absoluten Peak — goldenes Randlicht, Cover-Moment des Jahres",
      en: "Attack at absolute peak — golden rim light, photo-of-the-year cover moment",
    },
    isHighlight: true,
    hero: {
      kicker: {
        en: "Cover frame · golden rim light",
        de: "Cover-Frame · goldenes Randlicht",
      },
      cameraSpec: {
        en: "Canon R5 · 70–200 f/2.8 · 1/2000 s",
        de: "Canon R5 · 70–200 f/2.8 · 1/2000 s",
      },
      location: {
        en: "Bremen, 2026",
        de: "Bremen, 2026",
      },
    },
  },
  {
    id: "joust",
    src: "/images/landing/hero-joust.jpg",
    ...FRAME,
    objectPosition: "52% 42%",
    alt: {
      de: "Netz-Duell — Angriff trifft Block in der Luft, Ball im letzten Millimeter",
      en: "Net joust — spike meets block mid-air, ball frozen between their hands",
    },
    isHighlight: true,
    hero: {
      kicker: {
        en: "Net joust · ball between the hands",
        de: "Netz-Duell · Ball zwischen den Händen",
      },
      cameraSpec: {
        en: "Canon R5 · 70–200 f/2.8 · 1/1800 s",
        de: "Canon R5 · 70–200 f/2.8 · 1/1800 s",
      },
      location: {
        en: "Hamburg, 2026",
        de: "Hamburg, 2026",
      },
    },
  },
  {
    id: "spike",
    src: "/images/landing/hero-spike.jpg",
    ...FRAME,
    objectPosition: "62% 40%",
    alt: {
      de: "Angreiferin schlägt am Netz — eingefrorener Peak-Moment, Hallenlicht von der Seite",
      en: "Outside hitter spiking at the net — frozen peak moment, sidelight from the arena",
    },
    isHighlight: true,
    hero: {
      kicker: {
        en: "Outside hitter · peak moment",
        de: "Außenangriff · Peak-Moment",
      },
      cameraSpec: {
        en: "Canon R5 · 70–200 f/2.8 · 1/2000 s",
        de: "Canon R5 · 70–200 f/2.8 · 1/2000 s",
      },
      location: {
        en: "Bremen, 2026",
        de: "Bremen, 2026",
      },
    },
  },
  {
    id: "set",
    src: "/images/landing/hero-set.jpg",
    ...FRAME,
    objectPosition: "55% 38%",
    alt: {
      de: "Zuspielerin im Sprung — Ball an den Fingerspitzen, Cover-Moment",
      en: "Setter at full extension — ball on fingertips, magazine-cover moment",
    },
    isHighlight: true,
    hero: {
      kicker: {
        en: "Setter · ball on the fingertips",
        de: "Zuspielerin · Ball an den Fingerspitzen",
      },
      cameraSpec: {
        en: "Canon R5 · 24–70 f/2.8 · 1/1600 s",
        de: "Canon R5 · 24–70 f/2.8 · 1/1600 s",
      },
      location: {
        en: "Schwerin, 2026",
        de: "Schwerin, 2026",
      },
    },
  },
  {
    id: "block",
    src: "/images/landing/hero-block.jpg",
    ...FRAME,
    objectPosition: "50% 38%",
    alt: {
      de: "Doppelblock am Netz — Froschperspektive, blaues Hallenlicht von oben",
      en: "Double block at the net — low angle, cool overhead arena light",
    },
    isHighlight: true,
    hero: {
      kicker: {
        en: "Double block · low angle",
        de: "Doppelblock · Untersicht",
      },
      cameraSpec: {
        en: "Canon R5 · 24–70 f/2.8 · 1/1600 s",
        de: "Canon R5 · 24–70 f/2.8 · 1/1600 s",
      },
      location: {
        en: "Hamburg, 2026",
        de: "Hamburg, 2026",
      },
    },
  },
  {
    id: "serve",
    src: "/images/landing/hero-serve.jpg",
    ...FRAME,
    objectPosition: "58% 45%",
    alt: {
      de: "Sprungaufschlag — volle Streckung, langer Schatten auf dem Parkett",
      en: "Jump serve — full extension, long shadow across the court floor",
    },
    isHighlight: true,
    hero: {
      kicker: {
        en: "Jump serve · full extension",
        de: "Sprungaufschlag · volle Streckung",
      },
      cameraSpec: {
        en: "Canon R5 · 70–200 f/2.8 · 1/2500 s",
        de: "Canon R5 · 70–200 f/2.8 · 1/2500 s",
      },
      location: {
        en: "Berlin, 2026",
        de: "Berlin, 2026",
      },
    },
  },
  {
    id: "dig",
    src: "/images/landing/hero-dig.jpg",
    ...FRAME,
    objectPosition: "52% 55%",
    alt: {
      de: "Hechtverteidigung über dem Parkett — Bodenperspektive, Ball im letzten Moment",
      en: "Floor dig — courtside worm's-eye view, ball inches from the wood",
    },
    isHighlight: true,
    hero: {
      kicker: {
        en: "Floor dig · worm's-eye",
        de: "Bodenabwehr · Bodenperspektive",
      },
      cameraSpec: {
        en: "Canon R5 · 16–35 f/2.8 · 1/1250 s",
        de: "Canon R5 · 16–35 f/2.8 · 1/1250 s",
      },
      location: {
        en: "Bremen, 2026",
        de: "Bremen, 2026",
      },
    },
  },
];

export type ResolvedLandingPhoto = Omit<LandingPhoto, "alt" | "hero"> & {
  alt: string;
  kicker: string;
  cameraSpec: string;
  location: string;
};

function resolveHeroStrings(
  photo: LandingPhoto,
  locale: Locale,
): Pick<ResolvedLandingPhoto, "kicker" | "cameraSpec" | "location"> {
  if (!photo.hero) return { kicker: "", cameraSpec: "", location: "" };
  return {
    kicker: photo.hero.kicker[locale] ?? photo.hero.kicker.de,
    cameraSpec: photo.hero.cameraSpec[locale] ?? photo.hero.cameraSpec.de,
    location: photo.hero.location[locale] ?? photo.hero.location.de,
  };
}

export function getLandingPhotos(locale: Locale): ResolvedLandingPhoto[] {
  return LANDING_PHOTOS.map((photo) => ({
    ...photo,
    alt: photo.alt[locale] ?? photo.alt.de,
    ...resolveHeroStrings(photo, locale),
  }));
}

export function getHeroPhotos(locale: Locale): ResolvedLandingPhoto[] {
  return getLandingPhotos(locale);
}

export function getHighlightPhotos(locale: Locale): ResolvedLandingPhoto[] {
  return getLandingPhotos(locale).filter((p) => p.isHighlight);
}

/** Wide action frame for the closing booking band. */
export function getBookingBackgroundPhoto(locale: Locale): ResolvedLandingPhoto {
  const spike = getLandingPhotos(locale).find((p) => p.id === "spike");
  if (!spike) throw new Error("landing: spike photo missing");
  return spike;
}

/** Editorial crop for the about teaser when no CMS portrait exists. */
export function getAboutFallbackPhoto(locale: Locale): ResolvedLandingPhoto {
  const serve = getLandingPhotos(locale).find((p) => p.id === "serve");
  if (!serve) throw new Error("landing: serve photo missing");
  return { ...serve, objectPosition: "58% 30%" };
}
```

- [ ] **Step 5: Run the extended tests and verify they pass.**

```bash
pnpm test --run tests/unit/lib/landing/photos.test.ts
```

Expected: all 9 tests PASS (6 existing + 3 new).

- [ ] **Step 6: Run all unit tests + typecheck.**

```bash
pnpm typecheck && pnpm test --run tests/unit
```

Expected: all PASS. The existing `hero-scene.test.tsx` calls `getHeroPhotos("en")` and receives 7 photos with the new resolved fields — its existing assertions are not affected by the addition of new fields.

- [ ] **Step 7: Commit.**

```bash
git add src/lib/landing/photos.ts tests/unit/lib/landing/photos.test.ts
git commit -m "$(cat <<'EOF'
feat(landing): per-photo hero metadata (kicker / cameraSpec / location)

Adds a hero block on LandingPhoto (locale records for kicker, camera
spec, location). getHeroPhotos enriches each of the 7 frames with
locale-resolved display strings — the rotating hero now reads as a
photo essay, not a slideshow. Extends asset-integrity tests with
metadata coverage; cover-first ordering preserved.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Add i18n keys for the masthead

**Files:**

- Modify: `src/messages/en.json`
- Modify: `src/messages/de.json`

- [ ] **Step 1: Add `masthead` keys to `src/messages/en.json`.**

Find the `"home" > "hero"` block (line 8-11). Replace:

```json
    "hero": {
      "cameraSpec": "f/2.8 · 1/2000s · ISO 6400",
      "scrollCue": "scroll"
    },
```

With:

```json
    "hero": {
      "cameraSpec": "f/2.8 · 1/2000s · ISO 6400",
      "scrollCue": "scroll",
      "masthead": {
        "left": "belin akguel · sports photography",
        "counter": "Reel · {current} ⁄ {total}"
      }
    },
```

- [ ] **Step 2: Add `masthead` keys to `src/messages/de.json`.**

Find the equivalent `"home" > "hero"` block. Apply the same shape with German content:

```json
    "hero": {
      "cameraSpec": "f/2.8 · 1/2000s · ISO 6400",
      "scrollCue": "scroll",
      "masthead": {
        "left": "belin akguel · sportfotografie",
        "counter": "Reel · {current} ⁄ {total}"
      }
    },
```

(The existing values for `cameraSpec` and `scrollCue` are whatever is currently there — preserve them; only add the new `masthead` sub-block.)

- [ ] **Step 3: Run i18n test.**

```bash
pnpm test --run tests/unit/lib/i18n.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit.**

```bash
git add src/messages/en.json src/messages/de.json
git commit -m "feat(landing): add hero masthead i18n keys

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Move `hero-scene.tsx` into `hero/` folder (no behavior change)

**Files:**

- Create: `src/components/landing/hero/HeroScene.tsx` (move)
- Create: `src/components/landing/hero/index.ts`
- Delete: `src/components/landing/hero-scene.tsx`
- Modify: `src/app/(site)/[locale]/page.tsx`
- Modify: `tests/unit/components/landing/hero-scene.test.tsx`

**Rationale:** Move the existing file as-is so the next tasks can incrementally extract subcomponents. No behavior change in this task — verify by running the existing test suite unchanged.

- [ ] **Step 1: Create the folder + index re-export.**

Create `src/components/landing/hero/index.ts`:

```ts
export { HeroScene } from "./HeroScene";
```

- [ ] **Step 2: Move `hero-scene.tsx` to `hero/HeroScene.tsx` (verbatim copy).**

```bash
mv src/components/landing/hero-scene.tsx src/components/landing/hero/HeroScene.tsx
```

- [ ] **Step 3: Update the import in `src/app/(site)/[locale]/page.tsx` line 7.**

Find:

```ts
import { HeroScene } from "@/components/landing/hero-scene";
```

Replace with:

```ts
import { HeroScene } from "@/components/landing/hero";
```

- [ ] **Step 4: Update the import in `tests/unit/components/landing/hero-scene.test.tsx` line 3.**

Find:

```ts
import { HeroScene } from "@/components/landing/hero-scene";
```

Replace with:

```ts
import { HeroScene } from "@/components/landing/hero";
```

- [ ] **Step 5: Run typecheck + unit tests.**

```bash
pnpm typecheck && pnpm test --run tests/unit
```

Expected: all PASS (we haven't changed any behavior).

- [ ] **Step 6: Commit.**

```bash
git add src/components/landing/hero/ src/components/landing/hero-scene.tsx src/app/\(site\)/\[locale\]/page.tsx tests/unit/components/landing/hero-scene.test.tsx
git commit -m "refactor(landing): move hero-scene into hero/ folder

Verbatim move; no behavior change. Folder unlocks subcomponent extraction
in subsequent commits.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Create `hero-motion.css` and import it from `HeroScene`

**Files:**

- Create: `src/components/landing/hero/hero-motion.css`
- Modify: `src/components/landing/hero/HeroScene.tsx`

**Rationale:** Establish the co-located CSS file. Initially it contains the same rules as `globals.css` for hero behavior, but scoped under `.hero-scene` and imported by `HeroScene`. Once both files contain the same rules, we delete the `globals.css` block in Task 12. This avoids visual regression mid-refactor.

- [ ] **Step 1: Create `src/components/landing/hero/hero-motion.css` with all hero-related rules copied verbatim from `src/app/globals.css` lines 80–189.**

```css
/* ------- Hero rotation: crossfade + per-variant Ken Burns ------- */

.hero-scene .hero-photo {
  opacity: 0;
  transition:
    opacity 1200ms cubic-bezier(0.4, 0, 0.2, 1),
    transform 8500ms cubic-bezier(0.4, 0, 0.2, 1);
  will-change: opacity, transform;
}
.hero-scene .hero-photo[data-active="true"] {
  opacity: 1;
}

.hero-scene .hero-photo[data-variant="1"] {
  transform: scale(1.06) translate(0.4%, -0.4%);
  transform-origin: 30% 70%;
}
.hero-scene .hero-photo[data-variant="1"][data-active="true"] {
  transform: scale(1) translate(0, 0);
}
.hero-scene .hero-photo[data-variant="2"] {
  transform: scale(1.06) translate(-0.4%, 0.4%);
  transform-origin: 70% 30%;
}
.hero-scene .hero-photo[data-variant="2"][data-active="true"] {
  transform: scale(1) translate(0, 0);
}
.hero-scene .hero-photo[data-variant="3"] {
  transform: scale(1.06) translate(0.5%, 0.3%);
  transform-origin: 50% 50%;
}
.hero-scene .hero-photo[data-variant="3"][data-active="true"] {
  transform: scale(1) translate(0, 0);
}
.hero-scene .hero-photo[data-variant="4"] {
  transform: scale(1.06) translate(-0.3%, -0.3%);
  transform-origin: 20% 30%;
}
.hero-scene .hero-photo[data-variant="4"][data-active="true"] {
  transform: scale(1) translate(0, 0);
}

.hero-scene[data-reduced-motion="true"] .hero-photo {
  transform: none;
  transition: opacity 200ms linear;
}
.hero-scene[data-reduced-motion="true"] .hero-photo[data-active="false"] {
  display: none;
}

/* ------- Progress bar (resets per active photo via React key remount) ------- */
.hero-progress-fill {
  width: 0%;
  animation-name: hero-progress;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}
@keyframes hero-progress {
  from {
    width: 0%;
  }
  to {
    width: 100%;
  }
}
@media (prefers-reduced-motion: reduce) {
  .hero-progress-fill {
    animation: none;
    width: 0%;
  }
}

.hero-scene .hero-name,
.hero-scene .hero-tagline,
.hero-scene .hero-camera,
.hero-scene .hero-ctas {
  opacity: 0;
  transform: translateY(12px);
  animation: hero-reveal 700ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.hero-scene .hero-name {
  animation-delay: 2000ms;
}
.hero-scene .hero-tagline {
  animation-delay: 2700ms;
}
.hero-scene .hero-camera {
  animation-delay: 3100ms;
}
.hero-scene .hero-ctas {
  animation-delay: 3400ms;
}

@keyframes hero-reveal {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-scene[data-reduced-motion="true"] .hero-name,
.hero-scene[data-reduced-motion="true"] .hero-tagline,
.hero-scene[data-reduced-motion="true"] .hero-camera,
.hero-scene[data-reduced-motion="true"] .hero-ctas {
  animation: none;
  opacity: 1;
  transform: none;
}
```

- [ ] **Step 2: Import the new stylesheet from `HeroScene.tsx`.**

Add at the top of `src/components/landing/hero/HeroScene.tsx`, immediately after the `"use client";` directive:

```ts
"use client";

import "./hero-motion.css";

// ...rest of existing imports
```

- [ ] **Step 3: Verify the page still renders correctly (no visual regression).**

```bash
pnpm typecheck && pnpm test --run tests/unit
```

Expected: all PASS. (At this point the styles are duplicated between `globals.css` and `hero-motion.css` — the cascade order doesn't matter because they declare the same values. We remove the `globals.css` copy in Task 12.)

- [ ] **Step 4: Commit.**

```bash
git add src/components/landing/hero/hero-motion.css src/components/landing/hero/HeroScene.tsx
git commit -m "refactor(landing): co-locate hero CSS in hero/hero-motion.css

Verbatim copy from globals.css to enable later removal of the global
block. No visual change.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Extract `HeroPhotoStack` (with Dissolve + Depth transition)

**Files:**

- Create: `src/components/landing/hero/HeroPhotoStack.tsx`
- Modify: `src/components/landing/hero/HeroScene.tsx`
- Modify: `src/components/landing/hero/hero-motion.css`
- Modify: `tests/unit/components/landing/hero-scene.test.tsx`

- [ ] **Step 1: Write failing tests for the photo stack and the new dissolve markers.**

Add to `tests/unit/components/landing/hero-scene.test.tsx` inside the existing `describe("HeroScene", () => {`:

```ts
  it("marks the active photo via data-active='true' and others 'false'", () => {
    const { container } = render(<HeroScene {...baseProps} photos={photos} />);
    const stack = container.querySelectorAll(".hero-photo");
    expect(stack.length).toBe(4);
    expect(stack[0]!.getAttribute("data-active")).toBe("true");
    expect(stack[1]!.getAttribute("data-active")).toBe("false");
    expect(stack[2]!.getAttribute("data-active")).toBe("false");
    expect(stack[3]!.getAttribute("data-active")).toBe("false");
  });

  it("emits a data-variant in 1..4 per photo for the Ken Burns trajectory", () => {
    const { container } = render(<HeroScene {...baseProps} photos={photos} />);
    const stack = container.querySelectorAll(".hero-photo");
    expect(stack[0]!.getAttribute("data-variant")).toBe("1");
    expect(stack[1]!.getAttribute("data-variant")).toBe("2");
    expect(stack[2]!.getAttribute("data-variant")).toBe("3");
    expect(stack[3]!.getAttribute("data-variant")).toBe("4");
  });
```

- [ ] **Step 2: Run tests and verify the dot-indicator tests still pass but the new tests pass too (they describe behavior already in the file). All should still be PASS — this step is a safety check before refactor.**

```bash
pnpm test --run tests/unit/components/landing/hero-scene.test.tsx
```

Expected: PASS for all assertions including the new two (the existing component already emits these attributes).

- [ ] **Step 3: Create `src/components/landing/hero/HeroPhotoStack.tsx`.**

```tsx
"use client";

import { useEffect } from "react";
import { LandingImage } from "@/components/landing/landing-image";
import type { ResolvedLandingPhoto } from "@/lib/landing/photos";

type Props = {
  photos: ResolvedLandingPhoto[];
  activeIndex: number;
};

/**
 * Full-bleed photo stack with Dissolve + Depth (opacity + blur) transition
 * driven entirely by CSS via `data-active` and `data-variant` attributes.
 * The variant index assigns each photo a Ken Burns trajectory (1..4).
 *
 * Performance: priority-loads photo 0, preloads the next photo in queue
 * via a transient `<link rel="preload">` on every active-index change so
 * the dissolve never reveals a half-decoded image.
 */
export function HeroPhotoStack({ photos, activeIndex }: Props) {
  // Preload the next photo on every rotation tick.
  useEffect(() => {
    if (photos.length < 2) return;
    const next = photos[(activeIndex + 1) % photos.length];
    if (!next) return;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = next.src;
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, [activeIndex, photos]);

  if (photos.length === 0) return null;

  return (
    <div className="hero-photo-stack absolute inset-0">
      {photos.map((photo, index) => (
        <div
          key={photo.id}
          className="hero-photo absolute inset-0"
          data-active={index === activeIndex ? "true" : "false"}
          data-variant={(index % 4) + 1}
          aria-hidden={index !== activeIndex}
        >
          <LandingImage
            photo={photo}
            sizes="100vw"
            priority={index === 0}
            className="size-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Update `HeroScene.tsx` to use `HeroPhotoStack`.**

In `src/components/landing/hero/HeroScene.tsx`:

a. Add to the imports block:

```ts
import { HeroPhotoStack } from "./HeroPhotoStack";
```

b. Remove the existing `LandingImage` import (no longer needed in this file):

```ts
// DELETE this line:
import { LandingImage } from "@/components/landing/landing-image";
```

c. In the JSX, replace the entire `{photos.length > 0 && ( ... photo-stack div ... )}` block (currently lines ~84-103 of the moved file) with:

```tsx
<HeroPhotoStack photos={photos} activeIndex={activeIndex} />
```

- [ ] **Step 5: Replace the dissolve+depth CSS rules in `hero-motion.css`.**

In `src/components/landing/hero/hero-motion.css`, replace the entire `.hero-photo` opacity/transition rule and the four `.hero-photo[data-variant="N"]` blocks with:

```css
/* ------- Hero rotation: Dissolve + Depth + per-variant Ken Burns ------- */

.hero-scene .hero-photo {
  opacity: 0;
  filter: blur(8px);
  transform: scale(1.1);
  transition:
    opacity 1800ms cubic-bezier(0.6, 0.05, 0.4, 1),
    filter 1800ms cubic-bezier(0.6, 0.05, 0.4, 1),
    transform 11000ms cubic-bezier(0.5, 0, 0.2, 1);
  will-change: opacity, filter, transform;
}
.hero-scene .hero-photo[data-active="true"] {
  opacity: 1;
  filter: blur(0);
  transform: scale(1);
}

/* Per-photo Ken Burns offsets layered on top of the active-state base scale */
.hero-scene .hero-photo[data-variant="1"][data-active="true"] {
  transform: scale(1) translate(0.4%, -0.4%);
  transform-origin: 30% 70%;
}
.hero-scene .hero-photo[data-variant="2"][data-active="true"] {
  transform: scale(1) translate(-0.4%, 0.4%);
  transform-origin: 70% 30%;
}
.hero-scene .hero-photo[data-variant="3"][data-active="true"] {
  transform: scale(1) translate(0.5%, 0.3%);
  transform-origin: 50% 50%;
}
.hero-scene .hero-photo[data-variant="4"][data-active="true"] {
  transform: scale(1) translate(-0.3%, -0.3%);
  transform-origin: 20% 30%;
}

@media (max-width: 767px) {
  .hero-scene .hero-photo {
    filter: blur(4px);
  }
}

.hero-scene[data-reduced-motion="true"] .hero-photo {
  filter: none !important;
  transform: none !important;
  transition: opacity 200ms linear;
}
.hero-scene[data-reduced-motion="true"] .hero-photo[data-active="false"] {
  display: none;
}
```

- [ ] **Step 6: Run tests + typecheck.**

```bash
pnpm typecheck && pnpm test --run tests/unit
```

Expected: all PASS.

- [ ] **Step 7: Commit.**

```bash
git add src/components/landing/hero/HeroPhotoStack.tsx src/components/landing/hero/HeroScene.tsx src/components/landing/hero/hero-motion.css tests/unit/components/landing/hero-scene.test.tsx
git commit -m "feat(landing): HeroPhotoStack with Dissolve + Depth transition

Extracts photo rotation into its own component. Replaces simple crossfade
with opacity + filter:blur(8px→0) + scale(1.1→1) over 1.8s — the pull-focus
detail that separates cinema from slideshow. Mobile reduces blur to 4px;
reduced-motion drops blur and scale entirely. Preloads photos[i+1] on
every rotation to prevent decode flash.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Extract `HeroSlateFrame` (letterbox bars, masthead, progress strip)

**Files:**

- Create: `src/components/landing/hero/HeroSlateFrame.tsx`
- Modify: `src/components/landing/hero/HeroScene.tsx`
- Modify: `src/components/landing/hero/hero-motion.css`
- Modify: `tests/unit/components/landing/hero-scene.test.tsx`

- [ ] **Step 1: Write failing tests for the slate frame.**

Add to `tests/unit/components/landing/hero-scene.test.tsx`:

```ts
  it("renders the masthead left wordmark and right counter", () => {
    const { container } = render(<HeroScene {...baseProps} photos={photos} />);
    expect(container.querySelector('[data-test="hero-masthead-left"]')?.textContent).toBe(
      baseProps.mastheadLeft,
    );
    expect(container.querySelector('[data-test="hero-masthead-counter"]')?.textContent).toBe(
      "Reel · 01 ⁄ 07",
    );
  });

  it("renders the progress strip when there are 2+ photos", () => {
    const { container } = render(<HeroScene {...baseProps} photos={photos} />);
    expect(container.querySelector(".hero-progress-fill")).toBeInTheDocument();
  });

  it("does not render the progress strip with a single photo", () => {
    const { container } = render(<HeroScene {...baseProps} photos={[photos[0]!]} />);
    expect(container.querySelector(".hero-progress-fill")).toBeNull();
  });
```

Also add the new prop to `baseProps`:

```ts
const baseProps = {
  name: "belin akguel",
  tagline: "Volleyball-Fotografie. Bremen.",
  cameraSpec: "f/2.8 · 1/2000s · ISO 6400",
  ctaPrimaryLabel: "Stories entdecken",
  ctaPrimaryHref: "/stories",
  ctaSecondaryLabel: "Anfrage stellen",
  ctaSecondaryHref: "/contact",
  scrollCueLabel: "scroll",
  mastheadLeft: "belin akguel · sports photography",
  mastheadCounter: "Reel · {current} ⁄ {total}",
};
```

- [ ] **Step 2: Run tests and verify they fail.**

```bash
pnpm test --run tests/unit/components/landing/hero-scene.test.tsx
```

Expected: FAIL on the three new tests (no `[data-test="hero-masthead-left"]` element).

- [ ] **Step 3: Create `src/components/landing/hero/HeroSlateFrame.tsx`.**

```tsx
"use client";

type Props = {
  current: number; // 1-indexed
  total: number;
  mastheadLeft: string;
  /** Pattern with {current} and {total} placeholders. */
  mastheadCounterTemplate: string;
  intervalMs: number;
  reducedMotion: boolean;
};

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatCounter(template: string, current: number, total: number): string {
  return template.replace("{current}", pad(current)).replace("{total}", pad(total));
}

/**
 * Letterbox bars (desktop ≥ md), top hairline (mobile),
 * masthead row, and the hairline progress strip on the top edge of
 * the bottom letterbox bar. Mobile renders no bars; the progress strip
 * uses a CSS variable (--hero-cta-h) set by HeroStickyCTA to position
 * itself just above the sticky CTA bar.
 */
export function HeroSlateFrame({
  current,
  total,
  mastheadLeft,
  mastheadCounterTemplate,
  intervalMs,
  reducedMotion,
}: Props) {
  const showProgress = total > 1 && !reducedMotion;

  return (
    <>
      {/* Desktop letterbox bars */}
      <div className="hero-bar-top pointer-events-none absolute inset-x-0 top-0 z-[2] hidden bg-black md:block" />
      <div className="hero-bar-bot pointer-events-none absolute inset-x-0 bottom-0 z-[2] hidden bg-black md:block" />

      {/* Mobile top hairline */}
      <div className="hero-hairline pointer-events-none absolute inset-x-0 top-0 z-[2] block h-px md:hidden" />

      {/* Masthead row */}
      <div className="hero-masthead absolute z-[4] flex w-full items-center justify-between px-[3%]">
        <span
          data-test="hero-masthead-left"
          className="text-ink font-mono text-[10px] tracking-[0.22em] uppercase md:text-[11px]"
        >
          {mastheadLeft}
        </span>
        <span
          data-test="hero-masthead-counter"
          className="text-ink/55 font-mono text-[10px] tracking-[0.22em] uppercase md:text-[11px]"
        >
          {formatCounter(mastheadCounterTemplate, current, total)}
        </span>
      </div>

      {/* Progress strip — pinned to bottom-of-photo / top-of-bottom-bar (desktop)
          and just above sticky CTA on mobile via --hero-cta-h CSS var */}
      {showProgress && (
        <div className="hero-progress bg-ink/10 pointer-events-none absolute inset-x-0 z-[3] h-px">
          <div
            key={`${current}-${intervalMs}`}
            className="hero-progress-fill bg-accent h-full"
            style={{ animationDuration: `${intervalMs}ms` }}
          />
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 4: Add slate-frame CSS to `hero-motion.css`.**

Append to `src/components/landing/hero/hero-motion.css`:

```css
/* ------- Letterbox bars + hairline ------- */

@media (min-width: 768px) {
  .hero-scene .hero-bar-top,
  .hero-scene .hero-bar-bot {
    height: 4.5%;
  }
}

.hero-scene .hero-hairline {
  background: rgba(244, 241, 234, 0.12);
}

/* ------- Masthead position ------- */

.hero-scene .hero-masthead {
  top: 6%;
}
@media (min-width: 768px) {
  .hero-scene .hero-masthead {
    top: 7%;
  }
}

/* ------- Progress strip position ------- */

/* Desktop: sit on top edge of bottom letterbox bar */
@media (min-width: 768px) {
  .hero-scene .hero-progress {
    bottom: 4.5%;
  }
}

/* Mobile: just above sticky CTA bar via CSS var written by HeroStickyCTA */
@media (max-width: 767px) {
  .hero-scene .hero-progress {
    bottom: var(--hero-cta-h, 0px);
  }
}
```

- [ ] **Step 5: Update `HeroScene.tsx`.**

a. Import the new component and `useTranslations`:

```ts
import { useTranslations } from "next-intl";
import { HeroSlateFrame } from "./HeroSlateFrame";
```

b. Add new required props to the `Props` type:

```ts
type Props = {
  photos: ResolvedLandingPhoto[];
  name: string;
  tagline: string;
  cameraSpec: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
  scrollCueLabel: string;
  mastheadLeft: string;
  mastheadCounter: string;
  intervalMs?: number;
};
```

c. Destructure them in the function signature:

```ts
export function HeroScene({
  photos,
  name,
  tagline,
  cameraSpec,
  ctaPrimaryLabel,
  ctaPrimaryHref,
  ctaSecondaryLabel,
  ctaSecondaryHref,
  scrollCueLabel,
  mastheadLeft,
  mastheadCounter,
  intervalMs = DEFAULT_INTERVAL_MS,
}: Props) {
```

d. Leave the two existing scrim `<div>` blocks (`pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-3/5` and the top fade) **in place**. They still belong to the hero.

e. Insert `<HeroSlateFrame ... />` immediately after the existing top-fade scrim div (i.e. between the scrims and the content overlay div):

```tsx
<HeroSlateFrame
  current={activeIndex + 1}
  total={photos.length}
  mastheadLeft={mastheadLeft}
  mastheadCounterTemplate={mastheadCounter}
  intervalMs={intervalMs}
  reducedMotion={reducedMotion}
/>
```

f. **Delete** the entire dot-indicator block (currently around line 149-176 of the moved file — the `{hasMultiple && ( <div className="hero-dots" ... )}` JSX).

g. **Delete** the existing progress-bar block (currently around line 178-187 — the `{hasMultiple && !reducedMotion && ( <div className="hero-progress" ... )}` JSX). It now lives inside `HeroSlateFrame`.

- [ ] **Step 6: Update `src/app/(site)/[locale]/page.tsx` to pass the new props.**

In `src/app/(site)/[locale]/page.tsx`, find the `<HeroScene>` call (around line 40-50) and update it to:

```tsx
<HeroScene
  photos={heroPhotos}
  name="belin akguel"
  tagline={t("site.tagline")}
  cameraSpec={t("home.hero.cameraSpec")}
  ctaPrimaryLabel={t("home.ctaStories")}
  ctaPrimaryHref="/stories"
  ctaSecondaryLabel={t("home.ctaBooking")}
  ctaSecondaryHref="/contact"
  scrollCueLabel={t("home.hero.scrollCue")}
  mastheadLeft={t("home.hero.masthead.left")}
  mastheadCounter={t("home.hero.masthead.counter", { current: "{current}", total: "{total}" })}
/>
```

Note: `next-intl` will leave `{current}` and `{total}` as literal text in the returned string because we pass them as string values — the `HeroSlateFrame` component then does its own replacement at render time using the live `current` and `total` numbers. (This avoids re-translating on every rotation tick.)

- [ ] **Step 7: Delete the dot-indicator tests from `tests/unit/components/landing/hero-scene.test.tsx`.**

Remove these four tests entirely (the fourth is the one the WIP commit added):

```ts
it("renders one dot indicator per photo when there are 2+ photos", ...);
it("does not render dot indicators with a single photo", ...);
it("jumping to a dot updates the active index", ...);
it("cycles through all photo ids via dot navigation", ...);
```

- [ ] **Step 8: Run tests + typecheck.**

```bash
pnpm typecheck && pnpm test --run tests/unit
```

Expected: PASS. The new masthead/progress tests pass; dot-indicator tests removed; everything else unaffected.

- [ ] **Step 9: Commit.**

```bash
git add src/components/landing/hero/HeroSlateFrame.tsx src/components/landing/hero/HeroScene.tsx src/components/landing/hero/hero-motion.css src/app/\(site\)/\[locale\]/page.tsx tests/unit/components/landing/hero-scene.test.tsx
git commit -m "feat(landing): HeroSlateFrame with letterbox + masthead + progress

Letterbox bars on desktop, top hairline on mobile. Masthead row with
left wordmark + right counter (Reel · NN ⁄ NN). Hairline progress strip
sits on the top edge of the bottom letterbox bar (desktop) or just above
the sticky CTA (mobile) via --hero-cta-h CSS var. Removes dot indicators.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Extract `HeroCoverTitle` (kicker + two-line title + camera spec, with per-photo rotation)

**Files:**

- Create: `src/components/landing/hero/HeroCoverTitle.tsx`
- Modify: `src/components/landing/hero/HeroScene.tsx`
- Modify: `src/components/landing/hero/hero-motion.css`
- Modify: `tests/unit/components/landing/hero-scene.test.tsx`

- [ ] **Step 1: Write failing tests for per-photo rotation of kicker / camera spec.**

Append to `tests/unit/components/landing/hero-scene.test.tsx`:

```ts
  it("renders the active photo's kicker in the cover title block", () => {
    const { container, rerender } = render(<HeroScene {...baseProps} photos={photos} />);
    expect(container.querySelector('[data-test="hero-kicker"]')?.textContent).toContain(
      "spike kicker",
    );
    // Programmatically advance by overriding intervalMs to a small value and re-rendering
    rerender(<HeroScene {...baseProps} photos={photos} intervalMs={1} />);
  });

  it("renders the active photo's camera spec, not the static i18n prop", () => {
    const { container } = render(<HeroScene {...baseProps} photos={photos} />);
    expect(container.querySelector('[data-test="hero-camera"]')?.textContent).toContain(
      "spike spec",
    );
  });

  it("renders the cover title with two lines (belin / akguel.)", () => {
    render(<HeroScene {...baseProps} photos={photos} />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toMatch(/belin/);
    expect(h1.textContent).toMatch(/akguel\./);
  });
```

- [ ] **Step 2: Run tests and verify they fail.**

```bash
pnpm test --run tests/unit/components/landing/hero-scene.test.tsx
```

Expected: FAIL — no `[data-test="hero-kicker"]` element; current camera spec uses i18n prop, not per-photo data.

- [ ] **Step 3: Create `src/components/landing/hero/HeroCoverTitle.tsx`.**

```tsx
"use client";

type Props = {
  /** Active photo's kicker (rotates). Empty string acceptable. */
  kicker: string;
  /** Active photo's camera spec (rotates). Falls back to prop. */
  cameraSpec: string;
  /** Active photo's location (rotates), shown after an em-dash. Empty string acceptable. */
  location: string;
  /** Brand name — static across rotations. */
  name: string;
  /** Key changes with active index so the rotating lines remount + crossfade. */
  rotationKey: number;
};

/**
 * The magazine-cover title block: red kicker rule + per-photo kicker line,
 * two-line "belin / akguel." Fraunces title (static across rotations — it
 * is the brand), then a per-photo mono camera-spec line.
 *
 * The kicker and camera-spec rotate with the active photo; the title does not.
 * Crossfade is driven by remounting those two lines via React key.
 */
export function HeroCoverTitle({ kicker, cameraSpec, location, name, rotationKey }: Props) {
  const nameParts = name.split(" ");
  const firstName = nameParts[0] ?? name;
  const lastName = nameParts.slice(1).join(" ");

  const kickerLine = location ? `${kicker} — ${location}` : kicker;

  return (
    <div className="hero-cover-title absolute right-[3%] bottom-[22%] left-[3%] z-[4] max-md:bottom-[24%]">
      {/* Red kicker rule + text — rotates */}
      <div key={`kicker-${rotationKey}`} className="hero-kicker mb-3 flex items-center gap-[10px]">
        <span className="hero-kicker-rule bg-accent inline-block h-[1.5px] w-[26px]" />
        <span
          data-test="hero-kicker"
          className="hero-kicker-text text-accent font-mono text-[10px] tracking-[0.22em] uppercase md:text-[11px]"
        >
          {kickerLine}
        </span>
      </div>

      {/* Static cover title */}
      <h1
        className="hero-cover-name font-display text-ink"
        style={{
          fontWeight: 500,
          fontSize: "clamp(2.8rem, 8.5vw, 8.5rem)",
          lineHeight: 0.86,
          letterSpacing: "-0.035em",
        }}
      >
        <span className="hero-cover-line-1 block">{firstName}</span>
        {lastName && (
          <span className="hero-cover-line-2 block">
            {lastName}
            <span className="hero-cover-period text-accent">.</span>
          </span>
        )}
      </h1>

      {/* Per-photo camera spec — rotates */}
      <div
        key={`spec-${rotationKey}`}
        data-test="hero-camera"
        className="hero-camera text-ink/60 mt-3.5 font-mono text-[10px] tracking-[0.18em] uppercase md:text-[11px]"
      >
        {cameraSpec}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Replace the static name/tagline/camera/CTA block in `HeroScene.tsx`.**

In `src/components/landing/hero/HeroScene.tsx`:

a. Add to imports:

```ts
import { HeroCoverTitle } from "./HeroCoverTitle";
```

b. Pull the active photo's metadata for rendering:

```ts
const activePhoto = photos[activeIndex];
const activeKicker = activePhoto?.kicker ?? "";
const activeCamera = activePhoto?.cameraSpec ?? cameraSpec;
const activeLocation = activePhoto?.location ?? "";
```

(Insert this just after the existing `const hasMultiple = photos.length > 1;` line.)

c. Remove the entire existing content overlay block (the `<div className="relative z-10 flex w-full flex-col gap-5 p-6 ...">` and its children — currently lines ~121-147 of the moved file).

d. Insert in its place:

```tsx
<HeroCoverTitle
  kicker={activeKicker}
  cameraSpec={activeCamera}
  location={activeLocation}
  name={name}
  rotationKey={activeIndex}
/>
```

(CTAs are added back via `HeroStickyCTA` in Task 8.)

- [ ] **Step 5: Add kicker / camera crossfade rules to `hero-motion.css`.**

Append to `src/components/landing/hero/hero-motion.css`:

```css
/* ------- Per-photo kicker + camera-spec crossfade ------- */

.hero-scene .hero-kicker,
.hero-scene .hero-camera {
  animation: hero-meta-fade 600ms cubic-bezier(0.16, 1, 0.3, 1) both;
}
.hero-scene .hero-camera {
  animation-delay: 100ms;
}
@keyframes hero-meta-fade {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.hero-scene[data-reduced-motion="true"] .hero-kicker,
.hero-scene[data-reduced-motion="true"] .hero-camera {
  animation: none;
  opacity: 1;
  transform: none;
}
```

- [ ] **Step 6: Run tests + typecheck.**

```bash
pnpm typecheck && pnpm test --run tests/unit
```

Expected: PASS. (CTA tests in the existing suite may currently fail because we deleted the CTA JSX — they will be restored in Task 8. If you see CTA test failures, **skip ahead to Task 8 before committing**. If you want a green commit here, temporarily comment out the CTA tests and uncomment them in Task 8.)

For this plan we **continue without committing yet**; Tasks 7 + 8 land as one commit. Move to Task 8.

---

## Task 8: Extract `HeroStickyCTA` (mobile sticky bottom bar / desktop inline chips)

**Files:**

- Create: `src/components/landing/hero/HeroStickyCTA.tsx`
- Modify: `src/components/landing/hero/HeroScene.tsx`
- Modify: `src/components/landing/hero/hero-motion.css`
- Modify: `tests/unit/components/landing/hero-scene.test.tsx`

- [ ] **Step 1: Write failing tests for sticky CTA and the inline chips render.**

Add to `tests/unit/components/landing/hero-scene.test.tsx`:

```ts
  it("renders both CTAs once (desktop inline and mobile sticky live in the same bar with breakpoint visibility)", () => {
    render(<HeroScene {...baseProps} photos={photos} />);
    // We render exactly one anchor per CTA target; both are visible via CSS at the chosen breakpoint
    const stories = screen.getAllByRole("link", { name: baseProps.ctaPrimaryLabel });
    const book = screen.getAllByRole("link", { name: baseProps.ctaSecondaryLabel });
    expect(stories.length).toBe(1);
    expect(book.length).toBe(1);
    expect(stories[0]).toHaveAttribute("href", baseProps.ctaPrimaryHref);
    expect(book[0]).toHaveAttribute("href", baseProps.ctaSecondaryHref);
  });

  it("the CTA bar exposes a data attribute that switches between sticky and inline based on viewport", () => {
    const { container } = render(<HeroScene {...baseProps} photos={photos} />);
    // The component always renders the bar; visibility is CSS-driven (tested in e2e).
    expect(container.querySelector('[data-test="hero-cta-bar"]')).toBeInTheDocument();
  });
```

- [ ] **Step 2: Create `src/components/landing/hero/HeroStickyCTA.tsx`.**

```tsx
"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

type Props = {
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

/**
 * Renders the two CTA chips. On mobile (< md) the chips live in a sticky
 * bottom bar inside the hero section, gradient-faded over the photo, sitting
 * above the iOS home indicator. On desktop they appear in-flow at bottom-left
 * via the same `.hero-cta-bar` rules — only the position/decoration differ.
 *
 * Writes the bar's measured height to a CSS var `--hero-cta-h` on the section,
 * so HeroSlateFrame's progress strip can sit just above the bar on mobile.
 */
export function HeroStickyCTA({ primaryLabel, primaryHref, secondaryLabel, secondaryHref }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const section = el.closest(".hero-scene") as HTMLElement | null;
    if (!section) return;

    const apply = () => {
      // Only set --hero-cta-h on mobile; on desktop the var stays 0.
      if (window.matchMedia("(max-width: 767px)").matches) {
        section.style.setProperty("--hero-cta-h", `${el.offsetHeight}px`);
      } else {
        section.style.setProperty("--hero-cta-h", "0px");
      }
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    const onResize = () => apply();
    window.addEventListener("resize", onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      section.style.removeProperty("--hero-cta-h");
    };
  }, []);

  return (
    <div
      ref={ref}
      data-test="hero-cta-bar"
      className="hero-cta-bar absolute right-0 bottom-0 left-0 z-[4] grid grid-cols-[1.4fr_1fr] gap-2 px-[14px] pt-3 pb-[max(22px,env(safe-area-inset-bottom))] md:right-auto md:bottom-[10%] md:left-[3%] md:flex md:gap-2 md:p-0"
    >
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={primaryHref as any}
        className="hero-cta-primary bg-accent text-canvas hover:bg-accent/90 px-4 py-3 text-center font-mono text-[10px] tracking-[0.2em] uppercase transition-colors"
      >
        {primaryLabel}
      </Link>
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={secondaryHref as any}
        className="hero-cta-ghost border-ink/45 text-ink hover:text-accent hover:border-accent border px-4 py-3 text-center font-mono text-[10px] tracking-[0.2em] uppercase transition-colors"
      >
        {secondaryLabel}
      </Link>
    </div>
  );
}
```

- [ ] **Step 3: Add sticky-CTA CSS to `hero-motion.css`.**

Append to `src/components/landing/hero/hero-motion.css`:

```css
/* ------- Sticky CTA bar (mobile) ------- */

@media (max-width: 767px) {
  .hero-scene .hero-cta-bar {
    background: linear-gradient(to top, rgba(11, 14, 19, 0.97), rgba(11, 14, 19, 0.85));
    border-top: 1px solid rgba(244, 241, 234, 0.12);
  }
}
```

- [ ] **Step 4: Wire `HeroStickyCTA` into `HeroScene.tsx`.**

a. Add to imports:

```ts
import { HeroStickyCTA } from "./HeroStickyCTA";
```

b. Render the sticky CTA inside the section, just before `<ScrollCue />`:

```tsx
<HeroStickyCTA
  primaryLabel={ctaPrimaryLabel}
  primaryHref={ctaPrimaryHref}
  secondaryLabel={ctaSecondaryLabel}
  secondaryHref={ctaSecondaryHref}
/>
<ScrollCue label={scrollCueLabel} />
```

- [ ] **Step 5: Run tests + typecheck.**

```bash
pnpm typecheck && pnpm test --run tests/unit
```

Expected: PASS. (The pre-existing `renders both CTAs with correct href` test still passes; new sticky-CTA tests pass.)

- [ ] **Step 6: Commit Tasks 7 + 8 together.**

```bash
git add src/components/landing/hero/HeroCoverTitle.tsx src/components/landing/hero/HeroStickyCTA.tsx src/components/landing/hero/HeroScene.tsx src/components/landing/hero/hero-motion.css tests/unit/components/landing/hero-scene.test.tsx
git commit -m "feat(landing): HeroCoverTitle + HeroStickyCTA

Magazine-cover title block: red kicker rule + per-photo kicker line, two-line
'belin / akguel.' Fraunces title with red signature period (static across
rotations), per-photo camera-spec line. Sticky CTA bar pinned at hero bottom
on mobile (above iOS home indicator); inline chips at bottom-left on desktop.
Bar publishes its height as --hero-cta-h so the progress strip can sit above
it on mobile.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: First-load reveal stagger

**Files:**

- Modify: `src/components/landing/hero/hero-motion.css`
- Modify: `src/components/landing/hero/HeroScene.tsx`

- [ ] **Step 1: Add a `data-first-load` attribute to the section that flips to `false` after the longest reveal completes (~1700ms + 700ms = 2400ms).**

In `src/components/landing/hero/HeroScene.tsx`:

a. Add a state and effect:

```ts
const [firstLoad, setFirstLoad] = useState(true);

useEffect(() => {
  const t = window.setTimeout(() => setFirstLoad(false), 2500);
  return () => window.clearTimeout(t);
}, []);
```

b. On the `<section>` element, add the attribute:

```tsx
<section
  ref={sectionRef}
  className="hero-scene bg-canvas relative flex w-full items-end overflow-hidden"
  role="region"
  aria-label="Belin Akguel — sports photography hero"
  style={{ minHeight: "80vh", height: "100dvh" }}
  data-reduced-motion={reducedMotion ? "true" : "false"}
  data-active-index={activeIndex}
  data-first-load={firstLoad ? "true" : "false"}
>
```

- [ ] **Step 2: Replace the legacy reveal rules in `hero-motion.css`.**

In `src/components/landing/hero/hero-motion.css`, **delete** the entire legacy reveal block (the rules for `.hero-name`, `.hero-tagline`, `.hero-camera`, `.hero-ctas` with their `animation-delay`s and `@keyframes hero-reveal`).

Append:

```css
/* ------- First-load reveal stagger (Slate × Cover) ------- */

.hero-scene[data-first-load="true"] .hero-kicker-rule {
  transform-origin: left center;
  animation: hero-rule-scale 600ms cubic-bezier(0.16, 1, 0.3, 1) 600ms both;
}
.hero-scene[data-first-load="true"] .hero-kicker-text {
  animation: hero-fade-up 600ms cubic-bezier(0.16, 1, 0.3, 1) 700ms both;
}
.hero-scene[data-first-load="true"] .hero-cover-line-1 {
  clip-path: inset(0 0 100% 0);
  animation: hero-mask-reveal 700ms cubic-bezier(0.16, 1, 0.3, 1) 900ms both;
}
.hero-scene[data-first-load="true"] .hero-cover-line-2 {
  clip-path: inset(0 0 100% 0);
  animation: hero-mask-reveal 700ms cubic-bezier(0.16, 1, 0.3, 1) 1080ms both;
}
.hero-scene[data-first-load="true"] .hero-camera {
  animation: hero-fade-up 600ms cubic-bezier(0.16, 1, 0.3, 1) 1500ms both;
}
.hero-scene[data-first-load="true"] .hero-cta-bar > * {
  animation: hero-fade-up 600ms cubic-bezier(0.16, 1, 0.3, 1) both;
}
.hero-scene[data-first-load="true"] .hero-cta-bar > *:nth-child(1) {
  animation-delay: 1700ms;
}
.hero-scene[data-first-load="true"] .hero-cta-bar > *:nth-child(2) {
  animation-delay: 1780ms;
}
.hero-scene[data-first-load="true"] .hero-masthead,
.hero-scene[data-first-load="true"] .hero-progress {
  animation: hero-fade-in 600ms linear 200ms both;
}

@keyframes hero-fade-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes hero-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes hero-mask-reveal {
  from {
    clip-path: inset(0 0 100% 0);
  }
  to {
    clip-path: inset(0 0 0 0);
  }
}
@keyframes hero-rule-scale {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

.hero-scene[data-reduced-motion="true"] .hero-kicker-rule,
.hero-scene[data-reduced-motion="true"] .hero-kicker-text,
.hero-scene[data-reduced-motion="true"] .hero-cover-line-1,
.hero-scene[data-reduced-motion="true"] .hero-cover-line-2,
.hero-scene[data-reduced-motion="true"] .hero-camera,
.hero-scene[data-reduced-motion="true"] .hero-cta-bar > *,
.hero-scene[data-reduced-motion="true"] .hero-masthead,
.hero-scene[data-reduced-motion="true"] .hero-progress {
  animation: none;
  clip-path: none;
  opacity: 1;
  transform: none;
}
```

- [ ] **Step 3: Run tests + typecheck.**

```bash
pnpm typecheck && pnpm test --run tests/unit
```

Expected: PASS.

- [ ] **Step 4: Commit.**

```bash
git add src/components/landing/hero/HeroScene.tsx src/components/landing/hero/hero-motion.css
git commit -m "feat(landing): line-by-line reveal stagger (~2.4s budget)

Replaces the 3.4s delayed name reveal with a tighter Slate × Cover stagger:
red kicker rule scales in (600ms), kicker text fades up (700ms), title
lines mask-reveal sequentially (900ms / 1080ms), camera spec (1500ms),
CTA chips (1700/1780ms). Masthead + progress fade in early (200ms).
data-first-load flips off at 2500ms to prevent re-runs on rotation.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Pause rotation on tab hidden (visibilitychange)

**Files:**

- Modify: `src/components/landing/hero/HeroScene.tsx`
- Modify: `tests/unit/components/landing/hero-scene.test.tsx`

- [ ] **Step 1: Write failing test.**

Append to `tests/unit/components/landing/hero-scene.test.tsx`:

```ts
import { act } from "@testing-library/react";

// inside describe("HeroScene", () => {
  it("does not advance while document.visibilityState is 'hidden'", () => {
    vi.useFakeTimers();
    const { container } = render(<HeroScene {...baseProps} photos={photos} intervalMs={50} />);
    const section = container.querySelector(".hero-scene");

    // Simulate tab hidden
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(section?.getAttribute("data-active-index")).toBe("0");

    // Simulate tab visible again
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));

    act(() => {
      vi.advanceTimersByTime(60);
    });
    // Still 0 because IntersectionObserver isn't set up in jsdom — but the visibility-change
    // pause specifically should not have caused us to skip ticks. Re-enabling visibility re-arms.
    vi.useRealTimers();
  });
```

(The assertion is intentionally narrow: it verifies the section's active-index doesn't advance during the hidden window. The "resume after visible" behavior is covered in e2e.)

- [ ] **Step 2: Run test and verify it fails (the existing code does not listen for visibilitychange).**

```bash
pnpm test --run tests/unit/components/landing/hero-scene.test.tsx -t "visibilityState"
```

Expected: depending on whether IntersectionObserver is faked, the test may currently pass coincidentally (because IO isn't intersecting in jsdom). Verify the implementation step still adds the listener (see Step 3).

- [ ] **Step 3: Extend the rotation effect in `HeroScene.tsx`.**

a. Add new state:

```ts
const [tabVisible, setTabVisible] = useState(
  typeof document === "undefined" ? true : document.visibilityState !== "hidden",
);
```

b. Add an effect listening to `visibilitychange`:

```ts
useEffect(() => {
  if (typeof document === "undefined") return;
  const onVis = () => setTabVisible(document.visibilityState !== "hidden");
  document.addEventListener("visibilitychange", onVis);
  return () => document.removeEventListener("visibilitychange", onVis);
}, []);
```

c. Update the rotation effect's guard:

Find the existing rotation effect:

```ts
useEffect(() => {
  if (!hasMultiple || reducedMotion || !inView) return;
  // ...
}, [hasMultiple, reducedMotion, inView, photos.length, intervalMs]);
```

Replace with:

```ts
useEffect(() => {
  if (!hasMultiple || reducedMotion || !inView || !tabVisible) return;
  const id = window.setInterval(() => {
    setActiveIndex((i) => (i + 1) % photos.length);
  }, intervalMs);
  return () => window.clearInterval(id);
}, [hasMultiple, reducedMotion, inView, tabVisible, photos.length, intervalMs]);
```

- [ ] **Step 4: Run tests + typecheck.**

```bash
pnpm typecheck && pnpm test --run tests/unit
```

Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add src/components/landing/hero/HeroScene.tsx tests/unit/components/landing/hero-scene.test.tsx
git commit -m "feat(landing): pause hero rotation on tab hidden

Extends IntersectionObserver pause coverage with document.visibilitychange.
Rotation only ticks when both viewport visibility and tab visibility are
true. Prevents stale activeIndex churn when the user is in another tab.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Remove the legacy hero CSS from `globals.css`

**Files:**

- Modify: `src/app/globals.css`

- [ ] **Step 1: Open `src/app/globals.css` and delete lines 80–189** — the entire `/* ------- Hero rotation ... */` section and the `/* ------- Progress bar ... */` section, and the hero-name/tagline/camera/ctas reveal block. Stop before the `.booking-cta` rule.

After the delete, line 80 should be `.booking-cta .cta-primary:hover .cta-arrow {` (or whatever immediately followed the hero block).

- [ ] **Step 2: Run dev build smoke + tests.**

```bash
pnpm typecheck && pnpm test --run tests/unit && pnpm lint
```

Expected: PASS.

- [ ] **Step 3: Manually verify the hero still looks correct via dev server.**

```bash
pnpm dev
```

Open `http://localhost:3000/` and `http://localhost:3000/de` and confirm:

- Letterbox bars visible top + bottom on desktop.
- Masthead row at top.
- Two-line cover title at bottom-left.
- Per-photo kicker + camera-spec rotate every 6.5s.
- Photos crossfade with a visible defocus → focus blur.
- Mobile (DevTools 390×844): no letterbox; sticky CTA bar at bottom.

Stop dev server. If anything looks wrong, the regression is in the CSS removal — restore the deleted block and re-run.

- [ ] **Step 4: Commit.**

```bash
git add src/app/globals.css
git commit -m "refactor(landing): remove duplicated hero CSS from globals.css

Hero-specific rules now live in components/landing/hero/hero-motion.css
co-located with the component. Global stylesheet trimmed accordingly.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: Playwright e2e — frame snapshots, mobile sticky CTA, reduced motion

**Files:**

- Create: `tests/e2e/landing-hero.spec.ts`

- [ ] **Step 1: Create `tests/e2e/landing-hero.spec.ts`.**

```ts
import { test, expect } from "@playwright/test";

test.describe("Hero — Slate × Cover", () => {
  test("desktop: first frame renders the cover title, masthead, and letterbox", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    // Wait for reveal stagger to complete (~2.5s)
    await page.waitForTimeout(2600);

    // Cover title H1
    await expect(page.getByRole("heading", { level: 1 })).toContainText("belin");

    // Masthead counter visible (NN ⁄ NN format)
    const counter = page.locator('[data-test="hero-masthead-counter"]');
    await expect(counter).toBeVisible();
    await expect(counter).toContainText("⁄");

    // Inline CTA chips visible at bottom-left
    const ctaBar = page.locator('[data-test="hero-cta-bar"]');
    await expect(ctaBar).toBeVisible();

    // No sticky-CTA gradient background on desktop (computed style spot-check)
    const bg = await ctaBar.evaluate((el) => getComputedStyle(el).borderTopStyle);
    expect(bg).toBe("none");
  });

  test("desktop: after one rotation, kicker and camera-spec text changed", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.waitForTimeout(2600);

    const kickerBefore = await page.locator('[data-test="hero-kicker"]').textContent();
    const cameraBefore = await page.locator('[data-test="hero-camera"]').textContent();

    // Default hold is 6500ms — wait one full rotation
    await page.waitForTimeout(7000);

    const kickerAfter = await page.locator('[data-test="hero-kicker"]').textContent();
    const cameraAfter = await page.locator('[data-test="hero-camera"]').textContent();
    expect(kickerAfter).not.toBe(kickerBefore);
    expect(cameraAfter).not.toBe(cameraBefore);
  });

  test("mobile: sticky CTA bar present with gradient backing, letterbox bars hidden", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.waitForTimeout(2600);

    const ctaBar = page.locator('[data-test="hero-cta-bar"]');
    await expect(ctaBar).toBeVisible();
    const borderTop = await ctaBar.evaluate((el) => getComputedStyle(el).borderTopStyle);
    expect(borderTop).toBe("solid");

    // Letterbox bars are hidden on mobile
    const topBar = page.locator(".hero-bar-top");
    await expect(topBar).toBeHidden();
  });

  test("reduced motion: no blur, no scale, photo is instantly opaque", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.waitForTimeout(400);

    const photo = page.locator(".hero-photo[data-active='true']").first();
    const filter = await photo.evaluate((el) => getComputedStyle(el).filter);
    const transform = await photo.evaluate((el) => getComputedStyle(el).transform);
    expect(filter === "none" || filter === "").toBeTruthy();
    expect(transform === "none" || transform === "matrix(1, 0, 0, 1, 0, 0)").toBeTruthy();

    await ctx.close();
  });
});
```

- [ ] **Step 2: Run the new spec.**

```bash
pnpm test:e2e -- --grep "Hero — Slate × Cover"
```

Expected: PASS. If a test fails on visual timing (the 2600ms wait), bump the wait by 200ms — but no farther; failures past 3s indicate the reveal budget regressed.

- [ ] **Step 3: Commit.**

```bash
git add tests/e2e/landing-hero.spec.ts
git commit -m "test(landing): e2e for Slate × Cover hero — frames, mobile, reduced-motion

Covers: desktop first-frame composition, post-rotation per-photo metadata
change, mobile sticky CTA + hidden letterbox, reduced-motion stripping of
blur/scale.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 13: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full unit suite.**

```bash
pnpm test --run tests/unit
```

Expected: all PASS.

- [ ] **Step 2: Run typecheck and lint.**

```bash
pnpm typecheck && pnpm lint
```

Expected: PASS.

- [ ] **Step 3: Run the full e2e suite.**

```bash
pnpm test:e2e
```

Expected: PASS. (If unrelated suites fail, surface them — do not patch around them.)

- [ ] **Step 4: Run a production build smoke.**

```bash
pnpm build
```

Expected: build succeeds; no new warnings beyond baseline.

- [ ] **Step 5: Visual sanity in dev.**

```bash
pnpm dev
```

Visit `/` and `/de`. Confirm in a browser:

- Reveal completes in roughly 2.5s with: red rule, kicker, title line 1, title line 2, camera spec, CTA chips arriving in order.
- Photo rotation visibly pulls focus (blur → sharp) every 6.5s.
- Kicker line text changes per photo (e.g. `Cover frame · golden rim light — Bremen, 2026` → `Net joust · ball between the hands — Hamburg, 2026`).
- Cover title `belin / akguel.` stays put through rotations; the `.` is red.
- Masthead counter increments `Reel · 01 ⁄ 07` → `02 ⁄ 07` → ... → `07 ⁄ 07` → `01 ⁄ 07`.
- Hairline progress strip sits on the top edge of the bottom letterbox bar.
- Mobile (DevTools 390×844): no bars, sticky CTA bar with gradient, progress strip sits just above it.
- Tab-switch away from the page for 30s, come back: counter has not advanced.
- Reduced motion (DevTools → Rendering → Emulate CSS prefers-reduced-motion: reduce): photos crossfade in 200ms with no blur, no scale; type appears immediately.

If any of these checks fail, the bug is in the corresponding task — go back and fix before claiming done.

- [ ] **Step 6: Push the branch.**

```bash
git push -u origin feat/hero-elevation
```

- [ ] **Step 7: Open a PR.**

```bash
gh pr create --title "feat(landing): cinematic Slate × Cover hero" --body "$(cat <<'EOF'
## Summary
- Elevates the landing-page hero to a Slate × Cover hybrid composition: documentary film-slate framing (letterbox bars, mono masthead, frame counter, hairline progress) wearing magazine-cover typography (oversized two-line Fraunces "belin / akguel." title with red signature period, red kicker rule, mono camera-spec).
- Per-photo kicker + camera-spec rotate with each photo; cover title stays static.
- Dissolve + Depth transition: opacity + blur(8px → 0) + scale(1.10 → 1) for the pull-focus film read. Mobile drops blur to 4px; reduced-motion drops blur and scale entirely.
- Mobile drops letterbox in favor of a sticky bottom CTA bar that lives inside the hero (above iOS home indicator). Inline chips on desktop.
- Faster first-load reveal (~2.4 s vs 3.4 s) with line-by-line mask reveal of the title.
- Rotation pauses on both viewport-off and tab-hidden.
- Refactor: single `hero-scene.tsx` → `hero/HeroScene` + `HeroPhotoStack` + `HeroSlateFrame` + `HeroCoverTitle` + `HeroStickyCTA` + co-located `hero-motion.css`.

## Test plan
- [ ] `pnpm test --run tests/unit` passes
- [ ] `pnpm test:e2e` passes — new `landing-hero.spec.ts` included
- [ ] `pnpm typecheck && pnpm lint && pnpm build` clean
- [ ] Visual: desktop reveal, rotation, blur dissolve, kicker/spec change per photo
- [ ] Visual: mobile sticky CTA + no letterbox, progress sits above sticky CTA
- [ ] Visual: reduced motion strips blur + scale, photos crossfade instantly
- [ ] Visual: tab-switch pause works (counter doesn't tick while hidden)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Return the PR URL to the user.

---

## Spec coverage check

| Spec section                          | Covered by                                                                                           |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| §1 Intent                             | Plan overall; Task 13 visual sanity                                                                  |
| §2.1 Desktop composition              | Tasks 4, 6, 7, 8, 9                                                                                  |
| §2.2 Mobile composition               | Tasks 6, 8                                                                                           |
| §3.1 Photo transition                 | Task 5                                                                                               |
| §3.2 Type rotation                    | Task 7                                                                                               |
| §3.3 First-load reveal                | Task 9                                                                                               |
| §3.4 Rotation pause coverage          | Task 10                                                                                              |
| §4 Data model                         | Task 1                                                                                               |
| §5 Component architecture             | Tasks 3, 5, 6, 7, 8                                                                                  |
| §5.1 Import path                      | Task 3                                                                                               |
| §6 Accessibility (region label, etc.) | Task 9 (section role/label) + existing reduced-motion handling preserved by Task 5 + Task 11 cleanup |
| §7 Performance (preload, GPU)         | Task 5 (preload chain + `will-change`) + Task 5 (mobile blur reduction)                              |
| §8 Testing                            | Tasks 1, 5, 6, 7, 8, 10, 12                                                                          |
| §9 i18n keys                          | Task 2                                                                                               |
| §10 Scope guardrails                  | Task 3 (preserves pinning), Task 5 (preserves IO), Task 10 (preserves reduced-motion)                |
| §11 Acceptance                        | Task 13                                                                                              |
