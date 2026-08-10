import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { compositeWatermark } from "@/lib/studio/watermark";

const solidJpeg = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: { r: 20, g: 20, b: 20 } } })
    .jpeg()
    .toBuffer();

const whiteLogoPng = (size: number) =>
  sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

describe("compositeWatermark", () => {
  it("stamps the logo while preserving dimensions and source format", async () => {
    const base = await solidJpeg(800, 600);
    const logo = await whiteLogoPng(256);

    const out = await compositeWatermark(base, logo, "standard");
    const meta = await sharp(out).metadata();

    expect(meta.width).toBe(800);
    expect(meta.height).toBe(600);
    // No explicit output format -> stays JPEG so Payload's downstream resize is unaffected.
    expect(meta.format).toBe("jpeg");
    // The corner pixels actually changed.
    expect(out.equals(base)).toBe(false);
  });
});
