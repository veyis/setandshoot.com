import type { CollectionConfig } from "payload";
import { isAdmin } from "@/payload/access/is-admin";
import { canManageContent } from "@/payload/access/can-manage-content";
export const Competitions: CollectionConfig = {
  slug: "competitions",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "season", "tier"],
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
    { name: "season", type: "text", required: true },
    {
      name: "tier",
      type: "select",
      options: [
        { label: "Bundesliga", value: "bundesliga" },
        { label: "2. Bundesliga", value: "2-bundesliga" },
        { label: "Regional", value: "regional" },
        { label: "Jugend", value: "youth" },
      ],
    },
    { name: "published", type: "checkbox", defaultValue: true, admin: { position: "sidebar" } },
  ],
};
