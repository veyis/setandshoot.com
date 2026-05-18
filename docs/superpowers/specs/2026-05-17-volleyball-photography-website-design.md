---
title: Volleyball Photography Website for Belin Akguel — Design Spec
date: 2026-05-17
status: approved
authors:
  - Belin Akguel (subject)
  - John V (project lead)
locale: de-DE (primary), en (secondary)
project_codename: setandshoot
---

# Volleyball Photography Website — Belin Akguel (Bremen, DE)

A world-class, cinematic-editorial portfolio and operating platform for Belin
Akguel's volleyball photography practice, with first-class CRUD admin, full
DSGVO posture, and a content model purpose-built for match-driven sport
storytelling.

## 1. Goals and non-goals

### Goals

- **Get Belin hired** by clubs, leagues, agencies, sponsors, and editorial outlets
  in Germany and abroad.
- **Showcase her work** in a way that elevates volleyball photography to an
  editorial, gallery-grade experience.
- **Give Belin full operational control** through a fast, embedded admin where
  she can publish a 30-photo match story in under 12 minutes.
- **Be legally clean by default** under German DSGVO and Jugendschutz law,
  without imposing a cookie banner on visitors.
- **Be world-class in performance and accessibility** (Lighthouse ≥ 95 on the
  Home and Story routes, WCAG AA).

### Non-goals (v1)

- E-commerce / print sales.
- Client galleries with per-event passcodes.
- Multi-user editorial workflow with review chain.
- Native mobile app.
- Comments on individual photos (only on Stories and Journal posts).
- Newsletter signup.
- AI auto-tagging, auto-captioning, or auto-cropping.
- WebGL/3D archive views.
- Live courtside upload pipeline.

## 2. Audience and core decisions

| Question          | Decision                                                                                                                                                                |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary purpose   | Hybrid: hiring + showcase. No e-commerce.                                                                                                                               |
| Visual direction  | Cinematic Editorial — blue-hour palette, oversized editorial type, restrained motion.                                                                                   |
| Languages         | Bilingual DE + EN; DE primary (unprefixed), EN at `/en/...`.                                                                                                            |
| Archive structure | By Match/Event ("Stories"), with a parallel curated Highlights wall.                                                                                                    |
| Identity          | Designed from scratch. Wordmark-only.                                                                                                                                   |
| Admin / CMS       | Payload v3, embedded in the Next.js app.                                                                                                                                |
| Sections in v1    | Home, Stories, Story detail, Highlights, Athletes, About, Services + Booking, Journal, Press, Contact, Impressum, Datenschutz.                                          |
| Engagement        | Native cookieless comments (Stories + Journal only), anonymous likes (Stories, Photos, Journal), social share buttons, server-side Instagram sync, OG image generation. |

## 3. Visual identity

### Color mode

**Dark only.** No light-mode toggle in v1. The palette below is the single
canonical theme; cinematic editorial photography portfolios in 2026 ship dark
and we don't dilute that. A light theme is a v2 consideration if requested.

### Palette

| Token           | Value                    | Use                                              |
| --------------- | ------------------------ | ------------------------------------------------ |
| `bg/canvas`     | `#0B0E13`                | Page background — near-black with blue undertone |
| `bg/elevated`   | `#13171F`                | Cards, story panels, lightbox chrome             |
| `ink/primary`   | `#F4F1EA`                | Body and headings — warm off-white               |
| `ink/muted`     | `#8C8F97`                | Captions, meta, EXIF, dates                      |
| `accent/signal` | `#E63946`                | Single hot accent — CTAs, active states          |
| `accent/court`  | `#D8B66E`                | Brass/sand secondary — sparing                   |
| `line/hairline` | `rgba(244,241,234,0.08)` | Dividers, table rules                            |

One hot accent only. Photos carry the rest of the color story.

### Typography

- **Display / H1 / Hero**: Fraunces (variable), opsz 144, weight 500, slight
  negative tracking.
- **Body / UI**: Inter (variable), weights 400/500/600.
- **Meta / EXIF**: JetBrains Mono, weight 400.
- **Scale (desktop, 1.250 ratio)**: 12 / 14 / 16 / 20 / 25 / 31 / 39 / 49 / 61
  / 76 / 96 / 144.

Oversized Fraunces titles layered behind or beside hero images on Story pages.
Inter for all functional copy.

