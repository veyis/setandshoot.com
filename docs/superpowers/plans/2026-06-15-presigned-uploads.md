# Presigned Direct-to-R2 Uploads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Studio admins upload images straight to Cloudflare R2 via a presigned PUT (bypassing Vercel's ~4.5 MB function-body limit), then re-run the original through Payload so all size variants + focal crop are regenerated — lifting the upload cap from 4 MB to 50 MB.

**Architecture:** Two new admin-only API routes replace the single `POST /api/studio/upload`. `presign` validates the request and returns a presigned PUT URL for a `tmp/` key. The browser PUTs the file directly to R2 (with an XHR progress bar). `finalize` downloads that temp object server-side (no request-body limit), feeds the buffer to the existing `createPhotoFromUpload` → `payload.create` (regenerating thumbnail/feed/full + focal crop), then deletes the temp object. R2 access mirrors `payload.config.ts`'s S3 client exactly.

**Tech Stack:** Next 16 App Router route handlers, `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (the same S3 SDK family Payload already uses to talk to R2), Payload 3 Local API, Zod, Vitest, Playwright.

---

## Spec

Source spec: `docs/superpowers/specs/2026-06-15-presigned-uploads-design.md` (approved).

## Deliberate deviations from the spec (flagged for review)

1. **Finalize body is `{ tempKey }`, not `{ tempKey, alt }`.** The current uploader does not collect alt text at upload time — `createPhotoFromUpload` derives a fallback alt from the filename, and the editor edits it in the grid immediately after. Collecting alt at upload is out of scope (YAGNI) and would change the uploader UX. The original filename is recovered from the temp key's last path segment, so no extra body field is needed.
2. **Per-route memory/time is set with `export const maxDuration = 60` (route segment config), not a `functions` block in `vercel.ts`.** App Router's native per-route config is simpler and avoids brittle compiled-function globs. Memory is left at the Vercel default (Fluid Compute, ample for a 50 MB Sharp resize); if a large image ever OOMs, bump memory in the Vercel project settings — documented in Task 6. No code change needed.

If either deviation is unwanted, say so during review and the relevant task adapts.

## File Structure

- **`src/lib/studio/schemas.ts`** (modify) — bump `MAX_UPLOAD_BYTES` to 50 MB; add the shared `ALLOWED_MIME` allowlist, `TEMP_PREFIX`, pure helpers `sanitizeFilename` / `isAllowedMime` / `isTempKey`, and the `presignSchema` / `finalizeSchema` request schemas. Single source of truth for both routes and the client.
- **`src/lib/studio/r2.ts`** (create) — `server-only` R2 helper: lazily builds the S3 client from `R2_*` env (mirrors `payload.config.ts`), exposes `presignPutUrl`, `getObjectBuffer`, `deleteObject`. Isolated so the routes can be unit-tested by mocking it.
- **`src/app/api/studio/upload/presign/route.ts`** (create) — admin-only `POST`: validate → presign → `{ uploadUrl, tempKey, contentType }`.
- **`src/app/api/studio/upload/finalize/route.ts`** (create) — admin-only `POST`, `maxDuration = 60`: temp-key guard → GetObject → `createPhotoFromUpload` → DeleteObject → `{ ok, id }`.
- **`src/app/api/studio/upload/route.ts`** (delete in Task 5) — the old single-shot route; only the uploader calls it.
- **`src/components/studio/photo-upload.tsx`** (modify) — presign → XHR PUT (progress) → finalize; progress bar; 50 MB cap copy.
- **`src/messages/de.json`, `src/messages/en.json`** (modify) — update the "max 4 MB" copy to 50 MB; add a `finalizing` status label.
- **`src/lib/studio/photos.ts`** — `createPhotoFromUpload` is reused unchanged (the shared `payload.create` wrapper).
- **`tests/unit/lib/studio-upload.test.ts`** (create) — pure-helper + schema tests.
- **`tests/unit/app/studio-upload-routes.test.ts`** (create) — route handler tests (auth/validation/happy-path), deps mocked.
- **`tests/e2e/studio.spec.ts`** (modify, light) — the env-gated authenticated upload journey already drives the new flow through the UI; only its doc comment changes.
- **`docs/runbooks/r2-temp-uploads.md`** (create) — operator note: R2 lifecycle rule for the `tmp/` prefix + the optional memory bump.

---

### Task 1: Shared upload constants & pure helpers

**Files:**
- Modify: `src/lib/studio/schemas.ts:1-5`
- Test: `tests/unit/lib/studio-upload.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/lib/studio-upload.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  ALLOWED_MIME,
  MAX_UPLOAD_BYTES,
  TEMP_PREFIX,
  sanitizeFilename,
  isAllowedMime,
  isTempKey,
  presignSchema,
  finalizeSchema,
} from "@/lib/studio/schemas";

