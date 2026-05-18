// scripts/seed/photos.ts
import fs from "node:fs/promises";
import path from "node:path";
import type { Payload } from "payload";
import { getSeedPayload, SEEDS_DIR } from "./payload-bootstrap";
import { PHOTO_MANIFEST, SEED_TAG_SLUGS, type PhotoManifestEntry } from "./photo-manifest";

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

  const filepath = path.join(SEEDS_DIR, entry.file);
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