### Photography style enforcement (in CMS)

- Story hero images render full-bleed, no border-radius, no shadow.
- Story sequences use a fixed block vocabulary: FullBleedPhoto, Diptych,
  Triptych, InsetPortrait, Sequence, PullQuote, TextParagraph.
- AVIF primary, WebP fallback, served via `next/image`.
- Long-edge max 2880px.
- Watermark off by default, per-photo override available.

### Motion

- Cross-fade page transitions (200ms).
- Hero Ken Burns drift (1.02 → 1.00 over 8s) on Home only.
- Native scroll; no smooth-scroll libraries.
- 1.02 zoom on photo card hover; underline animation on links.
- Lightbox: Framer Motion spring (mass 1, stiffness 260, damping 30), arrow-key
  - swipe nav, ESC to close, deep-linkable `?photo=<id>`.
- All motion disabled under `prefers-reduced-motion`.

### Logo / wordmark

Wordmark-only: `belin akguel` in Fraunces Display lowercase. Three sizes: nav
(16px), hero overlay (96px), favicon (32px). Optional `bᴀ` monogram for social
avatars if needed later.

### Accessibility floor

WCAG AA contrast site-wide, visible focus rings, full keyboard nav in lightbox,
required alt text on all photos (CMS publish-gated), `prefers-reduced-motion`
honored, German `lang` attributes correct, hreflang declared.

## 4. Site map and routing

```
/                              Home
/stories                       Match Archive
/stories/[slug]                Story (match) detail
/highlights                    Curated Highlights wall
/athletes                      Athletes index (grouped by team)
/athletes/[slug]               Athlete profile (404 if isMinor && !consentOnFile)
/about                         About / Profile
/services                      Services + Booking form
/journal                       Journal index
/journal/[slug]                Journal post
/press                         Press credits
/contact                       Contact
/impressum                     Impressum (legal)
/datenschutz                   Datenschutzerklärung (legal)
/bildrechte                    Image rights & takedown form
/admin/*                       Payload CMS (auth-gated)
/api/*                         Routes: like toggle, comment submit, OG image gen, sitemap, IG sync webhook
```

Routing pattern: `/[locale]/...` with `de` as default (unprefixed) and `/en/...`
for English. Slugs shared across locales (one slug per story, not one per
locale).

### Navigation

- **Top**: `Stories · Highlights · Athletes · About · Services · Journal ·
Kontakt`, with locale switcher (DE/EN) on the right and wordmark on the left.
  Sticky. Text-only. No dropdowns. On viewports ≤ 1024px the nav collapses to
  the wordmark + a hamburger that opens a full-screen overlay menu.
- **Footer**: Impressum · Datenschutz · Bildrechte · Instagram · Email · ©Year
  - locale switcher.

## 5. Content model

Payload v3 collections. Per-field localization for DE/EN where marked.

### `photos`

| Field                    | Type                  | Notes                                                                                    |
| ------------------------ | --------------------- | ---------------------------------------------------------------------------------------- |
| `id`                     | uuid                  |                                                                                          |
| `file`                   | upload                | Self-hosted Supabase Storage via Payload's S3 adapter (`@payloadcms/storage-s3`)         |
| `sizes`                  | auto                  | Generated: thumb 400, card 800, feed 1600, hero 2880, in AVIF + WebP                     |
| `blurDataURL`            | string                | Pre-generated 10px placeholder                                                           |
| `width`, `height`        | int                   | From sharp on upload                                                                     |
| `exif`                   | json                  | Camera, lens, ISO, shutter, aperture, focal length, capturedAt                           |
| `altDe`, `altEn`         | string                | **Required** for publish                                                                 |
| `captionDe`, `captionEn` | richtext              | Optional                                                                                 |
| `story`                  | rel → stories         | Nullable (highlights-only photos allowed)                                                |
| `tags`                   | rel → tags (many)     | Technique/moment only (spike, block, …)                                                  |
| `athletesInPhoto`        | rel → athletes (many) | People in this frame                                                                     |
| `isHighlight`            | bool                  | Surfaces on `/highlights`                                                                |
| `isCover`                | bool                  | Used as cover for its story                                                              |
| `orderInStory`           | int                   | Drag-to-reorder                                                                          |
| `dominantColor`          | string                | Auto-extracted                                                                           |
| `likeCount`              | int                   | Denormalized counter                                                                     |
| `watermark`              | enum                  | `inherit` (default) \| `on` \| `off` — per-photo override of `settings.defaultWatermark` |
| `published`              | bool                  |                                                                                          |

