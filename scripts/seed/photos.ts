// scripts/seed/photos.ts
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";
import type { Payload } from "payload";
import { PHOTO_MANIFEST, SEED_TAG_SLUGS, type PhotoManifestEntry } from "./photo-manifest";

// Stub Next.js `revalidatePath`/`revalidateTag` BEFORE Payload (and its
// `afterChange` story hook) is loaded. Outside a request context those
// functions throw `Invariant: static generation store missing`, which
// would abort `payload.create` from this CLI seed. Replacing them with
// no-ops keeps the seed runnable without touching the production hook.
// This MUST run before any module that transitively imports the Payload
// config (and therefore the Stories collection hooks), so
// `payload-bootstrap` is loaded via a dynamic import inside `seedPhotos`
// below rather than as a top-level static import.
const seedRequire = createRequire(import.meta.url);
try {
  const nextCache = seedRequire("next/cache") as Record<string, unknown>;
  const noop = () => {};
  Object.defineProperty(nextCache, "revalidatePath", {
    value: noop,
    writable: true,
    configurable: true,
    enumerable: true,
  });
  Object.defineProperty(nextCache, "revalidateTag", {
    value: noop,
    writable: true,
    configurable: true,
    enumerable: true,
  });
} catch {
  // next/cache not resolvable — nothing to patch.
}

const TAG_NAMES: Record<(typeof SEED_TAG_SLUGS)[number], { de: string; en: string }> = {
  seed: { de: "Seed", en: "Seed" },
  portrait: { de: "Porträt", en: "Portrait" },
};

async function ensureTags(payload: Payload): Promise<Record<string, number>> {
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
  payload: Payload,
  entry: PhotoManifestEntry,
  tagIds: Record<string, number>,
  seedsDir: string,
): Promise<number> {
  const existing = await payload.find({
    collection: "photos",
    where: { filename: { equals: entry.file } },
    limit: 1,
  });
  if (existing.docs[0]) {
    payload.logger.info(`[seed] photo already present: ${entry.file}`);
    return existing.docs[0].id as number;
  }

  const filepath = path.join(seedsDir, entry.file);
  const buffer = await fs.readFile(filepath);
  const stat = await fs.stat(filepath);

  const created = await payload.create({
    collection: "photos",
    data: {
      alt: entry.altDe,
      tags: entry.tagSlugs.map((slug) => {
        const id = tagIds[slug];
        if (id === undefined) throw new Error(`[seed] missing tag id for slug: ${slug}`);
        return id;
      }),
      isHighlight: entry.isHighlight,
      isCover: entry.isCover,
      published: true,
    },
    locale: "de",
    file: {
      data: buffer,
      mimetype: "image/jpeg",
      name: entry.file,
      size: stat.size,
    },
  });

  await payload.update({
    collection: "photos",
    id: created.id,
    data: { alt: entry.altEn },
    locale: "en",
  });

  return created.id as number;
}

async function ensureStory(payload: Payload, photoIds: Record<string, number>): Promise<void> {
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

  if (!coverPhotoId || !setPhotoId || !aftermatchPhotoId) {
    throw new Error("[seed] story photos missing — run photo seed first");
  }

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

export async function seedPhotos() {
  // Dynamic import keeps the Payload config (and its Stories afterChange
  // hook that imports next/cache) from loading before the revalidate
  // stubs above have been installed.
  const { getSeedPayload, SEEDS_DIR } = await import("./payload-bootstrap");
  const payload = await getSeedPayload();
  payload.logger.info("[seed] ensuring tags…");
  const tagIds = await ensureTags(payload);

  payload.logger.info("[seed] importing photos…");
  const photoIds: Record<string, number> = {};
  for (const entry of PHOTO_MANIFEST) {
    photoIds[entry.file] = await ensurePhoto(payload, entry, tagIds, SEEDS_DIR);
  }

  payload.logger.info("[seed] ensuring sample story…");
  await ensureStory(payload, photoIds);

  payload.logger.info(`[seed] done.`);
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
