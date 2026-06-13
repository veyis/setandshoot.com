import "server-only";
import { getPayload } from "payload";
import { sql } from "@payloadcms/db-postgres";
import config from "@/payload/payload.config";
import { photoSrc } from "@/lib/payload/media";
import { altFor, type LocalizedText } from "@/lib/studio/localized";
import type { Photo } from "@/payload-types";

export type StudioPhoto = {
  id: number;
  filename: string;
  thumbUrl: string | null;
  altDe: string;
  altEn: string;
  published: boolean;
  isHighlight: boolean;
  isCover: boolean;
  tagIds: number[];
  createdAt: string;
};

export type StudioTag = { id: number; name: string };

export async function listStudioTags(): Promise<StudioTag[]> {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "tags",
    sort: "name",
    limit: 100,
    depth: 0,
    locale: "de",
    overrideAccess: true,
  });
  return docs.map((tag) => ({ id: tag.id, name: tag.name }));
}

export async function listStudioPhotos(): Promise<StudioPhoto[]> {
  const payload = await getPayload({ config });
  // locale: "all" so the editor can show DE and EN alt text side-by-side.
  const { docs } = await payload.find({
    collection: "photos",
    sort: "-createdAt",
    limit: 200,
    depth: 0,
    locale: "all",
    overrideAccess: true,
  });
  return docs.map((doc) => {
    const photo = doc as Photo;
    return {
      id: photo.id,
      filename: photo.filename ?? "",
      thumbUrl: photoSrc(photo, "thumbnail"),
      altDe: altFor(photo.alt as LocalizedText, "de"),
      altEn: altFor(photo.alt as LocalizedText, "en"),
      published: Boolean(photo.published),
      isHighlight: Boolean(photo.isHighlight),
      isCover: Boolean(photo.isCover),
      // depth: 0 → tags come back as numeric ids.
      tagIds: (photo.tags ?? []).filter((tag): tag is number => typeof tag === "number"),
      createdAt: photo.createdAt,
    };
  });
}

export async function createPhotoFromUpload(file: {
  data: Buffer;
  name: string;
  mimetype: string;
  size: number;
}): Promise<{ id: number }> {
  const payload = await getPayload({ config });
  // Beginner-friendly default: derive alt text from the filename; it is
  // editable in the grid right after upload.
  const fallbackAlt =
    file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]+/g, " ")
      .trim() || file.name;
  const doc = await payload.create({
    collection: "photos",
    data: { alt: fallbackAlt, published: false },
    file,
    locale: "de",
    overrideAccess: true,
  });
  return { id: doc.id };
}

export async function updatePhotoMeta(input: {
  id: number;
  altDe: string;
  altEn?: string;
  published: boolean;
  isHighlight: boolean;
  isCover: boolean;
  tagIds?: number[];
}): Promise<void> {
  const payload = await getPayload({ config });
  await payload.update({
    collection: "photos",
    id: input.id,
    data: {
      alt: input.altDe,
      published: input.published,
      isHighlight: input.isHighlight,
      isCover: input.isCover,
      ...(input.tagIds ? { tags: input.tagIds } : {}),
    },
    locale: "de",
    overrideAccess: true,
  });
  // EN alt is tri-state:
  //   undefined        -> leave the EN override untouched
  //   non-empty string -> set the EN override via the Local API
  //   "" (cleared)     -> remove the EN override
  // Clearing can't go through payload.update: `alt` is required + NOT NULL, so
  // the API rejects a blank value and the column can't be nulled. The locale
  // row also stores the localized `caption`, so deleting the row would drop it.
  // Blank just the EN alt column directly; a missing EN row makes this a no-op
  // (EN already falls back to DE).
  if (input.altEn !== undefined) {
    const altEn = input.altEn.trim();
    if (altEn !== "") {
      await payload.update({
        collection: "photos",
        id: input.id,
        data: { alt: altEn },
        locale: "en",
        overrideAccess: true,
      });
    } else {
      const db = payload.db as unknown as {
        drizzle: { execute: (query: unknown) => Promise<unknown> };
      };
      await db.drizzle.execute(
        sql`UPDATE payload.photos_locales SET alt = '' WHERE _locale = 'en' AND _parent_id = ${input.id}`,
      );
    }
  }
}
