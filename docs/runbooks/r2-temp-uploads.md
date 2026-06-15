# Runbook: presigned direct-to-R2 uploads (operator notes)

Studio photo uploads go straight to R2 via a presigned PUT, into a temporary
`tmp/<uuid>/<filename>` key, then the `finalize` route downloads that object,
runs it through Payload (regenerating the size variants), and **deletes the temp
object**. Two operator-side settings back this up:

## 1. R2 lifecycle rule for the `tmp/` prefix (orphan cleanup)

If `finalize` never runs (tab closed after the PUT, a 500, etc.), the temp
object is orphaned. Add a lifecycle rule as a backstop:

- Cloudflare dashboard → R2 → the media bucket → **Settings → Object lifecycle rules**.
- Rule: prefix `tmp/`, **delete objects 1 day after creation**.
- (Or via Wrangler: `wrangler r2 bucket lifecycle add <bucket> --prefix tmp/ --expire-days 1`.)

Real uploads live under the Payload media prefix, never `tmp/`, so this only
ever reaps abandoned temp originals.

## 2. Finalize function resources

`src/app/api/studio/upload/finalize/route.ts` sets `export const maxDuration = 60`.
Memory is left at the Vercel default (Fluid Compute), which comfortably handles a
50 MB Sharp resize. If a very large image ever OOMs the function, raise the
function memory in **Vercel → Project → Settings → Functions** (no code change
needed).