describe("upload constants", () => {
  it("caps uploads at 50 MB", () => {
    expect(MAX_UPLOAD_BYTES).toBe(50 * 1024 * 1024);
  });
  it("allows the four image MIME types", () => {
    expect(ALLOWED_MIME).toEqual(["image/jpeg", "image/png", "image/webp", "image/avif"]);
    expect(isAllowedMime("image/jpeg")).toBe(true);
    expect(isAllowedMime("image/gif")).toBe(false);
    expect(isAllowedMime("")).toBe(false);
  });
});

describe("sanitizeFilename", () => {
  it("strips paths, replaces unsafe chars, keeps the extension", () => {
    expect(sanitizeFilename("My Photo (1).JPG")).toBe("My-Photo-1.JPG");
    expect(sanitizeFilename("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFilename("a/b/c.png")).toBe("c.png");
  });
  it("falls back to 'upload' when nothing usable remains", () => {
    expect(sanitizeFilename("")).toBe("upload");
    expect(sanitizeFilename("...")).toBe("upload");
  });
});

describe("isTempKey", () => {
  it("accepts only tmp/ keys without traversal", () => {
    expect(isTempKey("tmp/uuid/photo.jpg")).toBe(true);
    expect(isTempKey("photos/x.jpg")).toBe(false);
    expect(isTempKey("tmp/../photos/x.jpg")).toBe(false);
    expect(isTempKey("tmp//x.jpg")).toBe(false);
    expect(isTempKey(TEMP_PREFIX)).toBe(false); // prefix alone, no object
  });
});

describe("presignSchema", () => {
  it("accepts a well-formed body", () => {
    const r = presignSchema.parse({ filename: "a.jpg", contentType: "image/jpeg", size: 10 });
    expect(r.size).toBe(10);
  });
  it("rejects empty filename / non-positive size", () => {
    expect(() => presignSchema.parse({ filename: "", contentType: "image/jpeg", size: 10 })).toThrow();
    expect(() => presignSchema.parse({ filename: "a.jpg", contentType: "image/jpeg", size: 0 })).toThrow();
  });
});

describe("finalizeSchema", () => {
  it("requires a non-empty tempKey", () => {
    expect(finalizeSchema.parse({ tempKey: "tmp/x/a.jpg" }).tempKey).toBe("tmp/x/a.jpg");
    expect(() => finalizeSchema.parse({ tempKey: "" })).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/unit/lib/studio-upload.test.ts`
Expected: FAIL — imports `ALLOWED_MIME`, `TEMP_PREFIX`, `sanitizeFilename`, etc. are not exported yet.

- [ ] **Step 3: Implement in `src/lib/studio/schemas.ts`**

Replace the existing `MAX_UPLOAD_BYTES` block (lines 3-5) with:

```ts
// 50 MB. The client uploads originals directly to R2 via a presigned PUT, so the
// old ~4.5 MB Vercel function-body limit no longer applies.
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const TEMP_PREFIX = "tmp/";

export function isAllowedMime(contentType: string): boolean {
  return (ALLOWED_MIME as readonly string[]).includes(contentType);
}

/** Reduce an uploaded filename to a safe object-key segment (no paths/unsafe chars). */
export function sanitizeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? name;
  const cleaned = base
    .replace(/[^a-zA-Z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+/, "")
    .slice(0, 200);
  return cleaned || "upload";
}

/** Guard finalize against reading arbitrary R2 keys — only our temp objects. */
export function isTempKey(key: string): boolean {
  return (
    typeof key === "string" &&
    key.startsWith(TEMP_PREFIX) &&
    key.length > TEMP_PREFIX.length &&
    !key.includes("..") &&
    !key.includes("//")
  );
}

export const presignSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  contentType: z.string().trim().min(1),
  size: z.number().int().positive(),
});

export const finalizeSchema = z.object({
  tempKey: z.string().trim().min(1),
});

export type PresignInput = z.infer<typeof presignSchema>;
export type FinalizeInput = z.infer<typeof finalizeSchema>;
```

(`z` is already imported at the top of the file.)

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/unit/lib/studio-upload.test.ts`
Expected: PASS (all describe blocks green).

- [ ] **Step 5: Commit**

```bash
pnpm exec prettier --write src/lib/studio/schemas.ts tests/unit/lib/studio-upload.test.ts
git add src/lib/studio/schemas.ts tests/unit/lib/studio-upload.test.ts
git commit -m "feat(uploads): shared 50MB cap, MIME allowlist, temp-key helpers + presign/finalize schemas"
```

---

### Task 2: R2 helper module + AWS SDK dependencies

**Files:**
- Create: `src/lib/studio/r2.ts`
- Modify: `package.json`, `pnpm-lock.yaml` (via `pnpm add`)

> No unit test in this task: `r2.ts` is thin network glue. It is covered by the route tests (which mock it) and the env-gated e2e / manual checks. Verify it via `pnpm typecheck`.

- [ ] **Step 1: Add the dependencies**

Run:
```bash
pnpm add @aws-sdk/s3-request-presigner @aws-sdk/client-s3
```
Expected: both added to `dependencies` in `package.json`; lockfile updated. (`@aws-sdk/client-s3` is currently only a transitive dep of `@payloadcms/storage-s3` and is not directly resolvable under pnpm, so it must be declared directly.)

- [ ] **Step 2: Create `src/lib/studio/r2.ts`**

```ts
import "server-only";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Mirrors the S3 client config in src/payload/payload.config.ts (R2 is S3-compatible).
const PRESIGN_EXPIRY_SECONDS = 15 * 60;

function requireBucket(): string {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) throw new Error("R2_BUCKET is not configured");
  return bucket;
}

let cached: S3Client | null = null;
function getR2Client(): S3Client {
  if (cached) return cached;
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 storage is not configured");
  }
  cached = new S3Client({
    endpoint,
    region: "auto",
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
  return cached;
}

/** Presigned PUT URL (15 min) for a temp object. ContentType is part of the signature. */
export async function presignPutUrl(key: string, contentType: string): Promise<string> {
  return getSignedUrl(
    getR2Client(),
    new PutObjectCommand({ Bucket: requireBucket(), Key: key, ContentType: contentType }),
    { expiresIn: PRESIGN_EXPIRY_SECONDS },
  );
}

/** Download a temp object server-side (no request-body limit applies here). */
export async function getObjectBuffer(
  key: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await getR2Client().send(
    new GetObjectCommand({ Bucket: requireBucket(), Key: key }),
  );
  if (!res.Body) throw new Error(`Temp object has no body: ${key}`);
  const bytes = await res.Body.transformToByteArray();
  return { buffer: Buffer.from(bytes), contentType: res.ContentType ?? "application/octet-stream" };
}

export async function deleteObject(key: string): Promise<void> {
  await getR2Client().send(new DeleteObjectCommand({ Bucket: requireBucket(), Key: key }));
}
```

- [ ] **Step 3: Verify it typechecks**

Run: `pnpm typecheck`
Expected: PASS (no errors). If `transformToByteArray` is flagged, confirm `@aws-sdk/client-s3` resolved correctly from Step 1.

- [ ] **Step 4: Commit**

```bash
pnpm exec prettier --write src/lib/studio/r2.ts
git add package.json pnpm-lock.yaml src/lib/studio/r2.ts
git commit -m "feat(uploads): R2 presign/get/delete helper using the AWS S3 SDK"
```

---

### Task 3: Presign route

**Files:**
- Create: `src/app/api/studio/upload/presign/route.ts`
- Test: `tests/unit/app/studio-upload-routes.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/app/studio-upload-routes.test.ts` (this file also covers Task 4's finalize route):

```ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/server", () => ({ auth: { getSession: vi.fn() } }));
vi.mock("@/lib/studio/r2", () => ({
  presignPutUrl: vi.fn(),
  getObjectBuffer: vi.fn(),
  deleteObject: vi.fn(),
}));
vi.mock("@/lib/studio/photos", () => ({ createPhotoFromUpload: vi.fn() }));

import { auth } from "@/lib/auth/server";
import { presignPutUrl, getObjectBuffer, deleteObject } from "@/lib/studio/r2";
import { createPhotoFromUpload } from "@/lib/studio/photos";
import { POST as presignPOST } from "@/app/api/studio/upload/presign/route";

const getSession = vi.mocked(auth.getSession);
const asAdmin = () => getSession.mockResolvedValue({ data: { user: { role: "admin" } } } as never);
const asGuest = () => getSession.mockResolvedValue({ data: null } as never);

function jsonReq(body: unknown) {
  return new Request("http://test/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => vi.clearAllMocks());

describe("POST /api/studio/upload/presign", () => {
  it("rejects non-admins with 403", async () => {
    asGuest();
    const res = await presignPOST(jsonReq({ filename: "a.jpg", contentType: "image/jpeg", size: 10 }));
    expect(res.status).toBe(403);
    expect(presignPutUrl).not.toHaveBeenCalled();
  });

  it("rejects unsupported MIME with 415", async () => {
    asAdmin();
    const res = await presignPOST(jsonReq({ filename: "a.gif", contentType: "image/gif", size: 10 }));
    expect(res.status).toBe(415);
  });

  it("rejects oversize with 413", async () => {
    asAdmin();
    const res = await presignPOST(
      jsonReq({ filename: "a.jpg", contentType: "image/jpeg", size: 51 * 1024 * 1024 }),
    );
    expect(res.status).toBe(413);
  });

  it("returns a tmp/ key and presigned url for a valid request", async () => {
    asAdmin();
    vi.mocked(presignPutUrl).mockResolvedValue("https://r2.example/upload-url");
    const res = await presignPOST(
      jsonReq({ filename: "My Photo.jpg", contentType: "image/jpeg", size: 1234 }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.tempKey).toMatch(/^tmp\/.+\/My-Photo\.jpg$/);
    expect(json.uploadUrl).toBe("https://r2.example/upload-url");
    expect(presignPutUrl).toHaveBeenCalledWith(expect.stringMatching(/^tmp\//), "image/jpeg");
  });
});
```

(The unused `getObjectBuffer` / `deleteObject` / `createPhotoFromUpload` imports are used by the finalize describe block added in Task 4.)

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/unit/app/studio-upload-routes.test.ts`
Expected: FAIL — `@/app/api/studio/upload/presign/route` does not exist.

- [ ] **Step 3: Create `src/app/api/studio/upload/presign/route.ts`**

```ts
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth/server";
import {
  MAX_UPLOAD_BYTES,
  TEMP_PREFIX,
  isAllowedMime,
  presignSchema,
  sanitizeFilename,
} from "@/lib/studio/schemas";
import { presignPutUrl } from "@/lib/studio/r2";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = presignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { filename, contentType, size } = parsed.data;

  if (!isAllowedMime(contentType)) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 415 });
  }
  if (size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File too large." }, { status: 413 });
  }

  const tempKey = `${TEMP_PREFIX}${randomUUID()}/${sanitizeFilename(filename)}`;
  try {
    const uploadUrl = await presignPutUrl(tempKey, contentType);
    return NextResponse.json({ uploadUrl, tempKey, contentType });
  } catch (error) {
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: "Could not presign upload.",
        ...(isDev && error instanceof Error ? { detail: error.message } : {}),
      },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/unit/app/studio-upload-routes.test.ts`
Expected: PASS for the presign describe block.

- [ ] **Step 5: Commit**

```bash
pnpm exec prettier --write "src/app/api/studio/upload/presign/route.ts" "tests/unit/app/studio-upload-routes.test.ts"
git add "src/app/api/studio/upload/presign/route.ts" "tests/unit/app/studio-upload-routes.test.ts"
git commit -m "feat(uploads): admin-only presign route (validate -> presigned PUT url)"
```

---

### Task 4: Finalize route

**Files:**
- Create: `src/app/api/studio/upload/finalize/route.ts`
- Test: `tests/unit/app/studio-upload-routes.test.ts` (extend)

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/app/studio-upload-routes.test.ts`, and add the finalize import near the other route import at the top of the file:

```ts
import { POST as finalizePOST } from "@/app/api/studio/upload/finalize/route";
```

```ts
describe("POST /api/studio/upload/finalize", () => {
  it("rejects non-admins with 403", async () => {
    asGuest();
    const res = await finalizePOST(jsonReq({ tempKey: "tmp/uuid/a.jpg" }));
    expect(res.status).toBe(403);
    expect(getObjectBuffer).not.toHaveBeenCalled();
  });

  it("rejects a non-tmp/ key with 400 and never reads the object", async () => {
    asAdmin();
    const res = await finalizePOST(jsonReq({ tempKey: "photos/secret.jpg" }));
    expect(res.status).toBe(400);
    expect(getObjectBuffer).not.toHaveBeenCalled();
  });

  it("creates a photo from the temp object, deletes it, returns the id", async () => {
    asAdmin();
    vi.mocked(getObjectBuffer).mockResolvedValue({
      buffer: Buffer.from("img"),
      contentType: "image/jpeg",
    });
    vi.mocked(createPhotoFromUpload).mockResolvedValue({ id: 42 });
    const res = await finalizePOST(jsonReq({ tempKey: "tmp/uuid/photo.jpg" }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.id).toBe(42);
    expect(createPhotoFromUpload).toHaveBeenCalledWith(
      expect.objectContaining({ name: "photo.jpg", mimetype: "image/jpeg", size: 3 }),
    );
    expect(deleteObject).toHaveBeenCalledWith("tmp/uuid/photo.jpg");
  });

  it("rejects an unexpected stored MIME with 415 and cleans up", async () => {
    asAdmin();
    vi.mocked(getObjectBuffer).mockResolvedValue({
      buffer: Buffer.from("x"),
      contentType: "application/zip",
    });
    const res = await finalizePOST(jsonReq({ tempKey: "tmp/uuid/evil.zip" }));
    expect(res.status).toBe(415);
    expect(createPhotoFromUpload).not.toHaveBeenCalled();
    expect(deleteObject).toHaveBeenCalledWith("tmp/uuid/evil.zip");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/unit/app/studio-upload-routes.test.ts`
Expected: FAIL — `@/app/api/studio/upload/finalize/route` does not exist.

- [ ] **Step 3: Create `src/app/api/studio/upload/finalize/route.ts`**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { finalizeSchema, isAllowedMime, isTempKey } from "@/lib/studio/schemas";
import { deleteObject, getObjectBuffer } from "@/lib/studio/r2";
import { createPhotoFromUpload } from "@/lib/studio/photos";

export const dynamic = "force-dynamic";
// A 50 MB original goes through Sharp (3 sizes + focal crop) here; give it headroom.
export const maxDuration = 60;

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = finalizeSchema.safeParse(body);
  if (!parsed.success || !isTempKey(parsed.data.tempKey)) {
    return NextResponse.json({ error: "Invalid temp key." }, { status: 400 });
  }
  const { tempKey } = parsed.data;
  const name = tempKey.split("/").pop() || "upload";

  try {
    const { buffer, contentType } = await getObjectBuffer(tempKey);
    if (!isAllowedMime(contentType)) {
      await deleteObject(tempKey).catch(() => {});
      return NextResponse.json({ error: "Unsupported file type." }, { status: 415 });
    }
    const { id } = await createPhotoFromUpload({
      data: buffer,
      name,
      mimetype: contentType,
      size: buffer.length,
    });
    await deleteObject(tempKey).catch(() => {});
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    await deleteObject(tempKey).catch(() => {});
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: "Upload failed.",
        ...(isDev && error instanceof Error ? { detail: error.message } : {}),
      },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/unit/app/studio-upload-routes.test.ts`
Expected: PASS (both presign and finalize describe blocks green).

- [ ] **Step 5: Commit**

```bash
pnpm exec prettier --write "src/app/api/studio/upload/finalize/route.ts" "tests/unit/app/studio-upload-routes.test.ts"
git add "src/app/api/studio/upload/finalize/route.ts" "tests/unit/app/studio-upload-routes.test.ts"
git commit -m "feat(uploads): admin-only finalize route (GetObject -> payload.create -> cleanup)"
```

---

### Task 5: Client uploader + i18n; remove the old route

**Files:**
- Modify: `src/components/studio/photo-upload.tsx`
- Modify: `src/messages/de.json`, `src/messages/en.json`
- Delete: `src/app/api/studio/upload/route.ts`

> No unit test: the uploader orchestrates `fetch` + `XMLHttpRequest` (integration territory). It is covered by the env-gated e2e journey (Task 7) and the manual >4 MB check. The pure pieces it relies on (`ALLOWED_MIME`, `MAX_UPLOAD_BYTES`) are tested in Task 1.

- [ ] **Step 1: Replace `src/components/studio/photo-upload.tsx` entirely**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type DragEvent } from "react";
import { useTranslations } from "next-intl";
import { ALLOWED_MIME, MAX_UPLOAD_BYTES } from "@/lib/studio/schemas";

type Status =
  | "pending"
  | "uploading"
  | "finalizing"
  | "done"
  | "error"
  | "tooLarge"
  | "unsupported";

type QueueItem = { name: string; status: Status; progress: number };

// fetch() has no upload progress, so the direct-to-R2 PUT uses XHR.
function putWithProgress(
  url: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`PUT failed (${xhr.status})`));
    xhr.onerror = () => reject(new Error("PUT failed"));
    xhr.send(file);
  });
}

export function PhotoUpload() {
  const t = useTranslations("studio");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [busy, setBusy] = useState(false);

  function update(i: number, patch: Partial<QueueItem>) {
    setQueue((q) => q.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  }

  async function uploadFiles(files: File[]) {
    if (busy || files.length === 0) return;
    setBusy(true);
    setQueue(files.map((file) => ({ name: file.name, status: "pending", progress: 0 })));

    // One file at a time: large originals + Sharp processing can approach
    // serverless time limits, so never batch.
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i]!;
      if (!ALLOWED_MIME.includes(file.type)) {
        update(i, { status: "unsupported" });
        continue;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        update(i, { status: "tooLarge" });
        continue;
      }
      update(i, { status: "uploading", progress: 0 });
      try {
        const presignRes = await fetch("/api/studio/upload/presign", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size }),
        });
        if (!presignRes.ok) {
          update(i, {
            status:
              presignRes.status === 413
                ? "tooLarge"
                : presignRes.status === 415
                  ? "unsupported"
                  : "error",
          });
          continue;
        }
        const { uploadUrl, tempKey } = (await presignRes.json()) as {
          uploadUrl: string;
          tempKey: string;
        };

        await putWithProgress(uploadUrl, file, (pct) => update(i, { progress: pct }));

        update(i, { status: "finalizing" });
        const finalizeRes = await fetch("/api/studio/upload/finalize", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ tempKey }),
        });
        update(i, { status: finalizeRes.ok ? "done" : "error" });
      } catch {
        update(i, { status: "error" });
      }
    }

    setBusy(false);
    router.refresh();
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    void uploadFiles(Array.from(event.dataTransfer.files));
  }

  function label(item: QueueItem): string {
    switch (item.status) {
      case "done":
        return t("uploadDone");
      case "error":
        return t("uploadError");
      case "tooLarge":
        return t("uploadTooLarge");
      case "unsupported":
        return t("uploadUnsupported");
      case "uploading":
        return `${item.progress}%`;
      case "finalizing":
        return t("finalizing");
      default:
        return "…";
    }
  }

  return (
    <section className="mb-10">
      <h2 className="font-display mb-3 text-xl tracking-tight">{t("uploadTitle")}</h2>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        className="border-hairline text-ink-muted hover:text-ink focus:ring-accent cursor-pointer rounded-md border border-dashed p-8 text-center text-sm transition-colors outline-none focus:ring-2"
      >
        {busy ? t("uploading") : t("uploadHint")}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="hidden"
          onChange={(event) => {
            void uploadFiles(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
      </div>
      {queue.length > 0 ? (
        <ul className="mt-3 space-y-1 text-sm">
          {queue.map((item, index) => (
            <li key={`${item.name}-${index}`} className="flex flex-col gap-1">
              <div className="flex justify-between gap-4">
                <span className="truncate">{item.name}</span>
                <span className="text-ink-muted shrink-0">{label(item)}</span>
              </div>
              {item.status === "uploading" ? (
                <div className="bg-canvas h-1 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-accent h-full transition-[width]"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 2: Update i18n — `src/messages/de.json` (studio namespace)**

- Change `uploadTooLarge` from `"Zu groß (max. 4 MB)"` to `"Zu groß (max. 50 MB)"`.
- Add `"finalizing": "Wird verarbeitet …"` next to the other upload keys.

- [ ] **Step 3: Update i18n — `src/messages/en.json` (studio namespace)**

- Change `uploadTooLarge` from `"Too large (max 4 MB)"` to `"Too large (max 50 MB)"`.
- Add `"finalizing": "Processing …"` next to the other upload keys.

- [ ] **Step 4: Delete the old route and confirm nothing else references it**

Run:
```bash
git rm "src/app/api/studio/upload/route.ts"
grep -rn "api/studio/upload\"" src   # should print nothing (the new calls use /presign and /finalize)
grep -rn "createPhotoFromUpload" src # should show photos.ts (def) + finalize/route.ts (caller) only
```
Expected: no reference to the bare `"/api/studio/upload"` endpoint remains; `createPhotoFromUpload` is still used by the finalize route.

- [ ] **Step 5: Verify typecheck + the full unit suite**

Run: `pnpm typecheck && pnpm test`
Expected: PASS. (i18n message-shape tests, if any, pass because both `de.json` and `en.json` gained the same `finalizing` key.)

- [ ] **Step 6: Commit**

```bash
pnpm exec prettier --write src/components/studio/photo-upload.tsx src/messages/de.json src/messages/en.json
git add src/components/studio/photo-upload.tsx src/messages/de.json src/messages/en.json "src/app/api/studio/upload/route.ts"
git commit -m "feat(uploads): direct-to-R2 uploader (presign -> PUT w/ progress -> finalize); drop 4MB route"
```

---

### Task 6: Operator runbook — R2 temp lifecycle + memory note

**Files:**
- Create: `docs/runbooks/r2-temp-uploads.md`

- [ ] **Step 1: Write the runbook**

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
pnpm exec prettier --write docs/runbooks/r2-temp-uploads.md
git add docs/runbooks/r2-temp-uploads.md
git commit -m "docs(uploads): R2 tmp/ lifecycle + finalize function resources runbook"
```

---

### Task 7: E2E note + full verification

**Files:**
- Modify: `tests/e2e/studio.spec.ts` (doc comment only)

- [ ] **Step 1: Update the e2e doc comment**

The authenticated upload journey (`tests/e2e/studio.spec.ts`, env-gated on `TEST_EMAIL`/`TEST_PASSWORD`) drives the file input and waits for the "Uploaded" status — which now flows through presign → PUT → finalize via the rewritten uploader, so it exercises the new path end-to-end with no test-body changes. Update the block's header comment to say so:

In the comment block above `test.describe("studio upload (authenticated)")`, add a line noting the upload now uses the presign → direct-PUT → finalize flow (so the journey also validates that the R2 round-trip works against the preview bucket).

- [ ] **Step 2: Run the required CI checks locally**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: all three PASS (these are the branch-protection-required checks on `main`).

- [ ] **Step 3: Build sanity check**

Run: `pnpm build`
Expected: PASS — confirms the new routes + `r2.ts` (and the AWS SDK deps) compile in the production build, and `deploy-migrate.sh` is skipped locally (no `VERCEL_ENV=production`).

- [ ] **Step 4: Manual verification (record results, do not skip silently)**

With R2 env configured (local `.env.local` direct endpoint), run `pnpm dev`, sign in as admin, open `/studio/fotos`, and:
- Upload a **> 4 MB** JPEG → expect a progress bar, then "Uploaded"; the new card shows the derived alt and a thumbnail (focal-cropped); the public `feed` variant renders.
- Confirm **no `tmp/` object remains** in the R2 bucket after success.
- Upload a non-image → "Unsupported"; an oversize (>50 MB) file → "Too large".

If R2 isn't configured locally, state that this manual step is pending and must be done against a preview/prod environment before merge.

- [ ] **Step 5: Commit**

```bash
pnpm exec prettier --write tests/e2e/studio.spec.ts
git add tests/e2e/studio.spec.ts
git commit -m "test(uploads): note e2e journey now exercises the presign->PUT->finalize flow"
```

---

## Self-Review (completed by plan author)

**Spec coverage:**
- presign endpoint (auth/MIME/size/tmp key) → Task 3 ✅
- finalize endpoint (auth/tmp-prefix guard/GetObject→create→delete) → Task 4 ✅
- client presign→PUT(progress)→finalize, drop 4 MB copy, progress bar → Task 5 ✅
- `MAX_UPLOAD_BYTES` → 50 MB single source → Task 1 ✅
- `@aws-sdk/s3-request-presigner` (+ client-s3) dep → Task 2 ✅
- finalize memory/time → Task 4 (`maxDuration`) + Task 6 (memory note) ✅ (deviation flagged)
- R2 `tmp/` lifecycle rule → Task 6 ✅
- Unit tests (415/413/403/happy, tmp-guard, sanitizer) → Tasks 1, 3, 4 ✅
- E2E (env-gated upload journey covers the new flow) → Task 7 ✅
- Keep `createPhotoFromUpload`, remove old route → Task 5 ✅
- Watermark untouched ✅ (not referenced anywhere in this plan)

**Placeholder scan:** none — every code/test step contains complete content.

**Type consistency:** `presignPutUrl(key, contentType)`, `getObjectBuffer(key) → {buffer, contentType}`, `deleteObject(key)`, `createPhotoFromUpload({data,name,mimetype,size}) → {id}`, `isTempKey`/`isAllowedMime`/`sanitizeFilename` — names/signatures match across r2.ts, the routes, and their tests. Temp key shape `tmp/<uuid>/<filename>` is consistent in the presign builder, the `isTempKey` guard, and the finalize `name` recovery (`split("/").pop()`).

**Note for executor:** Land all tasks as a single PR — intermediate commits raise the cap to 50 MB before the old POST route is removed, so a >4.5 MB upload via the old flow would fail at the Vercel platform until Task 5; this only matters if a commit is deployed mid-stack, which won't happen.
```