# Growth & Go-Live Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every public page locale-correct metadata, social-share images, and Full JSON-LD structured data, and cover the booking funnel with an E2E test plus accessible validation.

**Architecture:** A single `seoCopy()` reader over the i18n JSON is the one source of SEO text; `buildPageMetadata()` composes title/description/canonical/hreflang/OG/Twitter from it. Marketing pages get OG images via Next's `opengraph-image.tsx` file convention (rendered by a shared `next/og` card); stories use their real R2 hero. JSON-LD is rendered by one `<JsonLd>` component from pure builders in `schema.ts`. CMS-editable SEO and site identity are added as Payload fields (with migrations) that override the i18n defaults. The booking form reuses the existing `bookingInquirySchema` for client-side validation.

**Tech Stack:** Next.js 16 (App Router), TypeScript, next-intl v4, Payload 3.84 (db-postgres), `next/og`, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-06-13-growth-go-live-seo-booking-design.md`

**Conventions in this repo (read before starting):**

- Run any one test file: `pnpm test -- <path>` (vitest) ; full unit suite `pnpm test`.
- E2E: `pnpm test:e2e` (Playwright; config `tests/playwright.config.ts`). A foreign "VoxArena" app sometimes occupies :3000 — set `PLAYWRIGHT_BASE_URL` to a known server if port detection misfires.
- Payload schema changes REQUIRE a migration: `pnpm payload migrate:create <name>` then `pnpm payload:generate-types`, apply locally with `pnpm payload:migrate`. Production migrations are run **manually** (no migrate-on-deploy) — call this out in the PR.
- This repo has a `pre-commit` hook (lefthook) running prettier `--check` + `tsc`. Run `pnpm exec prettier --write <files>` before every commit or the commit is rejected.
- `localePrefix` is `as-needed`: German is unprefixed (`/about`), English is under `/en` (`/en/about`). The `localeAlternates(path, locale)` helper already encodes this — always pass the **German-relative** path.
- No `<title>` template is introduced; each page sets its complete title string. (Avoids double-suffixing story titles.)

---

## File Structure

**Create:**

- `src/lib/seo/copy.ts` — single reader: `seoCopy(locale, page)` over the i18n JSON. Used by both page metadata and OG image routes (one source of truth).
- `src/lib/seo/metadata.ts` — `buildPageMetadata(...)` composing `Metadata`.
- `src/lib/seo/og-card.tsx` — shared `next/og` `ImageResponse` renderer.
- `src/lib/seo/schema.ts` — pure JSON-LD builders (`personSchema`, `localBusinessSchema`, `serviceSchema`, `articleSchema`, `breadcrumbSchema`, `webSiteSchema`).
- `src/components/seo/json-ld.tsx` — `<JsonLd data={...} />` server component.
- `app/(site)/[locale]/{about,services,contact,highlights,athletes,journal,stories}/opengraph-image.tsx` — per-route OG card (7 files).
- `src/app/opengraph-image.tsx` — static root fallback OG card.
- `tests/unit/lib/seo/metadata.test.ts`, `tests/unit/lib/seo/schema.test.ts`, `tests/unit/lib/seo/copy.test.ts`, `tests/unit/components/json-ld.test.tsx`, `tests/unit/lib/booking/validate.test.ts`.
- `tests/e2e/booking.spec.ts`, `tests/e2e/seo.spec.ts`.
- `src/lib/booking/validate.ts` — client-side field validation helper over `bookingInquirySchema`.

**Modify:**

- `src/messages/de.json`, `src/messages/en.json` — add `seo` namespace.
- 7 page files — add/extend `generateMetadata`; add `<JsonLd>` where specified.
- `src/app/(site)/[locale]/stories/[slug]/page.tsx` — OG hero image + Article/Breadcrumb JSON-LD.
- `src/app/(site)/[locale]/layout.tsx` — Person + WebSite JSON-LD.
- `src/payload/globals/settings.ts` — `organization` group (+ migration).
- `src/payload/globals/{about,services,contact,highlights,athletes}-page.ts` — `seo` group (+ migration).
- `scripts/seed/marketing-pages.ts` — seed the new `seo` group from i18n.
- `src/components/booking/booking-form.tsx` — client validation + `aria-errormessage`/`aria-invalid`.

---

## Task 1: `seoCopy()` — single SEO-text reader

**Files:**

- Create: `src/lib/seo/copy.ts`
- Test: `tests/unit/lib/seo/copy.test.ts`

This reads SEO title/description from the i18n JSON so both page metadata and the OG image routes share one source. (Page `generateMetadata` could use `getTranslations`, but OG routes have no request scope — so we read the JSON directly in both.)

- [ ] **Step 1: Add the `seo` namespace to both message files.**

Add this object at the top level of `src/messages/de.json`:

```jsonc
"seo": {
  "about": {
    "title": "Über Belin Akguel — Volleyball-Fotografin aus Bremen",
    "description": "Lerne Belin Akguel kennen: cinematische Volleyball- und Sportfotografie aus Bremen, mit einem Blick für Bewegung, Licht und den entscheidenden Moment."
  },
  "services": {
    "title": "Leistungen — Volleyball- & Sportfotografie",
    "description": "Buche Belin Akguel für Spieltag-Reportagen, Team-Porträts und Highlight-Sessions. Professionelle Volleyball- und Sportfotografie aus Bremen."
  },
  "contact": {
    "title": "Kontakt & Buchung — Belin Akguel",
    "description": "Frag deinen Foto-Termin an: Volleyball- und Sportfotografie aus Bremen. Schnelle Antwort, unkomplizierte Buchung."
  },
  "highlights": {
    "title": "Highlights — Ausgewählte Volleyball-Momente",
    "description": "Eine Auswahl der stärksten Volleyball- und Sportaufnahmen von Belin Akguel — Bewegung, Emotion und Licht in einem Bild."
  },
  "athletes": {
    "title": "Athletinnen & Athleten — Sportporträts",
    "description": "Porträts und Spielszenen von Volleyballerinnen und Volleyballern, fotografiert von Belin Akguel in Bremen."
  },
  "journal": {
    "title": "Journal — Hinter den Kulissen",
    "description": "Notizen, Spieltage und Geschichten hinter den Bildern von Belin Akguel — Volleyball- und Sportfotografie aus Bremen."
  },
  "stories": {
    "title": "Stories — Volleyball-Reportagen",
    "description": "Bildstrecken und Reportagen von Spieltagen und Turnieren, fotografiert von Belin Akguel aus Bremen."
  }
}
```

Add the English equivalent at the top level of `src/messages/en.json`:

```jsonc
"seo": {
  "about": {
    "title": "About Belin Akguel — Volleyball Photographer in Bremen",
    "description": "Meet Belin Akguel: cinematic volleyball and sports photography from Bremen, with an eye for motion, light, and the decisive moment."
  },
  "services": {
    "title": "Services — Volleyball & Sports Photography",
    "description": "Book Belin Akguel for match-day reportage, team portraits, and highlight sessions. Professional volleyball and sports photography from Bremen."
  },
  "contact": {
    "title": "Contact & Booking — Belin Akguel",
    "description": "Request your shoot: volleyball and sports photography from Bremen. Fast reply, easy booking."
  },
  "highlights": {
    "title": "Highlights — Selected Volleyball Moments",
    "description": "A selection of Belin Akguel's strongest volleyball and sports images — motion, emotion, and light in a single frame."
  },
  "athletes": {
    "title": "Athletes — Sports Portraits",
    "description": "Portraits and game action of volleyball players, photographed by Belin Akguel in Bremen."
  },
  "journal": {
    "title": "Journal — Behind the Scenes",
    "description": "Notes, match days, and the stories behind Belin Akguel's images — volleyball and sports photography from Bremen."
  },
  "stories": {
    "title": "Stories — Volleyball Reportage",
    "description": "Photo stories and reportage from match days and tournaments, shot by Belin Akguel from Bremen."
  }
}
```

- [ ] **Step 2: Write the failing test.**

`tests/unit/lib/seo/copy.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { seoCopy, type SeoPage } from "@/lib/seo/copy";

