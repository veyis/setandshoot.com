import de from "@/messages/de.json";
import en from "@/messages/en.json";

export type SeoPage =
  "about" | "services" | "contact" | "highlights" | "athletes" | "journal" | "stories";

type SeoEntry = { title: string; description: string };

const tables: Record<"de" | "en", Record<SeoPage, SeoEntry>> = {
  de: (de as { seo: Record<SeoPage, SeoEntry> }).seo,
  en: (en as { seo: Record<SeoPage, SeoEntry> }).seo,
};

/** SEO title/description for a page, read from the i18n JSON. Non-de/en → de. */
export function seoCopy(locale: string, page: SeoPage): SeoEntry {
  const table = locale === "en" ? tables.en : tables.de;
  return table[page];
}

/** i18n default overridden by a non-empty CMS value. */
export function resolveSeo(
  base: { title: string; description: string },
  override?: { title?: string | null; description?: string | null },
): { title: string; description: string } {
  return {
    title: override?.title?.trim() || base.title,
    description: override?.description?.trim() || base.description,
  };
}
