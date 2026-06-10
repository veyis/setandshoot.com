# Editable Marketing Pages (About pilot) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the About page's copy, portrait image, and section order editable from `/admin` (DE + EN) via a Payload global, without changing the page's design.

**Architecture:** A Payload global `aboutPage` holds a localized `sections` blocks field built from a reusable 4-block marketing library. `about/page.tsx` renders those blocks via a new `MarketingBlocks` component (mirroring `story-blocks.tsx`); if the global is empty it falls back to the current next-intl markup. A seed populates the global from the existing `de.json`/`en.json` copy so the page is unchanged on day one.

**Tech Stack:** Payload 3.84 (globals, blocks, localization), Next.js 16 App Router, next-intl, lexical richText, Vitest, Playwright.

**Reference spec:** `docs/superpowers/specs/2026-06-10-editable-marketing-pages-design.md`

---

## File Structure

- Create `src/payload/blocks/marketing/page-header.ts` — `PageHeaderBlock`
- Create `src/payload/blocks/marketing/portrait-figure.ts` — `PortraitFigureBlock`
- Create `src/payload/blocks/marketing/editorial-prose.ts` — `EditorialProseBlock`
- Create `src/payload/blocks/marketing/cta-link.ts` — `CtaLinkBlock`
- Create `src/payload/blocks/marketing/index.ts` — `marketingBlocks` array
- Create `src/payload/hooks/revalidate-about.ts` — global afterChange revalidation
- Create `src/payload/globals/about-page.ts` — `AboutPage` global
- Modify `src/payload/payload.config.ts` — register the global
- Create `src/components/site/marketing-blocks.tsx` — block renderer
- Create `src/app/(site)/[locale]/about/about-fallback.tsx` — current markup, used when global empty
- Modify `src/app/(site)/[locale]/about/page.tsx` — read global, render blocks or fallback
- Create `scripts/seed/about-page.ts` — idempotent DE+EN seed
- Modify `package.json` — add `seed:about-page` script
- Create `tests/unit/components/site/marketing-blocks.test.tsx` — renderer tests
- Create `tests/e2e/about.spec.ts` — About page e2e

---

## Task 1: Marketing block library

**Files:**

- Create: `src/payload/blocks/marketing/page-header.ts`, `portrait-figure.ts`, `editorial-prose.ts`, `cta-link.ts`, `index.ts`
- Test: `tests/unit/payload/marketing-blocks.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/payload/marketing-blocks.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { marketingBlocks } from "@/payload/blocks/marketing";

describe("marketingBlocks", () => {
  it("exposes the four pilot block types", () => {
    const slugs = marketingBlocks.map((b) => b.slug).sort();
    expect(slugs).toEqual(["ctaLink", "editorialProse", "pageHeader", "portraitFigure"]);
  });

  it("requires a title on the header and a label on the cta", () => {
    const header = marketingBlocks.find((b) => b.slug === "pageHeader");
    const cta = marketingBlocks.find((b) => b.slug === "ctaLink");
    expect(header?.fields.some((f) => "name" in f && f.name === "title" && f.required)).toBe(true);
    expect(cta?.fields.some((f) => "name" in f && f.name === "label" && f.required)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/payload/marketing-blocks.test.ts`
Expected: FAIL — cannot resolve `@/payload/blocks/marketing`.

- [ ] **Step 3: Create the four block files**

`src/payload/blocks/marketing/page-header.ts`:

```ts
import type { Block } from "payload";

export const PageHeaderBlock: Block = {
  slug: "pageHeader",
  interfaceName: "PageHeaderBlock",
  labels: { singular: "Seitenkopf", plural: "Seitenköpfe" },
  fields: [
    { name: "label", type: "text", localized: true },
    { name: "title", type: "text", required: true, localized: true },
    { name: "intro", type: "textarea", localized: true },
  ],
};
```

`src/payload/blocks/marketing/portrait-figure.ts`:

```ts
import type { Block } from "payload";

export const PortraitFigureBlock: Block = {
  slug: "portraitFigure",
  interfaceName: "PortraitFigureBlock",
  labels: { singular: "Portrait", plural: "Portraits" },
  fields: [
    // Optional: when empty the page renders the built-in fallback portrait.
    { name: "photo", type: "relationship", relationTo: "photos" },
    { name: "caption", type: "text", localized: true },
  ],
};
```

`src/payload/blocks/marketing/editorial-prose.ts`:

