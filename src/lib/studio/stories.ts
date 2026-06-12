import "server-only";
import { getPayload } from "payload";
import config from "@/payload/payload.config";
import { photoSrc, resolvePhoto } from "@/lib/payload/media";
import { altFor, type LocalizedText } from "@/lib/studio/localized";
import type { Story } from "@/payload-types";
import type { StoryCreateInput, StoryMetaInput } from "@/lib/studio/schemas";

export type StudioStoryListItem = {
  id: number;
  slug: string;
  titleDe: string;
  titleEn: string;
  playedAt: string | null;
  published: boolean;
  coverThumbUrl: string | null;
  updatedAt: string;
};

export async function listStudioStories(): Promise<StudioStoryListItem[]> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "stories",
    sort: "-updatedAt",
    limit: 200,
    depth: 1, // resolve coverPhoto for thumbnails
    locale: "all",
    overrideAccess: true,
  });
  return docs.map((doc) => {
    const story = doc as Story;
    return {
      id: story.id,
      slug: story.slug,
      titleDe: altFor(story.title as LocalizedText, "de"),
      titleEn: altFor(story.title as LocalizedText, "en"),
      playedAt: story.playedAt ?? null,
      published: Boolean(story.published),
      coverThumbUrl: photoSrc(resolvePhoto(story.coverPhoto), "thumbnail"),
      updatedAt: story.updatedAt,
    };
  });
}

export type StudioStoryMeta = {
  id: number;
  slug: string;
  titleDe: string;
  titleEn: string;
  competitionId: number | null;
  homeTeamId: number | null;
  awayTeamId: number | null;
  venue: string;
  playedAt: string | null;
  result: string;
  published: boolean;
};

function relationId(value: number | { id: number } | null | undefined): number | null {
  if (typeof value === "number") return value;
  return value?.id ?? null;
}

export async function getStudioStoryMeta(id: number): Promise<StudioStoryMeta | null> {
  const payload = await getPayload({ config });
  const story = (await payload
    .findByID({ collection: "stories", id, depth: 0, locale: "all", overrideAccess: true })
    .catch(() => null)) as Story | null;
  if (!story) return null;
  return {
    id: story.id,
    slug: story.slug,
    titleDe: altFor(story.title as LocalizedText, "de"),
    titleEn: altFor(story.title as LocalizedText, "en"),
    competitionId: relationId(story.competition),
    homeTeamId: relationId(story.homeTeam),
    awayTeamId: relationId(story.awayTeam),
    venue: story.venue ?? "",
    playedAt: story.playedAt ? story.playedAt.slice(0, 10) : null,
    result: story.result ?? "",
    published: Boolean(story.published),
  };
}

export type StoryOption = { id: number; label: string };

export async function listStoryOptions(): Promise<{
  competitions: StoryOption[];
  teams: StoryOption[];
}> {
  const payload = await getPayload({ config });
  const [competitions, teams] = await Promise.all([
    payload.find({
      collection: "competitions",
      sort: "name",
      limit: 200,
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({ collection: "teams", sort: "name", limit: 200, depth: 0, overrideAccess: true }),
  ]);
  return {
    competitions: competitions.docs.map((c) => ({ id: c.id, label: `${c.name} ${c.season}` })),
    teams: teams.docs.map((t) => ({ id: t.id, label: t.name })),
  };
}

export async function createStudioStory(input: StoryCreateInput): Promise<{ id: number }> {
  const payload = await getPayload({ config });
  const doc = await payload.create({
    collection: "stories",
    data: { slug: input.slug, title: input.titleDe, published: false },
    locale: "de",
    overrideAccess: true,
  });
  return { id: doc.id };
}

export async function updateStudioStoryMeta(input: StoryMetaInput): Promise<void> {
  const payload = await getPayload({ config });
  await payload.update({
    collection: "stories",
    id: input.id,
    data: {
      title: input.titleDe,
      competition: input.competitionId ?? null,
      homeTeam: input.homeTeamId ?? null,
      awayTeam: input.awayTeamId ?? null,
      venue: input.venue ?? null,
      playedAt: input.playedAt ?? null,
      result: input.result ?? null,
    },
    locale: "de",
    overrideAccess: true,
  });
  if (input.titleEn && input.titleEn.trim() !== "") {
    await payload.update({
      collection: "stories",
      id: input.id,
      data: { title: input.titleEn },
      locale: "en",
      overrideAccess: true,
    });
  }
}

export async function setStudioStoryPublished(id: number, published: boolean): Promise<void> {
  const payload = await getPayload({ config });
  // beforeChange hook on the collection manages publishedAt.
  await payload.update({
    collection: "stories",
    id,
    data: { published },
    locale: "de",
    overrideAccess: true,
  });
}