### `stories`

| Field                      | Type               | Notes                                               |
| -------------------------- | ------------------ | --------------------------------------------------- |
| `slug`                     | string             | Auto from title, editable                           |
| `titleDe`, `titleEn`       | string             |                                                     |
| `competition`              | rel → competitions | Optional                                            |
| `homeTeam`, `awayTeam`     | rel → teams        | Optional                                            |
| `venue`                    | string             |                                                     |
| `playedAt`                 | datetime           |                                                     |
| `result`                   | string             | Free-form (e.g. "3–1 (25–22, 21–25, 25–19, 25–17)") |
| `summaryDe`, `summaryEn`   | richtext           | 2–4 sentence editorial intro                        |
| `layout`                   | blocks             | Sequence of layout blocks (see below)               |
| `coverPhoto`               | rel → photos       |                                                     |
| `featured`                 | bool               | Surfaces on Home                                    |
| `featuredOrder`            | int                |                                                     |
| `likeCount`                | int                |                                                     |
| `published`, `publishedAt` | bool / datetime    |                                                     |

**`layout` block types:**

- `FullBleedPhoto` — single photo, full viewport width
- `Diptych` — two photos side-by-side, 50/50 or 60/40
- `Triptych` — three photos in a strip
- `InsetPortrait` — single portrait photo with text beside it
- `Sequence` — 3–6 small frames showing peak-action timing
- `PullQuote` — oversized Fraunces quote, optional attribution
- `TextParagraph` — narrative prose

### `athletes`

| Field             | Type         | Notes                                                           |
| ----------------- | ------------ | --------------------------------------------------------------- |
| `slug`            | string       |                                                                 |
| `firstName`       | string       | **Required**, always shown publicly                             |
| `lastName`        | string       | Required in admin; public only if `!isMinor` or `consentOnFile` |
| `isMinor`         | bool         | Default false                                                   |
| `consentOnFile`   | bool         | Default false; required to publish a minor's full record        |
| `team`            | rel → teams  | Nullable                                                        |
| `position`        | enum         | outside / opposite / middle / setter / libero / staff           |
| `jerseyNumber`    | int          | Nullable                                                        |
| `nationality`     | string       | ISO-3166 alpha-2, nullable                                      |
| `bioDe`, `bioEn`  | richtext     | Nullable                                                        |
| `portraitPhoto`   | rel → photos | Editorial portrait                                              |
| `headshotPhoto`   | rel → photos | Square crop                                                     |
| `socialLinks`     | json         | `{ instagram, x, web }`                                         |
| `releaseDocument` | upload       | **Private, admin-only**, auth-gated                             |
| `released`        | bool         | Model release on file                                           |
| `published`       | bool         |                                                                 |

**Jugendschutz enforcement:**

- Admin shows a red banner on any athlete with `isMinor && !consentOnFile`.
- Server-side publish gate blocks save unless `releaseDocument` is present and
  `consentOnFile` is true.
- For minors without consent, photos still appear in Story pages but the
  athlete's name renders as initials (`L.M.`) and `/athletes/[slug]` returns 404.
- `releaseDocument` uploads bypass public CDN; served only to authed admin
  sessions.

### `comments`

| Field           | Type           | Notes                                                               |
| --------------- | -------------- | ------------------------------------------------------------------- |
| `targetType`    | enum           | `story` \| `journal` (no photo comments)                            |
| `targetId`      | dynamic rel    |                                                                     |
| `authorName`    | string         | Required, shown as first name + last initial                        |
| `authorEmail`   | string         | Required, never shown publicly                                      |
| `bodyText`      | text           | Plain text, line breaks preserved                                   |
| `status`        | enum           | `pending` \| `approved` \| `rejected` \| `spam` (default `pending`) |
| `language`      | enum           | `de` \| `en`                                                        |
| `ipHash`        | string         | Salted, daily-rotating; abuse dedup only                            |
| `createdAt`     | datetime       |                                                                     |
| `approvedAt`    | datetime       | Nullable                                                            |
| `parentComment` | rel → comments | Nullable, max one level deep                                        |

**Submission flow:** Cloudflare Turnstile (cookieless) → POST to API route →
status `pending` → admin moderation queue → approve / reject / spam.