```ts
import type { Block } from "payload";

export const EditorialProseBlock: Block = {
  slug: "editorialProse",
  interfaceName: "EditorialProseBlock",
  labels: { singular: "Editorial-Text", plural: "Editorial-Texte" },
  fields: [
    { name: "eyebrow", type: "text", localized: true },
    // textarea so the editor can use line breaks (was the " / " split).
    { name: "title", type: "textarea", localized: true },
    { name: "body1", type: "richText", localized: true },
    { name: "pullQuote", type: "text", localized: true },
    { name: "body2", type: "richText", localized: true },
    // One credit line per row, rendered as separate spans (split on newline).
    { name: "credits", type: "textarea", localized: true },
  ],
};
```

`src/payload/blocks/marketing/cta-link.ts`:

```ts
import type { Block } from "payload";

export const CtaLinkBlock: Block = {
  slug: "ctaLink",
  interfaceName: "CtaLinkBlock",
  labels: { singular: "Button", plural: "Buttons" },
  fields: [
    { name: "label", type: "text", required: true, localized: true },
    {
      name: "target",
      type: "select",
      required: true,
      defaultValue: "/contact",
      options: [
        { label: "Kontakt", value: "/contact" },
        { label: "Über mich", value: "/about" },
        { label: "Athletinnen", value: "/athletes" },
        { label: "Leistungen", value: "/services" },
        { label: "Highlights", value: "/highlights" },
        { label: "Stories", value: "/stories" },
        { label: "Startseite", value: "/" },
      ],
    },
  ],
};
```

- [ ] **Step 4: Create the index**

`src/payload/blocks/marketing/index.ts`:

```ts
import { CtaLinkBlock } from "./cta-link";
import { EditorialProseBlock } from "./editorial-prose";
import { PageHeaderBlock } from "./page-header";
import { PortraitFigureBlock } from "./portrait-figure";

export const marketingBlocks = [
  PageHeaderBlock,
  PortraitFigureBlock,
  EditorialProseBlock,
  CtaLinkBlock,
];
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/payload/marketing-blocks.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/payload/blocks/marketing tests/unit/payload/marketing-blocks.test.ts
git commit -m "feat(cms): add reusable marketing block library"
```

---

## Task 2: aboutPage global + revalidation, register, regenerate types

**Files:**

- Create: `src/payload/hooks/revalidate-about.ts`, `src/payload/globals/about-page.ts`
- Modify: `src/payload/payload.config.ts`
- Regenerate: `payload-types.ts`

- [ ] **Step 1: Create the revalidation hook**

`src/payload/hooks/revalidate-about.ts`:

```ts
import type { GlobalAfterChangeHook } from "payload";
import { revalidatePath } from "next/cache";

/** Bust the About page (both locales) when the global is saved. */
export const revalidateAbout: GlobalAfterChangeHook = ({ doc }) => {
  revalidatePath("/about");
  revalidatePath("/en/about");
  return doc;
};
```

- [ ] **Step 2: Create the global**

`src/payload/globals/about-page.ts`:

```ts
import type { GlobalConfig } from "payload";
import { canManageContent } from "@/payload/access/can-manage-content";
import { marketingBlocks } from "@/payload/blocks/marketing";
import { revalidateAbout } from "@/payload/hooks/revalidate-about";

export const AboutPage: GlobalConfig = {
  slug: "aboutPage",
  label: "Über mich (Seite)",
  admin: { group: "Seiten" },
  access: { read: () => true, update: canManageContent },
  hooks: { afterChange: [revalidateAbout] },
  fields: [{ name: "sections", type: "blocks", blocks: marketingBlocks, label: "Sektionen" }],
};
```

- [ ] **Step 3: Register the global in the config**

In `src/payload/payload.config.ts`, add the import next to the other globals:

```ts
import { AboutPage } from "./globals/about-page";
```

And add it to the `globals` array:

```ts
globals: [Impressum, Datenschutz, Settings, AboutPage],
```

- [ ] **Step 4: Regenerate Payload types**

Run: `pnpm payload:generate-types`
Expected: `payload-types.ts` updated; it now exports `AboutPage`, `PageHeaderBlock`, `PortraitFigureBlock`, `EditorialProseBlock`, `CtaLinkBlock` interfaces.

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck`
Expected: exit 0. (Confirms `canManageContent` is valid for a global `update` access and the global config typechecks.)

- [ ] **Step 6: Commit**

```bash
git add src/payload/hooks/revalidate-about.ts src/payload/globals/about-page.ts src/payload/payload.config.ts payload-types.ts
git commit -m "feat(cms): add editable aboutPage global"
```

---

## Task 3: MarketingBlocks renderer (TDD)

**Files:**

- Create: `src/components/site/marketing-blocks.tsx`
- Test: `tests/unit/components/site/marketing-blocks.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/components/site/marketing-blocks.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarketingBlocks } from "@/components/site/marketing-blocks";

