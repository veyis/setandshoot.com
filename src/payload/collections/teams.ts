import type { CollectionConfig } from "payload";
import { isAdmin } from "@/payload/access/is-admin";
import { canManageContent } from "@/payload/access/can-manage-content";
const tierOptions = [
  { label: "Bundesliga", value: "bundesliga" },
  { label: "2. Bundesliga", value: "2-bundesliga" },
  { label: "Regional", value: "regional" },
  { label: "Jugend", value: "youth" },
] as const;

export const Teams: CollectionConfig = {
  slug: "teams",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "shortName", "city"],
    group: "Taxonomie",
  },
  access: {
    read: () => true,
    create: canManageContent,
    update: canManageContent,
    delete: isAdmin,
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "shortName", type: "text" },
    { name: "city", type: "text" },
    {
      name: "tier",
      type: "select",
      options: [...tierOptions],
    },
    { name: "published", type: "checkbox", defaultValue: true, admin: { position: "sidebar" } },
  ],
};
