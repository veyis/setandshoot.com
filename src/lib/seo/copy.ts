import de from "@/messages/de.json";
import en from "@/messages/en.json";

export type SeoPage =
  | "about"
  | "services"
  | "contact"
  | "highlights"
  | "athletes"
  | "journal"
  | "stories";

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
