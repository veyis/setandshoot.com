import { describe, it, expect } from "vitest";
import { photoSrc } from "@/lib/payload/media";
import type { Photo } from "@/payload-types";

describe("payload media paths", () => {
  it("photoSrc returns the requested size's public (R2) url", () => {
    const photo = {
      url: "https://pub-x.r2.dev/06-story-cover.jpg",
      filename: "06-story-cover.jpg",
      sizes: {
        feed: {
          url: "https://pub-x.r2.dev/06-story-cover-1400x788.jpg",
          filename: "06-story-cover-1400x788.jpg",
          width: 1400,
          height: 788,
        },
      },
    } as unknown as Photo;

    expect(photoSrc(photo, "feed")).toBe("https://pub-x.r2.dev/06-story-cover-1400x788.jpg");
  });

  it("photoSrc falls back to the original url when the size is missing, and null for no photo", () => {
    const photo = {
      url: "https://pub-x.r2.dev/06-story-cover.jpg",
      sizes: {},
    } as unknown as Photo;
    expect(photoSrc(photo, "feed")).toBe("https://pub-x.r2.dev/06-story-cover.jpg");
    expect(photoSrc(null)).toBeNull();
  });
});
