# Neon Auth Integration — Design

**Date:** 2026-05-18
**Status:** Approved (brainstorming phase)
**Scope:** Replace Supabase entirely with Neon Auth (identity) + Payload on Neon Postgres (booking data).

## Goal

Use Neon Auth as the sole identity provider for setandshoot.com. Remove Supabase (auth, booking DB, S3 storage references, scripts) and consolidate all application data on the existing Neon Postgres instance via Payload CMS.

## Stack target

- Next.js 16 App Router (existing)
- Neon Postgres (existing — Payload uses `payload` schema)
- Payload CMS 3.84.1 (existing — owns all collections including the new `bookings`)
- Neon Auth via `@neondatabase/auth` — `createNeonAuth({ baseUrl, cookies.secret })`
- Neon Auth UI components (`<AuthView />`, `<AccountView />`) for sign-in / sign-up / account management
- next-intl, Sentry, Tailwind — all unchanged

## Non-goals

- SSO between Neon Auth and Payload admin (out of scope; gate-only approach chosen).
- German translation of Neon Auth UI copy in v1.
- Phased Supabase coexistence — this is a clean cut.
- Migrating any existing user accounts (none exist).

## Surfaces

| Surface           | Path                                     | Auth required          | Notes                                                                                                                                                           |
| ----------------- | ---------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public site       | `/`, `/[locale]/...`                     | No                     | Unchanged.                                                                                                                                                      |
| Sign-in / sign-up | `/[locale]/sign-in`, `/[locale]/sign-up` | No                     | `<AuthView />` from Neon.                                                                                                                                       |
| Customer account  | `/[locale]/account`                      | Yes                    | `<AccountView />`.                                                                                                                                              |
| Customer bookings | `/[locale]/account/bookings`             | Yes                    | Lists bookings where `customerId === user.id`.                                                                                                                  |
| Booking flow      | `/[locale]/booking` (and existing forms) | No (anonymous allowed) | Attaches `customerId` if signed in, else `null`.                                                                                                                |
| Payload admin     | `/admin`                                 | Yes + role check       | Proxy redirects unauth users to `/sign-in?next=/admin`. Non-admin Neon users redirected to `/`. Payload's own login still authenticates editors after the gate. |

## Architecture

### Identity model

- Neon Auth manages its own user table in its own schema on the same Neon project.
- App references users by Neon Auth `user.id` (uuid).
- Payload's own Users collection is untouched — it continues to authenticate `/admin` editors. There is no cross-system FK; admin role on the Neon side is a metadata flag (`user.role === "admin"`), checked in the proxy.

### File layout

**New — auth core:**

```
src/lib/auth/
  server.ts          # createNeonAuth(...) → exports `auth`
  client.ts          # 'use client' — createAuthClient()
  guards.ts          # requireUser(), requireAdmin() for server components
src/app/api/auth/[...path]/route.ts   # export { GET, POST } = auth.handler()
```

**New — UI routes (locale-scoped under `(site)/[locale]`):**

```
src/app/(site)/[locale]/sign-in/page.tsx
src/app/(site)/[locale]/sign-up/page.tsx
src/app/(site)/[locale]/account/page.tsx
src/app/(site)/[locale]/account/bookings/page.tsx
```

**Modified:**

- `src/proxy.ts` — replace `updateSession()` with `auth.middleware()` + `/admin` role gate; matcher must now _include_ `/admin`.
- `src/app/api/booking/route.ts` — write via Payload local API instead of Supabase admin client; attach `customerId` from session when present.
- `src/app/(site)/[locale]/layout.tsx` — wrap children in Neon Auth client provider (if the SDK ships one; otherwise no-op).
- `src/payload/payload.config.ts` — register `Bookings` collection.
- `.env.example` — add `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`; remove `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_S3_*`.

**Deleted:**

- `src/lib/supabase/` (all 7 files)
- `src/app/auth/callback/route.ts`
- `supabase/` (migrations + config)
- `scripts/supabase-*.sh`
- `scripts/sync-vercel-supabase-env.sh`
- Supabase deps in `package.json` (`@supabase/ssr`, `@supabase/supabase-js`, `supabase` devDep)

### Booking collection (Payload)

Replaces `public.booking_inquiries` from `supabase/migrations/20260518050000_foundation.sql`.

```ts
// src/payload/collections/bookings.ts
{
  slug: "bookings",
  admin: { useAsTitle: "email" },
  access: { /* admin-only; no public reads */ },
  fields: [
    { name: "name", type: "text", required: true, minLength: 2 },
    { name: "email", type: "email", required: true },
    { name: "organization", type: "text" },
    { name: "message", type: "textarea", required: true, minLength: 10 },
    { name: "locale", type: "select", options: ["de", "en"], required: true, defaultValue: "de" },
    { name: "customerId", type: "text", index: true }, // Neon Auth user.id; nullable
  ],
}
```

`site_meta` from the old foundation migration is dropped — nothing in the app reads it.

## Data flow

### Sign-up / sign-in

```
Browser → <AuthView /> form submit
       → POST /api/auth/[...path] (auth.handler() proxies to Neon Auth)
       → Sets HMAC-signed session cookie (NEON_AUTH_COOKIE_SECRET)
       → Redirect to ?next= or /account
```

### Server-component guard