describe("seoCopy", () => {
  it("returns German copy for de", () => {
    const c = seoCopy("de", "about");
    expect(c.title).toMatch(/Belin Akguel/);
    expect(c.description.length).toBeGreaterThan(20);
  });

  it("returns English copy for en", () => {
    expect(seoCopy("en", "services").title).toMatch(/Services/);
  });

  it("falls back to German for an unknown locale", () => {
    expect(seoCopy("fr", "contact")).toEqual(seoCopy("de", "contact"));
  });

  it("covers every page key", () => {
    const pages: SeoPage[] = [
      "about",
      "services",
      "contact",
      "highlights",
      "athletes",
      "journal",
      "stories",
    ];
    for (const p of pages) {
      expect(seoCopy("de", p).title).toBeTruthy();
      expect(seoCopy("en", p).title).toBeTruthy();
    }
  });
});
```

- [ ] **Step 3: Run it — expect failure.**

Run: `pnpm test -- tests/unit/lib/seo/copy.test.ts`
Expected: FAIL — `Cannot find module '@/lib/seo/copy'`.

- [ ] **Step 4: Implement `src/lib/seo/copy.ts`.**

```ts
import de from "@/messages/de.json";
import en from "@/messages/en.json";

export type SeoPage =
  "about" | "services" | "contact" | "highlights" | "athletes" | "journal" | "stories";

type SeoEntry = { title: string; description: string };

const tables: Record<"de" | "en", Record<SeoPage, SeoEntry>> = {
  de: (de as { seo: Record<SeoPage, SeoEntry> }).seo,
  en: (en as { seo: Record<SeoPage, SeoEntry> }).seo,
};

/** SEO title/description for a page, read from the i18n JSON. Non-de/en → de. */
export function seoCopy(locale: string, page: SeoPage): SeoEntry {
  const table = locale === "en" ? tables.en : tables.de;
  return table[page];
}
```

If `tsc` complains about importing JSON, confirm `resolveJsonModule` is set in `tsconfig.json` (Next enables it; add `"resolveJsonModule": true` to `compilerOptions` if missing).

- [ ] **Step 5: Run the test — expect pass.**

Run: `pnpm test -- tests/unit/lib/seo/copy.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit.**

```bash
pnpm exec prettier --write src/messages/de.json src/messages/en.json src/lib/seo/copy.ts tests/unit/lib/seo/copy.test.ts
git add src/messages/de.json src/messages/en.json src/lib/seo/copy.ts tests/unit/lib/seo/copy.test.ts
git commit -m "feat(seo): add seo i18n namespace + seoCopy reader"
```

---

## Task 2: `buildPageMetadata()`

**Files:**

- Create: `src/lib/seo/metadata.ts`
- Test: `tests/unit/lib/seo/metadata.test.ts`

- [ ] **Step 1: Write the failing test.**

`tests/unit/lib/seo/metadata.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildPageMetadata } from "@/lib/seo/metadata";

describe("buildPageMetadata", () => {
  const base = { title: "Leistungen", description: "Volleyball." };

  it("sets title, description and German canonical", () => {
    const m = buildPageMetadata({ ...base, locale: "de", path: "/services" });
    expect(m.title).toBe("Leistungen");
    expect(m.description).toBe("Volleyball.");
    expect(m.alternates?.canonical).toBe("/services");
    expect(m.alternates?.languages).toMatchObject({ en: "/en/services", de: "/services" });
  });

  it("sets the English canonical under /en", () => {
    const m = buildPageMetadata({ ...base, locale: "en", path: "/services" });
    expect(m.alternates?.canonical).toBe("/en/services");
  });

  it("emits og + twitter card with the same title", () => {
    const m = buildPageMetadata({ ...base, locale: "de", path: "/services" });
    expect((m.openGraph as { title?: string }).title).toBe("Leistungen");
    expect((m.twitter as { card?: string }).card).toBe("summary_large_image");
  });

  it("includes an explicit OG image when given", () => {
    const m = buildPageMetadata({
      ...base,
      locale: "de",
      path: "/stories/x",
      image: { url: "https://cdn.example/x.jpg", width: 1200, height: 800, alt: "x" },
    });
    expect((m.openGraph as { images?: unknown[] }).images).toEqual([
      { url: "https://cdn.example/x.jpg", width: 1200, height: 800, alt: "x" },
    ]);
  });
});
```

