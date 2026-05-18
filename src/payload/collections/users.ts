import type { CollectionConfig } from "payload";
import { isAdmin } from "@/payload/access/is-admin";

export const Users: CollectionConfig = {
  slug: "users",
  auth: {
    tokenExpiration: 60 * 60 * 24 * 30,
    cookies: {
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "role", "createdAt"],
  },
  access: {
    create: isAdmin,
    read: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "editor",
      options: [
        { label: "Admin", value: "admin" },
        { label: "Editor", value: "editor" },
      ],
    },
    { name: "name", type: "text" },
  ],
};
