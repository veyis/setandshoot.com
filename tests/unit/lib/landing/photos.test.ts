import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  LANDING_PHOTOS,
  HERO_IMAGE_FILES,
  getHeroPhotos,
  getHighlightPhotos,
  type LandingPhotoRole,
} from "@/lib/landing/photos";

const PUBLIC = path.join(process.cwd(), "public");
const LANDING_DIR = path.join(PUBLIC, "images/landing");

function diskPath(src: string): string {
  return path.join(PUBLIC, src.replace(/^\//, ""));
}

describe("landing photos — hero asset integrity", () => {
  it("registers exactly the 7 generated hero JPEGs", () => {
    expect(LANDING_PHOTOS).toHaveLength(HERO_IMAGE_FILES.length);
    expect(getHeroPhotos("en")).toHaveLength(HERO_IMAGE_FILES.length);
  });

  it("maps each configured photo to an existing file on disk", () => {
    for (const photo of LANDING_PHOTOS) {
      const file = diskPath(photo.src);
      expect(fs.existsSync(file), `${photo.id} → ${photo.src} must exist`).toBe(true);
    }
  });

  it("uses every hero-*.jpg on disk (no orphans, no missing)", () => {
    const onDisk = fs
      .readdirSync(LANDING_DIR)
      .filter((f) => f.startsWith("hero-") && f.endsWith(".jpg"))
      .sort();

    expect(onDisk).toEqual([...HERO_IMAGE_FILES].sort());

    const configured = LANDING_PHOTOS.map((p) => path.basename(p.src)).sort();
    expect(configured).toEqual(onDisk);
  });

  it("assigns unique ids and /images/landing/hero-*.jpg paths", () => {
    const ids = new Set<LandingPhotoRole>();
    for (const photo of LANDING_PHOTOS) {
      expect(ids.has(photo.id), `duplicate id: ${photo.id}`).toBe(false);
      ids.add(photo.id);
      expect(photo.src).toMatch(/^\/images\/landing\/hero-[a-z]+\.jpg$/);
      expect(photo.width).toBeGreaterThan(0);
      expect(photo.height).toBeGreaterThan(0);
      expect(photo.alt.en.length).toBeGreaterThan(0);
      expect(photo.alt.de.length).toBeGreaterThan(0);
    }
  });

  it("includes all frames in hero rotation and work mosaic highlights", () => {
    const hero = getHeroPhotos("en");
    const highlights = getHighlightPhotos("en");
    expect(hero.map((p) => p.id)).toEqual(LANDING_PHOTOS.map((p) => p.id));
    expect(highlights.map((p) => p.id)).toEqual(LANDING_PHOTOS.map((p) => p.id));
    for (const photo of LANDING_PHOTOS) {
      expect(photo.isHighlight).toBe(true);
    }
  });

  it("loads cover first — the photo-of-the-year frame leads the rotator", () => {
    expect(getHeroPhotos("en")[0]?.id).toBe("cover");
    expect(getHeroPhotos("en")[0]?.src).toBe("/images/landing/hero-cover.jpg");
  });
});
