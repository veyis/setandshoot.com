import type { Photo } from "@/payload-types";

export type PhotoSize = "thumbnail" | "feed" | "full";

export function resolvePhoto(doc: Photo | number | null | undefined): Photo | null {
  if (!doc || typeof doc === "number") return null;
  return doc;
}

/** Strip origin from Payload file URLs so next/image treats them as same-origin paths. */
export function toRelativeMediaSrc(src: string): string {
  if (!src) return src;
  try {
    const url = new URL(src);
    return url.pathname + url.search;
  } catch {
    return src;
  }
}

/**
 * Payload serves uploads via /api/photos/file/* but those files live on disk
 * under public/media/. On Vercel the API 404s when binaries aren't present;
 * static /media/* is generated at build from seeds and always deploys.
 */
export function resolvePhotoAssetPath(url: string, filename?: string | null): string {
  const relative = toRelativeMediaSrc(url);

  const apiMatch = relative.match(/^\/api\/photos\/file\/(.+)$/);
  if (apiMatch?.[1]) return `/media/${apiMatch[1]}`;

  if (relative.startsWith("/media/")) return relative;

  if (filename) return `/media/${filename}`;

  return relative;
}

export function photoSrc(photo: Photo | null | undefined, size: PhotoSize = "feed"): string | null {
  if (!photo) return null;
  const sized = photo.sizes?.[size];
  const raw = sized?.url ?? photo.url ?? null;
  if (!raw) return null;
  return resolvePhotoAssetPath(raw, sized?.filename ?? photo.filename ?? null);
}

export function photoAlt(photo: Photo | null | undefined, fallback = ""): string {
  if (!photo) return fallback;
  if (typeof photo.alt === "string" && photo.alt.trim()) return photo.alt;
  return fallback;
}

export function photoDimensions(
  photo: Photo | null | undefined,
  size: PhotoSize = "feed",
): { width: number; height: number } {
  const sized = photo?.sizes?.[size];
  return {
    width: sized?.width ?? photo?.width ?? 1400,
    height: sized?.height ?? photo?.height ?? 900,
  };
}
