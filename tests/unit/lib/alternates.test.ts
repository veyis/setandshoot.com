import { describe, it, expect } from "vitest";
import { localeAlternates } from "@/lib/seo/alternates";

describe("localeAlternates", () => {
  it("builds canonical + hreflang for the home page", () => {
    expect(localeAlternates("/", "de")).toEqual({
      canonical: "/",
      languages: { de: "/", en: "/en", "x-default": "/" },
    });
    expect(localeAlternates("/", "en")).toEqual({
      canonical: "/en",
      languages: { de: "/", en: "/en", "x-default": "/" },
    });
  });

  it("prefixes English deep paths with /en", () => {
    expect(localeAlternates("/stories/foo", "en")).toEqual({
      canonical: "/en/stories/foo",
      languages: { de: "/stories/foo", en: "/en/stories/foo", "x-default": "/stories/foo" },
    });
  });
});
