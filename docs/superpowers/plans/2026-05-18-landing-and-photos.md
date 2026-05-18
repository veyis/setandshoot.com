# Landing Page + Sample Photos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the type-only landing page with a portfolio-first, photo-driven page (rotating hero, highlights strip, stories teaser, about teaser, booking CTA), and seed the Payload `Photos` collection with 10 stock placeholder photos so the page is alive in development.

**Architecture:** Five new server/client components under `src/components/landing/` assembled by a rewritten `src/app/(site)/[locale]/page.tsx`. All photo and story data comes from Payload via `payload.find` at request time. Stock photos and one sample story are seeded once via `pnpm seed:photos` (runs Payload's local API). Photo files live in `public/media/seeds/` and Payload writes resized variants to `public/media/`.

**Tech Stack:** Next.js 16 App Router, React 19, Payload 3.84.1 (local API + `@payloadcms/db-postgres`), next-intl v4, Tailwind v4, Vitest 4 (jsdom env added for client-component tests), `@testing-library/react`, Playwright.

**Spec reference:** `docs/superpowers/specs/2026-05-18-landing-and-photos-design.md`

**Conventions used here:**

- Server components by default; `'use client'` only on HeroRotator (interactive).
- All payload queries pass `locale` from the `[locale]` route param.
- `force-dynamic` on the page (already the project pattern).
- Stock photos picked by hand from Unsplash and dropped into `public/media/seeds/` before the seed runs — no HTTP at seed time.
- Stories query uses `published: { equals: true }` (boolean field on the Stories collection), not `_status`.
- Photos seeded via Payload local API so resized variants generate automatically.
- Test files: `tests/unit/...` per existing vitest convention.

---

## File structure delivered by this plan

```
new:
  public/media/seeds/01-hero-spike.jpg            (committed — sourced by hand)
  public/media/seeds/02-hero-block.jpg
  public/media/seeds/03-hero-serve.jpg
  public/media/seeds/04-hero-celebration.jpg
  public/media/seeds/05-hero-dive.jpg
  public/media/seeds/06-story-cover.jpg
  public/media/seeds/07-story-set.jpg
  public/media/seeds/08-story-aftermatch.jpg
  public/media/seeds/09-portrait.jpg
  public/media/seeds/10-action-wide.jpg
  scripts/seed/photo-manifest.ts                  (manifest of the 10 photos with attribution)
  scripts/seed/photos.ts                          (seed runner)
  scripts/seed/payload-bootstrap.ts               (shared local-API setup for seed scripts)
  src/components/landing/hero-rotator.tsx         (client)
  src/components/landing/highlights-strip.tsx     (server)
  src/components/landing/stories-teaser.tsx       (server)
  src/components/landing/about-teaser.tsx         (server)
  src/components/landing/booking-cta.tsx          (server)
  src/components/landing/photo-image.tsx          (shared <Image> wrapper that reads Payload sizes)
  tests/unit/components/landing/hero-rotator.test.tsx
  tests/unit/setup-jsdom.ts                       (setupFiles — window.matchMedia stub)

modified:
  src/app/(site)/[locale]/page.tsx                (rewrite)
  src/messages/de.json                            (new home.* keys)
  src/messages/en.json                            (new home.* keys)
  package.json                                    ("seed:photos" script, devDeps: jsdom + @testing-library/react)
  vitest.config.ts                                (jsdom env, *.test.tsx glob, setupFiles)
  tests/e2e/smoke.spec.ts                         (landing assertions)
```

---

## Task 1: Source and place the 10 stock photos

This task is partly manual (curation) and partly mechanical (file placement). Photos are committed to git so the seed is reproducible.

**Files:**

- Create: `public/media/seeds/*.jpg` (10 files)

- [ ] **Step 1: Pick 10 photos from Unsplash**

Open `https://unsplash.com/s/photos/volleyball` and select 10 photos matching this brief:

| Role             | Count | Notes                                                                                                                                                                                                                                                   |
| ---------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero rotation    | 5     | Wide landscape orientation, dramatic action — spike, block, serve, celebration, dive.                                                                                                                                                                   |
| Story gallery    | 3     | Match-narrative shots — one striking cover, one mid-action, one quieter aftermath/bench moment.                                                                                                                                                         |
| Portrait (about) | 1     | Portrait orientation, single subject, ideally female athlete or generic photographer-at-work. If no Unsplash result reads as a credible portrait of Belin, pick a non-portrait scene and the AboutTeaser will fall back to typographic-only at runtime. |
| Action overflow  | 1     | Wide horizontal action shot — used both in the highlights strip and as the BookingCTA background.                                                                                                                                                       |

For each photo, record: Unsplash photo ID (the slug fragment after `/photos/`), photographer name, photo URL. Stick to photos under Unsplash's standard free license (no Unsplash+ paid photos).

- [ ] **Step 2: Download photos at full resolution**

For each photo, click the download button on Unsplash, select "Large" (≥ 2560px wide). Files arrive as `<photographer>-<id>.jpg`.

- [ ] **Step 3: Rename and place files**

Rename to the slot names below and place in `public/media/seeds/`:

```
public/media/seeds/01-hero-spike.jpg
public/media/seeds/02-hero-block.jpg
public/media/seeds/03-hero-serve.jpg
public/media/seeds/04-hero-celebration.jpg
public/media/seeds/05-hero-dive.jpg
public/media/seeds/06-story-cover.jpg
public/media/seeds/07-story-set.jpg
public/media/seeds/08-story-aftermatch.jpg
public/media/seeds/09-portrait.jpg
public/media/seeds/10-action-wide.jpg
```

- [ ] **Step 4: Strip EXIF and reduce filesize**

Each JPEG should be ≤ 600 KB. From the repo root:

```bash
for f in public/media/seeds/*.jpg; do
  pnpm exec sharp-cli --input "$f" --output "$f" resize 2560 -- jpeg --quality 85 --mozjpeg
done
```

If `sharp-cli` is not already a dep, use `magick`/`convert` from ImageMagick:

```bash
for f in public/media/seeds/*.jpg; do
  magick "$f" -strip -resize 2560x -quality 85 "$f"
done
```

Expected: each file is ≤ 600 KB; total seeds directory is ≤ 6 MB.

- [ ] **Step 5: Commit**

```bash
git add public/media/seeds/
git commit -m "feat(seed): add 10 stock volleyball photos for landing-page seed"
```

---

## Task 2: Create the photo manifest

The manifest is a TypeScript file the seed reads. It lives next to the seed script so attribution and role flags are version-controlled alongside the photos.

**Files:**

- Create: `scripts/seed/photo-manifest.ts`

- [ ] **Step 1: Create the manifest**

```ts
// scripts/seed/photo-manifest.ts
export type PhotoManifestEntry = {
  /** filename inside public/media/seeds/ */
  file: string;
  /** absolute path slot for Payload upload — Payload will rename internally */
  altDe: string;
  altEn: string;
  isHighlight: boolean;
  isCover: boolean;
  /** ids of tags to attach by slug (resolved at seed time) */
  tagSlugs: string[];
  /** attribution shown nowhere user-facing yet but kept for license compliance */
  unsplashId: string;
  photographer: string;
};

export const SEED_TAG_SLUGS = ["seed", "portrait"] as const;

export const PHOTO_MANIFEST: PhotoManifestEntry[] = [
  {
    file: "01-hero-spike.jpg",
    altDe: "Angreiferin schlägt den Ball über das Netz",
    altEn: "Hitter spiking the ball over the net",
    isHighlight: true,
    isCover: false,
    tagSlugs: ["seed"],
    unsplashId: "REPLACE_WITH_ID",
    photographer: "REPLACE_WITH_NAME",
  },
  {
    file: "02-hero-block.jpg",
    altDe: "Doppelblock am Netz",
    altEn: "Two players blocking at the net",
    isHighlight: true,
    isCover: false,
    tagSlugs: ["seed"],
    unsplashId: "REPLACE_WITH_ID",
    photographer: "REPLACE_WITH_NAME",
  },
  {
    file: "03-hero-serve.jpg",
    altDe: "Sprungaufschlag im Volleyballspiel",
    altEn: "Jump serve in a volleyball match",
    isHighlight: true,
    isCover: false,
    tagSlugs: ["seed"],
    unsplashId: "REPLACE_WITH_ID",
    photographer: "REPLACE_WITH_NAME",
  },
  {
    file: "04-hero-celebration.jpg",
    altDe: "Mannschaft feiert einen Punkt",
    altEn: "Team celebrating a point",
    isHighlight: true,
    isCover: false,
    tagSlugs: ["seed"],
    unsplashId: "REPLACE_WITH_ID",
    photographer: "REPLACE_WITH_NAME",
  },
  {
    file: "05-hero-dive.jpg",
    altDe: "Abwehrspielerin im Hechtsprung",
    altEn: "Libero diving for a dig",
    isHighlight: true,
    isCover: false,
    tagSlugs: ["seed"],
    unsplashId: "REPLACE_WITH_ID",
    photographer: "REPLACE_WITH_NAME",
  },
  {
    file: "06-story-cover.jpg",
    altDe: "Cover-Bild: Spielerin vor leerer Tribüne",
    altEn: "Cover shot: player in front of an empty stand",
    isHighlight: false,
    isCover: true,
    tagSlugs: ["seed"],
    unsplashId: "REPLACE_WITH_ID",
    photographer: "REPLACE_WITH_NAME",
  },
  {
    file: "07-story-set.jpg",
    altDe: "Zuspielerin stellt den Ball",
    altEn: "Setter delivering an assist",
    isHighlight: false,
    isCover: false,
    tagSlugs: ["seed"],
    unsplashId: "REPLACE_WITH_ID",
    photographer: "REPLACE_WITH_NAME",
  },
  {
    file: "08-story-aftermatch.jpg",
    altDe: "Spielerin auf der Bank nach dem Match",
    altEn: "Player on the bench after the match",
    isHighlight: false,
    isCover: false,
    tagSlugs: ["seed"],
    unsplashId: "REPLACE_WITH_ID",
    photographer: "REPLACE_WITH_NAME",
  },
  {
    file: "09-portrait.jpg",
    altDe: "Porträt einer Volleyballspielerin",
    altEn: "Portrait of a volleyball player",
    isHighlight: false,
    isCover: false,
    tagSlugs: ["seed", "portrait"],
    unsplashId: "REPLACE_WITH_ID",
    photographer: "REPLACE_WITH_NAME",
  },
  {
    file: "10-action-wide.jpg",
    altDe: "Spielszene im Weitwinkel",
    altEn: "Wide-angle match scene",
    isHighlight: true,
    isCover: false,
    tagSlugs: ["seed"],
    unsplashId: "REPLACE_WITH_ID",
    photographer: "REPLACE_WITH_NAME",
  },
];
```

Replace each `REPLACE_WITH_ID` and `REPLACE_WITH_NAME` with the actual values from Task 1.

- [ ] **Step 2: Commit**

```bash
git add scripts/seed/photo-manifest.ts
git commit -m "feat(seed): photo manifest for landing seed (attribution + role flags)"
```

---

## Task 3: Bootstrap Payload local API for seed scripts

A tiny helper that loads `.env.local`, imports the Payload config, and returns an initialized Payload instance. Reused by the seed script.

**Files:**

- Create: `scripts/seed/payload-bootstrap.ts`

- [ ] **Step 1: Create the bootstrap**

```ts
// scripts/seed/payload-bootstrap.ts
import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";
import config from "../../src/payload/payload.config";

const dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.PAYLOAD_CONFIG_PATH ??= path.resolve(dirname, "../../src/payload/payload.config.ts");

export async function getSeedPayload() {
  return getPayload({ config });
}

export const SEEDS_DIR = path.resolve(dirname, "../../public/media/seeds");
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add scripts/seed/payload-bootstrap.ts
git commit -m "feat(seed): shared Payload bootstrap for seed scripts"
```

---

## Task 4: Seed script — Tags and Photos

**Files:**

- Create: `scripts/seed/photos.ts`
- Modify: `package.json` (add `seed:photos` script)

- [ ] **Step 1: Create the seed runner**

```ts
// scripts/seed/photos.ts
import fs from "node:fs/promises";
import path from "node:path";
import { getSeedPayload, SEEDS_DIR } from "./payload-bootstrap";
import { PHOTO_MANIFEST, SEED_TAG_SLUGS, type PhotoManifestEntry } from "./photo-manifest";

const TAG_NAMES: Record<(typeof SEED_TAG_SLUGS)[number], { de: string; en: string }> = {
  seed: { de: "Seed", en: "Seed" },
  portrait: { de: "Porträt", en: "Portrait" },
};

async function ensureTags(payload: Awaited<ReturnType<typeof getSeedPayload>>) {
  const ids: Record<string, number> = {};
  for (const slug of SEED_TAG_SLUGS) {
    const existing = await payload.find({
      collection: "tags",
      where: { slug: { equals: slug } },
      limit: 1,
    });
    if (existing.docs[0]) {
      ids[slug] = existing.docs[0].id as number;
      continue;
    }
    const created = await payload.create({
      collection: "tags",
      data: {
        slug,
        name: TAG_NAMES[slug].de,
        published: true,
      },
      locale: "de",
    });
    // Set the EN locale name
    await payload.update({
      collection: "tags",
      id: created.id,
      data: { name: TAG_NAMES[slug].en },
      locale: "en",
    });
    ids[slug] = created.id as number;
  }
  return ids;
}

async function ensurePhoto(
  payload: Awaited<ReturnType<typeof getSeedPayload>>,
  entry: PhotoManifestEntry,
  tagIds: Record<string, number>,
): Promise<number> {
  // Idempotency: a photo seeded earlier ends up with filename === entry.file (Payload preserves it)
  const existing = await payload.find({
    collection: "photos",
    where: { filename: { equals: entry.file } },
    limit: 1,
  });
  if (existing.docs[0]) {
    payload.logger.info(`[seed] photo already present: ${entry.file}`);
    return existing.docs[0].id as number;
  }

  const filepath = path.join(SEEDS_DIR, entry.file);
  const buffer = await fs.readFile(filepath);
  const stat = await fs.stat(filepath);

  const created = await payload.create({
    collection: "photos",
    data: {
      alt: entry.altDe,
      tags: entry.tagSlugs.map((slug) => tagIds[slug]),
      isHighlight: entry.isHighlight,
      isCover: entry.isCover,
    },
    locale: "de",
    file: {
      data: buffer,
      mimetype: "image/jpeg",
      name: entry.file,
      size: stat.size,
    },
  });

  // Set EN alt
  await payload.update({
    collection: "photos",
    id: created.id,
    data: { alt: entry.altEn },
    locale: "en",
  });

  return created.id as number;
}

export async function seedPhotos() {
  const payload = await getSeedPayload();
  payload.logger.info("[seed] ensuring tags…");
  const tagIds = await ensureTags(payload);

  payload.logger.info("[seed] importing photos…");
  const photoIds: Record<string, number> = {};
  for (const entry of PHOTO_MANIFEST) {
    photoIds[entry.file] = await ensurePhoto(payload, entry, tagIds);
  }

  payload.logger.info(`[seed] photos done. imported ${PHOTO_MANIFEST.length} photos.`);
  return { tagIds, photoIds };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedPhotos()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("[seed] failed", error);
      process.exit(1);
    });
}
```

- [ ] **Step 2: Add `seed:photos` script to package.json**

In `package.json`, under `"scripts"`, add:

```json
"seed:photos": "tsx scripts/seed/photos.ts",
```

Verify `tsx` is in devDependencies:

```bash
grep '"tsx"' package.json
```

If absent:

```bash
pnpm add -D tsx
```

- [ ] **Step 3: Run the seed**

```bash
pnpm seed:photos
```

Expected output:

```
[seed] ensuring tags…
[seed] importing photos…
[seed] photos done. imported 10 photos.
```

- [ ] **Step 4: Verify in DB**

```bash
pnpm payload --help >/dev/null # warms env
psql "$DATABASE_URL" -c "SELECT count(*) FROM payload.photos;"
psql "$DATABASE_URL" -c "SELECT slug FROM payload.tags ORDER BY slug;"
```

Expected: 10 photos, 2 tags (`portrait`, `seed`).

If `psql` isn't installed, use the Neon MCP `run_sql` instead, or open `/admin` in a browser and confirm visually.

- [ ] **Step 5: Verify resized variants on disk**

```bash
ls public/media/ | head -20
```

Expected: each seed photo has `_thumbnail`, `_feed`, and `_full` variants alongside the original. (Payload runs sharp internally.)

- [ ] **Step 6: Commit**

```bash
git add scripts/seed/photos.ts package.json pnpm-lock.yaml public/media/
git commit -m "feat(seed): import seed photos via Payload local API"
```

(The committed `public/media/*.jpg` includes Payload's resized variants — that's intentional. They're the canonical seed output.)

---

## Task 5: Seed script — sample Story document

A separate function in the same seed script creates one published Story with a cover and a sequence-block gallery.

**Files:**

- Modify: `scripts/seed/photos.ts`

- [ ] **Step 1: Add story seeding to `scripts/seed/photos.ts`**

Add to the bottom of the file (before the `if (import.meta.url === …)` block) and update the `seedPhotos` function to call it:

```ts
async function ensureStory(
  payload: Awaited<ReturnType<typeof getSeedPayload>>,
  photoIds: Record<string, number>,
) {
  const slug = "pre-saison-vc-wiesbaden-vs-schwerin";
  const existing = await payload.find({
    collection: "stories",
    where: { slug: { equals: slug } },
    limit: 1,
  });
  if (existing.docs[0]) {
    payload.logger.info(`[seed] story already present: ${slug}`);
    return;
  }

  const coverPhotoId = photoIds["06-story-cover.jpg"];
  const setPhotoId = photoIds["07-story-set.jpg"];
  const aftermatchPhotoId = photoIds["08-story-aftermatch.jpg"];

  const playedAt = new Date();
  playedAt.setUTCDate(playedAt.getUTCDate() - 21);

  const story = await payload.create({
    collection: "stories",
    data: {
      slug,
      title: "Pre-Saison: VC Wiesbaden vs. SSC Palmberg Schwerin",
      venue: "Sporthalle am Platz der Deutschen Einheit, Wiesbaden",
      playedAt: playedAt.toISOString(),
      result: "2:3",
      coverPhoto: coverPhotoId,
      published: true,
      layout: [
        {
          blockType: "sequence",
          photos: [coverPhotoId, setPhotoId, aftermatchPhotoId],
          caption: "Drei Momente aus der Begegnung.",
        },
      ],
    },
    locale: "de",
  });

  await payload.update({
    collection: "stories",
    id: story.id,
    data: {
      title: "Pre-season: VC Wiesbaden vs. SSC Palmberg Schwerin",
      layout: [
        {
          blockType: "sequence",
          photos: [coverPhotoId, setPhotoId, aftermatchPhotoId],
          caption: "Three moments from the match.",
        },
      ],
    },
    locale: "en",
  });

  payload.logger.info(`[seed] story created: ${slug}`);
}
```

Update `seedPhotos` to call it:

```ts
export async function seedPhotos() {
  const payload = await getSeedPayload();
  payload.logger.info("[seed] ensuring tags…");
  const tagIds = await ensureTags(payload);

  payload.logger.info("[seed] importing photos…");
  const photoIds: Record<string, number> = {};
  for (const entry of PHOTO_MANIFEST) {
    photoIds[entry.file] = await ensurePhoto(payload, entry, tagIds);
  }

  payload.logger.info("[seed] ensuring sample story…");
  await ensureStory(payload, photoIds);

  payload.logger.info(`[seed] done.`);
  return { tagIds, photoIds };
}
```

- [ ] **Step 2: Run the seed again — verify idempotency + story creation**

```bash
pnpm seed:photos
```

Expected output (photos already present, story is new):

```
[seed] ensuring tags…
[seed] importing photos…
[seed] photo already present: 01-hero-spike.jpg
... (10 lines)
[seed] ensuring sample story…
[seed] story created: pre-saison-vc-wiesbaden-vs-schwerin
[seed] done.
```

- [ ] **Step 3: Verify story in DB**

```bash
psql "$DATABASE_URL" -c "SELECT slug, published FROM payload.stories;"
```

Expected: one row with `slug = 'pre-saison-vc-wiesbaden-vs-schwerin'`, `published = true`.

- [ ] **Step 4: Run seed a third time — verify story idempotency**

```bash
pnpm seed:photos
```

Expected: `[seed] story already present: pre-saison-vc-wiesbaden-vs-schwerin`.

- [ ] **Step 5: Commit**

```bash
git add scripts/seed/photos.ts
git commit -m "feat(seed): create sample story with cover + sequence block"
```

---

## Task 6: Add new i18n message keys

**Files:**

- Modify: `src/messages/de.json`
- Modify: `src/messages/en.json`

- [ ] **Step 1: Add keys to `src/messages/de.json`**

Find the `"home"` key and replace its entire block with:

```json
"home": {
  "ctaStories": "Stories entdecken",
  "ctaBooking": "Anfrage stellen",
  "highlights": {
    "title": "Highlights",
    "subtitle": "Einzelmomente",
    "viewAll": "Alle ansehen"
  },
  "stories": {
    "title": "Stories",
    "subtitle": "Spiele als Bildserie",
    "comingSoon": "Bald verfügbar"
  },
  "about": {
    "title": "Über mich",
    "body1": "Ich fotografiere Volleyball in Bremen und Norddeutschland — Spieltag, Saisonbegleitung, Porträts. Mein Fokus liegt auf cinematischen Einzelmomenten, die das Spiel als visuelle Erzählung lesbar machen.",
    "body2": "Wenn du Halle, Team oder Verband bildlich begleitet sehen möchtest, schreib mir. Ich plane Saisons im Voraus und arbeite gern wiederkehrend.",
    "cta": "Mehr über mich"
  },
  "cta": {
    "title": "Halle gebucht?",
    "subtitle": "Spiel, Saison, Porträt — ich begleite es bildlich.",
    "button": "Anfrage stellen"
  }
}
```

- [ ] **Step 2: Add the same shape to `src/messages/en.json`**

Replace the `"home"` block with:

```json
"home": {
  "ctaStories": "Browse stories",
  "ctaBooking": "Get in touch",
  "highlights": {
    "title": "Highlights",
    "subtitle": "Single moments",
    "viewAll": "View all"
  },
  "stories": {
    "title": "Stories",
    "subtitle": "Matches as photo series",
    "comingSoon": "Coming soon"
  },
  "about": {
    "title": "About",
    "body1": "I photograph volleyball in Bremen and northern Germany — match days, season-long coverage, portraits. My focus is on cinematic single moments that make the game readable as a visual narrative.",
    "body2": "If you'd like a court, a team, or a federation covered photographically, drop me a line. I plan seasons ahead and like recurring work.",
    "cta": "More about me"
  },
  "cta": {
    "title": "Got a court date?",
    "subtitle": "Match, season, portrait — I'll cover it photographically.",
    "button": "Get a quote"
  }
}
```

- [ ] **Step 3: Verify typecheck**

```bash
pnpm typecheck
```

Expected: no errors. If next-intl complains about missing keys, the schema is loaded from `de.json` — make sure DE has every key EN has and vice versa.

- [ ] **Step 4: Commit**

```bash
git add src/messages/de.json src/messages/en.json
git commit -m "feat(i18n): landing page message keys (home.highlights, .stories, .about, .cta)"
```

---

## Task 7: Configure Vitest for jsdom + .tsx tests

The HeroRotator test needs a DOM and JSX support. Today the project's vitest config is node-only and only matches `.test.ts`.

**Files:**

- Modify: `vitest.config.ts`
- Modify: `package.json` (devDeps)
- Create: `tests/unit/setup-jsdom.ts`

- [ ] **Step 1: Install jsdom + Testing Library**

```bash
pnpm add -D jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/react
```

Expected: deps added, lockfile updates.

- [ ] **Step 2: Create the test setup file**

```ts
// tests/unit/setup-jsdom.ts
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

// jsdom does not implement matchMedia
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
```

- [ ] **Step 3: Update `vitest.config.ts`**

Replace the file contents with:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/unit/setup-jsdom.ts"],
    coverage: {
      reporter: ["text", "html"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 4: Verify existing tests still pass**

```bash
pnpm test
```

Expected: all 18 existing tests still pass. (They were node-environment but should be DOM-agnostic — env.test.ts, auth/guards.test.ts, etc. don't depend on Node-only APIs.)

If a test fails because it expects Node globals that jsdom doesn't provide (rare), the fix is to add `// @vitest-environment node` at the top of that specific test file.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts tests/unit/setup-jsdom.ts package.json pnpm-lock.yaml
git commit -m "chore(test): switch vitest to jsdom for component tests"
```

---

## Task 8: HeroRotator component (TDD)

**Files:**

- Create: `src/components/landing/hero-rotator.tsx`
- Create: `tests/unit/components/landing/hero-rotator.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/unit/components/landing/hero-rotator.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HeroRotator } from "@/components/landing/hero-rotator";

const photos = [
  { id: 1, alt: "Photo 1", src: "/media/1.jpg", srcSet: "/media/1_feed.jpg 1400w" },
  { id: 2, alt: "Photo 2", src: "/media/2.jpg", srcSet: "/media/2_feed.jpg 1400w" },
  { id: 3, alt: "Photo 3", src: "/media/3.jpg", srcSet: "/media/3_feed.jpg 1400w" },
];

const matchMediaMock = vi.fn((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

beforeEach(() => {
  vi.useFakeTimers();
  window.matchMedia = matchMediaMock as unknown as typeof window.matchMedia;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("HeroRotator", () => {
  it("renders the first photo as active on mount", () => {
    render(<HeroRotator photos={photos} overlay={<div>OVERLAY</div>} />);
    expect(screen.getByTestId("hero-active-index")).toHaveTextContent("0");
    expect(screen.getByText("OVERLAY")).toBeInTheDocument();
  });

  it("advances to the next photo every 6 seconds", () => {
    render(<HeroRotator photos={photos} overlay={null} />);
    expect(screen.getByTestId("hero-active-index")).toHaveTextContent("0");
    vi.advanceTimersByTime(6_000);
    expect(screen.getByTestId("hero-active-index")).toHaveTextContent("1");
    vi.advanceTimersByTime(6_000);
    expect(screen.getByTestId("hero-active-index")).toHaveTextContent("2");
  });

  it("does not advance when prefers-reduced-motion is set", () => {
    matchMediaMock.mockImplementation((q: string) => ({
      matches: q.includes("reduced-motion"),
      media: q,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    render(<HeroRotator photos={photos} overlay={null} />);
    vi.advanceTimersByTime(60_000);
    expect(screen.getByTestId("hero-active-index")).toHaveTextContent("0");
  });

  it("jumps to a specific index when its dot is clicked", () => {
    render(<HeroRotator photos={photos} overlay={null} />);
    fireEvent.click(screen.getByLabelText("Show photo 3"));
    expect(screen.getByTestId("hero-active-index")).toHaveTextContent("2");
  });

  it("renders nothing visible (only overlay) when photos array is empty", () => {
    render(<HeroRotator photos={[]} overlay={<div>OVERLAY</div>} />);
    expect(screen.getByText("OVERLAY")).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
pnpm vitest run tests/unit/components/landing/hero-rotator.test.tsx
```

Expected: FAIL — "Cannot find module '@/components/landing/hero-rotator'".

- [ ] **Step 3: Implement `HeroRotator`**

```tsx
// src/components/landing/hero-rotator.tsx
"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";

export type HeroPhoto = {
  id: number;
  alt: string;
  src: string;
  srcSet?: string;
  width?: number;
  height?: number;
};

type Props = {
  photos: HeroPhoto[];
  overlay: ReactNode;
  intervalMs?: number;
};

const DEFAULT_INTERVAL_MS = 6_000;

export function HeroRotator({ photos, overlay, intervalMs = DEFAULT_INTERVAL_MS }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion || photos.length <= 1) return;
    const id = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % photos.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [reducedMotion, photos.length, intervalMs]);

  return (
    <section
      className="bg-canvas relative flex h-screen min-h-[80vh] w-full items-end overflow-hidden"
      data-testid="hero-rotator"
    >
      <span data-testid="hero-active-index" className="sr-only">
        {activeIndex}
      </span>
      {photos.map((photo, index) => (
        <div
          key={photo.id}
          aria-hidden={index !== activeIndex}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === activeIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="100vw"
            priority={index === 0}
            fetchPriority={index === 0 ? "high" : "low"}
            className="object-cover"
          />
        </div>
      ))}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
        style={{
          backgroundImage: "linear-gradient(to top, rgba(11,14,19,0.85), rgba(11,14,19,0) 100%)",
        }}
      />
      <div className="relative z-10 w-full p-8 md:p-12">{overlay}</div>
      {photos.length > 1 && (
        <div className="absolute right-6 bottom-6 z-10 flex gap-2">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              aria-label={`Show photo ${index + 1}`}
              aria-current={index === activeIndex}
              onClick={() => setActiveIndex(index)}
              className={`border-ink/40 h-2 w-2 rounded-full border transition-colors ${
                index === activeIndex ? "bg-accent" : "bg-ink/20 hover:bg-ink/40"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Run the test to confirm it passes**

```bash
pnpm vitest run tests/unit/components/landing/hero-rotator.test.tsx
```

Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/landing/hero-rotator.tsx tests/unit/components/landing/hero-rotator.test.tsx
git commit -m "feat(landing): HeroRotator client component with reduced-motion + dot nav"
```

---

## Task 9: Shared PhotoImage helper

A tiny wrapper that reads Payload's `sizes` object and returns a `next/image` element with the right `srcSet`.

**Files:**

- Create: `src/components/landing/photo-image.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/landing/photo-image.tsx
import Image, { type ImageProps } from "next/image";
import type { Photo } from "../../../payload-types";

type Props = {
  photo: Pick<Photo, "url" | "sizes" | "width" | "height" | "alt">;
  sizes: string;
  className?: string;
  priority?: boolean;
} & Omit<ImageProps, "src" | "alt" | "sizes" | "className" | "priority">;

/** Renders a Payload Photo via next/image, preferring the `feed` variant for src */
export function PhotoImage({ photo, sizes, className, priority, ...rest }: Props) {
  const src = photo.sizes?.feed?.url ?? photo.url ?? "";
  return (
    <Image
      src={src}
      alt={photo.alt ?? ""}
      width={photo.sizes?.feed?.width ?? photo.width ?? 1400}
      height={photo.sizes?.feed?.height ?? photo.height ?? 933}
      sizes={sizes}
      className={className}
      priority={priority}
      {...rest}
    />
  );
}
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```

Expected: no errors. If `Photo.sizes.feed` is not in `payload-types.ts`, regenerate:

```bash
pnpm payload:generate-types
```

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/photo-image.tsx
git commit -m "feat(landing): PhotoImage helper that renders Payload Photo via next/image"
```

---

## Task 10: HighlightsStrip component

**Files:**

- Create: `src/components/landing/highlights-strip.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/landing/highlights-strip.tsx
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Photo } from "../../../payload-types";
import { PhotoImage } from "./photo-image";

type Props = { photos: Photo[] };

export async function HighlightsStrip({ photos }: Props) {
  const t = await getTranslations("home.highlights");
  if (photos.length < 3) return null;

  return (
    <section className="border-hairline border-t px-6 py-16 md:px-12">
      <div className="flex items-end justify-between pb-8">
        <div>
          <h2 className="font-display text-4xl tracking-tight md:text-5xl">{t("title")}</h2>
          <p className="text-ink-muted mt-2 font-mono text-xs tracking-widest uppercase">
            {t("subtitle")}
          </p>
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Link
          href={"/highlights" as any}
          className="text-ink-muted hover:text-ink text-sm transition-colors"
        >
          {t("viewAll")} →
        </Link>
      </div>
      <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
        {photos.map((photo) => (
          <figure
            key={photo.id}
            className="ring-hairline hover:ring-accent group relative aspect-square w-[60vw] flex-shrink-0 snap-start overflow-hidden rounded-sm ring-1 transition-all hover:ring-2 lg:w-auto"
          >
            <PhotoImage
              photo={photo}
              sizes="(min-width: 1024px) 25vw, 60vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </figure>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/highlights-strip.tsx
git commit -m "feat(landing): HighlightsStrip section with mobile scroll + lg grid"
```

---

## Task 11: StoriesTeaser component

**Files:**

- Create: `src/components/landing/stories-teaser.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/landing/stories-teaser.tsx
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Story } from "../../../payload-types";
import { PhotoImage } from "./photo-image";

type Props = { stories: Story[]; slotsTotal?: number };

export async function StoriesTeaser({ stories, slotsTotal = 3 }: Props) {
  const t = await getTranslations("home.stories");
  const filled = stories.slice(0, slotsTotal);
  const emptySlots = Math.max(0, slotsTotal - filled.length);

  return (
    <section className="border-hairline border-t px-6 py-16 md:px-12">
      <div className="pb-8">
        <h2 className="font-display text-4xl tracking-tight md:text-5xl">{t("title")}</h2>
        <p className="text-ink-muted mt-2 font-mono text-xs tracking-widest uppercase">
          {t("subtitle")}
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {filled.map((story) => {
          const cover = typeof story.coverPhoto === "object" ? story.coverPhoto : null;
          const date =
            story.playedAt &&
            new Date(story.playedAt).toISOString().slice(0, 10).replace(/-/g, ".");
          return (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <Link
              key={story.id}
              href={`/stories/${story.slug}` as any}
              className="border-hairline hover:border-ink/30 group block overflow-hidden rounded-sm border transition-colors"
            >
              <figure className="bg-elevated relative aspect-[4/5] w-full overflow-hidden">
                {cover ? (
                  <PhotoImage
                    photo={cover}
                    sizes="(min-width: 768px) 33vw, 90vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                ) : null}
              </figure>
              <div className="space-y-2 p-4">
                <p className="text-ink-muted font-mono text-xs">
                  {date}
                  {story.venue ? ` · ${story.venue}` : ""}
                </p>
                <h3 className="font-display text-lg leading-snug">{story.title}</h3>
              </div>
            </Link>
          );
        })}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="border-hairline text-ink-muted flex aspect-[4/5] items-end rounded-sm border border-dashed p-4 text-sm"
          >
            {t("comingSoon")}
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/stories-teaser.tsx
git commit -m "feat(landing): StoriesTeaser with coming-soon empty slots"
```

---

## Task 12: AboutTeaser component

**Files:**

- Create: `src/components/landing/about-teaser.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/landing/about-teaser.tsx
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Photo } from "../../../payload-types";
import { PhotoImage } from "./photo-image";

type Props = { portrait: Photo | null };

export async function AboutTeaser({ portrait }: Props) {
  const t = await getTranslations("home.about");

  return (
    <section className="border-hairline grid border-t px-6 py-16 md:px-12 lg:grid-cols-12 lg:gap-12">
      {portrait ? (
        <figure className="lg:col-span-5">
          <div className="bg-elevated relative aspect-[3/4] w-full overflow-hidden rounded-sm">
            <PhotoImage
              photo={portrait}
              sizes="(min-width: 1024px) 40vw, 90vw"
              className="object-cover saturate-[0.9]"
            />
          </div>
        </figure>
      ) : null}
      <div
        className={`flex flex-col justify-center gap-4 pt-8 lg:pt-0 ${
          portrait ? "lg:col-span-7" : "lg:col-span-12"
        }`}
      >
        <h2 className="font-display text-4xl tracking-tight md:text-5xl">{t("title")}</h2>
        <p className="text-ink max-w-prose font-sans text-base leading-relaxed">{t("body1")}</p>
        <p className="text-ink-muted max-w-prose font-sans text-base leading-relaxed">
          {t("body2")}
        </p>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Link
          href={"/about" as any}
          className="hover:text-accent mt-2 inline-flex items-center text-sm transition-colors"
        >
          {t("cta")} →
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/about-teaser.tsx
git commit -m "feat(landing): AboutTeaser with optional portrait + typographic fallback"
```

---

## Task 13: BookingCTA component

**Files:**

- Create: `src/components/landing/booking-cta.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/landing/booking-cta.tsx
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Photo } from "../../../payload-types";
import { PhotoImage } from "./photo-image";

type Props = { backgroundPhoto: Photo | null };

export async function BookingCTA({ backgroundPhoto }: Props) {
  const t = await getTranslations("home.cta");

  return (
    <section className="relative overflow-hidden">
      {backgroundPhoto ? (
        <div className="absolute inset-0">
          <PhotoImage photo={backgroundPhoto} sizes="100vw" className="object-cover" />
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.55)" }} />
        </div>
      ) : (
        <div className="bg-elevated absolute inset-0" />
      )}
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-24 text-center md:py-32">
        <h2 className="font-display text-5xl tracking-tight md:text-6xl">{t("title")}</h2>
        <p className="text-ink-muted max-w-xl text-base">{t("subtitle")}</p>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Link
          href={"/contact" as any}
          className="bg-accent text-canvas hover:bg-accent/90 mt-2 rounded-sm px-6 py-3 text-sm font-medium transition-colors"
        >
          {t("button")}
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/booking-cta.tsx
git commit -m "feat(landing): BookingCTA full-width band with photo background + scrim"
```

---

## Task 14: Rewrite the landing page to assemble all sections

**Files:**

- Modify: `src/app/(site)/[locale]/page.tsx`

- [ ] **Step 1: Replace the page contents**

```tsx
// src/app/(site)/[locale]/page.tsx
import Link from "next/link";
import { getPayload } from "payload";
import { getTranslations, setRequestLocale } from "next-intl/server";
import config from "@/payload/payload.config";
import type { Photo } from "../../../../payload-types";
import { HeroRotator, type HeroPhoto } from "@/components/landing/hero-rotator";
import { HighlightsStrip } from "@/components/landing/highlights-strip";
import { StoriesTeaser } from "@/components/landing/stories-teaser";
import { AboutTeaser } from "@/components/landing/about-teaser";
import { BookingCTA } from "@/components/landing/booking-cta";

export const dynamic = "force-dynamic";

function toHeroPhoto(photo: Photo): HeroPhoto {
  const feed = photo.sizes?.feed;
  return {
    id: photo.id as number,
    alt: photo.alt ?? "",
    src: feed?.url ?? photo.url ?? "",
    srcSet: feed?.url ? `${feed.url} ${feed.width}w` : undefined,
    width: feed?.width ?? photo.width ?? 1400,
    height: feed?.height ?? photo.height ?? 933,
  };
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const payload = await getPayload({ config });

  // Resolve the portrait tag id once so we can filter photos by it.
  const portraitTag = await payload.find({
    collection: "tags",
    where: { slug: { equals: "portrait" } },
    limit: 1,
  });
  const portraitTagId = portraitTag.docs[0]?.id;

  const [heroPhotos, highlightPhotos, recentStories, portraitPhotos] = await Promise.all([
    payload.find({
      collection: "photos",
      where: { isHighlight: { equals: true } },
      limit: 5,
      sort: "-updatedAt",
      locale,
    }),
    payload.find({
      collection: "photos",
      where: { isHighlight: { equals: true } },
      limit: 8,
      sort: "-updatedAt",
      locale,
    }),
    payload.find({
      collection: "stories",
      where: { published: { equals: true } },
      limit: 3,
      sort: "-publishedAt",
      locale,
      depth: 2,
    }),
    portraitTagId
      ? payload.find({
          collection: "photos",
          where: { tags: { in: [portraitTagId] } },
          limit: 1,
          locale,
        })
      : Promise.resolve({ docs: [] as Photo[] }),
  ]);

  const overlay = (
    <div className="flex max-w-2xl flex-col items-start gap-6">
      <h1 className="font-display text-6xl tracking-tight md:text-8xl">belin akguel</h1>
      <p className="text-ink max-w-prose font-sans text-base md:text-lg">{t("site.tagline")}</p>
      <p className="font-mono text-xs">f/2.8 · 1/2000s · ISO 6400</p>
      <div className="flex flex-wrap gap-4 pt-2">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Link
          href={"/stories" as any}
          className="bg-accent text-canvas hover:bg-accent/90 rounded-sm px-5 py-2.5 text-sm font-medium transition-colors"
        >
          {t("home.ctaStories")}
        </Link>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Link
          href={"/contact" as any}
          className="border-hairline hover:text-accent rounded-sm border px-5 py-2.5 text-sm transition-colors"
        >
          {t("home.ctaBooking")}
        </Link>
      </div>
    </div>
  );

  const bookingBgPhoto = highlightPhotos.docs[highlightPhotos.docs.length - 1] ?? null;

  return (
    <>
      <HeroRotator
        photos={heroPhotos.docs.map((photo) => toHeroPhoto(photo as Photo))}
        overlay={overlay}
      />
      <HighlightsStrip photos={highlightPhotos.docs as Photo[]} />
      <StoriesTeaser stories={recentStories.docs} />
      <AboutTeaser portrait={(portraitPhotos.docs[0] as Photo) ?? null} />
      <BookingCTA backgroundPhoto={(bookingBgPhoto as Photo) ?? null} />
    </>
  );
}
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```

Expected: no errors. If TypeScript complains about `Photo` shape (e.g., `url` not optional, `sizes.feed` missing), regenerate types: `pnpm payload:generate-types`.

- [ ] **Step 3: Manual smoke-test in the browser**

```bash
pnpm dev
```

Open `http://localhost:3000/` (DE) and `http://localhost:3000/en` (EN). Verify:

- Hero photo visible, rotates every 6 seconds.
- Overlay (name, tagline, mono spec line, two buttons) reads correctly.
- Scrolling shows: Highlights row, one Story card + 2 dashed coming-soon slots, About teaser with portrait + 2 paragraphs + CTA, BookingCTA band with red button.
- Toggle reduced motion in DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce" — hero stops rotating.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(site\)/\[locale\]/page.tsx
git commit -m "feat(landing): rewrite home as 5-section photo-driven layout"
```

---

## Task 15: Extend e2e smoke test

**Files:**

- Modify: `tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Look at the existing spec**

```bash
cat tests/e2e/smoke.spec.ts
```

- [ ] **Step 2: Add landing-page assertions**

Append to `tests/e2e/smoke.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("Landing page renders hero overlay + all sections", async ({ page }) => {
  await page.goto("/");

  // Hero overlay
  await expect(page.getByRole("heading", { name: /belin akguel/i, level: 1 })).toBeVisible();
  await expect(page.getByText("Volleyball-Fotografie. Bremen.")).toBeVisible();

  // At least one image from Payload media is in the DOM
  const firstImg = page.locator("img").first();
  await expect(firstImg).toBeVisible();
  const src = await firstImg.getAttribute("src");
  expect(src).toBeTruthy();

  // Section headings present
  await expect(page.getByRole("heading", { name: "Highlights", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^Stories$/, level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Über mich/i, level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Halle gebucht/i, level: 2 })).toBeVisible();

  // BookingCTA button
  await expect(page.getByRole("link", { name: "Anfrage stellen" }).first()).toBeVisible();
});

test("Landing hero rotator has at least one dot indicator when 2+ photos seeded", async ({
  page,
}) => {
  await page.goto("/");
  const dots = page.locator("[aria-label^='Show photo']");
  await expect(dots.first()).toBeVisible();
});
```

If the existing `smoke.spec.ts` already has its own `test.describe`, place the new tests outside any block (top-level). Don't remove the existing two smoke tests.

- [ ] **Step 3: Run e2e tests**

```bash
pnpm test:e2e
```

Expected: all 19+ pre-existing tests still pass, plus 2 new tests pass.

If the new tests fail because the dev server has stale data, re-run `pnpm seed:photos` and retry. If they fail because the i18n message hasn't surfaced, restart `pnpm dev`.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/smoke.spec.ts
git commit -m "test(landing): e2e for hero overlay, sections, and dot indicators"
```

---

## Task 16: Run the full verification gate

- [ ] **Step 1: Run everything**

```bash
pnpm format && pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e
```

Expected: all green.

- [ ] **Step 2: Commit any prettier drift**

```bash
git add -A
git diff --cached --quiet || git commit -m "chore: prettier pass"
```

---

## Self-review notes

- **Spec coverage:** All 5 landing sections, the seed (photos + tags + 1 story), the i18n keys, the new vitest setup, and the e2e checks have explicit tasks. Empty-state behaviors of each section are encoded in the component code, not deferred.
- **Placeholder scan:** Two intentional placeholders remain — `REPLACE_WITH_ID` and `REPLACE_WITH_NAME` in `photo-manifest.ts`. These are data the engineer fills during Task 1 curation, not code skeletons.
- **Type consistency:** `Photo`, `Story`, and `Tag` types come from `payload-types.ts` everywhere. `HeroPhoto` is a local view-model defined once in `hero-rotator.tsx` and exported. `toHeroPhoto()` is the one adapter.
- **One trade-off:** I used `eslint-disable-next-line @typescript-eslint/no-explicit-any` on `Link` `href` props because next-intl's typed routes treat string paths as opaque. The existing codebase already uses this pattern (see `Header` component).
- **Risk:** Task 4 step 4 uses `psql` to verify seed counts. If the dev environment doesn't have psql, fall back to running the Neon MCP `run_sql` query, or open `/admin` in the browser and verify visually.