**Retention:** unapproved/rejected purged after 12 months; approved retained
until deletion request. Right to deletion supported via admin or `bildrechte`
takedown route.

### Likes (denormalized, anonymous)

Not a full collection:

- `likeCount` int on `stories`, `photos`, `journal` (default 0).
- Internal `likes_ledger` table (`targetType`, `targetId`, `fingerprintHash`,
  `createdAt`) for 7-day rolling abuse dedup. Hash uses weekly-rotating salt;
  no persistent identifier.
- Client tracks own likes in `localStorage`. POST `/api/like` toggles.

### `teams`

`name`, `shortName`, `crestImage`, `city`, `tier` (Bundesliga / 2. Bundesliga /
Regional / Youth), `notes`.

### `competitions`

`name`, `season`, `tier`.

### `tags`

Free-form taxonomy seeded with technique/moment tags: `spike`, `block`,
`serve`, `dig`, `set`, `celebration`, `bench`, `portrait`, `warmup`, `coach`.
Many-to-many with `photos`. **Not** used for athletes — athletes live in
their own collection.

### `journal`

`slug`, `titleDe`/`titleEn`, `excerptDe`/`excerptEn`, `bodyDe`/`bodyEn`
(richtext with photo embeds), `coverPhoto`, `tags`, `relatedStory` (optional),
`publishedAt`, `likeCount`, `published`.

### `pressCredits`

`outlet`, `logo`, `articleTitle`, `articleUrl`, `publishedAt`, `relatedStory`
(optional), `order`.

### Singletons (`globals`)

- `home`, `about`, `services`, `contact`, `impressum`, `datenschutz`,
  `bildrechte` — flexible block-based singletons. Legal singletons use a
  stripped block set (text/headings only).
- `settings` — site-wide defaults (watermark, accent color, IG sync, retention
  windows, salt rotation period, SEO fallbacks).
- `socialFeed` — read-only Instagram sync state (latest 6 posts + last sync
  timestamp).

## 6. Admin (Payload v3) UX

### Access and auth

- URL `/admin`, same Next.js app, same domain.
- Payload built-in email/password with TOTP 2FA (mandatory for `admin` role).
- Two roles: `admin` (Belin, full), `editor` (future assistant, no delete or
  publish-minor permissions).
- Session 30 days, idle timeout 12 hours.

### Sidebar nav (ordered for daily flow)

1. Stories (with Featured sub-filter)
2. Photos (with Highlights and Unassigned sub-filters)
3. Athletes (with "Needs consent" red-badge filter)
4. Moderation — Comments queue with red-badge count
5. Teams · Competitions · Tags
6. Journal · Press
7. Pages (singletons)
8. Social Feed (read-only)
9. Settings

### Custom dashboard home

On login Belin sees: pending-comment count, draft count, athletes-needing-
consent count, last six edited Stories with covers, and three quick actions:
**+ New Story · + Upload Photos · Sync Instagram now**.

### Story editor

Two-column layout. Left (60%): block-based layout builder with drag-to-reorder,
photo-picker drawers, live preview. Right (40%): match metadata (titles DE/EN,
team pickers, competition, venue, played-at, result, summary DE/EN, cover
photo, feature toggle, draft/publish/schedule).

### Bulk photo upload

Drop up to 500 files per upload session. Concurrent uploads (8 at a time),
resumable on network drop, server-side EXIF + variant + blur + dominant-color
pipeline. Bulk apply of default alt text and tags. Lands in a grid review
screen with multi-select (shift-click), drag-reorder, inline alt editing,
bulk highlight/athlete/tag toggles.

### Moderation queue

Inbox-style list with Approve / Reject / Spam buttons. Keyboard shortcuts
`j/k` move, `a` approve, `r` reject, `s` spam (also blocks IP hash).

### Athletes — consent enforcement

Red banner + disabled publish button until both `releaseDocument` is uploaded
and `consentOnFile` is true. Enforcement is server-side, not just UI.

### What we deliberately don't build

- No floating uploads page; photos always tie to a Story or to Highlights.
- No custom rich-text editor (Payload Lexical, configured down).
- No multi-tenant / multi-site UI.
- No standalone trash page; soft delete via `deletedAt` with a 30-day recovery
  window exposed as a filter.

## 7. Tech stack