- [ ] **Step 2: Run it — expect failure.**

Run: `pnpm test -- tests/unit/lib/seo/metadata.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/seo/metadata.ts`.**

```ts
import type { Metadata } from "next";
import { localeAlternates } from "@/lib/seo/alternates";

export type OgImage = { url: string; width?: number; height?: number; alt?: string };

/**
 * Compose page Metadata: title, description, canonical+hreflang (via
 * localeAlternates), and OpenGraph/Twitter blocks. For marketing pages the OG
 * *image* comes from the colocated opengraph-image.tsx file convention, so
 * `image` is only passed for routes without one (e.g. stories → hero photo).
 */
export function buildPageMetadata(input: {
  locale: string;
  path: string;
  title: string;
  description: string;
  image?: OgImage;
}): Metadata {
  const { locale, path, title, description, image } = input;
  const images = image
    ? [{ url: image.url, width: image.width, height: image.height, alt: image.alt ?? title }]
    : undefined;

  return {
    title,
    description,
    alternates: localeAlternates(path, locale),
    openGraph: {
      type: "website",
      title,
      description,
      locale: locale === "en" ? "en_US" : "de_DE",
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
  };
}
```

- [ ] **Step 4: Run the test — expect pass.**

Run: `pnpm test -- tests/unit/lib/seo/metadata.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit.**

```bash
pnpm exec prettier --write src/lib/seo/metadata.ts tests/unit/lib/seo/metadata.test.ts
git add src/lib/seo/metadata.ts tests/unit/lib/seo/metadata.test.ts
git commit -m "feat(seo): add buildPageMetadata composer"
```

---

## Task 3: Wire `generateMetadata` into the 7 pages

**Files (modify):**

- `src/app/(site)/[locale]/about/page.tsx`
- `src/app/(site)/[locale]/services/page.tsx`
- `src/app/(site)/[locale]/contact/page.tsx`
- `src/app/(site)/[locale]/highlights/page.tsx`
- `src/app/(site)/[locale]/athletes/page.tsx`
- `src/app/(site)/[locale]/journal/page.tsx`
- `src/app/(site)/[locale]/stories/page.tsx`

Each page gets the SAME `generateMetadata`, differing only by the `path` and the `SeoPage` key. Reference implementation for **about** (apply identically to the others using the table below):

- [ ] **Step 1: Add `generateMetadata` to `about/page.tsx`.**

Add these imports at the top (keep existing imports):

```ts
import type { Metadata } from "next";
import { defaultLocale } from "@/lib/i18n/config";
import { seoCopy } from "@/lib/seo/copy";
import { buildPageMetadata } from "@/lib/seo/metadata";
```

Add above the default export:

```ts
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : defaultLocale;
  const copy = seoCopy(safeLocale, "about");
  return buildPageMetadata({ locale: safeLocale, path: "/about", ...copy });
}
```

(`isLocale` is already imported in these pages.)

- [ ] **Step 2: Apply the identical block to the other six pages**, substituting per this table:

| File                  | `path`        | `SeoPage` key |
| --------------------- | ------------- | ------------- |
| `services/page.tsx`   | `/services`   | `services`    |
| `contact/page.tsx`    | `/contact`    | `contact`     |
| `highlights/page.tsx` | `/highlights` | `highlights`  |
| `athletes/page.tsx`   | `/athletes`   | `athletes`    |
| `journal/page.tsx`    | `/journal`    | `journal`     |
| `stories/page.tsx`    | `/stories`    | `stories`     |

For any page that does NOT already import `isLocale`/`defaultLocale`, add them from `@/lib/i18n/config`. For any page whose `params` type omits `locale`, it already destructures `{ locale }` (all of these are `[locale]` segment pages) — keep the existing signature shape.

- [ ] **Step 3: Typecheck.**

Run: `pnpm typecheck`
Expected: PASS (no errors). If a page lacked a `Metadata` import, add it.

- [ ] **Step 4: Manually verify two pages render a title.**

Run: `pnpm dev` (note the port), then:
`curl -s http://localhost:3000/services | grep -o '<title>[^<]*</title>'`
Expected: `<title>Leistungen — Volleyball- &amp; Sportfotografie</title>`
`curl -s http://localhost:3000/en/about | grep -o '<title>[^<]*</title>'`
Expected: the English about title.

- [ ] **Step 5: Commit.**

```bash
pnpm exec prettier --write "src/app/(site)/[locale]"/{about,services,contact,highlights,athletes,journal,stories}/page.tsx
git add "src/app/(site)/[locale]"/{about,services,contact,highlights,athletes,journal,stories}/page.tsx
git commit -m "feat(seo): per-page metadata on all public marketing pages"
```

---

## Task 4: Story OG image (real R2 hero)

**Files (modify):** `src/app/(site)/[locale]/stories/[slug]/page.tsx`

The page already has `generateMetadata` (sets `title` + `alternates`). Replace it to add the description + OG hero image, reusing the existing `resolvePhoto`/`photoSrc`/`photoDimensions`/`photoAlt` from `@/lib/payload/media`.

- [ ] **Step 1: Update imports.**

Add to the existing imports:

```ts
import { resolvePhoto, photoSrc, photoDimensions, photoAlt } from "@/lib/payload/media";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { seoCopy } from "@/lib/seo/copy";
```

