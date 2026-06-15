# Runbook: presigned direct-to-R2 uploads (operator notes)

Studio photo uploads go straight to R2 via a presigned PUT, into a temporary
`tmp/<uuid>/<filename>` key, then the `finalize` route downloads that object,
runs it through Payload (regenerating the size variants), and **deletes the temp
object**. Three operator-side settings back this up — the first is a hard
deploy prerequisite.

## 1. R2 bucket CORS — REQUIRED before this works in production

The browser uploads the original with a **cross-origin `PUT`** straight from the
app origin (e.g. `https://setandshoot.com`) to the R2 S3 endpoint
(`https://<account>.r2.cloudflarestorage.com`). R2 rejects cross-origin PUTs
unless the bucket has a CORS policy. **Without this, every upload fails at the
PUT step** — and nothing in CI (`typecheck`/`lint`/`unit`/`next build`) catches
it, because the only test that drives the real PUT is the skipped-by-default
authenticated e2e journey.

Apply a CORS rule to the media bucket allowing `PUT` from the production **and**
preview origins, with the `content-type` request header allowed (the client sets
`Content-Type` on the PUT):

```json
[
  {
    "AllowedOrigins": [
      "https://setandshoot.com",
      "https://www.setandshoot.com",
      "https://*.vercel.app"
    ],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["content-type"],
    "MaxAgeSeconds": 3600
  }
]
```

- Cloudflare dashboard → R2 → the media bucket → **Settings → CORS policy** → add the rule, **or**
- `wrangler r2 bucket cors set <bucket> --file cors.json` (with the JSON above).

Tighten `AllowedOrigins` to your real preview domain(s) rather than the broad
`*.vercel.app` wildcard if you want to be strict.

## 2. R2 lifecycle rule for the `tmp/` prefix (orphan cleanup + exposure window)

If `finalize` never runs (tab closed after the PUT, a 500, etc.), the temp
object is orphaned. Add a lifecycle rule as a backstop:

- Cloudflare dashboard → R2 → the media bucket → **Settings → Object lifecycle rules**.
- Rule: prefix `tmp/`, **delete objects 1 day after creation**.
- (Or via Wrangler: `wrangler r2 bucket lifecycle add <bucket> --prefix tmp/ --expire-days 1`.)

Real uploads live under the Payload media prefix, never `tmp/`, so this only
ever reaps abandoned temp originals.

> **Note — temp originals are publicly readable until reaped.** The Payload R2
> config serves the whole bucket from the public custom domain
> (`R2_PUBLIC_BASE_URL`, e.g. `cdn.setandshoot.com`) with
> `disablePayloadAccessControl: true`. A `tmp/<uuid>/<filename>` orphan is
> therefore fetchable at `https://cdn.setandshoot.com/tmp/<uuid>/<filename>` until
> the lifecycle rule deletes it. The random UUID makes this hard to guess and the
> happy path deletes the temp object within seconds of finalize, so the risk is
> low — but if you want to minimise the exposure window, set the shortest
> lifecycle expiry your plan allows, or scope the public custom domain to the
> media prefix only.

## 3. Finalize function resources

`src/app/api/studio/upload/finalize/route.ts` sets `export const maxDuration = 60`.
Memory is left at the Vercel default (Fluid Compute), which comfortably handles a
50 MB Sharp resize. If a very large image ever OOMs the function, raise the
function memory in **Vercel → Project → Settings → Functions** (no code change
needed).
