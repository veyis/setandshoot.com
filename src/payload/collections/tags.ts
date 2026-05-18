import type { CollectionConfig } from "payload";
import { isAdmin } from "@/payload/access/is-admin";
import { canManageContent } from "@/payload/access/can-manage-content";
export const Tags: CollectionConfig = {
  slug: "tags",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug"],
    group: "Taxonomie",
  },
  access: {
    read: () => true,
    create: canManageContent,
    update: canManageContent,
    delete: isAdmin,
  },
  fields: [
    { name: "name", type: "text", required: true, localized: true },
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "published", type: "checkbox", defaultValue: true, admin: { position: "sidebar" } },
  ],
};
