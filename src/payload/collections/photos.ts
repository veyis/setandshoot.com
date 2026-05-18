import type { CollectionConfig } from "payload";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isAdmin } from "@/payload/access/is-admin";
import { canManageContent } from "@/payload/access/can-manage-content";
import { readPublishedOrAuthed } from "@/payload/access/read-published-or-authed";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export const Photos: CollectionConfig = {
  slug: "photos",
  admin: {
    useAsTitle: "filename",
    defaultColumns: ["filename", "alt", "story", "updatedAt"],
    group: "Portfolio",
  },
  access: {
    read: readPublishedOrAuthed,
    create: canManageContent,
    update: canManageContent,
    delete: isAdmin,
  },
  upload: {
    staticDir: path.resolve(dirname, "../../../../public/media"),
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
    adminThumbnail: "thumbnail",
    focalPoint: true,
    imageSizes: [
      { name: "thumbnail", width: 480, height: 360, position: "centre" },
      { name: "feed", width: 1400, withoutEnlargement: true },
      { name: "full", width: 2560, withoutEnlargement: true },
    ],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      localized: true,
      label: "Alt-Text",
    },
    {
      name: "caption",
      type: "richText",
      localized: true,
    },
    {
      name: "story",
      type: "relationship",
      relationTo: "stories",
      admin: { description: "Leer lassen für reine Highlight-Fotos" },
    },
    {
      name: "tags",
      type: "relationship",
      relationTo: "tags",
      hasMany: true,
    },
    {
      name: "isHighlight",
      type: "checkbox",
      defaultValue: false,
      admin: { position: "sidebar" },
    },
    {
      name: "isCover",
      type: "checkbox",
      defaultValue: false,
      admin: { position: "sidebar" },
    },
    {
      name: "orderInStory",
      type: "number",
      admin: { position: "sidebar" },
    },
    {
      name: "watermark",
      type: "select",
      defaultValue: "none",
      options: [
        { label: "Kein", value: "none" },
        { label: "Leicht", value: "light" },
        { label: "Standard", value: "standard" },
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "published",
      type: "checkbox",
      defaultValue: false,
      admin: { position: "sidebar" },
    },
  ],
};
