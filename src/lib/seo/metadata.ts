import type { Metadata } from "next";
import { localeAlternates } from "@/lib/seo/alternates";

export type OgImage = { url: string; width?: number; height?: number; alt?: string };

/**
 * Compose page Metadata: title, description, canonical+hreflang (via
 * localeAlternates), and OpenGraph/Twitter blocks. For marketing pages the OG
 * *image* comes from the colocated opengraph-image.tsx file convention, so
 * `image` is only passed for routes without one (e.g. stories → hero photo).
 */
export function buildPageMetadata(input: {
  locale: string;
  path: string;
  title: string;
  description: string;
  image?: OgImage;
}): Metadata {
  const { locale, path, title, description, image } = input;
  const images = image
    ? [{ url: image.url, width: image.width, height: image.height, alt: image.alt ?? title }]
    : undefined;

  return {
    title,
    description,
    alternates: localeAlternates(path, locale),
    openGraph: {
      type: "website",
      title,
      description,
      locale: locale === "en" ? "en_US" : "de_DE",
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
  };
}
