import { describe, it, expect } from "vitest";
import { localeAlternates } from "@/lib/seo/alternates";

describe("localeAlternates", () => {
  it("builds canonical + hreflang for the home page", () => {
    expect(localeAlternates("/", "de")).toEqual({
      canonical: "/de",
      languages: { de: "/de", en: "/", "x-default": "/" },
    });
    expect(localeAlternates("/", "en")).toEqual({
      canonical: "/",
      languages: { de: "/de", en: "/", "x-default": "/" },
    });
  });

  it("leaves English deep paths unprefixed and puts German under /de", () => {
    expect(localeAlternates("/stories/foo", "en")).toEqual({
      canonical: "/stories/foo",
      languages: { de: "/de/stories/foo", en: "/stories/foo", "x-default": "/stories/foo" },
    });
  });
});