(`resolvePhoto` is already imported in this file — don't duplicate it; add only the missing names.)

- [ ] **Step 2: Replace `generateMetadata`.**

```ts
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const story = await getStoryBySlug(slug, locale as Locale);
  if (!story) return {};

  const cover = resolvePhoto(story.coverPhoto);
  const url = photoSrc(cover, "feed");
  const { width, height } = photoDimensions(cover, "feed");
  const fallback = seoCopy(locale, "stories");

  return buildPageMetadata({
    locale,
    path: `/stories/${slug}`,
    title: story.title ?? fallback.title,
    description: story.excerpt?.trim() || fallback.description,
    image: url ? { url, width, height, alt: photoAlt(cover, story.title ?? "") } : undefined,
  });
}
```

If `Story` has no `excerpt` field (check `@/payload-types`), drop the `story.excerpt?.trim() ||` and use `fallback.description` directly.

- [ ] **Step 3: Typecheck.**

Run: `pnpm typecheck`
Expected: PASS. Fix the `excerpt` line per the note above if it errors.

- [ ] **Step 4: Verify a story exposes og:image.**

With `pnpm dev` running, pick a published slug from `/stories`, then:
`curl -s http://localhost:3000/stories/<slug> | grep -oE 'property="og:image"[^>]*'`
Expected: an `og:image` whose content is a `cdn.setandshoot.com` (or `r2.dev`) URL.

- [ ] **Step 5: Commit.**

```bash
pnpm exec prettier --write "src/app/(site)/[locale]/stories/[slug]/page.tsx"
git add "src/app/(site)/[locale]/stories/[slug]/page.tsx"
git commit -m "feat(seo): use story hero as OG image on story pages"
```

---

## Task 5: Dynamic OG cards for marketing pages + static root fallback

**Files:**

- Create: `src/lib/seo/og-card.tsx`
- Create: 7 × `app/(site)/[locale]/<page>/opengraph-image.tsx`
- Create: `src/app/opengraph-image.tsx`

OG image routes return an `ImageResponse` and cannot be meaningfully unit-tested without an edge runtime, so they are verified by the SEO E2E sweep (Task 12) and a manual social-card debugger. Keep the card font as `ImageResponse`'s built-in sans (no custom font fetch) to avoid runtime flakiness; a branded font can be layered later.

- [ ] **Step 1: Implement the shared card renderer `src/lib/seo/og-card.tsx`.**

```tsx
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

/** Branded 1200×630 OG card: page title + wordmark on the brand background. */
export function ogCard({ title }: { title: string }) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#0b0b0c",
        color: "#f5f5f4",
        padding: "80px",
      }}
    >
      <div style={{ fontSize: 30, letterSpacing: 4, color: "#E63946", textTransform: "uppercase" }}>
        Set &amp; Shoot
      </div>
      <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.1, maxWidth: 900 }}>{title}</div>
      <div style={{ fontSize: 34, color: "#a3a3a3" }}>
        Belin Akguel · Volleyball-Fotografie · Bremen
      </div>
    </div>,
    { ...OG_SIZE },
  );
}
```

- [ ] **Step 2: Create the per-page OG route. Example `app/(site)/[locale]/about/opengraph-image.tsx`:**

```tsx
import { ogCard, OG_SIZE } from "@/lib/seo/og-card";
import { seoCopy } from "@/lib/seo/copy";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Belin Akguel";

export default async function OgImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return ogCard({ title: seoCopy(locale, "about").title });
}
```

Create the identical file for the other six pages, substituting the `SeoPage` key from the Task 3 table (`services`, `contact`, `highlights`, `athletes`, `journal`, `stories`). Each lives next to that page's `page.tsx`.

- [ ] **Step 3: Create the static root fallback `src/app/opengraph-image.tsx`:**

```tsx
import { ogCard, OG_SIZE } from "@/lib/seo/og-card";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Belin Akguel — Volleyball-Fotografie";

export default function OgImage() {
  return ogCard({ title: "Belin Akguel — Volleyball-Fotografie" });
}
```

- [ ] **Step 4: Typecheck + verify a card renders.**

Run: `pnpm typecheck` → PASS.
With `pnpm dev` running:
`curl -s -o /tmp/og.png -w "%{http_code} %{content_type}\n" http://localhost:3000/services/opengraph-image`
Expected: `200 image/png` and `/tmp/og.png` is a valid PNG (`file /tmp/og.png` → PNG image data, 1200 x 630).

- [ ] **Step 5: Commit.**

```bash
pnpm exec prettier --write src/lib/seo/og-card.tsx "src/app/opengraph-image.tsx" "src/app/(site)/[locale]"/{about,services,contact,highlights,athletes,journal,stories}/opengraph-image.tsx
git add src/lib/seo/og-card.tsx "src/app/opengraph-image.tsx" "src/app/(site)/[locale]"/{about,services,contact,highlights,athletes,journal,stories}/opengraph-image.tsx
git commit -m "feat(seo): dynamic next/og social cards + static root fallback"
```

---

## Task 6: `<JsonLd>` component

**Files:**

- Create: `src/components/seo/json-ld.tsx`
- Test: `tests/unit/components/json-ld.test.tsx`

- [ ] **Step 1: Write the failing test.**

`tests/unit/components/json-ld.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JsonLd } from "@/components/seo/json-ld";

describe("JsonLd", () => {
  it("renders a ld+json script with the serialized data", () => {
    const { container } = render(
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Person", name: "Belin" }} />,
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    expect(JSON.parse(script!.innerHTML)).toMatchObject({ "@type": "Person", name: "Belin" });
  });

  it("escapes a closing script tag to prevent breakout", () => {
    const { container } = render(<JsonLd data={{ x: "</script>" }} />);
    expect(container.querySelector("script")!.innerHTML).not.toContain("</script>");
  });
});
```

- [ ] **Step 2: Run it — expect failure.**

Run: `pnpm test -- tests/unit/components/json-ld.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/components/seo/json-ld.tsx`.**

```tsx
/** Renders a JSON-LD <script>. `data` is any schema.org object/array. */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  // Escape "<" so a stray "</script>" in user content can't break out.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
```

- [ ] **Step 4: Run the test — expect pass.**

Run: `pnpm test -- tests/unit/components/json-ld.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit.**

```bash
pnpm exec prettier --write src/components/seo/json-ld.tsx tests/unit/components/json-ld.test.tsx
git add src/components/seo/json-ld.tsx tests/unit/components/json-ld.test.tsx
git commit -m "feat(seo): add JsonLd render component"
```

---

## Task 7: JSON-LD schema builders

**Files:**

- Create: `src/lib/seo/schema.ts`
- Test: `tests/unit/lib/seo/schema.test.ts`

Builders are pure (take plain inputs, return objects). The CMS `organization` identity is passed in as an argument so builders stay testable without Payload.

- [ ] **Step 1: Write the failing test.**

`tests/unit/lib/seo/schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  personSchema,
  localBusinessSchema,
  breadcrumbSchema,
  articleSchema,
} from "@/lib/seo/schema";

