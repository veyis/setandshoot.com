import { cache } from "react";
import { getPayload } from "@/lib/payload/get-payload";
import type { Locale } from "@/lib/i18n/config";
import type { Story } from "@/payload-types";

// Wrapped in React.cache so co-located callers within one render (e.g.
// generateMetadata + the page) dedupe the Payload query.
export const getPublishedStories = cache(async (locale: Locale): Promise<Story[]> => {
  const payload = await getPayload();
  const { docs } = await payload.find({
    collection: "stories",
    locale,
    depth: 2,
    where: { published: { equals: true } },
    sort: "-playedAt",
    limit: 100,
  });
  return docs;
});

export const getStoryBySlug = cache(async (slug: string, locale: Locale): Promise<Story | null> => {
  const payload = await getPayload();
  const { docs } = await payload.find({
    collection: "stories",
    locale,
    // depth 2 resolves blocks -> photos, which is all the story view renders.
    depth: 2,
    where: {
      and: [{ slug: { equals: slug } }, { published: { equals: true } }],
    },
    limit: 1,
  });
  return docs[0] ?? null;
});