```ts
// src/lib/auth/guards.ts
export async function requireUser(next = "/") {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  return session.user;
}

export async function requireAdmin(next = "/") {
  const user = await requireUser(next);
  if (user.role !== "admin") redirect("/");
  return user;
}
```

### Proxy chain

```
request → auth.middleware() refreshes session cookie
       → if pathname starts with /admin and (no user OR user.role !== "admin"):
            redirect /sign-in?next=/admin  OR  redirect /
       → else: handleI18nRouting(request)
       → propagate auth cookies onto intl response
```

Matcher change: currently excludes `/admin`. New matcher must include `/admin` so the gate runs there. Static assets and `/api` remain excluded.

### Booking submission

```
POST /api/booking
  → bookingInquirySchema.safeParse(body)  // keep existing zod schema
  → const { data: session } = await auth.getSession()  // non-blocking
  → payload.create({
       collection: "bookings",
       data: { ...parsed, customerId: session?.user.id ?? null },
     })
  → 201 { ok: true, id }
```

### Customer bookings page

```ts
const user = await requireUser("/account/bookings");
const payload = await getPayload({ config });
const { docs } = await payload.find({
  collection: "bookings",
  where: { customerId: { equals: user.id } },
  sort: "-createdAt",
});
```

### Sign-out

`<AccountView />` exposes a sign-out button. Server actions can call `auth.signOut()` directly if a custom button is needed elsewhere.

## Error handling

- **Boot config:** `createNeonAuth` throws if env vars missing. Fail fast (no silent no-op like the current Supabase middleware).
- **Anonymous booking:** `auth.getSession()` returns `{ data: null }` — not an error; `customerId: null` is passed through.
- **Stale / expired session:** Neon middleware refreshes; on hard failure, the next `requireUser()` redirects to `/sign-in?next=…`.
- **Payload `/admin` race:** Neon-authenticated admin still needs to log in to Payload separately. Documented limitation of the gate-only approach.
- **Duplicate email on sign-up:** Surfaced by `<AuthView />`; no custom messaging in v1.
- **i18n on auth pages:** Neon UI copy is English in v1; revisit when `auth.locale` prop wiring is needed.
- **Mid-flight session expiry during booking POST:** Single `getSession()` call at handler entry; if it expires before the write, row is saved with `customerId: null`. Acceptable.
- **Sentry:** existing config captures server + client errors. No new instrumentation.

## Testing

**Unit (vitest):**

- `src/lib/auth/guards.test.ts` — mock `auth.getSession()`; assert redirects.
- `src/lib/booking/schema.test.ts` — keep zod coverage.

**Integration (vitest + Payload local API against test DB):**

- Booking POST attaches `customerId` when session present.
- Booking POST writes `customerId: null` when anonymous.
- `payload.find({ where: { customerId: ... }})` filters correctly.

**E2E (Playwright):**

- Sign-up → `/account` → sign out → `/sign-in`.
- Anonymous booking submission succeeds.
- Authenticated booking listed at `/account/bookings`.
- Unauth `/admin` → redirected to `/sign-in?next=/admin`.

Neon Auth itself is not under test (third-party). Mock at the boundary in unit tests.

## Migration plan

Clean cut, one branch, each step a separate commit. Build must stay green after each commit.

1. Add `Bookings` Payload collection + migration (`pnpm payload:migrate`).
2. Add Neon Auth core: `src/lib/auth/{server,client,guards}.ts` and `src/app/api/auth/[...path]/route.ts`.
3. Rewrite booking API route to use Payload local API. (Supabase imports gone from this file.)
4. Rewrite `src/proxy.ts`: drop `updateSession`, add `auth.middleware()` + `/admin` gate; update matcher.
5. Add auth UI routes under `(site)/[locale]`.
6. Delete `src/app/auth/callback/route.ts`.
7. Delete `src/lib/supabase/`, `supabase/`, `scripts/supabase-*.sh`, `scripts/sync-vercel-supabase-env.sh`. Drop Supabase deps. Clean `.env.example`.
8. Update tests (unit, integration, E2E).
9. Manual: remove Supabase env vars from Vercel; add Neon Auth env vars.

## Environment variables

**Added:**

```
NEON_AUTH_BASE_URL=https://ep-yellow-sea-a2m6oq9a.neonauth.eu-central-1.aws.neon.tech/neondb/auth
NEON_AUTH_COOKIE_SECRET=<openssl rand -base64 32>
```

**Removed:**

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_S3_BUCKET
SUPABASE_S3_ENDPOINT
SUPABASE_S3_ACCESS_KEY_ID
SUPABASE_S3_SECRET_ACCESS_KEY
SUPABASE_S3_REGION
```

`DATABASE_URL` (Neon Postgres for Payload) and `PAYLOAD_SECRET` are unchanged.

## Open questions for implementation phase

- Exact API shape of Neon's `<AuthView />` / `<AccountView />` props — verify against `@neondatabase/auth/next` docs once the package is installed.
- Whether Neon Auth UI ships a client provider component that needs to wrap the locale layout, or whether the components are self-contained. The layout edit is conditional on this.
- S3 photo storage path: Payload's `s3Storage` plugin is currently pointed at Supabase S3-compatible endpoints. Out of scope for this spec but should be re-pointed before Supabase project is deleted (likely to Cloudflare R2 or Vercel Blob — separate decision).