const org = {
  instagram: "https://instagram.com/x",
  linkedin: "",
  email: "a@b.de",
  phone: "",
  city: "Bremen",
};

describe("schema builders", () => {
  it("personSchema includes only non-empty sameAs", () => {
    const s = personSchema({ siteUrl: "https://s.com", org });
    expect(s["@type"]).toBe("Person");
    expect(s.sameAs).toEqual(["https://instagram.com/x"]); // linkedin "" omitted
  });

  it("localBusinessSchema sets areaServed + omits empty contact", () => {
    const s = localBusinessSchema({ siteUrl: "https://s.com", org });
    expect(s["@type"]).toBe("ProfessionalService");
    expect(s.areaServed).toBe("Bremen");
    expect(s.email).toBe("a@b.de");
    expect("telephone" in s).toBe(false); // phone "" omitted
  });

  it("breadcrumbSchema numbers positions from 1", () => {
    const s = breadcrumbSchema([
      { name: "Home", url: "https://s.com/" },
      { name: "Stories", url: "https://s.com/stories" },
    ]);
    expect(s.itemListElement[1].position).toBe(2);
  });

  it("articleSchema nests an ImageObject when an image is given", () => {
    const s = articleSchema({
      siteUrl: "https://s.com",
      title: "T",
      description: "D",
      url: "https://s.com/stories/t",
      image: { url: "https://cdn/x.jpg", width: 1200, height: 800 },
      datePublished: "2026-01-01",
    });
    expect(s["@type"]).toBe("Article");
    expect((s.image as { "@type": string })["@type"]).toBe("ImageObject");
  });
});
```

- [ ] **Step 2: Run it — expect failure.**

Run: `pnpm test -- tests/unit/lib/seo/schema.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/seo/schema.ts`.**

```ts
export type OrgIdentity = {
  instagram?: string;
  linkedin?: string;
  email?: string;
  phone?: string;
  city?: string;
};

const NAME = "Belin Akguel";

function sameAs(org: OrgIdentity): string[] {
  return [org.instagram, org.linkedin].filter((u): u is string => Boolean(u && u.trim()));
}

export function webSiteSchema({ siteUrl }: { siteUrl: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: NAME,
    url: siteUrl,
  } as const;
}

export function personSchema({ siteUrl, org }: { siteUrl: string; org: OrgIdentity }) {
  const links = sameAs(org);
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: NAME,
    jobTitle: "Photographer",
    url: siteUrl,
    ...(links.length ? { sameAs: links } : {}),
  };
}

export function localBusinessSchema({ siteUrl, org }: { siteUrl: string; org: OrgIdentity }) {
  const links = sameAs(org);
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: NAME,
    url: siteUrl,
    image: `${siteUrl}/opengraph-image`,
    ...(org.city ? { areaServed: org.city } : {}),
    ...(org.email ? { email: org.email } : {}),
    ...(org.phone ? { telephone: org.phone } : {}),
    ...(links.length ? { sameAs: links } : {}),
  };
}

export function serviceSchema({
  siteUrl,
  offers,
}: {
  siteUrl: string;
  offers: { title: string; body: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    provider: { "@type": "Person", name: NAME },
    serviceType: "Sports & volleyball photography",
    areaServed: "Bremen",
    url: `${siteUrl}/services`,
    ...(offers.length
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Leistungen",
            itemListElement: offers.map((o) => ({
              "@type": "Offer",
              name: o.title,
              description: o.body,
            })),
          },
        }
      : {}),
  };
}

