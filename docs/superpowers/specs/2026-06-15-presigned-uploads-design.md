# Presigned Direct-to-R2 Uploads (lift the 4 MB cap)

**Date:** 2026-06-15
**Status:** Approved design — pending spec review
**Phase:** Product Surface, sub-project #1 (of: presigned uploads → `/account/bookings` → photo captions + taxonomy usage counts, each its own cycle).

## Context

Studio photo uploads currently POST a `FormData` file through `/api/studio/upload` → `createPhotoFromUpload` → `payload.create({ collection:"photos", file })`, which generates 3 image sizes (thumbnail 480×360 focal-cropped, feed 1400w, full 2560w via sharp) and uploads original + variants to Cloudflare R2 (`@payloadcms/storage-s3`). The hard **4 MB cap** (`MAX_UPLOAD_BYTES`) exists because Vercel rejects serverless request bodies over ~4.5 MB — a file routed through the function can't exceed it. This is the most concrete daily limitation for a photographer uploading high-res images.

**Usage findings (informing the design):**

- The public site serves images only via the **`feed`** size, through **next/image**.
- The focal-point **`thumbnail`** is used only in the **Studio admin** (photo grid, stories list).
- **Watermark** is a stored field + a settings toggle but is **never applied** to images (no rendering logic) — functionally dormant.

So the only Payload-pipeline output the site actually uses is the size variants. The design therefore **keeps Payload's pipeline intact** rather than dropping it.

## Goal

Lift the upload cap to ~**50 MB** by having the client upload **directly to R2** (bypassing the function body limit), while **regenerating the exact same Payload sizes/focal crop** so nothing the site uses is lost.

## Non-Goals

- The other Product Surface pieces (`/account/bookings`, caption editing, taxonomy usage counts) — separate specs.
- Implementing watermarking (dormant; untouched).
- A CDN image-transform service (Cloudflare Images, etc.).
- Changing how the public site serves images (still next/image from the `feed` variant).

## Design

The client uploads the original directly to R2 via a presigned PUT, then a server **finalize** step pulls it back and runs it through Payload's normal `payload.create` — so all variants + focal crop are regenerated exactly as today. No "register an external file in Payload" hack; `payload.create` stays the single source of media creation.

### Endpoints (both admin-only, `force-dynamic`)

**`POST /api/studio/upload/presign`** — body `{ filename, contentType, size }`.

- Auth: `session.user.role === "admin"` (else 403), same as the current route.
- Validate: `contentType` ∈ the MIME allowlist (jpeg/png/webp/avif → 415); `size` ≤ `MAX_UPLOAD_BYTES` (raised to 50 MB → 413).
- Generate a presigned PUT URL (15-min expiry) for a **temp key** `tmp/${crypto.randomUUID()}-${sanitize(filename)}` in the R2 bucket, using an S3 client built from the existing `R2_*` env vars + `@aws-sdk/s3-request-presigner` (new dep; `@aws-sdk/client-s3` already present via `@payloadcms/storage-s3`).
- Return `{ uploadUrl, tempKey, contentType }`.

**`POST /api/studio/upload/finalize`** — body `{ tempKey, alt }`.

- Auth: admin (403 otherwise). Validate `tempKey` starts with `tmp/` (no arbitrary-key reads).
- `GetObject(tempKey)` from R2 → buffer (this is fn compute, not a request body, so no 4 MB limit).
- `payload.create({ collection:"photos", file:{ data: buffer, name: originalName, mimetype: contentType, size }, data:{ alt } })` — regenerates sizes + focal crop + uploads to the real keys, sets width/height from the buffer.
- `DeleteObject(tempKey)` (cleanup the temp original).
- Return `{ ok:true, id }`. On failure, attempt temp cleanup and return 500 (dev-only `detail`).

### Client — `src/components/studio/photo-upload.tsx`

Replace the single POST with: (1) `presign` → (2) `fetch(uploadUrl, { method:"PUT", body:file, headers:{ "Content-Type": file.type } })` with progress via `XMLHttpRequest`/`upload.onprogress` (fetch lacks upload progress) → (3) `finalize`. Surface the same success/error UX; drop the 4 MB cap + the 413 "max 4 MB" copy; show a progress bar (uploads are now large). On PUT failure, allow retry (re-presign).

### Config

- `MAX_UPLOAD_BYTES` (in `src/lib/studio/schemas.ts`) → 50 MB (single source; presign + client read it).
- Finalize route may resize a large image server-side → give it more memory/time via Vercel function config (e.g. in `vercel.ts` functions config: `memory: 2048`, `maxDuration: 60` for `src/app/api/studio/upload/finalize/route.ts`).
- R2 lifecycle rule on the `tmp/` prefix (expire after 1 day) as a backstop for orphaned temp objects (documented; set in the Cloudflare dashboard / wrangler).

### Keep / remove

- Keep the old `/api/studio/upload` route? No — replace it with presign+finalize (the Studio uploader is the only caller). Remove `createPhotoFromUpload`'s old single-shot path if it becomes unused, or keep it as the shared `payload.create` wrapper the finalize step calls.

## Data Flow

```
Studio uploader
  POST /presign {filename,contentType,size}  ──auth+validate──▶ presigned PUT url (tmp/ key)
  PUT  <uploadUrl>  (file → R2 directly, progress bar, no 4MB limit)
  POST /finalize {tempKey,alt}  ──auth──▶ GetObject(tmp) → payload.create(buffer) → DeleteObject(tmp) → {id}
                                            (regenerates thumbnail/feed/full + focal crop, uploads to real keys)
```

## Testing

- **Unit:** presign validation (MIME reject → 415, oversize → 413, non-admin → 403, happy → returns a `tmp/` key); finalize auth + `tmp/`-prefix guard; the filename sanitizer. Mock the S3 client + `payload`.
- **E2E:** extend the env-gated authenticated `studio.spec.ts` upload test to drive presign → PUT → finalize against a real (preview) bucket, asserting a photo appears in the grid. (Stays env-gated like the current one.)
- **Manual:** upload a >4 MB image in the Studio and confirm it succeeds + the `feed`/`thumbnail` variants render.

## Risks & Mitigations

- **Orphaned temp objects** (finalize never runs / fails): `tmp/` cleanup on finalize + an R2 lifecycle rule expiring `tmp/`.
- **Large-image finalize memory/time:** bump the finalize function's memory/maxDuration; cap at 50 MB.
- **Presigned PUT contentType mismatch:** include `Content-Type` in the presign signature and the client PUT header so R2 accepts it.
- **Double-store during processing** (temp + final): transient, accepted; cleaned up immediately.
- **`@aws-sdk/s3-request-presigner` resolution under pnpm:** add as a direct dep (don't rely on hoist); the S3 client construction mirrors `@payloadcms/storage-s3`'s config.

## Success Criteria

- A >4 MB (up to 50 MB) image uploads successfully from the Studio; the Photo record has the usual `thumbnail`/`feed`/`full` variants (focal-cropped thumbnail intact); public + Studio display unchanged.
- Non-admin presign/finalize → 403; bad MIME → 415; oversize → 413.
- `pnpm typecheck`/`lint`/`test` green; no temp objects left after a successful upload.
