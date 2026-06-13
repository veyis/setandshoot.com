import { describe, expect, it } from "vitest";
import {
  personSchema,
  localBusinessSchema,
  breadcrumbSchema,
  articleSchema,
} from "@/lib/seo/schema";

const org = {
  instagram: "https://instagram.com/x",
  linkedin: "",
  email: "a@b.de",
  phone: "",
  city: "Bremen",
};

describe("schema builders", () => {
  it("personSchema includes only non-empty sameAs", () => {
    const s = personSchema({ siteUrl: "https://s.com", org });
    expect(s["@type"]).toBe("Person");
    expect(s.sameAs).toEqual(["https://instagram.com/x"]); // linkedin "" omitted
  });

  it("localBusinessSchema sets areaServed + omits empty contact", () => {
    const s = localBusinessSchema({ siteUrl: "https://s.com", org });
    expect(s["@type"]).toBe("ProfessionalService");
    expect(s.areaServed).toBe("Bremen");
    expect(s.email).toBe("a@b.de");
    expect("telephone" in s).toBe(false); // phone "" omitted
  });

  it("breadcrumbSchema numbers positions from 1", () => {
    const s = breadcrumbSchema([
      { name: "Home", url: "https://s.com/" },
      { name: "Stories", url: "https://s.com/stories" },
    ]);
    const items = s.itemListElement as { position: number }[];
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(items[1]!.position).toBe(2);
  });

  it("articleSchema nests an ImageObject when an image is given", () => {
    const s = articleSchema({
      siteUrl: "https://s.com",
      title: "T",
      description: "D",
      url: "https://s.com/stories/t",
      image: { url: "https://cdn/x.jpg", width: 1200, height: 800 },
      datePublished: "2026-01-01",
    });
    expect(s["@type"]).toBe("Article");
    expect((s.image as { "@type": string })["@type"]).toBe("ImageObject");
  });
});