export function articleSchema({
  siteUrl,
  title,
  description,
  url,
  image,
  datePublished,
}: {
  siteUrl: string;
  title: string;
  description: string;
  url: string;
  image?: { url: string; width: number; height: number };
  datePublished?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url,
    author: { "@type": "Person", name: NAME },
    publisher: { "@type": "Person", name: NAME },
    ...(datePublished ? { datePublished } : {}),
    ...(image
      ? {
          image: {
            "@type": "ImageObject",
            url: image.url,
            width: image.width,
            height: image.height,
          },
        }
      : {}),
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}
```

- [ ] **Step 4: Run the test — expect pass.**

Run: `pnpm test -- tests/unit/lib/seo/schema.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit.**

```bash
pnpm exec prettier --write src/lib/seo/schema.ts tests/unit/lib/seo/schema.test.ts
git add src/lib/seo/schema.ts tests/unit/lib/seo/schema.test.ts
git commit -m "feat(seo): add JSON-LD schema builders"
```

---

## Task 8: `settings.organization` group + place JSON-LD

**Files (modify):**

- `src/payload/globals/settings.ts`
- `src/app/(site)/[locale]/layout.tsx` (Person + WebSite)
- `src/app/(site)/[locale]/contact/page.tsx` (LocalBusiness)
- `src/app/(site)/[locale]/services/page.tsx` (Service)
- `src/app/(site)/[locale]/stories/[slug]/page.tsx` (Article + Breadcrumb)

This adds a Payload field group → **schema migration required**.

- [ ] **Step 1: Add the `organization` group to `settings.ts`.**

Append to the `fields` array (after `homeFeaturedCount`):

```ts
    {
      name: "organization",
      type: "group",
      label: "Profil / SEO",
      fields: [
        { name: "instagram", type: "text", label: "Instagram-URL" },
        { name: "linkedin", type: "text", label: "LinkedIn-URL" },
        { name: "email", type: "email", label: "Kontakt-E-Mail" },
        { name: "phone", type: "text", label: "Telefon" },
        { name: "city", type: "text", defaultValue: "Bremen", label: "Stadt" },
      ],
    },
```

- [ ] **Step 2: Generate + apply the migration and regenerate types.**

```bash
pnpm payload migrate:create add_settings_organization
pnpm payload:generate-types
pnpm payload:migrate
pnpm payload:migrate:status
```

Expected: a new file in `src/migrations/`, `payload-types.ts` updated with `organization`, status shows the migration applied. (Production: run `pnpm payload:migrate` manually after deploy — note in PR.)

- [ ] **Step 3: Add a small server helper to read identity once.** Create `src/lib/seo/identity.ts`:

```ts
import { getPayload } from "@/lib/payload/get-payload";
import type { OrgIdentity } from "@/lib/seo/schema";

export async function getOrgIdentity(): Promise<OrgIdentity> {
  const payload = await getPayload();
  const settings = await payload.findGlobal({ slug: "settings" });
  const org = (settings as { organization?: OrgIdentity }).organization ?? {};
  return {
    instagram: org.instagram ?? undefined,
    linkedin: org.linkedin ?? undefined,
    email: org.email ?? undefined,
    phone: org.phone ?? undefined,
    city: org.city ?? "Bremen",
  };
}
```

- [ ] **Step 4: Render Person + WebSite in the locale layout.**

In `src/app/(site)/[locale]/layout.tsx`, import and render inside `<body>` (above `<Header />`):

```tsx
import { JsonLd } from "@/components/seo/json-ld";
import { personSchema, webSiteSchema } from "@/lib/seo/schema";
import { getOrgIdentity } from "@/lib/seo/identity";
// inside the component, after setRequestLocale:
const org = await getOrgIdentity();
const siteUrl = env.NEXT_PUBLIC_SITE_URL;
// in JSX, first children of <body>:
<JsonLd data={personSchema({ siteUrl, org })} />
<JsonLd data={webSiteSchema({ siteUrl })} />
```

- [ ] **Step 5: Render LocalBusiness on `/contact`, Service on `/services`, Article+Breadcrumb on the story page.**

`contact/page.tsx` — in the default export, before the returned JSX:

```tsx
import { JsonLd } from "@/components/seo/json-ld";
import { localBusinessSchema } from "@/lib/seo/schema";
import { getOrgIdentity } from "@/lib/seo/identity";
import { env } from "@/env";
// ...
const org = await getOrgIdentity();
// render <JsonLd data={localBusinessSchema({ siteUrl: env.NEXT_PUBLIC_SITE_URL, org })} /> in the page.
```

`services/page.tsx` — read the `serviceOffers` block items from `servicesPage` global (the page already fetches it) and render:

```tsx
import { serviceSchema } from "@/lib/seo/schema";
// derive offers from the servicesPage global's serviceOffers block items ({ title, body });
// if none, pass [] (builder omits the catalog).
<JsonLd data={serviceSchema({ siteUrl: env.NEXT_PUBLIC_SITE_URL, offers })} />;
```

`stories/[slug]/page.tsx` — in the default export, after `story` is resolved:

```tsx
import { JsonLd } from "@/components/seo/json-ld";
import { articleSchema, breadcrumbSchema } from "@/lib/seo/schema";
import { env } from "@/env";
// ...
const siteUrl = env.NEXT_PUBLIC_SITE_URL;
const canonical = locale === "de" ? `${siteUrl}/stories/${slug}` : `${siteUrl}/en/stories/${slug}`;
const ogUrl = photoSrc(cover, "feed");
const { width, height } = photoDimensions(cover, "feed");
// render both, e.g. just inside <article>:
<JsonLd data={articleSchema({
  siteUrl,
  title: story.title ?? "",
  description: story.excerpt?.trim() || seoCopy(locale, "stories").description,
  url: canonical,
  image: ogUrl ? { url: ogUrl, width, height } : undefined,
  datePublished: story.publishedAt ?? undefined,
})} />
<JsonLd data={breadcrumbSchema([
  { name: "Home", url: locale === "de" ? `${siteUrl}/` : `${siteUrl}/en` },
  { name: seoCopy(locale, "stories").title, url: locale === "de" ? `${siteUrl}/stories` : `${siteUrl}/en/stories` },
  { name: story.title ?? "", url: canonical },
])} />
```

Verify `publishedAt`/`excerpt` field names against `@/payload-types`; drop whichever doesn't exist.

- [ ] **Step 6: Typecheck + verify JSON-LD on the page.**

Run: `pnpm typecheck` → PASS.
With `pnpm dev`: `curl -s http://localhost:3000/contact | grep -c 'application/ld+json'`
Expected: ≥ 3 (Person + WebSite from layout, LocalBusiness from page).

- [ ] **Step 7: Commit.**

```bash
pnpm exec prettier --write src/payload/globals/settings.ts src/lib/seo/identity.ts "src/app/(site)/[locale]/layout.tsx" "src/app/(site)/[locale]"/{contact,services}/page.tsx "src/app/(site)/[locale]/stories/[slug]/page.tsx" payload-types.ts src/migrations/*
git add src/payload/globals/settings.ts src/lib/seo/identity.ts "src/app/(site)/[locale]/layout.tsx" "src/app/(site)/[locale]"/{contact,services}/page.tsx "src/app/(site)/[locale]/stories/[slug]/page.tsx" payload-types.ts src/migrations/
git commit -m "feat(seo): organization identity global + JSON-LD on key pages"
```

---

## Task 9: CMS-editable SEO override (A2)

**Files (modify):**

- `src/payload/globals/{about,services,contact,highlights,athletes}-page.ts`
- 5 page `generateMetadata` functions
- `scripts/seed/marketing-pages.ts`

Adds a localized `seo` group to the 5 marketing globals (schema migration), then overrides the i18n default when filled.

- [ ] **Step 1: Add the `seo` group to each of the 5 marketing globals.** In each file, add to the `fields` array (before or after `sections`):

```ts
    {
      name: "seo",
      type: "group",
      localized: true,
      label: "SEO",
      fields: [
        { name: "title", type: "text", label: "SEO-Titel" },
        { name: "description", type: "textarea", label: "SEO-Beschreibung" },
      ],
    },
```

- [ ] **Step 2: Migration + types.**

```bash
pnpm payload migrate:create add_marketing_seo
pnpm payload:generate-types
pnpm payload:migrate
pnpm payload:migrate:status
```

- [ ] **Step 3: Add an override resolver.** Append to `src/lib/seo/copy.ts`:

```ts
/** i18n default overridden by a non-empty CMS value. */
export function resolveSeo(
  base: { title: string; description: string },
  override?: { title?: string | null; description?: string | null },
): { title: string; description: string } {
  return {
    title: override?.title?.trim() || base.title,
    description: override?.description?.trim() || base.description,
  };
}
```

- [ ] **Step 4: Wire the override into the 5 pages' `generateMetadata`.** For `about/page.tsx` (apply the same shape to services/contact/highlights/athletes, substituting the global slug):

```ts
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : defaultLocale;
  const payload = await getPayload();
  const data = await payload.findGlobal({ slug: "aboutPage", locale: safeLocale });
  const copy = resolveSeo(
    seoCopy(safeLocale, "about"),
    (data as { seo?: { title?: string; description?: string } }).seo,
  );
  return buildPageMetadata({ locale: safeLocale, path: "/about", ...copy });
}
```

Global slugs: about→`aboutPage`, services→`servicesPage`, contact→`contactPage`, highlights→`highlightsPage`, athletes→`athletesPage`. Add the `resolveSeo` import and (if absent) the `getPayload` import. `journal` and `stories` index keep their Task 3 form (no global).

- [ ] **Step 5: Seed the `seo` group from i18n in `scripts/seed/marketing-pages.ts`.** Extend the seed so each global's `seo` is populated (de + en) from the `seo` namespace when empty. Add to the `Messages` type:

```ts
seo: Record<string, { title: string; description: string }>;
```

And in each `updateGlobal` call, include `seo` in the `data` keyed by the page's seo slug (about→`about`, etc.), writing the de value in pass 1 and the en value in pass 2 (the `seo` group is localized, mirroring the existing two-pass localized write). Skip overwriting if `existing.seo?.title` is already set.

- [ ] **Step 6: Run the seed + typecheck.**

```bash
pnpm payload:generate-types
pnpm typecheck
pnpm seed:marketing-pages
```

Expected: typecheck PASS; seed logs each global seeded/skipped.

- [ ] **Step 7: Verify an override wins.** In `/admin` (or via a quick `payload run` probe) set `aboutPage.seo.title` for `de`, then `curl -s http://localhost:3000/about | grep -o '<title>[^<]*</title>'` → shows the CMS value, not the i18n default. Clear it → reverts to the i18n default.

- [ ] **Step 8: Commit.**

```bash
pnpm exec prettier --write src/payload/globals/*-page.ts src/lib/seo/copy.ts scripts/seed/marketing-pages.ts "src/app/(site)/[locale]"/{about,services,contact,highlights,athletes}/page.tsx payload-types.ts src/migrations/*
git add src/payload/globals/ src/lib/seo/copy.ts scripts/seed/marketing-pages.ts "src/app/(site)/[locale]"/{about,services,contact,highlights,athletes}/page.tsx payload-types.ts src/migrations/
git commit -m "feat(seo): CMS-editable SEO override on marketing pages"
```

---

## Task 10: Booking form — client validation + a11y

**Files:**

- Create: `src/lib/booking/validate.ts`
- Test: `tests/unit/lib/booking/validate.test.ts`
- Modify: `src/components/booking/booking-form.tsx`

- [ ] **Step 1: Write the failing test.**

`tests/unit/lib/booking/validate.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { validateBookingFields } from "@/lib/booking/validate";

describe("validateBookingFields", () => {
  it("returns no errors for valid input", () => {
    expect(
      validateBookingFields({ name: "Belin A", email: "a@b.de", message: "Hello there team" }),
    ).toEqual({});
  });

  it("flags short name, bad email, short message by field", () => {
    const errs = validateBookingFields({ name: "B", email: "nope", message: "hi" });
    expect(errs.name).toBeTruthy();
    expect(errs.email).toBeTruthy();
    expect(errs.message).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run it — expect failure.**

Run: `pnpm test -- tests/unit/lib/booking/validate.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/booking/validate.ts`.**

```ts
import { bookingInquirySchema } from "@/lib/booking/schema";

export type BookingFieldErrors = Partial<
  Record<"name" | "email" | "message" | "organization", string>
>;

/** Client-side, per-field validation reusing the server schema. */
export function validateBookingFields(input: {
  name: string;
  email: string;
  message: string;
  organization?: string;
}): BookingFieldErrors {
  const result = bookingInquirySchema.safeParse({ ...input, locale: "de" });
  if (result.success) return {};
  const errors: BookingFieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (key === "name" || key === "email" || key === "message" || key === "organization") {
      errors[key] ??= issue.message;
    }
  }
  return errors;
}
```

- [ ] **Step 4: Run the test — expect pass.**

Run: `pnpm test -- tests/unit/lib/booking/validate.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Wire validation + a11y into `booking-form.tsx`.** Add a `fieldErrors` state, validate on submit before the fetch, and link errors to inputs. Concretely:

