/**
 * Payload returns localized fields as plain strings for a single locale, or as
 * `{ de, en }` objects when queried with `locale: "all"`. Normalize both.
 */
export type LocalizedText = string | { de?: string | null; en?: string | null } | null | undefined;

export function altFor(value: LocalizedText, locale: "de" | "en"): string {
  if (typeof value === "string") return value;
  return value?.[locale] ?? "";
}
