/**
 * Payload returns localized fields as plain strings for a single locale, or as
 * `{ de, en }` objects when queried with `locale: "all"`. Normalize both.
 */
export type LocalizedText = string | { de?: string | null; en?: string | null } | null | undefined;

export function altFor(value: LocalizedText, locale: "de" | "en"): string {
  if (typeof value === "string") return value;
  return value?.[locale] ?? "";
}

/** Rich-text variant of altFor: a plain doc has `root`; locale-all wraps as {de,en}. */
export function richTextFor(value: unknown, locale: "de" | "en"): unknown {
  if (!value || typeof value !== "object") return null;
  if ("root" in value) return value;
  const wrapped = value as { de?: unknown; en?: unknown };
  return wrapped[locale] ?? null;
}
