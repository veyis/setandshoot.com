# Set & Shoot Studio — Design

**Date:** 2026-06-12
**Status:** Approved (brainstorming session)
**Decision:** Option B now ("custom Studio UI on top of the Payload backend"), Option C later (full Payload removal) as a separate future project once the Studio covers all editing tasks.

## Problem

The Payload admin at `/admin` is too hard for beginner users. The primary editor needs full content control: upload photos and build stories, edit marketing/legal page texts, read booking inquiries, and manage taxonomies and settings — without help.

A full Payload removal (custom schema + admin) was analyzed and estimated at 3–6 weeks, with the visual block editor being the largest single chunk. The Studio attacks the usability pain directly at a fraction of that cost, with no data migration and no risk to the live site. Its screens are reusable as-is if Payload is removed later; only the data-access layer would be swapped.

## Concept

A beginner-friendly editing interface at `/studio`, built with the site's existing design system and components, talking to Payload's Local API through server actions (same pattern as `src/app/api/booking/route.ts`). Payload `/admin` remains untouched as the power-user fallback.

- **No schema changes, no data migration.** Payload remains the data layer.
- **German-first UI** via the existing next-intl setup (`src/messages/`).
- **Access:** same gate as `/admin` — Neon Auth session + admin role, enforced in `src/proxy.ts`.

## Architecture

### Data layer (the future cut-line for Option C)

`src/lib/studio/actions/` — one server-action module per domain:

- `photos.ts` — upload, list, update metadata, publish toggle
- `stories.ts` — list, create, update (metadata + layout blocks), publish
- `pages.ts` — read/update the 5 marketing globals + impressum + datenschutz + settings
- `bookings.ts` — list/read
- `taxonomies.ts` — CRUD for teams, competitions, tags

Rules:

- Zod-validated inputs; typed from `payload-types.ts`.
- Verify the Neon Auth admin session at every entry point (route handler, server action, page), then call the Payload Local API with `overrideAccess: true` — the same pattern as `src/app/api/booking/route.ts`. (Payload's own access rules expect a Payload `req.user`, which these session-checked server modules don't carry.)
- Existing `afterChange` revalidation hooks fire automatically on writes — no new cache-busting code.
- Typed `{ ok, error }` results; no thrown errors crossing the action boundary.

When Option C happens, only the internals of these modules change (Payload Local API → Drizzle); every Studio screen stays.

### Routes

`src/app/(site)/[locale]/(auth)/studio/…` — inside the locale tree so next-intl messages work for free (URLs: `/studio` for German, `/en/studio` for English). The proxy gate in `src/proxy.ts` is extended to protect `/studio` and `/en/studio` exactly like `/admin` (Neon session + admin role, with the existing ADMIN_EMAILS promotion).

## Screens and phases

### Phase 1 — daily work

1. **Dashboard** (`/studio`) — large task cards: "Neue Story", "Fotos", "Seiten", "Anfragen"; secondary links: Stammdaten, Rechtliches, Einstellungen, plus "Erweiterter Editor" link to `/admin`. No tables, no jargon.
2. **Fotos** (`/studio/fotos`) — photo grid; drag-drop multi-upload, **one file per request** (browser queues the rest) to stay under serverless timeouts; Payload handles Sharp resizing (480/1400/2560 variants) and R2 upload underneath. Inline editing: alt text (DE/EN), tags, highlight/cover/published toggles.
3. **Anfragen** (`/studio/anfragen`) — bookings inbox, newest first, read view.

### Phase 2 — the centerpiece

4. **Story-Editor** (`/studio/stories`, `/studio/stories/[id]`) — one screen:
   - Metadata panel: title DE/EN side-by-side, home/away team, competition, date, venue, result, featured toggle.
   - Cover photo picker (from the photo library).
   - Visual block builder for the 7 story layout block types (fullBleedPhoto, diptych, triptych, insetPortrait, sequence, pullQuote, textParagraph): add, reorder, remove, with thumbnail previews of each layout.
   - Publish toggle with "Live ansehen" link (Payload's existing `publishedAt` hook logic applies).

### Phase 3 — everything else

5. **Seiten** (`/studio/seiten`) — the 5 marketing page globals (about, services, contact, athletes, highlights), each a simple form over its marketing blocks (pageHeader, portraitFigure, editorialProse, ctaLink, serviceOffers).
6. **Stammdaten** (`/studio/stammdaten`) — plain CRUD tables for Teams, Wettbewerbe, Tags.
7. **Rechtliches + Einstellungen** (`/studio/rechtliches`, `/studio/einstellungen`) — Impressum form, Datenschutz editor, the 3 settings fields.

## Rich text

A minimal shared editor component supporting **paragraphs, bold, italic, links only**, reading and writing Payload-compatible Lexical JSON directly (Lexical is already in the dependency tree via `@payloadcms/richtext-lexical`).

**Safety lock:** if a document contains node types the mini-editor doesn't support, the field renders read-only with an "Im erweiterten Editor bearbeiten" link to that document in `/admin`. The mini-editor must never round-trip content it doesn't fully understand.

Used for: story `summary`, photo `caption`, datenschutz `intro`/`body`, and the rich-text fields inside editorialProse / insetPortrait / textParagraph blocks.

## Localization UX

Every localized field shows DE/EN side-by-side (or tabbed on small screens). Saves use the Local API `locale` parameter; German is the default locale with fallback, matching the Payload config.

## Error handling

- Server actions return typed `{ ok, error }`; forms surface inline German messages via the existing `sonner` toasts.
- No optimistic writes — save, confirm, then update the UI.
- Upload failures report per-file; the queue continues with remaining files.

## Testing

- **Vitest:** validation logic in the action modules.
- **Playwright:** one journey per phase —
  - Phase 1: upload photo → appears in grid; booking visible in inbox.
  - Phase 2: build story with blocks → renders on `/stories/[slug]`.
  - Phase 3: edit page text → shows on `/about`.

## Out of scope

- Removing or changing anything in Payload `/admin` (it stays as fallback).
- Schema changes, new collections, or data migration.
- Booking status workflow (bookings have no status field; inbox is read-only for now).
- Option C (full Payload removal) — separate future spec; this design only requires that all data access stays inside `src/lib/studio/actions/`.
- Files over 4 MB per upload (Vercel request-body limit). Follow-up: presigned direct-to-R2 upload to lift the cap.
