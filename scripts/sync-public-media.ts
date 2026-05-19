/**
 * Generates Payload-compatible resized JPEGs from committed seed files into
 * public/media/ so Vercel deploys include the binary assets (gitignored uploads
 * are empty on serverless — /api/photos/file/* returns 404 in production).
 *
 * Run automatically before `next build`.
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { PHOTO_MANIFEST } from "./seed/photo-manifest";

const ROOT = path.resolve(import.meta.dirname, "..");
const SEEDS_DIR = path.join(ROOT, "public/media/seeds");
const OUT_DIR = path.join(ROOT, "public/media");

/** Mirrors src/payload/collections/photos.ts upload.imageSizes */
const THUMB = { width: 480, height: 360 } as const;
const FEED_MAX = 1400;
const FULL_MAX = 2560;

async function writeVariant(input: string, outPath: string, pipeline: sharp.Sharp): Promise<void> {
  await pipeline.jpeg({ quality: 82, mozjpeg: true }).toFile(outPath);
}

async function processSeed(file: string): Promise<void> {
  const input = path.join(SEEDS_DIR, file);
  const stem = file.replace(/\.(jpe?g|png|webp)$/i, "");

  // Original (Payload stores the upload basename as-is).
  await fs.copyFile(input, path.join(OUT_DIR, file));

  // thumbnail — 480×360 centre crop
  await writeVariant(
    input,
    path.join(OUT_DIR, `${stem}-${THUMB.width}x${THUMB.height}.jpg`),
    sharp(input).resize(THUMB.width, THUMB.height, { fit: "cover", position: "centre" }),
  );

  // feed + full — width cap, preserve aspect, no upscale
  for (const maxWidth of [FEED_MAX, FULL_MAX] as const) {
    const { data, info } = await sharp(input)
      .resize({ width: maxWidth, withoutEnlargement: true })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });
    const name = `${stem}-${info.width}x${info.height}.jpg`;
    await fs.writeFile(path.join(OUT_DIR, name), data);
  }
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const seeds = PHOTO_MANIFEST.map((e) => e.file);
  for (const file of seeds) {
    const input = path.join(SEEDS_DIR, file);
    try {
      await fs.access(input);
    } catch {
      console.warn(`[sync-public-media] skip missing seed: ${file}`);
      continue;
    }
    await processSeed(file);
    console.log(`[sync-public-media] synced ${file}`);
  }
}

main().catch((err) => {
  console.error("[sync-public-media] failed:", err);
  process.exit(1);
});
