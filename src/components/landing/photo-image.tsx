import Image, { type ImageProps } from "next/image";
import type { Photo } from "@/payload-types";

type Props = {
  photo: Pick<Photo, "url" | "sizes" | "width" | "height" | "alt">;
  sizes: string;
  className?: string;
  priority?: boolean;
} & Omit<ImageProps, "src" | "alt" | "sizes" | "className" | "priority">;

/**
 * Payload's `serverURL` config makes it prefix every file URL with the site
 * origin (e.g. `http://localhost:3000/api/photos/file/<name>`). Next.js 16
 * refuses to optimize images from private IPs as an SSRF guard, so we strip
 * the origin so next/image treats the URL as a same-origin path.
 */
function toRelative(src: string): string {
  if (!src) return src;
  try {
    const url = new URL(src);
    return url.pathname + url.search;
  } catch {
    return src;
  }
}

/** Renders a Payload Photo via next/image, preferring the `feed` variant for src. */
export function PhotoImage({ photo, sizes, className, priority, ...rest }: Props) {
  const rawSrc = photo.sizes?.feed?.url ?? photo.url ?? "";
  const src = toRelative(rawSrc);
  return (
    <Image
      src={src}
      alt={photo.alt ?? ""}
      width={photo.sizes?.feed?.width ?? photo.width ?? 1400}
      height={photo.sizes?.feed?.height ?? photo.height ?? 933}
      sizes={sizes}
      className={className}
      priority={priority}
      {...rest}
    />
  );
}