const header = {
  id: "1",
  blockType: "pageHeader" as const,
  label: "Bereich",
  title: "Über mich",
  intro: "Intro.",
};
const cta = {
  id: "2",
  blockType: "ctaLink" as const,
  label: "Anfrage stellen",
  target: "/contact",
};

describe("MarketingBlocks", () => {
  it("renders nothing when sections are empty", () => {
    const { container } = render(<MarketingBlocks sections={[]} locale="de" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders header text and cta in order", () => {
    render(<MarketingBlocks sections={[header, cta]} locale="de" />);
    expect(screen.getByRole("heading", { level: 1, name: "Über mich" })).toBeInTheDocument();
    expect(screen.getByText("Intro.")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Anfrage stellen/ });
    expect(link).toHaveAttribute("href", "/contact");
  });

  it("skips unknown block types", () => {
    const unknown = { id: "9", blockType: "mystery" } as never;
    const { container } = render(<MarketingBlocks sections={[unknown]} locale="de" />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/components/site/marketing-blocks.test.tsx`
Expected: FAIL — cannot resolve `@/components/site/marketing-blocks`.

- [ ] **Step 3: Implement the renderer**

`src/components/site/marketing-blocks.tsx`:

```tsx
import Link from "next/link";
import type { Route } from "next";
import { RichText } from "@payloadcms/richtext-lexical/react";
import type { AboutPage } from "@/payload-types";
import type { Locale } from "@/lib/i18n/config";
import { LandingImage } from "@/components/landing/landing-image";
import { PayloadPhoto } from "@/components/story/payload-photo";
import { resolvePhoto } from "@/lib/payload/media";
import { getAboutFallbackPhoto } from "@/lib/landing/photos";

type Props = {
  sections: AboutPage["sections"];
  locale: Locale;
};

export function MarketingBlocks({ sections, locale }: Props) {
  if (!sections?.length) return null;

  return (
    <>
      {sections.map((block, index) => {
        const key = block.id ?? `${block.blockType}-${index}`;

        switch (block.blockType) {
          case "pageHeader":
            return (
              <header key={key} className="flex flex-col gap-4">
                {block.label ? (
                  <p className="text-ink-muted font-mono text-xs tracking-widest uppercase">
                    {block.label}
                  </p>
                ) : null}
                <h1 className="font-display text-5xl tracking-tight md:text-6xl">{block.title}</h1>
                {block.intro ? (
                  <p className="text-ink-muted max-w-prose text-base leading-relaxed">
                    {block.intro}
                  </p>
                ) : null}
              </header>
            );

          case "portraitFigure": {
            const picked = resolvePhoto(block.photo);
            return (
              <div key={key}>
                <figure className="bg-elevated relative aspect-[4/5] w-full max-w-md overflow-hidden">
                  {picked ? (
                    <PayloadPhoto
                      photo={picked}
                      size="feed"
                      className="size-full object-cover saturate-[0.92]"
                    />
                  ) : (
                    <LandingImage
                      photo={getAboutFallbackPhoto(locale)}
                      sizes="(min-width: 768px) 400px, 90vw"
                      className="size-full object-cover saturate-[0.92]"
                    />
                  )}
                </figure>
                {block.caption ? (
                  <figcaption className="text-ink-faint mt-2 font-mono text-[10px] tracking-[0.15em] uppercase">
                    {block.caption}
                  </figcaption>
                ) : null}
              </div>
            );
          }

          case "editorialProse":
            return (
              <div key={key} className="flex flex-col gap-8">
                {block.eyebrow ? (
                  <p className="text-ink-faint font-mono text-xs tracking-[0.2em] uppercase">
                    {block.eyebrow}
                  </p>
                ) : null}
                {block.title ? (
                  <h2 className="font-display text-[clamp(1.75rem,3vw,2.75rem)] leading-[1.15] tracking-tight whitespace-pre-line italic">
                    {block.title}
                  </h2>
                ) : null}
                {block.body1 ? (
                  <div className="prose prose-sm text-ink max-w-prose">
                    <RichText data={block.body1 as never} />
                  </div>
                ) : null}
                {block.pullQuote ? (
                  <blockquote className="border-hairline text-ink-faint font-display border-l pl-6 text-2xl italic">
                    {block.pullQuote}
                  </blockquote>
                ) : null}
                {block.body2 ? (
                  <div className="prose prose-sm text-ink-muted max-w-prose">
                    <RichText data={block.body2 as never} />
                  </div>
                ) : null}
                {block.credits ? (
                  <div className="text-ink-faint flex flex-col gap-1 font-mono text-[10px] tracking-[0.15em] uppercase">
                    {block.credits
                      .split("\n")
                      .filter(Boolean)
                      .map((line, i) => (
                        <span key={i}>{line}</span>
                      ))}
                  </div>
                ) : null}
              </div>
            );

          case "ctaLink":
            return (
              <Link
                key={key}
                href={(block.target ?? "/contact") as Route}
                className="text-accent hover:text-accent/90 w-fit text-sm font-medium transition-colors"
              >
                {block.label} →
              </Link>
            );

          default:
            return null;
        }
      })}
    </>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/components/site/marketing-blocks.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/site/marketing-blocks.tsx tests/unit/components/site/marketing-blocks.test.tsx
git commit -m "feat(site): add MarketingBlocks renderer"
```

---

## Task 4: Wire About page to the global with fallback

**Files:**

- Create: `src/app/(site)/[locale]/about/about-fallback.tsx`
- Modify: `src/app/(site)/[locale]/about/page.tsx`

- [ ] **Step 1: Extract the current markup into a fallback component**

Create `src/app/(site)/[locale]/about/about-fallback.tsx` with the current page body (copied verbatim from today's `about/page.tsx`, minus the `params`/locale plumbing):

```tsx
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LandingImage } from "@/components/landing/landing-image";
import { PageShell } from "@/components/site/page-shell";
import { getAboutFallbackPhoto } from "@/lib/landing/photos";
import type { Locale } from "@/lib/i18n/config";

/** Rendered until the aboutPage global is seeded — mirrors the pre-CMS layout. */
export async function AboutFallback({ locale }: { locale: Locale }) {
  const t = await getTranslations("pages.about");
  const tCommon = await getTranslations("pages.common");
  const tHome = await getTranslations("home.about");
  const portrait = getAboutFallbackPhoto(locale);

  return (
    <PageShell>
      <header className="flex flex-col gap-4">
        <p className="text-ink-muted font-mono text-xs tracking-widest uppercase">
          {tCommon("label")}
        </p>
        <h1 className="font-display text-5xl tracking-tight md:text-6xl">{t("title")}</h1>
        <p className="text-ink-muted max-w-prose text-base leading-relaxed">{t("intro")}</p>
      </header>

      <figure className="bg-elevated relative aspect-[4/5] w-full max-w-md overflow-hidden">
        <LandingImage
          photo={portrait}
          sizes="(min-width: 768px) 400px, 90vw"
          className="size-full object-cover saturate-[0.92]"
        />
      </figure>
      <figcaption className="text-ink-faint -mt-6 font-mono text-[10px] tracking-[0.15em] uppercase">
        {tHome("cameraCaption")}
      </figcaption>

      <div className="flex flex-col gap-8">
        <p className="text-ink-faint font-mono text-xs tracking-[0.2em] uppercase">
          {tHome("eyebrow")}
        </p>
        <h2 className="font-display text-[clamp(1.75rem,3vw,2.75rem)] leading-[1.15] tracking-tight whitespace-pre-line italic">
          {tHome("title").replace(" / ", "\n")}
        </h2>
        <p className="text-ink max-w-prose text-base leading-relaxed">{tHome("body1")}</p>
        <blockquote className="border-hairline text-ink-faint font-display border-l pl-6 text-2xl italic">
          {tHome("pullQuote")}
        </blockquote>
        <p className="text-ink-muted max-w-prose text-base leading-relaxed">{tHome("body2")}</p>
        <div className="text-ink-faint flex flex-col gap-1 font-mono text-[10px] tracking-[0.15em] uppercase">
          <span>{tHome("publications")}</span>
          <span>{tHome("clients")}</span>
          <span>{tHome("availability")}</span>
        </div>
      </div>

      <Link
        href="/contact"
        className="text-accent hover:text-accent/90 w-fit text-sm font-medium transition-colors"
      >
        {tCommon("cta")} →
      </Link>
    </PageShell>
  );
}
```

- [ ] **Step 2: Replace `about/page.tsx` with the branching version**

`src/app/(site)/[locale]/about/page.tsx`:

```tsx
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { getPayload } from "@/lib/payload/get-payload";
import { PageShell } from "@/components/site/page-shell";
import { MarketingBlocks } from "@/components/site/marketing-blocks";
import { AboutFallback } from "./about-fallback";

export const dynamic = "force-dynamic";

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const payload = await getPayload();
  const data = await payload.findGlobal({ slug: "aboutPage", locale });

  if (data.sections?.length) {
    return (
      <PageShell>
        <MarketingBlocks sections={data.sections} locale={locale as Locale} />
      </PageShell>
    );
  }

  return <AboutFallback locale={locale as Locale} />;
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: exit 0.

- [ ] **Step 4: Manual smoke (global still empty → fallback path)**

Ensure a dev server is running, then:
Run: `curl -sf -o /dev/null -w "%{http_code}\n" http://localhost:3000/about`
Expected: `200`. The page renders via `AboutFallback` (global not seeded yet).

- [ ] **Step 5: Commit**

```bash
git add "src/app/(site)/[locale]/about/about-fallback.tsx" "src/app/(site)/[locale]/about/page.tsx"
git commit -m "feat(site): render About from aboutPage global, fall back to defaults"
```

---

## Task 5: Seed the global from the existing copy (DE + EN)

**Files:**

- Create: `scripts/seed/about-page.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the seed script**

`scripts/seed/about-page.ts` (run via `payload run`, same pattern as `scripts/reset-neon-auth-password.ts`):

```ts
/**
 * Seed the aboutPage global from the next-intl default copy.
 * Idempotent: skips if the global already has sections (never overwrites edits).
 *
 * Usage: pnpm seed:about-page
 */
import fs from "node:fs/promises";
import path from "node:path";
import { getPayload } from "payload";
import config from "@payload-config";

type Messages = {
  pages: { common: { label: string; cta: string }; about: { title: string; intro: string } };
  home: {
    about: {
      eyebrow: string;
      title: string;
      body1: string;
      body2: string;
      pullQuote: string;
      cameraCaption: string;
      publications: string;
      clients: string;
      availability: string;
    };
  };
};

async function loadMessages(locale: "de" | "en"): Promise<Messages> {
  const raw = await fs.readFile(path.join(process.cwd(), "src/messages", `${locale}.json`), "utf8");
  return JSON.parse(raw) as Messages;
}

/** Minimal lexical richText value holding one paragraph. */
function richParagraph(text: string) {
  return {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      direction: "ltr" as const,
      children: [
        {
          type: "paragraph",
          format: "",
          indent: 0,
          version: 1,
          direction: "ltr" as const,
          textFormat: 0,
          children: [
            { type: "text", text, format: 0, style: "", mode: "normal", detail: 0, version: 1 },
          ],
        },
      ],
    },
  };
}

function sectionsFor(m: Messages) {
  return [
    {
      blockType: "pageHeader" as const,
      label: m.pages.common.label,
      title: m.pages.about.title,
      intro: m.pages.about.intro,
    },
    {
      blockType: "portraitFigure" as const,
      caption: m.home.about.cameraCaption,
    },
    {
      blockType: "editorialProse" as const,
      eyebrow: m.home.about.eyebrow,
      title: m.home.about.title.replace(" / ", "\n"),
      body1: richParagraph(m.home.about.body1),
      pullQuote: m.home.about.pullQuote,
      body2: richParagraph(m.home.about.body2),
      credits: [m.home.about.publications, m.home.about.clients, m.home.about.availability].join(
        "\n",
      ),
    },
    {
      blockType: "ctaLink" as const,
      label: m.pages.common.cta,
      target: "/contact",
    },
  ];
}

const payload = await getPayload({ config });

const existing = await payload.findGlobal({ slug: "aboutPage", locale: "de", depth: 0 });
if (existing.sections?.length) {
  console.log("aboutPage already has sections — skipping (no overwrite).");
  await payload.destroy();
  process.exit(0);
}

const de = await loadMessages("de");
const en = await loadMessages("en");

// Pass 1: write the German content (default locale) — this creates the block rows + ids.
await payload.updateGlobal({
  slug: "aboutPage",
  locale: "de",
  data: { sections: sectionsFor(de) },
});

// Pass 2: re-read to get the generated block ids, then write the English localized
// values onto the SAME rows (matching by id preserves order + per-locale fields).
const seeded = await payload.findGlobal({ slug: "aboutPage", locale: "de", depth: 0 });
const enSections = sectionsFor(en).map((section, i) => ({
  ...section,
  id: (seeded.sections ?? [])[i]?.id,
}));
await payload.updateGlobal({ slug: "aboutPage", locale: "en", data: { sections: enSections } });

console.log("Seeded aboutPage (de + en).");
await payload.destroy();
```

- [ ] **Step 2: Add the pnpm script**

In `package.json` `scripts`, add (next to `seed:photos`):

```json
"seed:about-page": "bash scripts/payload-cli.sh run scripts/seed/about-page.ts",
```

- [ ] **Step 3: Run the seed**

Run: `pnpm seed:about-page`
Expected: `Seeded aboutPage (de + en).`

- [ ] **Step 4: Verify the page now renders from the global**

With the dev server running:
Run: `curl -sf http://localhost:3000/about | grep -c "Über mich"` → expect `>= 1`
Run: `curl -sf http://localhost:3000/en/about | grep -c "About"` → expect `>= 1`
Open `/admin` → Seiten → Über mich (Seite): the four sections are present, DE/EN tabs populated, and reordering/removing works.

- [ ] **Step 5: Re-run seed to confirm idempotency**

Run: `pnpm seed:about-page`
Expected: `aboutPage already has sections — skipping (no overwrite).`

- [ ] **Step 6: Commit**

```bash
git add scripts/seed/about-page.ts package.json
git commit -m "feat(cms): seed aboutPage global from next-intl defaults"
```

---

## Task 6: E2E + full verification

**Files:**

- Create: `tests/e2e/about.spec.ts`

- [ ] **Step 1: Write the e2e**

`tests/e2e/about.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("About (DE) renders heading, intro, portrait, and CTA", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1, name: /Über mich/i })).toBeVisible();
  await expect(page.locator("figure img").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Anfrage stellen/i })).toBeVisible();
});

test("About (EN) renders the English heading", async ({ page }) => {
  await page.goto("/en/about");
  await expect(page.getByRole("heading", { level: 1, name: /^About$/i })).toBeVisible();
});
```

- [ ] **Step 2: Run the e2e (server auto-detected)**

Run: `pnpm test:e2e about.spec`
Expected: 2 passed. (Works via the global-seeded content; also passes against the fallback since the copy is identical.)

- [ ] **Step 3: Full pipeline**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: typecheck exit 0; lint exit 0; vitest all pass (including the two new test files).

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/about.spec.ts
git commit -m "test(e2e): cover the editable About page"
```

---

## Self-Review

- **Spec coverage:** per-page global ✔ (Task 2); 4-block library ✔ (Task 1); MarketingBlocks renderer ✔ (Task 3); copy seeded from next-intl, JSON stays default ✔ (Task 5); empty-global fallback ✔ (Task 4); afterChange revalidation ✔ (Task 2); DE/EN localization ✔ (localized fields + two-pass seed); richText bodies / create-if-empty seed / Home deferred ✔ (resolved decisions honored). Editor experience (reorder/hide via blocks UI) is inherent to the `blocks` field.
- **Placeholders:** none — every code step is complete.
- **Type consistency:** block slugs (`pageHeader`/`portraitFigure`/`editorialProse`/`ctaLink`) and `interfaceName`s are identical across the block defs, the generated `AboutPage["sections"]` union, the renderer `switch`, and the seed `blockType` literals. `marketingBlocks`, `MarketingBlocks`, `AboutFallback`, `revalidateAbout`, `AboutPage` names match across tasks.

## Risks / notes for the executor

- **Localized blocks seed:** Pass 2 must reuse each block's `id` from the Pass-1 read, or Payload will treat the EN write as a new array and drop the DE values. The script does this; do not "simplify" it to a single write.
- **`canManageContent` on a global:** if `pnpm typecheck` (Task 2 Step 5) flags its signature for `GlobalConfig.access.update`, fall back to `isAdmin` (as `Impressum` uses) and note it — both are acceptable; canManageContent is preferred so editors (not just admins) can edit.
- **typedRoutes:** `ctaLink.target` is cast `as Route` in the renderer because the value is a dynamic string; the select options are all real routes.
- **`richParagraph` shape:** if Payload's lexical validation rejects the seeded value, generate one reference value by saving a body once in `/admin` and reading it back via `findGlobal`, then match that shape.
