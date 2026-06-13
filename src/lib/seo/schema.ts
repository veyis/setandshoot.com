export type OrgIdentity = {
  instagram?: string;
  linkedin?: string;
  email?: string;
  phone?: string;
  city?: string;
};

export type JsonLdObject = Record<string, unknown>;

const NAME = "Belin Akguel";

function sameAs(org: OrgIdentity): string[] {
  return [org.instagram, org.linkedin].filter((u): u is string => Boolean(u && u.trim()));
}

export function webSiteSchema({ siteUrl }: { siteUrl: string }): JsonLdObject {
  return { "@context": "https://schema.org", "@type": "WebSite", name: NAME, url: siteUrl };
}

export function personSchema({
  siteUrl,
  org,
}: {
  siteUrl: string;
  org: OrgIdentity;
}): JsonLdObject {
  const links = sameAs(org);
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: NAME,
    jobTitle: "Photographer",
    url: siteUrl,
    ...(links.length ? { sameAs: links } : {}),
  };
}

export function localBusinessSchema({
  siteUrl,
  org,
}: {
  siteUrl: string;
  org: OrgIdentity;
}): JsonLdObject {
  const links = sameAs(org);
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: NAME,
    url: siteUrl,
    image: `${siteUrl}/opengraph-image`,
    ...(org.city ? { areaServed: org.city } : {}),
    ...(org.email ? { email: org.email } : {}),
    ...(org.phone ? { telephone: org.phone } : {}),
    ...(links.length ? { sameAs: links } : {}),
  };
}

export function serviceSchema({
  siteUrl,
  offers,
}: {
  siteUrl: string;
  offers: { title: string; body: string }[];
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    provider: { "@type": "Person", name: NAME },
    serviceType: "Sports & volleyball photography",
    areaServed: "Bremen",
    url: `${siteUrl}/services`,
    ...(offers.length
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Leistungen",
            itemListElement: offers.map((o) => ({
              "@type": "Offer",
              name: o.title,
              description: o.body,
            })),
          },
        }
      : {}),
  };
}

export function articleSchema({
  siteUrl: _siteUrl,
  title,
  description,
  url,
  image,
  datePublished,
}: {
  siteUrl: string;
  title: string;
  description: string;
  url: string;
  image?: { url: string; width: number; height: number };
  datePublished?: string;
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url,
    author: { "@type": "Person", name: NAME },
    publisher: { "@type": "Person", name: NAME },
    ...(datePublished ? { datePublished } : {}),
    ...(image
      ? {
          image: {
            "@type": "ImageObject",
            url: image.url,
            width: image.width,
            height: image.height,
          },
        }
      : {}),
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}