- Add `import { validateBookingFields, type BookingFieldErrors } from "@/lib/booking/validate";`
- Add state: `const [fieldErrors, setFieldErrors] = useState<BookingFieldErrors>({});`
- At the top of `onSubmit`, after building `payload`, before `fetch`:

```tsx
const fieldErrs = validateBookingFields({
  name: payload.name,
  email: payload.email,
  message: payload.message,
  organization: payload.organization,
});
if (Object.keys(fieldErrs).length > 0) {
  setFieldErrors(fieldErrs);
  setState("idle");
  return;
}
setFieldErrors({});
```

- For each of name/email/message inputs add `aria-invalid={Boolean(fieldErrors.<field>)}` and `aria-errormessage="booking-err-<field>"`, and render below each input:

```tsx
{
  fieldErrors.name && (
    <span id="booking-err-name" className="text-accent text-xs">
      {fieldErrors.name}
    </span>
  );
}
```

(Repeat for email/message with matching ids. Keep the existing `noValidate` on the form so the custom messages drive the UX.)

- [ ] **Step 6: Typecheck.**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 7: Commit.**

```bash
pnpm exec prettier --write src/lib/booking/validate.ts tests/unit/lib/booking/validate.test.ts src/components/booking/booking-form.tsx
git add src/lib/booking/validate.ts tests/unit/lib/booking/validate.test.ts src/components/booking/booking-form.tsx
git commit -m "feat(booking): client-side field validation + aria error linking"
```

