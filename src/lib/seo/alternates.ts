import type { Metadata } from "next";

/**
 * Build canonical + hreflang alternates for a page, given its German-relative
 * path (e.g. "/", "/stories/foo"). German is unprefixed (localePrefix
 * "as-needed"), English lives under /en. Relative paths resolve against
 * `metadataBase` set in the locale layout.
 */
export function localeAlternates(
  path: string,
  locale: string,
): NonNullable<Metadata["alternates"]> {
  const de = path;
  const en = path === "/" ? "/en" : `/en${path}`;
  return {
    canonical: locale === "en" ? en : de,
    languages: { de, en, "x-default": de },
  };
}
