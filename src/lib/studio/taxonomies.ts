import "server-only";
import { getPayload } from "payload";
import config from "@/payload/payload.config";
import { altFor, type LocalizedText } from "@/lib/studio/localized";
import type {
  CompetitionInput,
  TagInput,
  TaxonomyDeleteInput,
  TeamInput,
} from "@/lib/studio/schemas";
import type { Tag } from "@/payload-types";

export type StudioTeamRow = Required<Pick<TeamInput, "id">> & Omit<TeamInput, "id">;

export async function listStudioTeams(): Promise<StudioTeamRow[]> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "teams",
    sort: "name",
    limit: 200,
    depth: 0,
    locale: "de",
    overrideAccess: true,
  });
  return docs.map((team) => ({
    id: team.id,
    name: team.name,
    shortName: team.shortName ?? undefined,
    city: team.city ?? undefined,
    tier: team.tier ?? null,
    published: Boolean(team.published),
  }));
}

export type StudioCompetitionRow = Required<Pick<CompetitionInput, "id">> &
  Omit<CompetitionInput, "id">;

export async function listStudioCompetitions(): Promise<StudioCompetitionRow[]> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "competitions",
    sort: "name",
    limit: 200,
    depth: 0,
    locale: "de",
    overrideAccess: true,
  });
  return docs.map((competition) => ({
    id: competition.id,
    name: competition.name,
    season: competition.season,
    tier: competition.tier ?? null,
    published: Boolean(competition.published),
  }));
}

export type StudioTagRow = Required<Pick<TagInput, "id">> & Omit<TagInput, "id">;

export async function listStudioTags(): Promise<StudioTagRow[]> {
  const payload = await getPayload({ config });
  // locale: "all" so the editor can show DE and EN names side-by-side.
  const { docs } = await payload.find({
    collection: "tags",
    sort: "slug",
    limit: 200,
    depth: 0,
    locale: "all",
    overrideAccess: true,
  });
  return docs.map((doc) => {
    const tag = doc as Tag;
    return {
      id: tag.id,
      nameDe: altFor(tag.name as LocalizedText, "de"),
      nameEn: altFor(tag.name as LocalizedText, "en") || undefined,
      slug: tag.slug,
      published: Boolean(tag.published),
    };
  });
}

export async function saveStudioTeam(input: TeamInput): Promise<{ id: number }> {
  const payload = await getPayload({ config });
  const data = {
    name: input.name,
    shortName: input.shortName ?? null,
    city: input.city ?? null,
    tier: input.tier ?? null,
    published: input.published,
  };
  if (input.id) {
    await payload.update({ collection: "teams", id: input.id, data, overrideAccess: true });
    return { id: input.id };
  }
  const doc = await payload.create({ collection: "teams", data, overrideAccess: true });
  return { id: doc.id };
}

export async function saveStudioCompetition(input: CompetitionInput): Promise<{ id: number }> {
  const payload = await getPayload({ config });
  const data = {
    name: input.name,
    season: input.season,
    tier: input.tier ?? null,
    published: input.published,
  };
  if (input.id) {
    await payload.update({ collection: "competitions", id: input.id, data, overrideAccess: true });
    return { id: input.id };
  }
  const doc = await payload.create({ collection: "competitions", data, overrideAccess: true });
  return { id: doc.id };
}

export async function saveStudioTag(input: TagInput): Promise<{ id: number }> {
  const payload = await getPayload({ config });
  const data = { name: input.nameDe, slug: input.slug, published: input.published };
  let id: number;
  if (input.id) {
    await payload.update({
      collection: "tags",
      id: input.id,
      data,
      locale: "de",
      overrideAccess: true,
    });
    id = input.id;
  } else {
    const doc = await payload.create({
      collection: "tags",
      data,
      locale: "de",
      overrideAccess: true,
    });
    id = doc.id;
  }
  if (input.nameEn && input.nameEn !== "") {
    await payload.update({
      collection: "tags",
      id,
      data: { name: input.nameEn },
      locale: "en",
      overrideAccess: true,
    });
  }
  return { id };
}

export async function deleteStudioTaxonomy(
  collection: TaxonomyDeleteInput["collection"],
  id: number,
): Promise<void> {
  const payload = await getPayload({ config });
  await payload.delete({ collection, id, overrideAccess: true });
}