---

## Task 11: Booking funnel E2E

**Files:** Create `tests/e2e/booking.spec.ts`

The form is public. Assert the happy path at the **network layer** (route-intercept) so CI doesn't write rows to the shared preview DB.

- [ ] **Step 1: Write the spec.**

```ts
import { test, expect } from "@playwright/test";

test.describe("booking form", () => {
  test("submits successfully (network-intercepted) and shows the success state", async ({
    page,
  }) => {
    await page.route("**/api/booking", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto("/contact");
    await page.getByTestId("booking-form").waitFor();
    await page.fill("#booking-name", "Belin Akguel");
    await page.fill("#booking-email", "belin@example.com");
    await page.fill("#booking-message", "I would like to book a match-day shoot.");
    await page.click('button[type="submit"]');

    await expect(page.getByTestId("booking-success")).toBeVisible();
  });

  test("blocks submission with client-side validation errors", async ({ page }) => {
    let called = false;
    await page.route("**/api/booking", async (route) => {
      called = true;
      await route.fulfill({ status: 201, contentType: "application/json", body: "{}" });
    });

    await page.goto("/contact");
    await page.getByTestId("booking-form").waitFor();
    await page.fill("#booking-name", "B");
    await page.fill("#booking-email", "not-an-email");
    await page.fill("#booking-message", "hi");
    await page.click('button[type="submit"]');

    await expect(page.locator("#booking-err-email")).toBeVisible();
    expect(called).toBe(false); // never hit the network
  });

  test("honeypot submission still shows success without erroring", async ({ page }) => {
    await page.route("**/api/booking", async (route) => {
      // server returns 201 for honeypot; mirror that here
      await route.fulfill({ status: 201, contentType: "application/json", body: "{}" });
    });
    await page.goto("/contact");
    await page.fill("#booking-name", "Bot Name");
    await page.fill("#booking-email", "bot@example.com");
    await page.fill("#booking-message", "spam spam spam spam");
    await page.fill("#booking-company", "Spammer Inc"); // honeypot
    await page.click('button[type="submit"]');
    await expect(page.getByTestId("booking-success")).toBeVisible();
  });
});
```

- [ ] **Step 2: Run it.**

Run: `pnpm test:e2e -- booking`
Expected: 3 tests PASS. (If port detection latches onto a foreign app, set `PLAYWRIGHT_BASE_URL`.)

- [ ] **Step 3: Commit.**

```bash
pnpm exec prettier --write tests/e2e/booking.spec.ts
git add tests/e2e/booking.spec.ts
git commit -m "test(booking): e2e for the contact/booking funnel"
```

---

## Task 12: SEO E2E sweep

**Files:** Create `tests/e2e/seo.spec.ts`

- [ ] **Step 1: Write the spec.**

```ts
import { test, expect } from "@playwright/test";

const PAGES = [
  "/about",
  "/services",
  "/contact",
  "/highlights",
  "/athletes",
  "/journal",
  "/stories",
];

test.describe("SEO surface", () => {
  for (const path of PAGES) {
    test(`${path} has title, description, og:image, canonical`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(/.{10,}/); // non-trivial title
      const desc = page.locator('meta[name="description"]');
      await expect(desc).toHaveAttribute("content", /.{20,}/);
      await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    });
  }

  test("contact exposes JSON-LD", async ({ page }) => {
    await page.goto("/contact");
    const count = await page.locator('script[type="application/ld+json"]').count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("og:image route returns a PNG", async ({ page }) => {
    const res = await page.request.get("/services/opengraph-image");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
  });
});
```

- [ ] **Step 2: Run it.**

Run: `pnpm test:e2e -- seo`
Expected: all PASS. If `og:image` is absent on a page, confirm its `opengraph-image.tsx` exists (Task 5).

- [ ] **Step 3: Commit.**

```bash
pnpm exec prettier --write tests/e2e/seo.spec.ts
git add tests/e2e/seo.spec.ts
git commit -m "test(seo): e2e sweep for metadata, og:image, JSON-LD"
```

---

## Task 13: Full verification + manual rich-results check

- [ ] **Step 1: Run the whole gate.**

```bash
pnpm typecheck && pnpm lint && pnpm exec prettier --check . && pnpm test && pnpm test:e2e
```

Expected: all green.

- [ ] **Step 2: Manual rich-results + social-card spot check (on a preview deploy).**

- Google Rich Results Test on `/`, `/contact`, `/services`, and one `/stories/<slug>` — expect Person, ProfessionalService, Service, Article detected with no errors.
- A social-card debugger (OpenGraph.xyz / LinkedIn Post Inspector) on the same URLs — expect a 1200×630 preview image (story hero on story pages, branded card elsewhere).

- [ ] **Step 3: Open the PR.** Note in the body that **two Payload migrations must be run manually on production** after deploy (`pnpm payload:migrate`), per repo convention.

---

## Self-Review (completed by author)

**Spec coverage:** WS1-A1 → Tasks 1–3; WS2 → Tasks 4–5; WS3 (Full JSON-LD) → Tasks 6–8; WS1-A2 → Task 9; WS4 → Tasks 10–12. Verification + go-live → Task 13. All five spec workstreams map to tasks.

**Placeholder scan:** Concrete copy, code, and commands throughout. The only intentionally deferred items are field-name confirmations (`excerpt`/`publishedAt`) flagged with an explicit "verify against payload-types and drop if absent" instruction, and the repetitive per-page edits expressed as a reference implementation + an exact substitution table (not "similar to Task N").

**Type consistency:** `seoCopy`/`SeoPage`, `buildPageMetadata`/`OgImage`, `OrgIdentity`, `resolveSeo`, `validateBookingFields`/`BookingFieldErrors`, and the `ogCard`/`OG_SIZE` exports are used with consistent names and signatures across tasks.

**Known follow-ups (out of scope, noted for the operational-hardening phase):** migrate-on-deploy automation; a custom OG-card font; `twitter-image` files if Twitter fallback proves insufficient.
