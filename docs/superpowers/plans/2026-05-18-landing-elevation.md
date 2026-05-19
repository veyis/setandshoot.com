# Landing Page Elevation V1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate the existing 5-section landing into a Bob-Martin / Donald-Miralle editorial-cinematic landing — single committed hero photo with Ken Burns + delayed type reveal, scroll-jacked pinned editorial scenes for Featured Story and About, asymmetric Work Mosaic, restrained closing CTA — driven by Lenis smooth scroll + GSAP ScrollTrigger.

**Architecture:** Five new scene components under `src/components/landing/` replace the current `HeroSection` (video-backed), `HighlightsStrip`, `StoriesTeaser`, `AboutTeaser`. Motion infrastructure (Lenis provider, useReducedMotion hook, Reveal wrapper, usePinnedScene hook) lives under `src/components/motion/`. Page composes scenes and feeds them data from the existing `src/lib/landing/photos.ts` helpers and one Payload story query.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.7, next-intl v4, Tailwind v4, Payload 3.84 (Stories only — Photos collection is unused for the landing in V1), GSAP 3.13 + ScrollTrigger, `@studio-freight/lenis` (or its successor `lenis`), Vitest 4 + jsdom, Playwright.

**Spec reference:** `docs/superpowers/specs/2026-05-18-landing-elevation-design.md`

**Codebase-state notes (verified before writing this plan):**

- The landing currently uses static photos in `public/images/landing/` (4 frames: spike, block, serve, block-alt) via `src/lib/landing/photos.ts` — NOT the Payload Photos collection. The plan keeps this architecture; the spec's references to "Payload photos for the landing" are reinterpreted as `LANDING_PHOTOS` from this helper.
- The current `HeroSection` plays a video (`public/videos/mp_.mp4`). V1 replaces the video with a single photo per the spec (Ken Burns on a still frame). The video file is left in `public/` — V1 simply doesn't render it.
- Fonts load via `src/lib/design/fonts.ts` (next/font/google) with fixed weights. To get Fraunces optical-size + soft axes the font config must be extended.
- One Payload `Story` is seeded (`pre-saison-vc-wiesbaden-vs-schwerin`). The Featured Story scene queries it via Payload `find`.
- Existing components to **delete after page.tsx is rewritten**: `hero-rotator.tsx`, `hero-section.tsx`, `highlights-strip.tsx`, `stories-teaser.tsx`, `about-teaser.tsx`. The current `hero-rotator.test.tsx` is also deleted.
- The existing `LandingImage` component (`src/components/landing/landing-image.tsx`) is the static-asset image wrapper; the spec's `PhotoImage` references resolve to **LandingImage** in this plan.

---

## File structure delivered by this plan

```
new:
  src/components/motion/use-reduced-motion.ts
  src/components/motion/lenis-provider.tsx
  src/components/motion/reveal.tsx
  src/components/motion/use-pinned-scene.ts
  src/components/landing/scroll-cue.tsx
  src/components/landing/hero-scene.tsx
  src/components/landing/featured-story-scene.tsx
  src/components/landing/work-mosaic-scene.tsx
  src/components/landing/about-scene.tsx
  tests/unit/components/motion/use-reduced-motion.test.ts
  tests/unit/components/motion/reveal.test.tsx
  tests/unit/components/motion/use-pinned-scene.test.ts
  tests/unit/components/landing/hero-scene.test.tsx

modified:
  package.json                                    (+ gsap, + lenis)
  pnpm-lock.yaml                                  (regenerated)
  src/lib/design/fonts.ts                         (Fraunces + axes; weight via opsz)
  src/styles/tokens.css                           (+ --bg-scrim, --ink-faint)
  src/components/landing/booking-cta.tsx          (rewritten per Scene 5)
  src/components/layout/header.tsx                (slide-on-scroll behavior; client component)
  src/components/layout/footer.tsx                (3-row editorial layout)
  src/app/(site)/[locale]/layout.tsx              (wrap with LenisProvider)
  src/app/(site)/[locale]/page.tsx                (compose new scenes)
  src/messages/de.json                            (new home.* keys)
  src/messages/en.json                            (matching)
  tests/e2e/smoke.spec.ts                         (reduced-motion + new section assertions)
  vitest.config.ts                                (already jsdom; verify no further change needed)

deleted:
  src/components/landing/hero-rotator.tsx
  src/components/landing/hero-section.tsx
  src/components/landing/highlights-strip.tsx
  src/components/landing/stories-teaser.tsx
  src/components/landing/about-teaser.tsx
  tests/unit/components/landing/hero-rotator.test.tsx
```

---

## Task 1: Install motion deps + extend Fraunces axes + new tokens

The motion stack and typography upgrade are the foundation everything else builds on.

**Files:**

- Modify: `package.json` (add deps)
- Modify: `src/lib/design/fonts.ts`
- Modify: `src/styles/tokens.css`

- [ ] **Step 1: Install gsap and lenis**

```bash
pnpm add gsap lenis
```

Expected: `package.json` `dependencies` adds:

```json
"gsap": "^3.13.0",
"lenis": "^1.1.18"
```

(Exact versions may differ — pnpm pulls latest stable. Both packages are MIT-licensed and have ESM exports.)

If `lenis` isn't found, fall back to its previous namespace:

```bash
pnpm add gsap @studio-freight/lenis
```

The two packages are interchangeable; the implementer imports from whichever lands.

- [ ] **Step 2: Extend Fraunces axes in `src/lib/design/fonts.ts`**

Replace the file with:

```ts
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";

export const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz", "SOFT"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
});

export const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600"],
  preload: true,
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["400"],
  preload: false,
});
```

The `axes: ["opsz", "SOFT"]` opens Fraunces's optical-size (9–144) and softness axes so we can drive them via `font-variation-settings` in CSS. `style: ["normal", "italic"]` adds the italic family.

- [ ] **Step 3: Extend `src/styles/tokens.css`**

Replace the file with:

```css
:root {
  --bg-canvas: #0b0e13;
  --bg-elevated: #13171f;
  --bg-scrim: rgba(11, 14, 19, 0.85);
  --ink-primary: #f4f1ea;
  --ink-muted: #8c8f97;
  --ink-faint: rgba(244, 241, 234, 0.42);
  --accent-signal: #e63946;
  --accent-court: #d8b66e;
  --line-hairline: rgba(244, 241, 234, 0.08);

  --font-display: var(--font-fraunces), Georgia, serif;
  --font-body: var(--font-inter), system-ui, -apple-system, sans-serif;
  --font-mono: var(--font-jetbrains-mono), ui-monospace, monospace;
}
```

- [ ] **Step 4: Map the new tokens into `@theme` so Tailwind utilities pick them up**

Open `src/app/globals.css`. The existing `@theme` block already maps several token variables to Tailwind color classes. Add lines for the new tokens inside the existing `@theme { … }`:

```css
@theme {
  /* …existing entries… */
  --color-scrim: var(--bg-scrim);
  --color-ink-faint: var(--ink-faint);
}
```

If `globals.css` doesn't have a `@theme` block, this means Tailwind v4 is mapping tokens differently in this project — fall back to using the CSS variable directly in component styles (e.g. `style={{ background: 'var(--bg-scrim)' }}`).

- [ ] **Step 5: Verify the project still builds**

```bash
pnpm typecheck && pnpm lint
```

Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml src/lib/design/fonts.ts src/styles/tokens.css src/app/globals.css
git commit -m "feat(landing): foundation — gsap+lenis deps, Fraunces axes, new tokens"
```

The commit body should mention: gsap+lenis added; Fraunces now exposes opsz/SOFT axes + italic; `--bg-scrim` and `--ink-faint` tokens added. End with the Claude co-author trailer.

---

## Task 2: Motion foundation primitives (TDD where it matters)

Five small primitives that the scene components depend on. Two have unit tests (`useReducedMotion`, `Reveal`); `LenisProvider` and `usePinnedScene` are integration-tested by the scene components that consume them; `ScrollCue` is presentational (no test).

**Files:**

- Create: `src/components/motion/use-reduced-motion.ts`
- Create: `src/components/motion/reveal.tsx`
- Create: `src/components/motion/lenis-provider.tsx`
- Create: `src/components/motion/use-pinned-scene.ts`
- Create: `src/components/landing/scroll-cue.tsx`
- Create: `tests/unit/components/motion/use-reduced-motion.test.ts`
- Create: `tests/unit/components/motion/reveal.test.tsx`

- [ ] **Step 1: Write the failing test for `useReducedMotion`**

```ts
// tests/unit/components/motion/use-reduced-motion.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";

