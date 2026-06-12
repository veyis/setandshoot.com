# Studio Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the beginner-friendly Studio at `/studio` (dashboard, photo upload/editing, bookings inbox) on top of the existing Payload backend, per `docs/superpowers/specs/2026-06-12-studio-design.md`.

**Architecture:** New pages under `src/app/(site)/[locale]/(auth)/studio/` (German-first, next-intl), gated in `src/proxy.ts` exactly like `/admin`. All data access lives in `src/lib/studio/` (the future Payload-removal cut-line): server-only query modules + `"use server"` mutation actions calling Payload's Local API. Photo upload goes through a route handler (`/api/studio/upload`) instead of a server action to avoid the server-action body size limit; Payload still does Sharp resizing + R2 underneath.

**Tech Stack:** Next.js 16 App Router, Payload 3 Local API, next-intl, Zod 4, sonner (Toaster already mounted globally), Vitest, Playwright.

**Codebase conventions you must follow:**

- `typedRoutes: true` is on — dynamic/new hrefs use the existing escape hatch: `href={"/studio" as any}` with `// eslint-disable-next-line @typescript-eslint/no-explicit-any` above (see `src/app/(site)/[locale]/(auth)/account/page.tsx:21-24`).
- Design tokens: `font-display`, `text-ink`, `text-ink-muted`, `border-hairline`, `bg-canvas`, `focus:ring-accent` (see account pages and `src/components/booking/booking-form.tsx`).
- Payload Local API: `getPayload({ config })` with `import config from "@/payload/payload.config"`.
- Commits run lefthook (prettier check + tsc). Run `pnpm format` before committing if unsure.

**File map (whole phase):**

| File                                                      | Action | Responsibility                                                                                 |
| --------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------- |
| `src/messages/de.json`, `src/messages/en.json`            | Modify | `studio` namespace + `account.openStudio`                                                      |
| `src/proxy.ts`                                            | Modify | Gate `/studio` + `/en/studio` like `/admin`                                                    |
| `src/lib/studio/schemas.ts`                               | Create | Zod input schemas                                                                              |
| `src/lib/studio/localized.ts`                             | Create | `altFor()` locale-object helper                                                                |
| `src/lib/studio/photos.ts`                                | Create | `listStudioPhotos`, `listStudioTags`, `createPhotoFromUpload`, `updatePhotoMeta` (server-only) |
| `src/lib/studio/bookings.ts`                              | Create | `listStudioBookings` (server-only)                                                             |
| `src/lib/studio/actions/photos.ts`                        | Create | `updatePhotoMetaAction` (`"use server"`)                                                       |
| `src/app/api/studio/upload/route.ts`                      | Create | Multipart upload endpoint (admin-only)                                                         |
| `src/app/(site)/[locale]/(auth)/studio/layout.tsx`        | Create | Admin guard + Studio nav shell                                                                 |
| `src/app/(site)/[locale]/(auth)/studio/page.tsx`          | Create | Dashboard cards                                                                                |
| `src/app/(site)/[locale]/(auth)/studio/fotos/page.tsx`    | Create | Photo grid + upload                                                                            |
| `src/app/(site)/[locale]/(auth)/studio/anfragen/page.tsx` | Create | Bookings inbox                                                                                 |
| `src/components/studio/photo-upload.tsx`                  | Create | Client drag-drop queue uploader                                                                |
| `src/components/studio/photo-card.tsx`                    | Create | Client inline metadata editor                                                                  |
| `src/app/(site)/[locale]/(auth)/account/page.tsx`         | Modify | "Studio öffnen" quick link                                                                     |
| `tests/unit/lib/studio-schemas.test.ts`                   | Create | Schema tests                                                                                   |
| `tests/unit/lib/studio-localized.test.ts`                 | Create | `altFor` tests                                                                                 |
| `tests/e2e/studio.spec.ts`                                | Create | Unauthenticated gate redirect                                                                  |

---

### Task 1: Studio i18n messages

**Files:**

- Modify: `src/messages/de.json`
- Modify: `src/messages/en.json`

- [ ] **Step 1: Add the `studio` namespace to `src/messages/de.json`**

Two edits: (a) add ONE new key `"openStudio": "Studio öffnen"` inside the existing `"account"` object (leave all its other keys untouched), and (b) add this complete new top-level `"studio"` object after `"account"`:

```json
"studio": {
  "title": "Studio",
  "subtitle": "Inhalte einfach verwalten — ohne CMS-Kenntnisse.",
  "navOverview": "Übersicht",
  "navPhotos": "Fotos",
  "navBookings": "Anfragen",
  "advancedEditor": "Erweiterter Editor",
  "cardPhotosTitle": "Fotos",
  "cardPhotosBody": "Bilder hochladen und beschriften.",
  "cardBookingsTitle": "Anfragen",
  "cardBookingsBody": "Eingegangene Buchungsanfragen lesen.",
  "cardStoriesTitle": "Stories",
  "cardPagesTitle": "Seiten",
  "comingSoon": "Bald verfügbar",
  "uploadTitle": "Fotos hochladen",
  "uploadHint": "Dateien hierher ziehen oder klicken (JPEG, PNG, WebP, AVIF)",
  "uploadDone": "Hochgeladen",
  "uploadError": "Fehlgeschlagen",
  "uploading": "Lädt hoch …",
  "photosTitle": "Fotos",
  "photosEmpty": "Noch keine Fotos.",
  "altDe": "Alt-Text (Deutsch)",
  "altEn": "Alt-Text (Englisch)",
  "published": "Veröffentlicht",
  "highlight": "Highlight",
  "cover": "Cover",
  "tags": "Tags",
  "save": "Speichern",
  "saving": "Speichert …",
  "saved": "Gespeichert",
  "saveError": "Speichern fehlgeschlagen",
  "bookingsTitle": "Anfragen",
  "bookingsEmpty": "Keine Anfragen vorhanden."
}
```

- [ ] **Step 2: Add the same keys in English to `src/messages/en.json`**

Same two edits: add `"openStudio": "Open Studio"` inside the existing `"account"` object, and add this `"studio"` object after it:

```json
"studio": {
  "title": "Studio",
  "subtitle": "Manage content the easy way — no CMS skills needed.",
  "navOverview": "Overview",
  "navPhotos": "Photos",
  "navBookings": "Inquiries",
  "advancedEditor": "Advanced editor",
  "cardPhotosTitle": "Photos",
  "cardPhotosBody": "Upload and caption images.",
  "cardBookingsTitle": "Inquiries",
  "cardBookingsBody": "Read incoming booking inquiries.",
  "cardStoriesTitle": "Stories",
  "cardPagesTitle": "Pages",
  "comingSoon": "Coming soon",
  "uploadTitle": "Upload photos",
  "uploadHint": "Drag files here or click (JPEG, PNG, WebP, AVIF)",
  "uploadDone": "Uploaded",
  "uploadError": "Failed",
  "uploading": "Uploading …",
  "photosTitle": "Photos",
  "photosEmpty": "No photos yet.",
  "altDe": "Alt text (German)",
  "altEn": "Alt text (English)",
  "published": "Published",
  "highlight": "Highlight",
  "cover": "Cover",
  "tags": "Tags",
  "save": "Save",
  "saving": "Saving …",
  "saved": "Saved",
  "saveError": "Saving failed",
  "bookingsTitle": "Inquiries",
  "bookingsEmpty": "No inquiries yet."
}
```

- [ ] **Step 3: Verify message parity and formatting**

Run: `pnpm test` (the existing `tests/unit/lib/i18n.test.ts` covers message integrity) and `pnpm format`
Expected: tests PASS, prettier rewrites the JSON files consistently.

- [ ] **Step 4: Commit**

```bash
git add src/messages/de.json src/messages/en.json
git commit -m "feat(studio): add studio i18n messages (de/en)"
```

---

### Task 2: Proxy gate for /studio

**Files:**

- Test: `tests/e2e/studio.spec.ts`
- Modify: `src/proxy.ts:39-74`

- [ ] **Step 1: Write the failing e2e test**

Create `tests/e2e/studio.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

// /studio is gated like /admin: Neon Auth session + role=admin required.
// Unauthenticated visits are redirected to /sign-in with a `next` param.
test("unauthenticated /studio redirects to sign-in", async ({ page }) => {
  await page.goto("/studio");
  await expect(page).toHaveURL(/\/sign-in/);
  expect(page.url()).toContain("next=%2Fstudio");
});

test("unauthenticated /studio/fotos redirects to sign-in", async ({ page }) => {
  await page.goto("/studio/fotos");
  await expect(page).toHaveURL(/\/sign-in/);
  expect(page.url()).toContain("next=%2Fstudio%2Ffotos");
});

// Authenticated journey (upload photo → appears in grid) needs a Neon Auth
// test user — same blocker as the fixme in tests/e2e/auth.spec.ts. Until that
// fixture exists, the upload flow is verified manually (see the Fotos task).
test.fixme("admin can upload a photo and see it in the studio grid", () => {});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm test:e2e tests/e2e/studio.spec.ts`
Expected: FAIL — `/studio` currently falls through to intl routing and 404s (no redirect to `/sign-in`).

- [ ] **Step 3: Extend the gate in `src/proxy.ts`**

Replace the entire `// Gate /admin: …` block (lines 39–74) with:

```ts
// Gate /admin and /studio: Neon Auth is the only login. Payload admin trusts
// the same session via the `neon` custom auth strategy (no separate CMS
// password). /studio pages live inside the [locale] tree, so after the gate
// they must continue through intl routing instead of NextResponse.next.
const isAdminPath = pathname.startsWith("/admin");
const isStudioPath =
  pathname === "/studio" ||
  pathname.startsWith("/studio/") ||
  pathname === "/en/studio" ||
  pathname.startsWith("/en/studio/");

if (isAdminPath || isStudioPath) {
  let { data: session } = await auth.getSession();
  if (!session?.user) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (session.user.role !== "admin" && isAdminEmail(session.user.email)) {
    await promoteNeonAdminByEmail(session.user.email);
    ({ data: session } = await auth.getSession());
  }

  if (session?.user?.role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    url.searchParams.set("error", "admin_required");
    return NextResponse.redirect(url);
  }

  if (isAdminPath) {
    // Native Payload login is disabled (Neon-only auth), so the legacy
    // /admin/login route can only render an empty Payload splash. Funnel it
    // back through the gate → dashboard if signed in, → /sign-in if not.
    if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  return handleI18nRouting(request);
}
```

- [ ] **Step 4: Run the e2e tests to confirm they pass**

Run: `pnpm test:e2e tests/e2e/studio.spec.ts tests/e2e/admin-login.spec.ts`
Expected: PASS (both new studio tests and the existing admin gate test — confirms no regression).

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/studio.spec.ts src/proxy.ts
git commit -m "feat(studio): gate /studio behind the admin session check"
```

---

### Task 3: Zod schemas

**Files:**

- Create: `src/lib/studio/schemas.ts`
- Test: `tests/unit/lib/studio-schemas.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/lib/studio-schemas.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { photoMetaSchema } from "@/lib/studio/schemas";

const base = { id: 7, altDe: "Torjubel", published: false, isHighlight: false, isCover: false };

