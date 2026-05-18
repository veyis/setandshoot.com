import type { CollectionConfig } from "payload";
import { isAdmin } from "@/payload/access/is-admin";
import { canManageContent } from "@/payload/access/can-manage-content";
import { readPublishedOrAuthed } from "@/payload/access/read-published-or-authed";
import { storyLayoutBlocks } from "@/payload/blocks/story-layout";
import { revalidateStory } from "@/payload/hooks/revalidate-story";

export const Stories: CollectionConfig = {
  slug: "stories",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "playedAt", "venue", "published", "updatedAt"],
    group: "Portfolio",
    description: "Foto-Stories — Kern des Portfolios",
  },
  access: {
    read: readPublishedOrAuthed,
    create: canManageContent,
    update: canManageContent,
    delete: isAdmin,
  },
  hooks: {
    afterChange: [revalidateStory],
    beforeChange: [
      ({ data, originalDoc }) => {
        if (data?.published && !originalDoc?.publishedAt) {
          data.publishedAt = new Date().toISOString();
        }
        if (data?.published === false) {
          data.publishedAt = null;
        }
        return data;
      },
    ],
  },
  fields: [
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        position: "sidebar",
        description: "Gemeinsamer Slug für DE/EN (z. B. vcw-sc-potsdam-2025)",
      },
    },
    {
      name: "title",
      type: "text",
      required: true,
      localized: true,
    },
    {
      name: "competition",
      type: "relationship",
      relationTo: "competitions",
    },
    {
      name: "homeTeam",
      type: "relationship",
      relationTo: "teams",
      label: "Heim",
    },
    {
      name: "awayTeam",
      type: "relationship",
      relationTo: "teams",
      label: "Gast",
    },
    { name: "venue", type: "text" },
    {
      name: "playedAt",
      type: "date",
      admin: { date: { pickerAppearance: "dayOnly" } },
    },
    { name: "result", type: "text", label: "Ergebnis" },
    {
      name: "summary",
      type: "richText",
      localized: true,
    },
    {
      name: "layout",
      type: "blocks",
      blocks: storyLayoutBlocks,
      label: "Layout",
    },
    {
      name: "coverPhoto",
      type: "relationship",
      relationTo: "photos",
      admin: { position: "sidebar" },
    },
    {
      name: "featured",
      type: "checkbox",
      defaultValue: false,
      admin: { position: "sidebar" },
    },
    {
      name: "featuredOrder",
      type: "number",
      admin: {
        position: "sidebar",
        condition: (_, siblingData) => Boolean(siblingData?.featured),
      },
    },
    {
      name: "published",
      type: "checkbox",
      defaultValue: false,
      admin: { position: "sidebar" },
    },
    {
      name: "publishedAt",
      type: "date",
      admin: {
        position: "sidebar",
        readOnly: true,
        date: { pickerAppearance: "dayAndTime" },
      },
    },
  ],
};