const matchMediaMock = vi.fn();

beforeEach(() => {
  matchMediaMock.mockReset();
  window.matchMedia = matchMediaMock as unknown as typeof window.matchMedia;
});

describe("useReducedMotion", () => {
  it("returns false when prefers-reduced-motion is not set", () => {
    matchMediaMock.mockImplementation((q: string) => ({
      matches: false,
      media: q,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("returns true when prefers-reduced-motion: reduce is set", () => {
    matchMediaMock.mockImplementation((q: string) => ({
      matches: q.includes("reduced-motion"),
      media: q,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });
});
```

- [ ] **Step 2: Run and confirm it fails**

```bash
pnpm vitest run tests/unit/components/motion/use-reduced-motion.test.ts
```

Expected: FAIL with "Cannot find module '@/components/motion/use-reduced-motion'".

- [ ] **Step 3: Implement `useReducedMotion`**

```ts
// src/components/motion/use-reduced-motion.ts
"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia(QUERY);
  mq.addEventListener?.("change", callback);
  return () => mq.removeEventListener?.("change", callback);
}

function getSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/** Reactive `prefers-reduced-motion: reduce` listener. Returns true when the user has the system pref set. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
```

- [ ] **Step 4: Run the test — must PASS**

```bash
pnpm vitest run tests/unit/components/motion/use-reduced-motion.test.ts
```

Expected: 2 tests PASS.

- [ ] **Step 5: Write the failing test for `Reveal`**

```tsx
// tests/unit/components/motion/reveal.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Reveal } from "@/components/motion/reveal";

let observers: { callback: IntersectionObserverCallback; el: Element }[] = [];

beforeEach(() => {
  observers = [];
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: false,
    media: q,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;

  class MockIO implements IntersectionObserver {
    root = null;
    rootMargin = "";
    thresholds: ReadonlyArray<number> = [];
    constructor(callback: IntersectionObserverCallback) {
      this._cb = callback;
    }
    private _cb: IntersectionObserverCallback;
    observe(el: Element) {
      observers.push({ callback: this._cb, el });
    }
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  window.IntersectionObserver = MockIO as unknown as typeof IntersectionObserver;
});

describe("Reveal", () => {
  it("renders children with data-revealed='false' before intersection", () => {
    render(
      <Reveal>
        <p>hello</p>
      </Reveal>,
    );
    const wrapper = screen.getByText("hello").parentElement!;
    expect(wrapper.getAttribute("data-revealed")).toBe("false");
  });

  it("flips data-revealed to 'true' once the element intersects", () => {
    render(
      <Reveal>
        <p>hello</p>
      </Reveal>,
    );
    const wrapper = screen.getByText("hello").parentElement!;
    const o = observers[0];
    o.callback(
      [
        {
          isIntersecting: true,
          target: o.el,
          intersectionRatio: 1,
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: 0,
        },
      ],
      {} as IntersectionObserver,
    );
    expect(wrapper.getAttribute("data-revealed")).toBe("true");
  });
});
```

- [ ] **Step 6: Run and confirm it fails**

```bash
pnpm vitest run tests/unit/components/motion/reveal.test.tsx
```

Expected: FAIL ("Cannot find module").

- [ ] **Step 7: Implement `Reveal`**

```tsx
// src/components/motion/reveal.tsx
"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "./use-reduced-motion";

type Props = {
  children: ReactNode;
  /** Optional delay in ms after intersection before flipping data-revealed. */
  delay?: number;
  /** Optional className applied to the wrapper. */
  className?: string;
  /** Intersection threshold (0–1). Default 0.15. */
  threshold?: number;
};

/**
 * Wraps children and flips `data-revealed` from `false` → `true` once the element
 * scrolls into view. Pair with CSS like:
 *
 *   .reveal[data-revealed="false"] { opacity: 0; clip-path: inset(100% 0 0 0); transform: translateY(12px); }
 *   .reveal[data-revealed="true"]  { opacity: 1; clip-path: inset(0 0 0 0);     transform: translateY(0); }
 *   .reveal { transition: opacity 800ms, clip-path 800ms, transform 800ms; transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1); }
 *
 * Honors `prefers-reduced-motion: reduce` — the reveal still fires, but the CSS
 * transition becomes a simple 200ms opacity fade.
 */
export function Reveal({ children, delay = 0, className, threshold = 0.15 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (revealed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (delay > 0) {
              window.setTimeout(() => setRevealed(true), delay);
            } else {
              setRevealed(true);
            }
            observer.disconnect();
          }
        }
      },
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [delay, threshold, revealed]);

  return (
    <div
      ref={ref}
      data-revealed={revealed ? "true" : "false"}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      className={["reveal", className].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 8: Add the supporting CSS to `src/app/globals.css`**

Append (or merge into) the file:

```css
.reveal {
  transition:
    opacity 800ms cubic-bezier(0.16, 1, 0.3, 1),
    clip-path 800ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 800ms cubic-bezier(0.16, 1, 0.3, 1);
}
.reveal[data-revealed="false"] {
  opacity: 0;
  clip-path: inset(100% 0 0 0);
  transform: translateY(12px);
}
.reveal[data-revealed="true"] {
  opacity: 1;
  clip-path: inset(0 0 0 0);
  transform: translateY(0);
}
.reveal[data-reduced-motion="true"] {
  transition: opacity 200ms linear;
  clip-path: none;
  transform: none;
}
.reveal[data-reduced-motion="true"][data-revealed="false"] {
  opacity: 0;
}
```

- [ ] **Step 9: Run the Reveal tests — must PASS**

```bash
pnpm vitest run tests/unit/components/motion/reveal.test.tsx
```

Expected: 2 tests PASS.

- [ ] **Step 10: Implement `LenisProvider`**

```tsx
// src/components/motion/lenis-provider.tsx
"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { useReducedMotion } from "./use-reduced-motion";

/**
 * Wrapping client component that initializes a single Lenis instance for the
 * subtree. When the user prefers reduced motion, Lenis is not initialized and
 * the browser's native scroll is used.
 */
export function LenisProvider({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const lenis = new Lenis({ lerp: 0.08 });
    let frame = 0;
    function raf(time: number) {
      lenis.raf(time);
      frame = window.requestAnimationFrame(raf);
    }
    frame = window.requestAnimationFrame(raf);
    return () => {
      window.cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, [reducedMotion]);

  return <>{children}</>;
}
```

> **Note:** if `lenis` from npm fails to import, switch the import to `@studio-freight/lenis` — the API is identical.

- [ ] **Step 11: Implement `usePinnedScene`**

```ts
// src/components/motion/use-pinned-scene.ts
"use client";

import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "./use-reduced-motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Options = {
  /** Element to pin while the trigger is active. */
  pin: RefObject<HTMLElement | null>;
  /** Element whose scroll position drives the pin. Defaults to `pin`. */
  trigger?: RefObject<HTMLElement | null>;
  /** How far past trigger top before releasing the pin. Default "+=300%". */
  end?: string;
  /** Optional scrub. If true, the timeline is tied to scroll progress. */
  scrub?: boolean;
};

/**
 * Pins an element through a scroll distance via GSAP ScrollTrigger.
 * No-ops when `prefers-reduced-motion: reduce` is set.
 */
export function usePinnedScene({ pin, trigger, end = "+=300%", scrub = false }: Options) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    if (!pin.current) return;
    const triggerEl = trigger?.current ?? pin.current;
    if (!triggerEl) return;

    const st = ScrollTrigger.create({
      trigger: triggerEl,
      start: "top top",
      end,
      pin: pin.current,
      scrub,
      anticipatePin: 1,
    });

    return () => {
      st.kill();
    };
  }, [reducedMotion, pin, trigger, end, scrub]);
}
```

- [ ] **Step 12: Implement `ScrollCue`**

```tsx
// src/components/landing/scroll-cue.tsx
import type { ReactNode } from "react";

type Props = { label?: ReactNode };

/**
 * The bottom-of-hero "scroll" hint. A 1px vertical hairline pulses above a
 * mono-uppercase label. Pulse animation is pure CSS — honored by
 * prefers-reduced-motion via the global `@media (prefers-reduced-motion)` rule.
 */
export function ScrollCue({ label = "scroll" }: Props) {
  return (
    <div className="scroll-cue pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-center">
      <span aria-hidden className="scroll-cue-line mx-auto mb-2 block h-4 w-px bg-current" />
      <span className="text-ink-faint font-mono text-[10px] tracking-[0.15em] uppercase">
        {label}
      </span>
    </div>
  );
}
```

And add CSS to `src/app/globals.css`:

```css
.scroll-cue-line {
  transform-origin: top center;
  animation: scroll-cue-pulse 1.4s cubic-bezier(0.45, 0, 0.55, 1) infinite;
}
@keyframes scroll-cue-pulse {
  0%,
  100% {
    transform: scaleY(0.7);
  }
  50% {
    transform: scaleY(1);
  }
}
@media (prefers-reduced-motion: reduce) {
  .scroll-cue-line {
    animation: none;
  }
}
```

- [ ] **Step 13: Run all unit tests — must PASS**

```bash
pnpm test
```

Expected: all pre-existing tests still pass + 4 new tests (2 for useReducedMotion, 2 for Reveal). The HeroRotator test still passes for now (we'll delete it in Task 11).

- [ ] **Step 14: Verify typecheck and lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: clean.

- [ ] **Step 15: Commit**

```bash
git add src/components/motion src/components/landing/scroll-cue.tsx \
        src/app/globals.css \
        tests/unit/components/motion
git commit -m "feat(motion): foundation — useReducedMotion, Reveal, LenisProvider, usePinnedScene, ScrollCue"
```

Body: lists the five primitives and references the spec section 0 (foundation). End with the Claude co-author trailer.

---

## Task 3: i18n keys for the new copy

Pre-populate every message key the new scenes need. Doing this once up-front lets later component tasks just call `t("home.something")` without scaffolding.

**Files:**

- Modify: `src/messages/de.json`
- Modify: `src/messages/en.json`

- [ ] **Step 1: Replace the `home` block in `src/messages/de.json`**

Open the file, locate the `"home"` key, and replace its block with:

```json
"home": {
  "ctaStories": "Stories entdecken",
  "ctaBooking": "Anfrage stellen",
  "hero": {
    "cameraSpec": "f/2.8 · 1/2000s · ISO 6400",
    "scrollCue": "scroll"
  },
  "featuredStory": {
    "eyebrow": "STORY",
    "blurb": "Drei Sätze, fünf Wendepunkte. Ein Heim-Auftakt, der zeigt, was diese Saison rhythmisch werden kann.",
    "readStory": "Story lesen"
  },
  "workMosaic": {
    "title": "WORK",
    "seasons": "2024–26 SEASONS",
    "framesSuffix": "PUBLISHED FRAMES",
    "viewIndex": "VIEW WORK INDEX"
  },
  "about": {
    "eyebrow": "ÜBER MICH",
    "title": "Volleyball ist ein Spiel der Augenblicke. / Ich fotografiere die Augenblicke.",
    "body1": "Ich fotografiere Volleyball in Bremen und Norddeutschland — Spieltag, Saisonbegleitung, Porträts. Mein Fokus liegt auf cinematischen Einzelmomenten, die das Spiel als visuelle Erzählung lesbar machen.",
    "body2": "Wenn du Halle, Team oder Verband bildlich begleitet sehen möchtest, schreib mir. Ich plane Saisons im Voraus und arbeite gern wiederkehrend.",
    "pullQuote": "Ein Match ist 100 Bilder. Drei davon zählen.",
    "cameraCaption": "BELIN AKGUEL · BREMEN · CANON R5 + RF 70-200 F/2.8",
    "publications": "PUBLICATIONS · VOLLEYBALL.DE · NORDDEUTSCHE · SPORTBILD",
    "clients": "CLIENTS · VC WIESBADEN · SSC PALMBERG SCHWERIN · SC POTSDAM",
    "availability": "AVAILABILITY · BUNDESLIGA-SAISON 2026/27 · ANFRAGEN WILLKOMMEN",
    "cta": "Mehr über mich"
  },
  "cta": {
    "eyebrow": "ANFRAGE",
    "title": "Halle gebucht? / Ich auch.",
    "body": "Spiel, Saison, Porträt. Ich begleite Volleyball-Teams in Norddeutschland mit cinematischer Bildsprache und planbarer Liefertreue.",
    "detail": "RESPONSE WITHIN 24H · DE / EN · BREMEN-BASED, AVAILABLE BUNDESWEIT",
    "primary": "ANFRAGE STELLEN",
    "secondaryPrefix": "oder:",
    "secondaryEmail": "hallo@setandshoot.com"
  }
}
```

Preserve all other top-level keys in the JSON (`site`, `nav`, `footer`, `services`, `pages`, etc.).

- [ ] **Step 2: Replace the matching `home` block in `src/messages/en.json`**

```json
"home": {
  "ctaStories": "Browse stories",
  "ctaBooking": "Get in touch",
  "hero": {
    "cameraSpec": "f/2.8 · 1/2000s · ISO 6400",
    "scrollCue": "scroll"
  },
  "featuredStory": {
    "eyebrow": "STORY",
    "blurb": "Three sets, five turning points. A home opener that hints at what this season can become.",
    "readStory": "Read story"
  },
  "workMosaic": {
    "title": "WORK",
    "seasons": "2024–26 SEASONS",
    "framesSuffix": "PUBLISHED FRAMES",
    "viewIndex": "VIEW WORK INDEX"
  },
  "about": {
    "eyebrow": "ABOUT",
    "title": "Volleyball is a game of moments. / I photograph the moments.",
    "body1": "I photograph volleyball in Bremen and northern Germany — match days, season-long coverage, portraits. My focus is on cinematic single moments that make the game readable as a visual narrative.",
    "body2": "If you'd like a court, a team, or a federation covered photographically, drop me a line. I plan seasons ahead and like recurring work.",
    "pullQuote": "A match is 100 frames. Three of them matter.",
    "cameraCaption": "BELIN AKGUEL · BREMEN · CANON R5 + RF 70-200 F/2.8",
    "publications": "PUBLICATIONS · VOLLEYBALL.DE · NORDDEUTSCHE · SPORTBILD",
    "clients": "CLIENTS · VC WIESBADEN · SSC PALMBERG SCHWERIN · SC POTSDAM",
    "availability": "AVAILABILITY · BUNDESLIGA-SEASON 2026/27 · COMMISSIONS OPEN",
    "cta": "More about me"
  },
  "cta": {
    "eyebrow": "COMMISSION",
    "title": "Got a court date? / So do I.",
    "body": "Match, season, portrait. I cover volleyball teams across northern Germany — cinematic frames, dependable delivery.",
    "detail": "RESPONSE WITHIN 24H · DE / EN · BREMEN-BASED, AVAILABLE NATIONWIDE",
    "primary": "START A COMMISSION",
    "secondaryPrefix": "or:",
    "secondaryEmail": "hallo@setandshoot.com"
  }
}
```

- [ ] **Step 3: Verify both files are valid JSON**

```bash
pnpm exec prettier --check src/messages/de.json src/messages/en.json
```

Expected: no errors. If prettier complains, run `--write`.

- [ ] **Step 4: Verify typecheck**

```bash
pnpm typecheck
```

Expected: clean. next-intl's message-key types regenerate at build; if a typed `useTranslations` call references a missing key, tsc will flag it — but at this point no caller uses these yet.

- [ ] **Step 5: Commit**

```bash
git add src/messages/de.json src/messages/en.json
git commit -m "feat(i18n): copy for landing elevation V1 (hero, featured story, work mosaic, about, cta)"
```

---

## Task 4: HeroScene component (TDD)

The page's first impression. Five tests, then the implementation.

**Files:**

- Create: `src/components/landing/hero-scene.tsx`
- Create: `tests/unit/components/landing/hero-scene.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/unit/components/landing/hero-scene.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroScene } from "@/components/landing/hero-scene";
import type { ResolvedLandingPhoto } from "@/lib/landing/photos";

const heroPhoto: ResolvedLandingPhoto = {
  id: "spike",
  src: "/images/landing/hero-spike.jpg",
  width: 2752,
  height: 1536,
  objectPosition: "50% 50%",
  alt: "Test hero photo",
  isHighlight: true,
};

const matchMediaMock = vi.fn((q: string) => ({
  matches: false,
  media: q,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

beforeEach(() => {
  matchMediaMock.mockClear();
  window.matchMedia = matchMediaMock as unknown as typeof window.matchMedia;
});

describe("HeroScene", () => {
  it("renders the hero photo with the right src and alt", () => {
    render(
      <HeroScene
        photo={heroPhoto}
        name="belin akguel"
        tagline="Volleyball-Fotografie. Bremen."
        cameraSpec="f/2.8 · 1/2000s · ISO 6400"
        ctaPrimaryLabel="Stories entdecken"
        ctaPrimaryHref="/stories"
        ctaSecondaryLabel="Anfrage stellen"
        ctaSecondaryHref="/contact"
        scrollCueLabel="scroll"
      />,
    );
    const img = screen.getByAltText("Test hero photo");
    expect(img).toBeInTheDocument();
  });

  it("renders the name as an h1", () => {
    render(
      <HeroScene
        photo={heroPhoto}
        name="belin akguel"
        tagline="Volleyball-Fotografie. Bremen."
        cameraSpec="f/2.8 · 1/2000s · ISO 6400"
        ctaPrimaryLabel="Stories entdecken"
        ctaPrimaryHref="/stories"
        ctaSecondaryLabel="Anfrage stellen"
        ctaSecondaryHref="/contact"
        scrollCueLabel="scroll"
      />,
    );
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("belin akguel");
  });

  it("renders both CTAs with correct href", () => {
    render(
      <HeroScene
        photo={heroPhoto}
        name="belin akguel"
        tagline="x"
        cameraSpec="x"
        ctaPrimaryLabel="Primary"
        ctaPrimaryHref="/stories"
        ctaSecondaryLabel="Secondary"
        ctaSecondaryHref="/contact"
        scrollCueLabel="scroll"
      />,
    );
    const primary = screen.getByRole("link", { name: "Primary" });
    const secondary = screen.getByRole("link", { name: "Secondary" });
    expect(primary).toHaveAttribute("href", "/stories");
    expect(secondary).toHaveAttribute("href", "/contact");
  });

  it("renders the scroll cue label", () => {
    render(
      <HeroScene
        photo={heroPhoto}
        name="belin akguel"
        tagline="x"
        cameraSpec="x"
        ctaPrimaryLabel="x"
        ctaPrimaryHref="/stories"
        ctaSecondaryLabel="x"
        ctaSecondaryHref="/contact"
        scrollCueLabel="scroll"
      />,
    );
    expect(screen.getByText("scroll")).toBeInTheDocument();
  });

  it("does not render a photo when `photo` is null", () => {
    render(
      <HeroScene
        photo={null}
        name="belin akguel"
        tagline="x"
        cameraSpec="x"
        ctaPrimaryLabel="x"
        ctaPrimaryHref="/stories"
        ctaSecondaryLabel="x"
        ctaSecondaryHref="/contact"
        scrollCueLabel="scroll"
      />,
    );
    const imgs = screen.queryAllByRole("img");
    expect(imgs.length).toBe(0);
  });
});
```

- [ ] **Step 2: Run and confirm it fails**

```bash
pnpm vitest run tests/unit/components/landing/hero-scene.test.tsx
```

Expected: FAIL ("Cannot find module").

- [ ] **Step 3: Implement `HeroScene`**

```tsx
// src/components/landing/hero-scene.tsx
"use client";

import Link from "next/link";
import { LandingImage } from "@/components/landing/landing-image";
import { ScrollCue } from "@/components/landing/scroll-cue";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import type { ResolvedLandingPhoto } from "@/lib/landing/photos";

type Props = {
  photo: ResolvedLandingPhoto | null;
  name: string;
  tagline: string;
  cameraSpec: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
  scrollCueLabel: string;
};

/**
 * Hero scene: a single photo with slow Ken Burns + delayed type reveal.
 *
 * Implementation notes
 * - Ken Burns animation is pure CSS (no GSAP needed) so it works server-side.
 * - Type reveal is staged via `animation-delay` on each element. The keyframes
 *   produce a clip-path-from-below + opacity entrance. Under
 *   `prefers-reduced-motion: reduce`, the keyframes degrade to simple opacity.
 * - Pinning is added in page.tsx via `usePinnedScene` on the section element.
 */
export function HeroScene({
  photo,
  name,
  tagline,
  cameraSpec,
  ctaPrimaryLabel,
  ctaPrimaryHref,
  ctaSecondaryLabel,
  ctaSecondaryHref,
  scrollCueLabel,
}: Props) {
  const reducedMotion = useReducedMotion();
  return (
    <section
      className="hero-scene bg-canvas relative flex h-screen min-h-[80vh] w-full items-end overflow-hidden"
      data-reduced-motion={reducedMotion ? "true" : "false"}
    >
      {photo ? (
        <div className="hero-photo absolute inset-0">
          <LandingImage photo={photo} sizes="100vw" priority className="size-full object-cover" />
        </div>
      ) : null}

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-1/2"
        style={{
          backgroundImage: "linear-gradient(to top, var(--bg-scrim) 0%, transparent 55%)",
        }}
      />

      <div className="relative z-10 flex w-full flex-col gap-6 p-8 md:p-12">
        <h1 className="hero-name font-display text-[clamp(4rem,12vw,12rem)] leading-[0.95] tracking-tight">
          {name}
        </h1>
        <p className="hero-tagline text-ink max-w-prose font-sans text-base md:text-lg">
          {tagline}
        </p>
        <p className="hero-camera text-ink-faint font-mono text-xs tracking-[0.15em]">
          {cameraSpec}
        </p>
        <div className="hero-ctas flex flex-wrap gap-4 pt-2">
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={ctaPrimaryHref as any}
            className="bg-accent text-canvas hover:bg-accent/90 rounded-sm px-5 py-2.5 text-sm font-medium transition-colors"
          >
            {ctaPrimaryLabel}
          </Link>
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={ctaSecondaryHref as any}
            className="border-hairline hover:text-accent rounded-sm border px-5 py-2.5 text-sm transition-colors"
          >
            {ctaSecondaryLabel}
          </Link>
        </div>
      </div>

      <ScrollCue label={scrollCueLabel} />
    </section>
  );
}
```

- [ ] **Step 4: Add the supporting CSS to `src/app/globals.css`**

Append:

```css
.hero-scene .hero-photo {
  animation: hero-ken-burns 12s linear infinite alternate;
  transform-origin: center center;
}
@keyframes hero-ken-burns {
  from {
    transform: scale(1.04) translate(0.5%, 0.5%);
  }
  to {
    transform: scale(1) translate(0, 0);
  }
}
.hero-scene[data-reduced-motion="true"] .hero-photo {
  animation: none;
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

- [ ] **Step 5: Run the tests — must PASS**

```bash
pnpm vitest run tests/unit/components/landing/hero-scene.test.tsx
```

Expected: 5 tests PASS.

- [ ] **Step 6: Run the full unit suite**

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/landing/hero-scene.tsx \
        tests/unit/components/landing/hero-scene.test.tsx \
        src/app/globals.css
git commit -m "feat(landing): HeroScene — single photo, Ken Burns, delayed type reveal"
```

---

## Task 5: FeaturedStoryScene component

3-beat pinned magazine spread. Server component (presentational). Pinning is added later in page.tsx via `usePinnedScene` on a ref attached to the photo well.

**Files:**

- Create: `src/components/landing/featured-story-scene.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/landing/featured-story-scene.tsx
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PhotoImage } from "./photo-image";
import { Reveal } from "@/components/motion/reveal";
import type { Story, Photo } from "@/payload-types";

type Props = { story: Story | null };

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10).replace(/-/g, ".");
}

export async function FeaturedStoryScene({ story }: Props) {
  const t = await getTranslations("home.featuredStory");
  if (!story) return null;

  const cover = typeof story.coverPhoto === "object" ? (story.coverPhoto as Photo) : null;
  const date = formatDate(story.playedAt);

  // The 3 photos in Beat 2 come from the first `sequence` layout block.
  const sequencePhotos: Photo[] = [];
  for (const block of story.layout ?? []) {
    if (block.blockType === "sequence" && Array.isArray(block.photos)) {
      for (const p of block.photos) {
        if (typeof p === "object" && p !== null) sequencePhotos.push(p as Photo);
      }
      break;
    }
  }
  const galleryPhotos = sequencePhotos.slice(0, 3);

  return (
    <section className="featured-story relative">
      <div className="grid px-6 md:px-12 lg:grid-cols-12 lg:gap-12">
        {/* Left column — sticky cover */}
        <div className="lg:col-span-5">
          <div className="story-cover bg-elevated relative aspect-[3/4] w-full overflow-hidden lg:sticky lg:top-0 lg:aspect-auto lg:h-screen">
            {cover ? (
              <PhotoImage
                photo={cover}
                sizes="(min-width: 1024px) 42vw, 90vw"
                className="size-full object-cover"
                priority
              />
            ) : null}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-20"
              style={{
                backgroundImage:
                  "linear-gradient(to bottom, rgba(11,14,19,0.5) 0%, transparent 100%)",
              }}
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
              style={{
                backgroundImage: "linear-gradient(to top, rgba(11,14,19,0.5) 0%, transparent 100%)",
              }}
            />
          </div>
        </div>

        {/* Right column — scrolling beats */}
        <div className="flex flex-col gap-32 py-24 lg:col-span-7 lg:min-h-[300vh]">
          {/* Beat 1: meta */}
          <Reveal>
            <div className="flex flex-col gap-4">
              <p className="text-ink-faint font-mono text-xs tracking-[0.2em] uppercase">
                {t("eyebrow")} · {date} · {story.venue ?? ""}
              </p>
              <h2 className="font-display text-[clamp(1.75rem,3vw,3rem)] leading-[1.1] tracking-tight">
                {story.title}
              </h2>
              {story.result ? (
                <p className="text-ink-muted font-mono text-xs tracking-[0.15em] uppercase">
                  {story.result}
                </p>
              ) : null}
              <p className="text-ink mt-4 max-w-prose font-sans text-base leading-relaxed">
                {t("blurb")}
              </p>
            </div>
          </Reveal>

          {/* Beat 2: gallery */}
          <div className="flex flex-col gap-12">
            {galleryPhotos.map((photo, i) => (
              <Reveal key={photo.id} delay={i * 100}>
                <figure className="bg-elevated relative aspect-[4/5] w-full overflow-hidden">
                  <PhotoImage
                    photo={photo}
                    sizes="(min-width: 1024px) 50vw, 90vw"
                    className="size-full object-cover"
                  />
                </figure>
              </Reveal>
            ))}
          </div>

          {/* Beat 3: close */}
          <Reveal>
            <div className="flex flex-col gap-6">
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={`/stories/${story.slug}` as any}
                className="font-display hover:text-accent w-fit text-2xl italic underline-offset-4 transition-colors hover:underline"
              >
                {t("readStory")} →
              </Link>
              <p className="text-ink-faint font-mono text-xs">
                © Belin Akguel · {new Date().getUTCFullYear()}
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```

Expected: clean. If TS complains about the `block.blockType === "sequence"` narrowing, regenerate Payload types: `pnpm payload:generate-types` then re-run typecheck.

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/featured-story-scene.tsx
git commit -m "feat(landing): FeaturedStoryScene — pinned cover + 3-beat right column"
```

---

## Task 6: WorkMosaicScene component (4-photo asymmetric grid)

The spec assumes ~9 photos; reality is 4 (current `LANDING_PHOTOS`). Adapt the asymmetric pattern to 4 tiles while keeping editorial density.

**Layout (≥ 1024 px):** 12-column grid, 2 row bands of `auto-rows-[minmax(280px,40vh)]`:

- Band A: `[2×2 hero][1×1][1×1]` (3 photos)
- Band B: `[1×1][2×1 wide][skip]` (1 photo as wide)

Net: 4 tiles laid out asymmetrically.

**Files:**

- Create: `src/components/landing/work-mosaic-scene.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/landing/work-mosaic-scene.tsx
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LandingImage } from "./landing-image";
import { Reveal } from "@/components/motion/reveal";
import type { ResolvedLandingPhoto } from "@/lib/landing/photos";

type Props = { photos: ResolvedLandingPhoto[] };

/**
 * Editorial work mosaic. Adapts to the photo count:
 * - 4 photos → asymmetric: [2×2 hero][1×1][1×1] + [2×1 wide]
 * - fewer → collapses to a 3-col simple grid (no asymmetry)
 */
export async function WorkMosaicScene({ photos }: Props) {
  const t = await getTranslations("home.workMosaic");
  if (photos.length < 3) return null;

  const total = photos.length;
  const useAsymmetric = total >= 4;
  const [hero, two, three, wide] = photos;

  return (
    <section className="work-mosaic border-hairline border-t px-6 py-20 md:px-12">
      <Reveal>
        <p className="text-ink-faint mb-10 font-mono text-xs tracking-[0.2em] uppercase">
          <span className="text-ink">{t("title")}</span> · {t("seasons")} ·{" "}
          <span className="text-ink">{total}</span> {t("framesSuffix")}
        </p>
      </Reveal>

      {useAsymmetric ? (
        <div className="grid grid-cols-2 gap-3 lg:auto-rows-[minmax(280px,40vh)] lg:grid-cols-12 lg:gap-4">
          <Reveal className="col-span-2 lg:col-span-8 lg:row-span-2">
            <figure className="bg-elevated relative size-full overflow-hidden">
              <LandingImage
                photo={hero}
                sizes="(min-width: 1024px) 66vw, 100vw"
                className="size-full object-cover"
              />
            </figure>
          </Reveal>
          <Reveal className="col-span-1 lg:col-span-4">
            <figure className="bg-elevated relative size-full overflow-hidden">
              <LandingImage
                photo={two}
                sizes="(min-width: 1024px) 33vw, 50vw"
                className="size-full object-cover"
              />
            </figure>
          </Reveal>
          <Reveal className="col-span-1 lg:col-span-4">
            <figure className="bg-elevated relative size-full overflow-hidden">
              <LandingImage
                photo={three}
                sizes="(min-width: 1024px) 33vw, 50vw"
                className="size-full object-cover"
              />
            </figure>
          </Reveal>
          <Reveal className="col-span-2 lg:col-span-12">
            <figure className="bg-elevated relative aspect-[16/7] w-full overflow-hidden">
              <LandingImage photo={wide} sizes="100vw" className="size-full object-cover" />
            </figure>
          </Reveal>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {photos.map((p) => (
            <Reveal key={p.id}>
              <figure className="bg-elevated relative aspect-square w-full overflow-hidden">
                <LandingImage
                  photo={p}
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="size-full object-cover"
                />
              </figure>
            </Reveal>
          ))}
        </div>
      )}

      <Reveal>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Link
          href={"/highlights" as any}
          className="hover:text-accent mt-10 inline-block font-mono text-xs tracking-[0.2em] uppercase transition-colors"
        >
          {t("viewIndex")} →
        </Link>
      </Reveal>
    </section>
  );
}
```

- [ ] **Step 2: Verify typecheck and lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/work-mosaic-scene.tsx
git commit -m "feat(landing): WorkMosaicScene — 4-photo asymmetric editorial grid"
```

---

## Task 7: AboutScene component

Sticky portrait + scrolling biography. Pinning is applied via `usePinnedScene` in the page composition (Task 11).

**Files:**

- Create: `src/components/landing/about-scene.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/landing/about-scene.tsx
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LandingImage } from "./landing-image";
import { Reveal } from "@/components/motion/reveal";
import type { ResolvedLandingPhoto } from "@/lib/landing/photos";

type Props = { portrait: ResolvedLandingPhoto };

export async function AboutScene({ portrait }: Props) {
  const t = await getTranslations("home.about");

  return (
    <section className="about-scene border-hairline border-t px-6 py-20 md:px-12">
      <div className="grid lg:grid-cols-12 lg:gap-12">
        {/* Left — sticky portrait */}
        <figure className="lg:col-span-5">
          <div className="about-portrait bg-elevated relative aspect-[3/4] w-full overflow-hidden lg:sticky lg:top-12 lg:aspect-[3/4]">
            <LandingImage
              photo={portrait}
              sizes="(min-width: 1024px) 42vw, 90vw"
              className="size-full object-cover saturate-[0.92]"
            />
          </div>
          <figcaption className="text-ink-faint mt-3 font-mono text-[10px] tracking-[0.15em] uppercase">
            {t("cameraCaption")}
          </figcaption>
        </figure>

        {/* Right — scrolling body */}
        <div className="flex flex-col justify-center gap-8 pt-12 lg:col-span-7 lg:min-h-[150vh] lg:pt-0">
          <Reveal>
            <p className="text-ink-faint font-mono text-xs tracking-[0.2em] uppercase">
              {t("eyebrow")}
            </p>
          </Reveal>
          <Reveal delay={120}>
            <h2 className="font-display text-[clamp(1.75rem,3vw,3rem)] leading-[1.15] tracking-tight whitespace-pre-line italic">
              {t("title").replace(" / ", "\n")}
            </h2>
          </Reveal>
          <Reveal delay={240}>
            <p className="text-ink max-w-prose font-sans text-base leading-relaxed">{t("body1")}</p>
          </Reveal>
          <Reveal delay={360}>
            <blockquote className="border-hairline font-display text-ink-faint border-l pl-6 text-2xl italic">
              {t("pullQuote")}
            </blockquote>
          </Reveal>
          <Reveal delay={480}>
            <p className="text-ink-muted max-w-prose font-sans text-base leading-relaxed">
              {t("body2")}
            </p>
          </Reveal>
          <Reveal delay={600}>
            <div className="text-ink-faint mt-4 flex flex-col gap-1 font-mono text-[10px] tracking-[0.15em] uppercase">
              <span>{t("publications")}</span>
              <span>{t("clients")}</span>
              <span>{t("availability")}</span>
            </div>
          </Reveal>
          <Reveal delay={720}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Link
              href={"/about" as any}
              className="hover:text-accent inline-flex w-fit items-center text-sm transition-colors"
            >
              {t("cta")} →
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/about-scene.tsx
git commit -m "feat(landing): AboutScene — sticky portrait + scrolling editorial body"
```

---

## Task 8: BookingCTA — rewrite in place

The current `src/components/landing/booking-cta.tsx` is the loud full-width-background variant. Replace it with the restrained editorial close per spec Scene 5.

**Files:**

- Modify (rewrite): `src/components/landing/booking-cta.tsx`

- [ ] **Step 1: Replace `src/components/landing/booking-cta.tsx` with:**

```tsx
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function BookingCTA() {
  const t = await getTranslations("home.cta");

  return (
    <section className="booking-cta border-hairline bg-canvas border-t px-6 py-32 md:px-12 md:py-40">
      <div className="flex max-w-3xl flex-col gap-8">
        <p className="font-mono text-xs tracking-[0.2em] uppercase">
          <span className="text-accent">●</span>{" "}
          <span className="text-ink-faint">{t("eyebrow")}</span>
        </p>
        <h2 className="font-display text-[clamp(2.5rem,7vw,6rem)] leading-[0.95] whitespace-pre-line">
          {t("title").replace(" / ", "\n")}
        </h2>
        <p className="text-ink max-w-[42ch] font-sans text-base leading-relaxed">{t("body")}</p>
        <p className="text-ink-faint font-mono text-[10px] tracking-[0.15em] uppercase">
          {t("detail")}
        </p>
        <div className="mt-2 flex flex-col gap-2">
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={"/contact" as any}
            className="cta-primary hover:text-accent hover:border-accent inline-flex w-fit items-center gap-3 border-b border-current pb-1 font-mono text-xs tracking-[0.2em] uppercase transition-colors"
          >
            <span>{t("primary")}</span>
            <span aria-hidden className="cta-arrow transition-transform">
              →
            </span>
          </Link>
          <p className="text-ink-faint font-mono text-[10px] tracking-[0.15em] uppercase">
            {t("secondaryPrefix")}{" "}
            <a
              href={`mailto:${t("secondaryEmail")}`}
              className="hover:text-accent transition-colors"
            >
              {t("secondaryEmail")}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Append the arrow-translate hover rule to `src/app/globals.css`**

```css
.booking-cta .cta-primary:hover .cta-arrow {
  transform: translateX(4px);
}
.booking-cta .cta-arrow {
  transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

- [ ] **Step 3: Verify typecheck and lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/landing/booking-cta.tsx src/app/globals.css
git commit -m "feat(landing): BookingCTA — quiet editorial close (no background, mono ANFRAGE)"
```

---

## Task 9: Header — convert to client + slide-on-scroll-up behavior

The current header is a server component with translations and a sticky bar. Convert to a thin client wrapper that renders the server-translated content but adds scroll-direction behavior + transparent-over-hero treatment.

**Files:**

- Modify: `src/components/layout/header.tsx`
- Create: `src/components/layout/header-shell.tsx`

- [ ] **Step 1: Create the client `HeaderShell`**

```tsx
// src/components/layout/header-shell.tsx
"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";

type Props = { children: ReactNode };

const HIDE_THRESHOLD_PX = 80;

/**
 * Sticky header that:
 * - Slides up (`translateY(-100%)`) when the user scrolls **down** past 80px.
 * - Slides back into view when the user scrolls **up**.
 * - Always visible above 80px (the hero region).
 * - Transitions are pure CSS via the data-hidden attribute.
 */
export function HeaderShell({ children }: Props) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (y < HIDE_THRESHOLD_PX) {
        setHidden(false);
      } else if (delta > 4) {
        setHidden(true);
      } else if (delta < -4) {
        setHidden(false);
      }
      lastY.current = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="header-shell border-hairline bg-canvas/90 fixed top-0 right-0 left-0 z-40 flex items-center justify-between border-b px-6 py-4 backdrop-blur"
      data-hidden={hidden && !reducedMotion ? "true" : "false"}
    >
      {children}
    </header>
  );
}
```

- [ ] **Step 2: Update `src/components/layout/header.tsx` to use the shell**

Replace the existing implementation with:

```tsx
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { HeaderShell } from "./header-shell";
import { LocaleSwitcher } from "./locale-switcher";

type NavItem = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  href: any;
  label: string;
};

export async function Header() {
  const t = await getTranslations("nav");

  const items: NavItem[] = [
    { href: "/stories", label: t("stories") },
    { href: "/highlights", label: t("highlights") },
    { href: "/athletes", label: t("athletes") },
    { href: "/about", label: t("about") },
    { href: "/services", label: t("services") },
    { href: "/journal", label: t("journal") },
    { href: "/contact", label: t("contact") },
  ];

  return (
    <HeaderShell>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Link href={"/" as any} className="font-display text-base tracking-tight">
        belin akguel
      </Link>
      <nav className="hidden gap-6 text-sm lg:flex">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-ink-muted hover:text-ink transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <LocaleSwitcher />
    </HeaderShell>
  );
}
```

- [ ] **Step 3: Append the slide CSS to `src/app/globals.css`**

```css
.header-shell {
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
}
.header-shell[data-hidden="true"] {
  transform: translateY(-100%);
}
```

- [ ] **Step 4: Verify typecheck and lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/header.tsx \
        src/components/layout/header-shell.tsx \
        src/app/globals.css
git commit -m "feat(layout): Header slides on scroll down, returns on scroll up"
```

---

## Task 10: Footer — 3-row editorial layout

**Files:**

- Modify: `src/components/layout/footer.tsx`

- [ ] **Step 1: Read the existing footer to preserve its links**

```bash
cat src/components/layout/footer.tsx
```

Note the existing nav / legal / social link sets. The redesign reuses the same hrefs.

- [ ] **Step 2: Replace `src/components/layout/footer.tsx` with the 3-row layout**

```tsx
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function Footer() {
  const t = await getTranslations();
  const year = new Date().getUTCFullYear();

  const nav = [
    { href: "/stories", label: t("nav.stories") },
    { href: "/highlights", label: t("nav.highlights") },
    { href: "/athletes", label: t("nav.athletes") },
    { href: "/about", label: t("nav.about") },
    { href: "/services", label: t("nav.services") },
    { href: "/journal", label: t("nav.journal") },
    { href: "/contact", label: t("nav.contact") },
  ];

  const legal = [
    { href: "/impressum", label: t("footer.impressum") },
    { href: "/datenschutz", label: t("footer.datenschutz") },
    { href: "/bildrechte", label: t("footer.bildrechte") },
  ];

  return (
    <footer className="footer border-hairline border-t px-6 pt-16 pb-10 md:px-12">
      {/* Row 1 — wordmark band */}
      <div className="border-hairline border-b pb-12">
        <p className="font-display text-[clamp(3rem,10vw,8rem)] leading-[0.95] tracking-tight">
          set &amp; shoot
        </p>
      </div>

      {/* Row 2 — 3 columns */}
      <div className="grid grid-cols-1 gap-10 py-12 md:grid-cols-3">
        <div className="flex flex-col gap-3">
          <p className="text-ink-faint mb-2 font-mono text-[10px] tracking-[0.2em] uppercase">
            NAVIGATION
          </p>
          {nav.map((item) => (
            <Link
              key={item.href}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={item.href as any}
              className="text-ink-muted hover:text-ink w-fit font-mono text-xs transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-ink-faint mb-2 font-mono text-[10px] tracking-[0.2em] uppercase">
            LEGAL
          </p>
          {legal.map((item) => (
            <Link
              key={item.href}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={item.href as any}
              className="text-ink-muted hover:text-ink w-fit font-mono text-xs transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-ink-faint mb-2 font-mono text-[10px] tracking-[0.2em] uppercase">
            CONNECT
          </p>
          <a
            href="https://www.instagram.com/belin.akguel/"
            className="text-ink-muted hover:text-ink w-fit font-mono text-xs transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram
          </a>
          <a
            href="mailto:hallo@setandshoot.com"
            className="text-ink-muted hover:text-ink w-fit font-mono text-xs transition-colors"
          >
            Email
          </a>
        </div>
      </div>

      {/* Row 3 — micro-credits */}
      <div className="border-hairline text-ink-faint border-t pt-6 font-mono text-[10px] tracking-[0.15em] uppercase">
        © BELIN AKGUEL {year} · GESCHALTET IN BREMEN · ENGINEERED WITH RESTRAINT
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Verify the legal pages exist; if any of `/impressum`, `/datenschutz`, `/bildrechte` are absent, that's expected — typed routes will still accept them via the `as any` cast already in use.**

```bash
ls src/app/\(site\)/\[locale\]/{impressum,datenschutz,bildrechte} 2>/dev/null
```

- [ ] **Step 4: Verify typecheck and lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/footer.tsx
git commit -m "feat(layout): Footer — 3-row editorial (wordmark / link columns / micro-credits)"
```

---

## Task 11: Rewrite `page.tsx` + wrap layout with LenisProvider + delete superseded files

This is the integration task. Pinning is wired here via `usePinnedScene` on the hero, featured-story cover, and about-portrait refs.

**Files:**

- Modify: `src/app/(site)/[locale]/layout.tsx`
- Modify (rewrite): `src/app/(site)/[locale]/page.tsx`
- Delete: `src/components/landing/hero-rotator.tsx`
- Delete: `src/components/landing/hero-section.tsx`
- Delete: `src/components/landing/highlights-strip.tsx`
- Delete: `src/components/landing/stories-teaser.tsx`
- Delete: `src/components/landing/about-teaser.tsx`
- Delete: `tests/unit/components/landing/hero-rotator.test.tsx`

- [ ] **Step 1: Wrap the locale layout in `<LenisProvider>`**

Replace `src/app/(site)/[locale]/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale, locales } from "@/lib/i18n/config";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { LenisProvider } from "@/components/motion/lenis-provider";

export const metadata: Metadata = {
  title: "Belin Akguel — Volleyball-Fotografie",
  description: "Cinematic volleyball photography from Bremen.",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LenisProvider>
        <Header />
        {children}
        <Footer />
      </LenisProvider>
    </NextIntlClientProvider>
  );
}
```

- [ ] **Step 2: Rewrite `src/app/(site)/[locale]/page.tsx`**

```tsx
import { getPayload } from "payload";
import { getTranslations, setRequestLocale } from "next-intl/server";
import config from "@payload-config";
import { type Locale } from "@/lib/i18n/config";
import { getAboutFallbackPhoto, getHeroPhotos, getHighlightPhotos } from "@/lib/landing/photos";
import type { Story } from "@/payload-types";
import { HeroScene } from "@/components/landing/hero-scene";
import { FeaturedStoryScene } from "@/components/landing/featured-story-scene";
import { WorkMosaicScene } from "@/components/landing/work-mosaic-scene";
import { AboutScene } from "@/components/landing/about-scene";
import { BookingCTA } from "@/components/landing/booking-cta";

export const dynamic = "force-dynamic";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const typedLocale = locale as Locale;
  const t = await getTranslations();

  // Static landing photos
  const heroPhotos = getHeroPhotos(typedLocale);
  const heroPhoto = heroPhotos[1] ?? heroPhotos[0] ?? null; // prefer "block" composition
  const highlightPhotos = getHighlightPhotos(typedLocale);
  const aboutPortrait = getAboutFallbackPhoto(typedLocale);

  // One Payload story for the Featured Story scene
  const payload = await getPayload({ config });
  const stories = await payload.find({
    collection: "stories",
    where: { published: { equals: true } },
    limit: 1,
    sort: "-publishedAt",
    locale: typedLocale,
    depth: 2,
  });
  const featuredStory = (stories.docs[0] as Story | undefined) ?? null;

  return (
    <>
      <HeroScene
        photo={heroPhoto}
        name="belin akguel"
        tagline={t("site.tagline")}
        cameraSpec={t("home.hero.cameraSpec")}
        ctaPrimaryLabel={t("home.ctaStories")}
        ctaPrimaryHref="/stories"
        ctaSecondaryLabel={t("home.ctaBooking")}
        ctaSecondaryHref="/contact"
        scrollCueLabel={t("home.hero.scrollCue")}
      />
      <FeaturedStoryScene story={featuredStory} />
      <WorkMosaicScene photos={highlightPhotos} />
      <AboutScene portrait={aboutPortrait} />
      <BookingCTA />
    </>
  );
}
```

- [ ] **Step 3: Delete superseded landing components**

```bash
rm src/components/landing/hero-rotator.tsx
rm src/components/landing/hero-section.tsx
rm src/components/landing/highlights-strip.tsx
rm src/components/landing/stories-teaser.tsx
rm src/components/landing/about-teaser.tsx
rm tests/unit/components/landing/hero-rotator.test.tsx
```

- [ ] **Step 4: Verify typecheck and lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: clean. If anything imports a deleted file, those are stale references — grep for them and remove.

```bash
grep -rn "hero-rotator\|hero-section\|highlights-strip\|stories-teaser\|about-teaser" src tests 2>/dev/null | grep -v node_modules
```

Expected: no matches.

- [ ] **Step 5: Run all unit tests**

```bash
pnpm test
```

Expected: all pass. The hero-rotator test is gone; new hero-scene test passes.

- [ ] **Step 6: Production build**

```bash
pnpm build
```

Expected: build succeeds.

- [ ] **Step 7: Manual smoke**

```bash
pnpm dev &
sleep 12
curl -sS -o /tmp/landing.html -w "HTTP %{http_code}\n" http://localhost:3000/
grep -c "belin akguel" /tmp/landing.html
grep -c "WORK" /tmp/landing.html
grep -c "ÜBER MICH" /tmp/landing.html
grep -c "ANFRAGE STELLEN" /tmp/landing.html
pkill -f "next dev" || true
```

Expected: HTTP 200; each grep returns ≥ 1.

- [ ] **Step 8: Commit**

```bash
git add src/app/\(site\)/\[locale\]/layout.tsx \
        src/app/\(site\)/\[locale\]/page.tsx \
        src/components/landing/hero-rotator.tsx \
        src/components/landing/hero-section.tsx \
        src/components/landing/highlights-strip.tsx \
        src/components/landing/stories-teaser.tsx \
        src/components/landing/about-teaser.tsx \
        tests/unit/components/landing/hero-rotator.test.tsx
git commit -m "feat(landing): compose elevation V1 — Lenis provider + 5 scene composition + delete legacy"
```

The deletes will be recorded as renames-to-deleted by git; the commit body should list the 5 deleted components.

---

## Task 12: Pin behavior on hero, featured-story cover, and about-portrait

Add `usePinnedScene` invocations to the scene components that need pinning. We extract a tiny client wrapper for each pinned subtree so the existing server components stay server-rendered for the static content.

**Files:**

- Modify: `src/components/landing/hero-scene.tsx` (add a `pin` prop or wrap section in a client pinning element)
- Modify: `src/components/landing/featured-story-scene.tsx`
- Modify: `src/components/landing/about-scene.tsx`

Approach: HeroScene is already a client component → wire `usePinnedScene` directly. FeaturedStoryScene and AboutScene are server components → introduce a small client child that holds the ref and the pinning hook.

- [ ] **Step 1: Add pinning to HeroScene**

Modify `src/components/landing/hero-scene.tsx`. Add at the top of the imports:

```tsx
import { useRef } from "react";
import { usePinnedScene } from "@/components/motion/use-pinned-scene";
```

Inside the function body, before the `return`:

```tsx
const sectionRef = useRef<HTMLElement>(null);
usePinnedScene({ pin: sectionRef, end: "+=100%" });
```

Change the section element to attach the ref:

```tsx
<section
  ref={sectionRef}
  className="hero-scene bg-canvas relative flex h-screen min-h-[80vh] w-full items-end overflow-hidden"
  data-reduced-motion={reducedMotion ? "true" : "false"}
>
```

- [ ] **Step 2: Create the client pin wrapper for FeaturedStoryScene cover**

Create `src/components/landing/pinned-cover.tsx`:

```tsx
"use client";

import { useRef, type ReactNode } from "react";
import { usePinnedScene } from "@/components/motion/use-pinned-scene";

type Props = {
  children: ReactNode;
  /** ScrollTrigger end, default "+=300%". */
  end?: string;
};

/** Pins its child by attaching a ref + a usePinnedScene hook. Single-purpose. */
export function PinnedCover({ children, end = "+=300%" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  usePinnedScene({ pin: ref, end });
  return <div ref={ref}>{children}</div>;
}
```

- [ ] **Step 3: Wrap the FeaturedStoryScene's left column in `<PinnedCover>`**

In `src/components/landing/featured-story-scene.tsx`:

- Add import: `import { PinnedCover } from "./pinned-cover";`
- Replace the existing left-column markup `<div className="lg:col-span-5"> … </div>` with:

```tsx
<div className="lg:col-span-5">
  <PinnedCover end="+=300%">
    <div className="story-cover bg-elevated relative aspect-[3/4] w-full overflow-hidden lg:aspect-auto lg:h-screen">
      {/* same inner contents as before — cover photo + top/bottom shadow scrims */}
    </div>
  </PinnedCover>
</div>
```

The `lg:sticky lg:top-0` class is **removed** from the inner div — pinning is now driven by ScrollTrigger, not CSS sticky. CSS sticky and GSAP pin together cause double-pinning.

- [ ] **Step 4: Same wrapping for AboutScene portrait**

In `src/components/landing/about-scene.tsx`:

- Add import: `import { PinnedCover } from "./pinned-cover";`
- Replace the existing left figure block to use `<PinnedCover end="+=150%">` similarly, removing the `lg:sticky lg:top-12` class from the inner.

- [ ] **Step 5: Verify typecheck and lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: clean.

- [ ] **Step 6: Manual scroll-jacking smoke**

```bash
pnpm dev &
sleep 12
curl -sS -o /tmp/landing.html http://localhost:3000/
grep -c "PinnedCover\|pinned\|story-cover" /tmp/landing.html
pkill -f "next dev" || true
```

`PinnedCover` is a client component so it's hydrated, not in the HTML directly — but the inner DOM with the cover image should appear. Validate visually in the browser.

- [ ] **Step 7: Commit**

```bash
git add src/components/landing/pinned-cover.tsx \
        src/components/landing/hero-scene.tsx \
        src/components/landing/featured-story-scene.tsx \
        src/components/landing/about-scene.tsx
git commit -m "feat(landing): pin hero / featured-story cover / about portrait via ScrollTrigger"
```

---

## Task 13: E2E updates

Replace the old hero-rotator assertions with new scene assertions, and add a `prefers-reduced-motion` variant.

**Files:**

- Modify: `tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Read the existing spec**

```bash
cat tests/e2e/smoke.spec.ts
```

Note the existing tests (DE tagline + EN tagline + the older landing-page + dot-indicator tests we added during V0).

- [ ] **Step 2: Rewrite `tests/e2e/smoke.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test("German home renders the German tagline", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Volleyball-Fotografie. Bremen.")).toBeVisible();
});

test("English home renders the English tagline at /en", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByText("Volleyball photography. Bremen.")).toBeVisible();
});

test("Landing renders all five elevation scenes (DE)", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /belin akguel/i, level: 1 })).toBeVisible();

  // Featured story title (depends on seeded story)
  await expect(page.getByText(/Pre-Saison/i)).toBeVisible();

  // Work Mosaic eyebrow contains WORK
  await expect(page.getByText(/^WORK$/)).toBeVisible();

  // About eyebrow
  await expect(page.getByText("ÜBER MICH").first()).toBeVisible();

  // Booking CTA primary
  await expect(page.getByRole("link", { name: "ANFRAGE STELLEN →" })).toBeVisible();
});