describe("photoMetaSchema", () => {
  it("accepts valid input without altEn or tagIds", () => {
    const result = photoMetaSchema.parse({ ...base, altDe: "Torjubel nach dem 2:1" });
    expect(result.altEn).toBeUndefined();
    expect(result.tagIds).toBeUndefined();
    expect(result.altDe).toBe("Torjubel nach dem 2:1");
  });

  it("trims and accepts altEn when present", () => {
    const result = photoMetaSchema.parse({ ...base, altEn: "  Goal celebration  " });
    expect(result.altEn).toBe("Goal celebration");
  });

  it("accepts tagIds as positive integers", () => {
    const result = photoMetaSchema.parse({ ...base, tagIds: [1, 2, 3] });
    expect(result.tagIds).toEqual([1, 2, 3]);
  });

  it("rejects an empty altDe", () => {
    expect(() => photoMetaSchema.parse({ ...base, altDe: "   " })).toThrow();
  });

  it("rejects a non-integer id", () => {
    expect(() => photoMetaSchema.parse({ ...base, id: 1.5 })).toThrow();
  });

  it("rejects non-integer tagIds", () => {
    expect(() => photoMetaSchema.parse({ ...base, tagIds: ["a"] })).toThrow();
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm test tests/unit/lib/studio-schemas.test.ts`
Expected: FAIL — `Cannot find module '@/lib/studio/schemas'`.

- [ ] **Step 3: Implement the schema**

Create `src/lib/studio/schemas.ts`:

```ts
import { z } from "zod";

export const photoMetaSchema = z.object({
  id: z.number().int().positive(),
  altDe: z.string().trim().min(1).max(300),
  altEn: z.string().trim().max(300).optional(),
  published: z.boolean(),
  isHighlight: z.boolean(),
  isCover: z.boolean(),
  tagIds: z.array(z.number().int().positive()).optional(),
});

export type PhotoMetaInput = z.infer<typeof photoMetaSchema>;
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `pnpm test tests/unit/lib/studio-schemas.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/studio/schemas.ts tests/unit/lib/studio-schemas.test.ts
git commit -m "feat(studio): add photo metadata schema"
```

---

### Task 4: Localized-value helper

The Studio editor shows DE and EN alt text side-by-side, so photos are fetched with `locale: "all"`, which makes localized fields come back as `{ de, en }` objects instead of strings. This helper normalizes both shapes.

**Files:**

- Create: `src/lib/studio/localized.ts`
- Test: `tests/unit/lib/studio-localized.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/lib/studio-localized.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { altFor } from "@/lib/studio/localized";

describe("altFor", () => {
  it("returns a plain string as-is for any locale", () => {
    expect(altFor("Torjubel", "de")).toBe("Torjubel");
    expect(altFor("Torjubel", "en")).toBe("Torjubel");
  });

  it("picks the requested locale from a localized object", () => {
    const value = { de: "Torjubel", en: "Goal celebration" };
    expect(altFor(value, "de")).toBe("Torjubel");
    expect(altFor(value, "en")).toBe("Goal celebration");
  });

  it("returns empty string for missing values", () => {
    expect(altFor(null, "de")).toBe("");
    expect(altFor(undefined, "en")).toBe("");
    expect(altFor({ de: "nur deutsch" }, "en")).toBe("");
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `pnpm test tests/unit/lib/studio-localized.test.ts`
Expected: FAIL — `Cannot find module '@/lib/studio/localized'`.

- [ ] **Step 3: Implement the helper**

Create `src/lib/studio/localized.ts`:

```ts
/**
 * Payload returns localized fields as plain strings for a single locale, or as
 * `{ de, en }` objects when queried with `locale: "all"`. Normalize both.
 */
export type LocalizedText = string | { de?: string | null; en?: string | null } | null | undefined;

export function altFor(value: LocalizedText, locale: "de" | "en"): string {
  if (typeof value === "string") return value;
  return value?.[locale] ?? "";
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `pnpm test tests/unit/lib/studio-localized.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/studio/localized.ts tests/unit/lib/studio-localized.test.ts
git commit -m "feat(studio): add localized text helper"
```

---

### Task 5: Photo data layer (queries + upload)

These functions are the Payload cut-line: every Studio read/write of photos goes through this module. They assume the caller has already verified the admin session (route handler and pages do that), hence `overrideAccess: true` — same pattern as `src/app/api/booking/route.ts:55`.

**Files:**

- Create: `src/lib/studio/photos.ts`

- [ ] **Step 1: Implement the module**

Create `src/lib/studio/photos.ts`:

```ts
import "server-only";
import { getPayload } from "payload";
import config from "@/payload/payload.config";
import { photoSrc } from "@/lib/payload/media";
import { altFor, type LocalizedText } from "@/lib/studio/localized";
import type { Photo } from "@/payload-types";

export type StudioPhoto = {
  id: number;
  filename: string;
  thumbUrl: string | null;
  altDe: string;
  altEn: string;
  published: boolean;
  isHighlight: boolean;
  isCover: boolean;
  tagIds: number[];
  createdAt: string;
};

export type StudioTag = { id: number; name: string };

export async function listStudioTags(): Promise<StudioTag[]> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "tags",
    sort: "name",
    limit: 100,
    depth: 0,
    locale: "de",
    overrideAccess: true,
  });
  return docs.map((tag) => ({ id: tag.id, name: tag.name }));
}

export async function listStudioPhotos(): Promise<StudioPhoto[]> {
  const payload = await getPayload({ config });
  // locale: "all" so the editor can show DE and EN alt text side-by-side.
  const { docs } = await payload.find({
    collection: "photos",
    sort: "-createdAt",
    limit: 200,
    depth: 0,
    locale: "all",
    overrideAccess: true,
  });
  return docs.map((doc) => {
    const photo = doc as Photo;
    return {
      id: photo.id,
      filename: photo.filename ?? "",
      thumbUrl: photoSrc(photo, "thumbnail"),
      altDe: altFor(photo.alt as LocalizedText, "de"),
      altEn: altFor(photo.alt as LocalizedText, "en"),
      published: Boolean(photo.published),
      isHighlight: Boolean(photo.isHighlight),
      isCover: Boolean(photo.isCover),
      // depth: 0 → tags come back as numeric ids.
      tagIds: (photo.tags ?? []).filter((tag): tag is number => typeof tag === "number"),
      createdAt: photo.createdAt,
    };
  });
}

export async function createPhotoFromUpload(file: {
  data: Buffer;
  name: string;
  mimetype: string;
  size: number;
}): Promise<{ id: number }> {
  const payload = await getPayload({ config });
  // Beginner-friendly default: derive alt text from the filename; it is
  // editable in the grid right after upload.
  const fallbackAlt =
    file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]+/g, " ")
      .trim() || file.name;
  const doc = await payload.create({
    collection: "photos",
    data: { alt: fallbackAlt, published: false },
    file,
    locale: "de",
    overrideAccess: true,
  });
  return { id: doc.id };
}

export async function updatePhotoMeta(input: {
  id: number;
  altDe: string;
  altEn?: string;
  published: boolean;
  isHighlight: boolean;
  isCover: boolean;
  tagIds?: number[];
}): Promise<void> {
  const payload = await getPayload({ config });
  await payload.update({
    collection: "photos",
    id: input.id,
    data: {
      alt: input.altDe,
      published: input.published,
      isHighlight: input.isHighlight,
      isCover: input.isCover,
      ...(input.tagIds ? { tags: input.tagIds } : {}),
    },
    locale: "de",
    overrideAccess: true,
  });
  if (input.altEn && input.altEn.trim() !== "") {
    await payload.update({
      collection: "photos",
      id: input.id,
      data: { alt: input.altEn },
      locale: "en",
      overrideAccess: true,
    });
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS. If `photo.alt as LocalizedText` errors because the generated `Photo["alt"]` type is `string`, widen via unknown: `altFor(photo.alt as unknown as LocalizedText, "de")`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/studio/photos.ts
git commit -m "feat(studio): add photo data layer (list, upload, meta update)"
```

---

### Task 6: Upload route handler

A route handler (not a server action) because photo files are multi-MB and server actions have a small default body limit. Admin-checked inside the handler — the proxy gate does not cover `/api/*`.

**Files:**

- Create: `src/app/api/studio/upload/route.ts`

- [ ] **Step 1: Implement the route**

Create `src/app/api/studio/upload/route.ts`:

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { createPhotoFromUpload } from "@/lib/studio/photos";

export const dynamic = "force-dynamic";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 30 * 1024 * 1024; // 30 MB — matches large match-day JPEGs.

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 30 MB)." }, { status: 413 });
  }

  try {
    const { id } = await createPhotoFromUpload({
      data: Buffer.from(await file.arrayBuffer()),
      name: file.name,
      mimetype: file.type,
      size: file.size,
    });
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) {
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

- [ ] **Step 2: Typecheck and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/studio/upload/route.ts
git commit -m "feat(studio): add photo upload endpoint"
```

---

### Task 7: Photo metadata server action

**Files:**

- Create: `src/lib/studio/actions/photos.ts`

- [ ] **Step 1: Implement the action**

Create `src/lib/studio/actions/photos.ts`:

```ts
"use server";

import { auth } from "@/lib/auth/server";
import { photoMetaSchema } from "@/lib/studio/schemas";
import { updatePhotoMeta } from "@/lib/studio/photos";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: "forbidden" | "validation" | "server" };

export async function updatePhotoMetaAction(input: unknown): Promise<ActionResult> {
  // Server actions are public POST endpoints — re-check the session here,
  // never rely on the proxy gate alone.
  const { data: session } = await auth.getSession();
  if (session?.user?.role !== "admin") {
    return { ok: false, error: "forbidden" };
  }

  const parsed = photoMetaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "validation" };
  }

  try {
    await updatePhotoMeta(parsed.data);
    return { ok: true };
  } catch {
    return { ok: false, error: "server" };
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/studio/actions/photos.ts
git commit -m "feat(studio): add photo metadata update action"
```

---

### Task 8: Bookings data layer

**Files:**

- Create: `src/lib/studio/bookings.ts`

- [ ] **Step 1: Implement the module**

Create `src/lib/studio/bookings.ts`:

```ts
import "server-only";
import { getPayload } from "payload";
import config from "@/payload/payload.config";
import type { Booking } from "@/payload-types";

export async function listStudioBookings(): Promise<Booking[]> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "bookings",
    sort: "-createdAt",
    limit: 100,
    depth: 0,
    overrideAccess: true,
  });
  return docs;
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/studio/bookings.ts
git commit -m "feat(studio): add bookings data layer"
```

---

### Task 9: Studio layout and dashboard

**Files:**

- Create: `src/app/(site)/[locale]/(auth)/studio/layout.tsx`
- Create: `src/app/(site)/[locale]/(auth)/studio/page.tsx`

- [ ] **Step 1: Create the layout (guard + nav shell)**

Create `src/app/(site)/[locale]/(auth)/studio/layout.tsx`:

```tsx
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

const navLinkClass =
  "border-hairline text-ink hover:bg-ink hover:text-canvas inline-flex rounded-sm border px-3 py-1.5 font-mono text-xs tracking-[0.15em] uppercase transition-colors";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  // Defense in depth: the proxy already gates /studio, but layouts must not
  // trust middleware alone.
  await requireAdmin("/studio");
  const t = await getTranslations("studio");

  return (
    <div className="mx-auto max-w-5xl px-4 pt-32 pb-16">
      <header className="mb-10">
        <h1 className="font-display text-3xl tracking-tight">{t("title")}</h1>
        <p className="text-ink-muted mt-1 text-sm">{t("subtitle")}</p>
        <nav className="mt-5 flex flex-wrap gap-3">
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={"/studio" as any}
            className={navLinkClass}
          >
            {t("navOverview")}
          </Link>
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={"/studio/fotos" as any}
            className={navLinkClass}
          >
            {t("navPhotos")}
          </Link>
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={"/studio/anfragen" as any}
            className={navLinkClass}
          >
            {t("navBookings")}
          </Link>
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={"/admin" as any}
            className={navLinkClass}
          >
            {t("advancedEditor")} ↗
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create the dashboard page**

Create `src/app/(site)/[locale]/(auth)/studio/page.tsx`:

```tsx
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

const cardClass =
  "border-hairline hover:bg-ink hover:text-canvas group block rounded-md border p-6 transition-colors";

export default async function StudioDashboardPage() {
  const t = await getTranslations("studio");

  return (
    <main className="grid gap-4 sm:grid-cols-2">
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={"/studio/fotos" as any}
        className={cardClass}
      >
        <h2 className="font-display text-xl tracking-tight">{t("cardPhotosTitle")}</h2>
        <p className="text-ink-muted group-hover:text-canvas/70 mt-1 text-sm">
          {t("cardPhotosBody")}
        </p>
      </Link>
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={"/studio/anfragen" as any}
        className={cardClass}
      >
        <h2 className="font-display text-xl tracking-tight">{t("cardBookingsTitle")}</h2>
        <p className="text-ink-muted group-hover:text-canvas/70 mt-1 text-sm">
          {t("cardBookingsBody")}
        </p>
      </Link>
      <div className="border-hairline rounded-md border border-dashed p-6 opacity-60">
        <h2 className="font-display text-xl tracking-tight">{t("cardStoriesTitle")}</h2>
        <p className="text-ink-muted mt-1 text-sm">{t("comingSoon")}</p>
      </div>
      <div className="border-hairline rounded-md border border-dashed p-6 opacity-60">
        <h2 className="font-display text-xl tracking-tight">{t("cardPagesTitle")}</h2>
        <p className="text-ink-muted mt-1 text-sm">{t("comingSoon")}</p>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify in the dev server**

Run: `pnpm dev`, sign in as an admin, open `http://localhost:3000/studio`
Expected: dashboard renders with 2 active cards + 2 "Bald verfügbar" cards; signed-out visit redirects to `/sign-in?next=/studio`.

- [ ] **Step 4: Typecheck and commit**

```bash
pnpm typecheck
git add "src/app/(site)/[locale]/(auth)/studio/layout.tsx" "src/app/(site)/[locale]/(auth)/studio/page.tsx"
git commit -m "feat(studio): add studio layout and dashboard"
```

---

### Task 10: Photo upload component

**Files:**

- Create: `src/components/studio/photo-upload.tsx`

- [ ] **Step 1: Implement the client uploader**

Uploads strictly one file per request (serverless-timeout safety per the spec); the browser queues the rest sequentially and refreshes the grid at the end.

Create `src/components/studio/photo-upload.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type DragEvent } from "react";
import { useTranslations } from "next-intl";

type QueueItem = { name: string; status: "pending" | "uploading" | "done" | "error" };

export function PhotoUpload() {
  const t = useTranslations("studio");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [busy, setBusy] = useState(false);

  async function uploadFiles(files: File[]) {
    if (busy || files.length === 0) return;
    setBusy(true);
    setQueue(files.map((file) => ({ name: file.name, status: "pending" })));

    // One file per request: large originals + Sharp processing can approach
    // serverless time limits, so never batch.
    for (let i = 0; i < files.length; i += 1) {
      setQueue((q) => q.map((item, idx) => (idx === i ? { ...item, status: "uploading" } : item)));
      const form = new FormData();
      form.append("file", files[i]);
      let ok = false;
      try {
        const response = await fetch("/api/studio/upload", { method: "POST", body: form });
        ok = response.ok;
      } catch {
        ok = false;
      }
      setQueue((q) =>
        q.map((item, idx) => (idx === i ? { ...item, status: ok ? "done" : "error" } : item)),
      );
    }

    setBusy(false);
    router.refresh();
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    void uploadFiles(Array.from(event.dataTransfer.files));
  }

  return (
    <section className="mb-10">
      <h2 className="font-display mb-3 text-xl tracking-tight">{t("uploadTitle")}</h2>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
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
            <li key={`${item.name}-${index}`} className="flex justify-between gap-4">
              <span className="truncate">{item.name}</span>
              <span className="text-ink-muted shrink-0">
                {item.status === "done"
                  ? t("uploadDone")
                  : item.status === "error"
                    ? t("uploadError")
                    : item.status === "uploading"
                      ? t("uploading")
                      : "…"}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/studio/photo-upload.tsx
git commit -m "feat(studio): add drag-drop photo uploader"
```

---

### Task 11: Photo card editor component

**Files:**

- Create: `src/components/studio/photo-card.tsx`

- [ ] **Step 1: Implement the inline editor**

Create `src/components/studio/photo-card.tsx`:

```tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { updatePhotoMetaAction } from "@/lib/studio/actions/photos";
import type { StudioPhoto, StudioTag } from "@/lib/studio/photos";

// text-base keeps inputs at 16px so iOS Safari doesn't auto-zoom on focus.
const fieldClass =
  "border-hairline bg-canvas focus:ring-accent w-full rounded-sm border px-3 py-2 text-base outline-none focus:ring-2";

export function PhotoCard({ photo, tags }: { photo: StudioPhoto; tags: StudioTag[] }) {
  const t = useTranslations("studio");
  const [altDe, setAltDe] = useState(photo.altDe);
  const [altEn, setAltEn] = useState(photo.altEn);
  const [published, setPublished] = useState(photo.published);
  const [isHighlight, setIsHighlight] = useState(photo.isHighlight);
  const [isCover, setIsCover] = useState(photo.isCover);
  const [tagIds, setTagIds] = useState<number[]>(photo.tagIds);
  const [saving, setSaving] = useState(false);

  function toggleTag(id: number) {
    setTagIds((current) =>
      current.includes(id) ? current.filter((tagId) => tagId !== id) : [...current, id],
    );
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    const result = await updatePhotoMetaAction({
      id: photo.id,
      altDe,
      altEn: altEn.trim() === "" ? undefined : altEn,
      published,
      isHighlight,
      isCover,
      tagIds,
    });
    setSaving(false);
    if (result.ok) {
      toast.success(t("saved"));
    } else {
      toast.error(t("saveError"));
    }
  }

  return (
    <li className="border-hairline rounded-md border p-4">
      {photo.thumbUrl ? (
        <Image
          src={photo.thumbUrl}
          alt={photo.altDe || photo.filename}
          width={480}
          height={360}
          className="mb-3 w-full rounded-sm object-cover"
        />
      ) : (
        <div className="border-hairline text-ink-muted mb-3 flex aspect-[4/3] items-center justify-center rounded-sm border text-xs">
          {photo.filename}
        </div>
      )}
      <div className="space-y-2">
        <label className="block text-sm">
          <span className="text-ink-muted mb-1 block text-xs">{t("altDe")}</span>
          <input
            value={altDe}
            onChange={(event) => setAltDe(event.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="block text-sm">
          <span className="text-ink-muted mb-1 block text-xs">{t("altEn")}</span>
          <input
            value={altEn}
            onChange={(event) => setAltEn(event.target.value)}
            className={fieldClass}
          />
        </label>
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={published}
              onChange={(event) => setPublished(event.target.checked)}
            />
            {t("published")}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isHighlight}
              onChange={(event) => setIsHighlight(event.target.checked)}
            />
            {t("highlight")}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isCover}
              onChange={(event) => setIsCover(event.target.checked)}
            />
            {t("cover")}
          </label>
        </div>
        {tags.length > 0 ? (
          <div className="text-sm">
            <span className="text-ink-muted mb-1 block text-xs">{t("tags")}</span>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {tags.map((tag) => (
                <label key={tag.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={tagIds.includes(tag.id)}
                    onChange={() => toggleTag(tag.id)}
                  />
                  {tag.name}
                </label>
              ))}
            </div>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || altDe.trim() === ""}
          className="border-hairline text-ink hover:bg-ink hover:text-canvas inline-flex rounded-sm border px-4 py-2 font-mono text-xs tracking-[0.15em] uppercase transition-colors disabled:opacity-50"
        >
          {saving ? t("saving") : t("save")}
        </button>
      </div>
    </li>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS. If `next/image` rejects a relative `/media/...` thumbnail URL in dev, that is fine in prod (R2 absolute URLs); for dev, replace `Image` with a plain `img` tag plus `// eslint-disable-next-line @next/next/no-img-element` ONLY if lint/build actually fails — do not change it preemptively.

- [ ] **Step 3: Commit**

```bash
git add src/components/studio/photo-card.tsx
git commit -m "feat(studio): add inline photo metadata editor card"
```

---

### Task 12: Fotos page

**Files:**

- Create: `src/app/(site)/[locale]/(auth)/studio/fotos/page.tsx`

- [ ] **Step 1: Implement the page**

Create `src/app/(site)/[locale]/(auth)/studio/fotos/page.tsx`:

```tsx
import { getTranslations } from "next-intl/server";
import { listStudioPhotos, listStudioTags } from "@/lib/studio/photos";
import { PhotoUpload } from "@/components/studio/photo-upload";
import { PhotoCard } from "@/components/studio/photo-card";

export const dynamic = "force-dynamic";

export default async function StudioPhotosPage() {
  const t = await getTranslations("studio");
  const [photos, tags] = await Promise.all([listStudioPhotos(), listStudioTags()]);

  return (
    <main>
      <PhotoUpload />
      <h2 className="font-display mb-4 text-xl tracking-tight">{t("photosTitle")}</h2>
      {photos.length === 0 ? (
        <p className="text-ink-muted">{t("photosEmpty")}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} tags={tags} />
          ))}
        </ul>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Manual verification in dev**

Run: `pnpm dev`, open `http://localhost:3000/studio/fotos` as admin.
Expected:

1. Existing photos render in a grid with DE/EN alt inputs.
2. Drag a JPEG onto the dropzone → status goes uploading → Hochgeladen → grid refreshes with the new photo (unpublished).
3. Edit alt text, klick Speichern → "Gespeichert" toast; reload page → value persisted.
4. The new photo appears in Payload `/admin` → Fotos with the same metadata (both systems share the backend).

- [ ] **Step 3: Typecheck and commit**

```bash
pnpm typecheck
git add "src/app/(site)/[locale]/(auth)/studio/fotos/page.tsx"
git commit -m "feat(studio): add fotos page (grid + upload + inline editing)"
```

---

### Task 13: Anfragen (bookings inbox) page

**Files:**

- Create: `src/app/(site)/[locale]/(auth)/studio/anfragen/page.tsx`

- [ ] **Step 1: Implement the page**

Pattern mirrors `src/app/(site)/[locale]/(auth)/account/bookings/page.tsx`, but lists all inquiries (admin view), not just the current user's.

Create `src/app/(site)/[locale]/(auth)/studio/anfragen/page.tsx`:

```tsx
import { getTranslations } from "next-intl/server";
import { listStudioBookings } from "@/lib/studio/bookings";

export const dynamic = "force-dynamic";

export default async function StudioBookingsPage() {
  const t = await getTranslations("studio");
  const bookings = await listStudioBookings();

  return (
    <main>
      <h2 className="font-display mb-4 text-xl tracking-tight">{t("bookingsTitle")}</h2>
      {bookings.length === 0 ? (
        <p className="text-ink-muted">{t("bookingsEmpty")}</p>
      ) : (
        <ul className="space-y-4">
          {bookings.map((booking) => (
            <li key={booking.id} className="border-hairline rounded-md border p-4">
              <div className="text-ink-muted flex flex-wrap justify-between gap-2 text-sm">
                <span>{new Date(booking.createdAt).toLocaleString()}</span>
                <span className="font-mono text-xs uppercase">{booking.locale}</span>
              </div>
              <div className="mt-1 font-medium">
                {booking.name} · {booking.email}
              </div>
              {booking.organization ? (
                <div className="text-ink-muted text-sm">{booking.organization}</div>
              ) : null}
              <p className="mt-2 text-sm whitespace-pre-wrap">{booking.message}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Manual verification in dev**

Open `http://localhost:3000/studio/anfragen` as admin.
Expected: all booking inquiries listed newest-first with name, email, organization, message, locale badge.

- [ ] **Step 3: Typecheck and commit**

```bash
pnpm typecheck
git add "src/app/(site)/[locale]/(auth)/studio/anfragen/page.tsx"
git commit -m "feat(studio): add anfragen inbox"
```

---

### Task 14: Account quick link + final verification

**Files:**

- Modify: `src/app/(site)/[locale]/(auth)/account/page.tsx:28-36`

- [ ] **Step 1: Add the Studio quick link for admins**

In `src/app/(site)/[locale]/(auth)/account/page.tsx`, inside the existing `{user.role === "admin" ? (...) : null}` block, add a Studio link BEFORE the CMS link, so the block becomes:

```tsx
{
  user.role === "admin" ? (
    <>
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={"/studio" as any}
        className={quickLinkClass}
      >
        {t("openStudio")}
      </Link>
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={"/admin" as any}
        className={quickLinkClass}
      >
        {t("openCms")}
      </Link>
    </>
  ) : null;
}
```

- [ ] **Step 2: Run the full verification suite**

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

Expected: all PASS, build succeeds.

- [ ] **Step 3: Run the e2e suite**

Run: `pnpm test:e2e`
Expected: PASS, including `tests/e2e/studio.spec.ts` and all pre-existing specs (no regressions from the proxy change).

- [ ] **Step 4: Commit**

```bash
git add "src/app/(site)/[locale]/(auth)/account/page.tsx"
git commit -m "feat(studio): link studio from account quick links"
```

---

## Out of scope for Phase 1 (per spec)

- Story editor / block builder (Phase 2).
- Marketing pages, Stammdaten, Rechtliches, Einstellungen screens (Phase 3).
- The mini Lexical rich-text editor (first needed for Phase 2 fields; photo captions stay editable in `/admin` until then).
- Booking status workflow (inbox is read-only).
- No schema or migration changes anywhere in this phase.
