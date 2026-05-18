import type { Photo } from "@/payload-types";

export type PhotoSize = "thumbnail" | "feed" | "full";

export function resolvePhoto(doc: Photo | number | null | undefined): Photo | null {
  if (!doc || typeof doc === "number") return null;
  return doc;
}

export function photoSrc(photo: Photo | null | undefined, size: PhotoSize = "feed"): string | null {
  if (!photo) return null;
  const sized = photo.sizes?.[size];
  return sized?.url ?? photo.url ?? null;
}

export function photoAlt(photo: Photo | null | undefined, fallback = ""): string {
  if (!photo) return fallback;
  if (typeof photo.alt === "string" && photo.alt.trim()) return photo.alt;
  return fallback;
}
