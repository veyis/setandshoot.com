# Growth & Go-Live: SEO, Social, and the Booking Funnel

**Date:** 2026-06-13
**Status:** Approved design — pending spec review
**Author:** session audit → next-phase scoping

## Context

The foundation is shipped and live: Next.js 16 App Router, Payload 3.84 CMS,
Neon Postgres + Neon Auth, Cloudflare R2 media (`cdn.setandshoot.com`), the
custom German-first Studio editor (PRs #2–#5), CMS-editable marketing pages,
Sentry, and CI (typecheck/lint/prettier/unit/e2e).

The site exists to do two things for a Bremen volleyball/sports photographer:
**be discovered** (search + social sharing) and **convert visitors into booking
inquiries**. A production audit found the app architecturally strong but thin on
exactly those two fronts:

- Only `/` and `/stories/[slug]` set per-page metadata; `about`, `services`,
  `contact`, `highlights`, `athletes`, `journal`, and the `stories` index all
  inherit one shared title/description from the locale layout's `SITE_META`.
- **Zero** Open Graph anywhere in `src/` — shared links render with no preview
  image, the single worst miss for a visual portfolio.
- **Zero** JSON-LD structured data.
- The booking form — the conversion path — has no end-to-end test (only its Zod
  schema is unit-tested).

This phase closes those gaps. It is intentionally **growth + go-live polish**,
not operational hardening (CSP, migrate-on-deploy, Sentry-in-actions) and not
the deferred Studio follow-ups (4 MB upload cap, `/account/bookings`).

## Goals

1. Every public page emits a locale-correct `title`, `description`, canonical,
   hreflang, and Open Graph/Twitter card.
2. Social shares render a compelling preview image on every route.
3. Search engines receive Full structured data (Person, LocalBusiness/
   ProfessionalService, Service, Article + ImageObject, BreadcrumbList).
4. Belin can edit the SEO copy and site identity (social links, business info)
   for CMS-backed pages without touching code.
5. The booking funnel is covered by an end-to-end test and its error/validation
   UX is accessible.

## Non-Goals

- CSP header, migrate-on-deploy automation, Sentry capture in server
  actions/API (these belong to the separate "Operational hardening" phase).
- Presigned direct-to-R2 uploads, `/account/bookings`, photo caption editing.
- Redesigning any page's visual layout. Metadata and JSON-LD are additive.
- A blog/journal content system (the `journal` page stays as-is; it gets
  metadata only).

## Architecture

Four workstreams, designed to land independently and in this order. Each builds
on the previous but none blocks shipping the earlier ones.

### Workstream 1 — Metadata foundation (i18n defaults + CMS override)

A single helper centralizes page metadata so every page is one consistent call.

**New: `src/lib/seo/metadata.ts`**

```ts
buildPageMetadata({
  locale: string,
  path: string,            // German-relative, e.g. "/services"
  title: string,           // resolved title (no site-name suffix)
  description: string,
  image?: OgImageInput,     // optional explicit OG image; else route default
}): Metadata
```

It composes `title` (with a shared `" — Belin Akguel"` suffix via Next's
`title.template`, set once in the layout), `description`, `localeAlternates(path,
locale)`, and `openGraph`/`twitter` blocks. `metadataBase` already exists in the
locale layout, so OG `images` can be relative.

**Copy source (A1 — ships first):** add an `seo` namespace to
`src/messages/{de,en}.json`, keyed by page:

```jsonc
"seo": {
  "about":     { "title": "...", "description": "..." },
  "services":  { "title": "...", "description": "..." },
  "contact":   { "title": "...", "description": "..." },
  "highlights":{ "title": "...", "description": "..." },
  "athletes":  { "title": "...", "description": "..." },
  "journal":   { "title": "...", "description": "..." },
  "stories":   { "title": "...", "description": "..." }
}
```

Each page gains `generateMetadata` that reads `seo.<page>` via
`getTranslations` and calls `buildPageMetadata`. The layout's hardcoded
`SITE_META` becomes the site-level default/template only.

**Copy override (A2 — layered after A1):** add an optional localized `seo`
group to the five marketing globals (`about-page`, `services-page`,
`contact-page`, `highlights-page`, `athletes-page`):

```ts
{ name: "seo", type: "group", localized: true, fields: [
  { name: "title", type: "text" },
  { name: "description", type: "textarea" },
]}
```

A page's `generateMetadata` reads the global; if `seo.title`/`seo.description`
are non-empty, they override the i18n default. Empty/absent → i18n default. This
means A1 ships working metadata immediately; A2 makes it editable without a
re-launch. `journal` and `stories` have no global, so they stay i18n-only.

### Workstream 2 — Open Graph images (tiered)

Three tiers, strongest-asset-first:

1. **Stories** → the story's real R2 hero image. `generateMetadata` in
   `stories/[slug]/page.tsx` resolves the cover via the existing
   `resolvePhoto(story.coverPhoto)` and sets `openGraph.images` to that absolute
   CDN url (width/height/alt included). No generation needed.
2. **Marketing + index pages** → a **dynamic branded card** generated by
   `next/og` `ImageResponse`. Implemented as `opengraph-image.tsx` route
   segments (Next's file convention) at the page level, or one shared dynamic
   handler parameterized by a title param. Card = page title + "Belin Akguel ·
   Set & Shoot" wordmark over a brand-color background using the site's
   `accentColor`. 1200×630, `alt` set.
3. **Root fallback** → a static `app/opengraph-image.(png|tsx)` so any route
   without a specific image still shares a branded card.

All pages also set `twitter.card = "summary_large_image"` and reuse the same
image (handled inside `buildPageMetadata`).

**Decision:** prefer file-convention `opengraph-image.tsx` per route over a
single query-param endpoint — it keeps each page's OG self-contained and lets
Next handle caching/sizing. Marketing OG cards share one render helper in
`src/lib/seo/og-card.tsx` to avoid duplication.

### Workstream 3 — JSON-LD structured data (Full)

**New: `src/components/seo/json-ld.tsx`** — a tiny typed server component that
renders `<script type="application/ld+json">` from a passed object (JSON
serialized safely). One component, many call sites.

**New: `src/lib/seo/schema.ts`** — pure builders returning typed schema objects:

- `personSchema(locale)` — Belin Akguel, jobTitle photographer, `sameAs` from
  the settings global's social links.
- `localBusinessSchema(locale)` — `ProfessionalService`, name, `areaServed`
  (Bremen), `sameAs`, contact, from settings.
- `serviceSchema(locale, offers)` — built from the existing `serviceOffers`
  CMS block items.
- `articleSchema(story, locale)` + nested `ImageObject` for the cover.
- `breadcrumbSchema(items)`.

**Placement:**

- Root locale layout: `Person` + `WebSite`.
- `/contact`: `LocalBusiness`/`ProfessionalService`.
- `/services`: `Service` (+ `FAQPage` only if the page later gains Q&A; not
  added speculatively now).
- `/stories/[slug]`: `Article` + `ImageObject` + `BreadcrumbList`.
- Nested pages: `BreadcrumbList`.

**Site identity source:** add an `organization` field group to the `settings`
global so `sameAs` and business details are CMS-editable:

```ts
{ name: "organization", type: "group", fields: [
  { name: "instagram", type: "text" },
  { name: "linkedin", type: "text" },
  { name: "email", type: "email" },
  { name: "phone", type: "text" },
  { name: "city", type: "text", defaultValue: "Bremen" },
]}
```

Schema builders read this global; missing fields are simply omitted from the
JSON-LD (no empty `sameAs` entries).

### Workstream 4 — Booking funnel: E2E test + a11y hardening

The booking form is **public** — `/api/booking` allows anonymous submissions
(optional session, `overrideAccess: true`), with a honeypot + Zod + per-IP rate
limit. So the E2E needs no auth fixture.

**New: `tests/e2e/booking.spec.ts`**

- Happy path: navigate to `/contact` (and `/en/contact`), fill name/email/
  message, submit, assert the success state replaces the form.
- Validation: submit empty → assert required-field handling; bad email →
  assert it's blocked.
- Honeypot: fill the hidden `company` field, submit, assert success UI shows but
  (optionally, via a follow-up DB/API assertion) no booking is created.

To keep CI hermetic and avoid writing rows to the shared preview DB on every
run, the happy-path submission is asserted at the **network layer** (intercept
the `POST /api/booking` request/response and assert 201) rather than requiring a
real DB write. The honeypot and validation cases assert UI state only.

**A11y hardening in `src/components/booking/booking-form.tsx`:**

- Link the existing error live-region to the relevant input(s) via
  `aria-errormessage` + `aria-invalid` on failure.
- Per-field invalid feedback on submit (name min length, email format, message
  min length) using the existing `bookingInquirySchema` client-side before the
  network call, so users get inline guidance.
- These are additive to the current `idle | submitting | success | error` state
  machine; no behavioral regression to the happy path.

## Data Flow

```
Page request
  └─ generateMetadata(page)
       ├─ getTranslations("seo") ............ i18n default copy (A1)
       ├─ getPayload().findGlobal(<page>) ... CMS seo override, if non-empty (A2)
       ├─ resolvePhoto(cover) ............... story OG image (WS2 tier 1)
       └─ buildPageMetadata() ............... title+desc+alternates+OG+twitter
  └─ Page render
       └─ <JsonLd data={schemaBuilder(...)} /> .. structured data (WS3)
            └─ findGlobal("settings").organization .. sameAs / business identity
```

## Testing Strategy

- **Unit:** `buildPageMetadata` (title template, OG image defaulting, locale
  canonical), schema builders (omit-empty behavior, correct `@type`), and the
  client-side booking validation helper. Vitest.
- **E2E:** `booking.spec.ts` as above. Extend `marketing-pages.spec.ts` (or a
  new `seo.spec.ts`) with assertions that key pages expose a non-empty
  `<title>`, `og:image`, and at least one `ld+json` block.
- **Manual/verification:** validate a sample of pages with Google Rich Results
  Test and a social-card debugger (LinkedIn Post Inspector / OpenGraph.xyz)
  against a preview deployment.

## Build Order

1. **WS1-A1** — `buildPageMetadata` helper + `seo` i18n keys + `generateMetadata`
   on all seven pages. Ships complete per-page metadata.
2. **WS2** — story-hero OG, then the `next/og` marketing card + root fallback.
3. **WS3** — `JsonLd` component + schema builders + `settings.organization`
   group + per-page placement.
4. **WS1-A2** — `seo` group on the five marketing globals + override wiring +
   seed update.
5. **WS4** — booking E2E + a11y hardening.

Each step is independently shippable; if time is short, 1–3 deliver the bulk of
the SEO/social value and 4–5 can follow.

## Success Criteria

- Every public route returns a unique, locale-correct `<title>` and
  `meta description` (verified by an e2e sweep).
- Every public route exposes a valid `og:image` (200, image/\*) and
  `twitter:card=summary_large_image`.
- Google Rich Results Test reports valid Person, LocalBusiness, Service, and
  Article items with no errors on the sampled pages.
- `booking.spec.ts` passes in CI (happy path via network intercept, validation,
  honeypot).
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:e2e` all green.
- No change to existing page layouts or the booking happy-path behavior.

## Risks & Mitigations

- **`next/og` font loading / Edge runtime quirks.** Mitigate by pinning a known
  font (the site already loads Fraunces/Inter via `next/font`) and testing the
  OG route renders 200 in CI.
- **CMS override empty-string vs absent.** Treat empty string as "no override"
  (trim-check) so a cleared CMS field falls back to i18n, never blanks the tag.
- **E2E writing to the shared preview DB.** Avoided by asserting the booking
  happy path at the network layer rather than persisting rows.
- **Duplicate/incorrect canonical for `as-needed` locale prefix.** Reuse the
  existing, tested `localeAlternates` helper rather than recomputing.
