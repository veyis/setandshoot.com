# Vercel env var sync — Supabase → Neon Auth

One-time manual sync to remove Supabase env vars from the Vercel project and
add the Neon Auth keys that replaced them. Run once per environment
(Development, Preview, Production) before shipping the Neon Auth branch.

This is intentionally not automated — `vercel env rm` is destructive and the
Neon Auth cookie secret is a value you should generate (or look up) per
environment, not commit to the repo.

## Prerequisites

- `vercel` CLI installed and authenticated (`vercel whoami` returns your
  account).
- The project is linked locally (`vercel link` if `.vercel/project.json` is
  missing).
- A copy of the Neon Auth base URL — find it via the Neon console
  (Project → Auth → Settings) or the MCP `get_neon_auth_config` call. As of
  2026-05-18 it is:
  `https://ep-yellow-sea-a2m6oq9a.neonauth.eu-central-1.aws.neon.tech/neondb/auth`

## 1. Remove Supabase env vars

The following keys were removed from `src/env.ts` and `.env.example` in commit
`a4db37b` (feat(auth): swap Supabase for Neon Auth end-to-end). They still
exist on Vercel and will be unused after deploy — remove them so nobody
mistakes them for live config.

Run once per env target (`development`, `preview`, `production`):

```bash
for KEY in \
  NEXT_PUBLIC_SUPABASE_URL \
  NEXT_PUBLIC_SUPABASE_ANON_KEY \
  SUPABASE_SERVICE_ROLE_KEY \
  SUPABASE_S3_BUCKET \
  SUPABASE_S3_ENDPOINT \
  SUPABASE_S3_ACCESS_KEY_ID \
  SUPABASE_S3_SECRET_ACCESS_KEY \
  SUPABASE_S3_REGION; do
  vercel env rm "$KEY" development --yes
done
```

Repeat the loop with `preview` and `production` in place of `development`.
Keys that aren't set in a given env produce a "not found" notice — safe to
ignore.

## 2. Add the Neon Auth env vars

`NEON_AUTH_BASE_URL` is the same across all envs.
`NEON_AUTH_COOKIE_SECRET` must be ≥ 32 chars (Zod-validated in `src/env.ts`).
You can use the same secret across envs or rotate per env — either works, the
cookie is signed independently per request.

```bash
NEON_AUTH_BASE_URL="https://ep-yellow-sea-a2m6oq9a.neonauth.eu-central-1.aws.neon.tech/neondb/auth"
COOKIE_SECRET="$(openssl rand -base64 32)"

for ENV in development preview production; do
  echo "$NEON_AUTH_BASE_URL" | vercel env add NEON_AUTH_BASE_URL "$ENV"
  echo "$COOKIE_SECRET"      | vercel env add NEON_AUTH_COOKIE_SECRET "$ENV"
done
```

## 3. Update the Neon Auth `trusted_origins`

Neon Auth rejects requests whose `Origin` header isn't in `trusted_origins`.
Confirm your preview URL pattern is allowlisted (the production domains
already are):

```bash
# Inspect current config
vercel env pull --environment=preview .env.preview  # to confirm NEON_AUTH_BASE_URL pulled correctly
```

To update via Neon MCP (Claude Code):

```
mcp__Neon__configure_neon_auth
  projectId: delicate-dew-22892979
  trusted_origins:
    - http://localhost:3000
    - https://www.setandshoot.com
    - https://setandshoot.com
    - https://*.vercel.app   # if you want all preview deploys to work
```

Or manually in the Neon console → Project → Auth → Settings → Trusted Origins.

## 4. Trigger a fresh deploy

```bash
vercel pull --yes --environment=preview
vercel deploy
```

Verify in the new deployment:

- `GET /api/health` returns `200` with `neonAuth.ok: true`.
- `/sign-in` renders the Neon `<AuthView />` (not a 404 or blank page).
- `/admin` (unauthenticated) redirects to `/sign-in?next=%2Fadmin`.
- `/account` (unauthenticated) redirects to `/sign-in?next=%2Faccount`.

## 5. After production deploy

- Sign in as the admin account once to seed the session.
- Reset a forgotten password (Neon Auth — one account for site + CMS):

  ```bash
  pnpm neon:reset-password you@example.com 'YourNewPassword123!'
  ```

  Or use `/forgot-password` in the browser. Payload `/admin` trusts the Neon session; no separate CMS password.

- Spot-check that booking submission still writes a row to `payload.bookings`
  with `customer_id` set when signed in, null otherwise.
- Remove `.env.preview` from your machine if you pulled it (it contains
  secrets).