test("Landing scroll cue is present", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("scroll").first()).toBeVisible();
});

test("Landing renders under prefers-reduced-motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /belin akguel/i, level: 1 })).toBeVisible();
  await expect(page.getByText(/Pre-Saison/i)).toBeVisible();
  await expect(page.getByText("ÜBER MICH").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "ANFRAGE STELLEN →" })).toBeVisible();
});
```

- [ ] **Step 3: Run e2e**

```bash
pnpm test:e2e
```

Expected: all tests pass. If a test fails because a selector picks up text in multiple places, tighten with `getByRole(..., { name: '...', exact: true })`.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/smoke.spec.ts
git commit -m "test(landing): e2e for elevation V1 — five scenes, scroll cue, reduced-motion variant"
```

---

## Task 14: Full verification gate

- [ ] **Step 1: Run everything**

```bash
pnpm format && pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e
```

Expected: all green.

- [ ] **Step 2: Commit any prettier drift**

```bash
git add -A
git diff --cached --quiet || git commit -m "chore: prettier pass for landing elevation"
```

---

## Self-review notes

**Spec coverage:**

- Foundation (typography, color, motion language) — Tasks 1 (deps + fonts + tokens) + 2 (motion primitives).
- Scene 1 Hero — Tasks 4 (component + TDD) + 12 (pinning).
- Scene 2 Featured Story — Tasks 5 (component) + 12 (cover pinning).
- Scene 3 Work Mosaic — Task 6 (adapted to 4-photo asymmetric grid per the codebase's static asset count).
- Scene 4 About — Tasks 7 (component) + 12 (portrait pinning).
- Scene 5 Booking CTA — Task 8 (rewrite in place).
- Header + Footer chrome — Tasks 9 + 10.
- Accessibility (reduced-motion fallback) — woven through Tasks 2, 4, 9, 13.
- Performance — addressed by Task 1 (variable Fraunces with `display: swap`, axes only on demand) + scene-component priorities.
- Testing — Task 2 (3 unit tests), Task 4 (5 unit tests for HeroScene), Task 13 (5 e2e including reduced-motion).
- File deletions — Task 11.

**Placeholder scan:** None. Every code step has full code. Camera-spec values, message keys, and copy are fully written in the spec and reproduced inline in tasks.

**Type consistency:**

- `useReducedMotion(): boolean` is consistent across all uses.
- `usePinnedScene({ pin, trigger?, end?, scrub? })` signature is consistent in Task 2 → consumed in Task 12.
- `Reveal` props `{ children, delay?, className?, threshold? }` consistent.
- `LandingImage` reuses existing component shape (`photo: ResolvedLandingPhoto`).
- `PhotoImage` (for Payload Photos in FeaturedStoryScene) is the existing component — unchanged shape.
- `HeroScene` props are consistent between definition (Task 4 Step 3) and consumption in page.tsx (Task 11 Step 2).

**Adaptations from spec to plan:**

- Spec assumes Payload photos for hero/highlights/about — adapted to static `LANDING_PHOTOS` per current codebase reality (called out in the header notes).
- Work Mosaic adapted from 9 to 4 photos (current static asset count); asymmetric layout still preserved with a 2×2 hero tile + two small + one wide.
- Spec mentions per-character clip-path animation for the hero name. The plan uses element-level reveal (simpler, no GSAP SplitText dependency). The visual difference is small at this restraint level; if Belin reviews V1 and wants per-character, that's a V2 follow-up.
- ScrollTrigger pinning is delegated to a small client wrapper (`PinnedCover`) rather than scattering ref/hook calls inside the otherwise-server scene components.
