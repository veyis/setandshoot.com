import type { MetadataRoute } from "next";
import { getPayload } from "@/lib/payload/get-payload";
import { env } from "@/env";

// Refresh hourly so newly published stories appear without a redeploy.
export const revalidate = 3600;

// German is the unprefixed default locale; English lives under /en.
const STATIC_PATHS = [
  "",
  "/stories",
  "/highlights",
  "/athletes",
  "/about",
  "/services",
  "/journal",
  "/contact",
  "/impressum",
  "/datenschutz",
];

function localized(base: string, path: string, lastModified?: Date): MetadataRoute.Sitemap {
  const de = `${base}${path || "/"}`;
  const en = `${base}/en${path}`;
  const alternates = { languages: { de, en } };
  return [
    { url: de, lastModified, alternates },
    { url: en, lastModified, alternates },
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_SITE_URL;

  const payload = await getPayload();
  // The local API bypasses access control, so filter to published explicitly.
  const { docs: stories } = await payload.find({
    collection: "stories",
    where: { published: { equals: true } },
    limit: 500,
    depth: 0,
  });

  return [
    ...STATIC_PATHS.flatMap((path) => localized(base, path)),
    ...stories.flatMap((story) =>
      localized(base, `/stories/${story.slug}`, new Date(story.updatedAt)),
    ),
  ];
}