| Layer            | Choice                                                                   |
| ---------------- | ------------------------------------------------------------------------ |
| Framework        | Next.js 16 (App Router)                                                  |
| Runtime          | Vercel Fluid Compute (Node 24)                                           |
| Styling          | Tailwind v4 + shadcn/ui                                                  |
| CMS / admin      | Payload v3 (embedded)                                                    |
| Database         | Self-hosted Supabase Postgres at `api.setandshoot.com` (Hetzner Germany) |
| Photo storage    | Self-hosted Supabase Storage (S3-compatible) on same instance            |
| Image delivery   | `next/image` over Supabase Storage URLs (AVIF / WebP)                    |
| Auth (admin)     | Payload built-in + TOTP 2FA                                              |
| Motion           | Framer Motion (Motion v12)                                               |
| Forms            | React Hook Form + Zod                                                    |
| Email            | Resend (EU region preferred)                                             |
| Spam             | Cloudflare Turnstile (cookieless)                                        |
| Analytics        | Vercel Analytics + Speed Insights (cookieless)                           |
| Search (admin)   | Postgres FTS + pg_trgm                                                   |
| i18n             | `next-intl` (routes/UI) + Payload localization (content)                 |
| Cron             | Vercel Cron                                                              |
| Image processing | sharp (server-side, on upload)                                           |
| Testing          | Vitest + Playwright                                                      |
| Quality          | TypeScript strict, ESLint flat, Prettier, lefthook                       |
| Error tracking   | Sentry (no PII; 100% sample at launch)                                   |

### Hosting topology

```
Vercel (one project, fra1 primary)
├── Next.js public pages
├── Payload /admin
└── /api/* (likes, comments, OG image, sitemap, IG webhook)

→ Supabase Postgres at api.setandshoot.com (Hetzner Germany, self-hosted)
→ Supabase Storage at api.setandshoot.com (Hetzner Germany, self-hosted, S3-compatible)
→ Resend (EU preferred, US-EU SCC otherwise)
→ Cloudflare Turnstile (no cookies)
→ Instagram Basic Display API (daily cron)
```

### Environments

- **Production**: `belinakguel.com` (or equivalent). Branch `main`.
- **Preview**: Per-PR Vercel preview URL. Database strategy: a dedicated `setandshoot_preview` schema on the same Supabase instance (or a separate Supabase project) — to be decided in Plan 2.
- **Local**: `.env.local` via `vercel env pull`; optional Docker Postgres for
  offline work. Payload runs in the same `pnpm dev` process.

### Repo layout

```
apps/
  web/
    app/
      (public)/       # locale-prefixed public routes
      (admin)/        # Payload mount
      api/
    payload/
      collections/
      globals/
      blocks/
      access/
    components/
      story/
      ui/
      lightbox/
    lib/
      i18n/
      exif/
      blob/
packages/             # empty unless something is genuinely shared
```

### Cost envelope (rough monthly at launch)

| Item                                      | Cost                          |
| ----------------------------------------- | ----------------------------- |
| Vercel (Hobby → Pro post-launch)          | $0 → $20                      |
| Self-hosted Supabase (Postgres + Storage) | already paid (own Hetzner VM) |
| Resend                                    | Free tier                     |
| Domain                                    | ~€1/mo                        |
| Cloudflare Turnstile                      | Free                          |
| **Total**                                 | **≈ $25 / month**             |

Scales linearly with storage; ~$50/mo at 200 GB.

## 8. Performance, SEO, and legal posture

### Performance budgets (hard)

| Metric                               | Target          |
| ------------------------------------ | --------------- |
| LCP                                  | < 1.8s on 4G    |
| INP                                  | < 200ms         |
| CLS                                  | < 0.05          |
| Initial JS                           | < 90 KB gzipped |
| Lighthouse Performance (Home, Story) | ≥ 95            |
| Lighthouse Accessibility (site-wide) | ≥ 95            |

### How we hit them

- Server Components everywhere except lightbox, story builder, like button,
  forms.
- `next/image` with explicit `width/height`/`sizes`/`placeholder="blur"` using
  pre-stored `blurDataURL`.
- `loading="eager"` + `fetchPriority="high"` on the first hero image of each
  route; everything else lazy.
