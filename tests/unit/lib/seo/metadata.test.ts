import { describe, expect, it } from "vitest";
import { buildPageMetadata } from "@/lib/seo/metadata";

describe("buildPageMetadata", () => {
  const base = { title: "Leistungen", description: "Volleyball." };

  it("sets title, description and German canonical", () => {
    const m = buildPageMetadata({ ...base, locale: "de", path: "/services" });
    expect(m.title).toBe("Leistungen");
    expect(m.description).toBe("Volleyball.");
    expect(m.alternates?.canonical).toBe("/de/services");
    expect(m.alternates?.languages).toMatchObject({ en: "/services", de: "/de/services" });
  });

  it("sets the English canonical unprefixed", () => {
    const m = buildPageMetadata({ ...base, locale: "en", path: "/services" });
    expect(m.alternates?.canonical).toBe("/services");
  });

  it("emits og + twitter card with the same title", () => {
    const m = buildPageMetadata({ ...base, locale: "de", path: "/services" });
    expect((m.openGraph as { title?: string }).title).toBe("Leistungen");
    expect((m.twitter as { card?: string }).card).toBe("summary_large_image");
  });

  it("includes an explicit OG image when given", () => {
    const m = buildPageMetadata({
      ...base,
      locale: "de",
      path: "/stories/x",
      image: { url: "https://cdn.example/x.jpg", width: 1200, height: 800, alt: "x" },
    });
    expect((m.openGraph as { images?: unknown[] }).images).toEqual([
      { url: "https://cdn.example/x.jpg", width: 1200, height: 800, alt: "x" },
    ]);
  });
});
