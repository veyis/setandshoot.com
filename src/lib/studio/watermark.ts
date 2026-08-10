import "server-only";
import sharp from "sharp";
import { readFile } from "node:fs/promises";

export type WatermarkLevel = "light" | "standard";

import { join } from "node:path";

// Drop a transparent-PNG brand mark (ideally white) at public/watermark-logo.png
// Missing file -> uploads still work, just unstamped.
const LOGO_PATH = join(process.cwd(), "public", "watermark-logo.png");

// Per-level look: overlay width as a fraction of the image's longest edge, and
// the overlay's opacity. "light" = small + faint, "standard" = larger + bolder.
const LEVELS: Record<WatermarkLevel, { widthFraction: number; opacity: number }> = {
  light: { widthFraction: 0.16, opacity: 0.4 },
  standard: { widthFraction: 0.24, opacity: 0.7 },
};

/**
 * Composite `logo` onto `image`, bottom-right with a small margin. Pure (no I/O)
 * so it's unit-testable without the asset on disk. Preserves the input format:
 * no explicit output format -> sharp re-encodes as the source (JPEG stays JPEG),
 * so Payload's downstream resize sees the same format it would have anyway.
 */
export async function compositeWatermark(
  image: Buffer,
  logo: Buffer,
  level: WatermarkLevel,
): Promise<Buffer> {
  const { widthFraction, opacity } = LEVELS[level];
  const { width = 0, height = 0 } = await sharp(image).metadata();
  if (!width || !height) return image;

  const overlayWidth = Math.max(1, Math.round(Math.max(width, height) * widthFraction));
  const margin = Math.round(Math.max(width, height) * 0.03);

  // Scale the logo, then scale its alpha by `opacity` — the canonical sharp
  // opacity trick: dest-in blend against a 1px uniform-alpha tile.
  const overlay = await sharp(logo)
    .resize({ width: overlayWidth })
    .ensureAlpha()
    .composite([
      {
        input: Buffer.from([255, 255, 255, Math.round(255 * opacity)]),
        raw: { width: 1, height: 1, channels: 4 },
        tile: true,
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();

  const { height: overlayHeight = 0 } = await sharp(overlay).metadata();
  const top = Math.max(0, height - overlayHeight - margin);
  const left = Math.max(0, width - overlayWidth - margin);

  return sharp(image)
    .composite([{ input: overlay, top, left }])
    .toBuffer();
}

/**
 * Stamp the bundled brand logo onto an upload before Payload generates its
 * sizes, so every variant (and the stored original) carries it. If the logo
 * asset is absent, return the image untouched — never fail an upload over it.
 */
export async function applyWatermark(image: Buffer, level: WatermarkLevel): Promise<Buffer> {
  let logo: Buffer;
  try {
    logo = await readFile(LOGO_PATH);
  } catch {
    console.warn(
      "[watermark] no logo at public/watermark-logo.png — uploading without watermark",
    );
    return image;
  }
  return compositeWatermark(image, logo, level);
}
