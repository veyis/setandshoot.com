import { getPayload } from "@/lib/payload/get-payload";
import type { Locale } from "@/lib/i18n/config";
import type { Story } from "@/payload-types";

export async function getPublishedStories(locale: Locale): Promise<Story[]> {
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
}

export async function getStoryBySlug(slug: string, locale: Locale): Promise<Story | null> {
  const payload = await getPayload();
  const { docs } = await payload.find({
    collection: "stories",
    locale,
    depth: 3,
    where: {
      and: [{ slug: { equals: slug } }, { published: { equals: true } }],
    },
    limit: 1,
  });
  return docs[0] ?? null;
}