- AVIF primary, WebP fallback. `qualities: [60, 75, 90]` allowlist (Next 16).
- Streaming + Suspense on Story pages (hero first, sequence later).
- Cache Components (Next 16): PPR on Home; `'use cache'` + `cacheLife(1h)` +
  `cacheTag('highlights')` on Highlights, invalidated via `updateTag` from
  Payload `afterChange` hooks.
- ISR for Story pages, revalidated on publish via `revalidateTag('story-' +
slug)`.
- Edge-cached OG images.
- Native scroll only.
- `next/font/google` self-hosts Fraunces, Inter, JetBrains Mono with
  `latin` + `latin-ext` subsets; `font-display: swap`; preload only Inter 500
  and Fraunces 500.

### SEO

- `/sitemap.xml` auto-generated (Stories, Athletes, Journal, Press, both
  locales), nightly + on publish.
- `robots.txt`: disallow `/admin`.
- JSON-LD: `Person` (Belin) on About, `SportsEvent` on Stories, `Person` on
  Athletes, `Article` on Journal posts, `ImageObject` on every photo,
  `BreadcrumbList` site-wide.
- `<link rel="alternate" hreflang="...">` between DE/EN; `x-default` to
  German.
- Canonical URLs declared with locale prefix.
- Payload SEO field on every content type for editable meta title/description.
  German title template: `[Story title] — Belin Akguel · Volleyball-Fotografie
Bremen`.

### Local SEO (Bremen)

- Google Business Profile linked.
- `LocalBusiness` JSON-LD with `addressLocality: "Bremen"`, `addressCountry:
"DE"`.
- Target phrases (used naturally in copy): "Volleyball Fotograf Bremen",
  "Sportfotografie Bremen", "Mannschaftsfotos Volleyball", "Volleyball Action
  Fotos".

### DSGVO posture

**No cookie banner shipped.** Achievable because:

- Vercel Analytics is cookieless.
- Vercel Speed Insights is cookieless.
- Cloudflare Turnstile is cookieless.
- Instagram fetched server-side at build/cron time, never as a client widget.
- Likes use a salted, rotating-salt ledger documented as non-tracking.
- No Google Analytics, Meta Pixel, Hotjar, Disqus, Giscus, etc.

If any of those gets added later, a consent banner becomes mandatory.

**Impressum** singleton with: legal name, Bremen postal address, email + phone,
USt-IdNr. if applicable, "Verantwortlich i.S.d. § 18 Abs. 2 MStV" for the
Journal section.

**Datenschutzerklärung** covering: data collected (form submissions, comments,
likes ledger, server logs), legal basis per process, retention (comments
unapproved 12mo / approved indefinitely; likes ledger 7 days; server logs 7
days), data subject rights, sub-processors (Vercel, Resend, Cloudflare —
note: database + photo storage live on Belin's own Hetzner Germany Supabase, so no DB sub-processor —
each with DPA link), server/CDN location.

**Bildrechte (image rights)** page explaining the policy and providing a
takedown form that creates an admin moderation task.

**Code guardrail:** new third-party scripts that drop cookies or fingerprints
must be added via a wrapper that throws in development unless whitelisted.
Prevents DSGVO regression.

### Hosting and data residency

- Vercel Frankfurt (`fra1`).
- Self-hosted Supabase on Hetzner Germany (DB + Storage on the same VM, owner-controlled).
- Resend EU region where possible (otherwise US-EU SCC documented).

### Monitoring

- Vercel Analytics + Speed Insights (production).
- Sentry — errors only, no PII, 100% sample at launch.
- Slack/email webhook on Payload critical errors.

## 9. Engagement features

### Native comments (Stories + Journal)

Form fields: name, email, comment, consent checkbox. Turnstile verification.
Lands as `pending`. Moderation queue in admin. Approved comments display as
`First L.` + timestamp + text. Single-level replies allowed.

### Likes

Anonymous, no auth. `localStorage`-tracked. POST `/api/like` toggles a counter
on the target row; abuse ledger dedups by salted fingerprint hash with weekly
rotation, retained 7 days only. Heart icon on photos (in lightbox), Stories,
Journal posts.

### Social

- **Share buttons** on Story, Journal post, and lightbox: X, Facebook,
  WhatsApp, LinkedIn, Email, Copy Link. Plain `<a>` tags constructing share
  URLs; zero third-party JS.
- **Instagram presence**: daily Vercel Cron fetches Belin's latest 6 posts via
  Instagram Basic Display API and stores into the `socialFeed` global.
  Rendered as a static grid on Home and About. Silent hide if sync fails.
