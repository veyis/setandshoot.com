import type { Metadata } from "next";

/**
 * Build canonical + hreflang alternates for a page, given its locale-agnostic
 * path (e.g. "/", "/stories/foo"). Relative paths resolve against
 * `metadataBase` set in the locale layout.
 *
 * `defaultLocale` is "en" with localePrefix "as-needed" (see lib/i18n/config.ts
 * and lib/i18n/routing.ts), so **English is served unprefixed** and German
 * lives under /de. This file previously assumed the opposite (German
 * unprefixed, English at /en) and emitted an /en/* canonical for English pages
 * — but next-intl 307-redirects /en/* back to the unprefixed path, so every
 * page pointed its canonical at a redirect, and /de/* pointed its canonical at
 * the English page. Google could resolve neither and reported the whole site
 * as "Duplicate without user-selected canonical" (Search Console, Aug 2026).
 * Keep this file in agreement with `defaultLocale`.
 */
export function localeAlternates(
  path: string,
  locale: string,
): NonNullable<Metadata["alternates"]> {
  const en = path;
  const de = path === "/" ? "/de" : `/de${path}`;
  return {
    canonical: locale === "de" ? de : en,
    languages: { de, en, "x-default": en },
  };
}
