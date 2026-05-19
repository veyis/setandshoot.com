import { describe, it, expect } from "vitest";
import { photoSrc, resolvePhotoAssetPath } from "@/lib/payload/media";
import type { Photo } from "@/payload-types";

describe("payload media paths", () => {
  it("rewrites API upload URLs to static /media/ paths", () => {
    expect(
      resolvePhotoAssetPath(
        "https://www.setandshoot.com/api/photos/file/06-story-cover-1400x788.jpg",
      ),
    ).toBe("/media/06-story-cover-1400x788.jpg");
    expect(resolvePhotoAssetPath("/api/photos/file/07-story-set-1400x934.jpg")).toBe(
      "/media/07-story-set-1400x934.jpg",
    );
  });

  it("photoSrc prefers feed size and resolves to /media/", () => {
    const photo = {
      url: "https://localhost:3000/api/photos/file/06-story-cover.jpg",
      filename: "06-story-cover.jpg",
      sizes: {
        feed: {
          url: "https://localhost:3000/api/photos/file/06-story-cover-1400x788.jpg",
          filename: "06-story-cover-1400x788.jpg",
          width: 1400,
          height: 788,
        },
      },
    } as unknown as Photo;

    expect(photoSrc(photo, "feed")).toBe("/media/06-story-cover-1400x788.jpg");
  });
});