- **OpenGraph + Twitter Card** metadata generated per Story / Journal /
  Athlete / Highlights page via `opengraph-image.tsx` files, edge-cached. 1200
  × 630 crop with cinematic letterbox and wordmark.

## 10. Risks and mitigations

| Risk                                    | Likelihood | Impact           | Mitigation                                                                                             |
| --------------------------------------- | ---------- | ---------------- | ------------------------------------------------------------------------------------------------------ |
| Belin doesn't have time for EN copy     | High       | Medium           | Per-field i18n; EN falls back to DE with `lang="de"` and a small "Auf Deutsch" badge.                  |
| Archive exceeds Blob comfort (~50 GB)   | Medium     | Low              | Storage adapter swappable to Cloudflare R2; migration script ready.                                    |
| Minor athlete published without release | Medium     | **High (legal)** | Triple-guarded: server-side publish gate, admin red banner, full-name redaction default.               |
| Comment spam wave                       | High       | Low              | Turnstile + IP-hash blocklist + moderation queue + retention sweep. Settings kill-switch.              |
| Lighthouse drift over time              | Medium     | Medium           | CI runs Lighthouse on every PR; build fails if Performance < 90 or A11y < 95 on Story + Home.          |
| Belin locked out of admin               | Low        | High             | Magic-link reset, recovery codes at signup, secondary admin account.                                   |
| Domain expires / DNS misconfig          | Low        | High             | Auto-renew, DNS in Vercel, monitored.                                                                  |
| Instagram API token expires             | High       | Low              | Cron logs failure; dashboard shows "IG sync failed N days ago" with re-auth button; site never breaks. |
| Image rights complaint                  | Low–Medium | Medium           | Bildrechte page + takedown form, 48h SLA, one-click unpublish.                                         |

## 11. Success criteria

- Lighthouse ≥ 95 Performance and ≥ 95 Accessibility on Story + Home routes,
  on real Bremen 4G.
- Belin can upload, tag, and publish a 30-photo Story end-to-end in **under 12
  minutes** without help.
- Cookie banner is not necessary (confirmed by legal review).
- ≥ 3 real client inquiries via the booking form in the first 60 days
  post-launch.
- Zero published photos of minors without consent on file.
- ≥ 1 athlete shares their profile link unprompted within 90 days.

## 12. Build phasing (shape, not plan)

The implementation plan will detail the steps. The shape:

1. **Foundation** — repo, Vercel project, self-hosted Supabase DB + Storage, Payload v3 mounted, auth,
   design tokens, base layouts in DE+EN.
2. **Content backbone** — collections (photos, stories, teams, competitions,
   tags, athletes, journal, press, comments), upload pipeline, EXIF/blur/
   dominant-color processing, locale routing, Impressum + Datenschutz
   singletons.
3. **Public site** — Home, Stories index, Story detail with block renderer,
   Highlights, Athletes index + detail (minor-redaction logic), Journal,
   Press, About, Services + booking form, Contact, lightbox, share buttons,
   OG image generation.
4. **Engagement + polish** — Comments + moderation, Likes, Instagram sync
   cron, settings UI, performance pass to budgets, SEO JSON-LD, sitemap,
   Sentry, CI guardrails, content seeding.

## 13. v1.1 roadmap (out of scope for this spec)

- Mobile upload from courtside.
- Smart photo search via pgvector + CLIP embeddings.
- WebGL exhibit page for tentpole projects.
- Print sales (Stripe + Resend).
- Athlete portals (passcode-gated press kits).
- AI-assisted tagging.
- Newsletter.

## 14. Open questions

These can be answered before or during implementation, none block the plan:

1. **Final domain** — confirm `belinakguel.com` availability or alternative.
2. **Impressum content** — Belin's exact legal name, address, USt-IdNr.
   status.
3. **Logo wordmark spelling** — `belin akguel` vs `Belin Akgül` (umlaut). Both
   supported in Fraunces; pick one for canonical wordmark.
4. **Initial content seed** — which 3–5 matches and ~5 athletes to seed at
   launch so the site doesn't ship empty.
5. **Resend sending domain** — `bookings@belinakguel.com` or similar; DKIM/
   SPF setup.
6. **Backup admin owner** — Belin's secondary account holder for lockout
   recovery.

---

_End of spec._
