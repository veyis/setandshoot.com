import type { CollectionConfig } from "payload";
import { isAdmin } from "@/payload/access/is-admin";

export const Bookings: CollectionConfig = {
  slug: "bookings",
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "name", "locale", "createdAt"],
    group: "Anfragen",
  },
  access: {
    create: () => false,
    read: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      minLength: 2,
      maxLength: 120,
    },
    {
      name: "email",
      type: "email",
      required: true,
    },
    {
      name: "organization",
      type: "text",
      maxLength: 200,
    },
    {
      name: "message",
      type: "textarea",
      required: true,
      minLength: 10,
      maxLength: 5000,
    },
    {
      name: "locale",
      type: "select",
      required: true,
      defaultValue: "de",
      options: [
        { label: "Deutsch", value: "de" },
        { label: "English", value: "en" },
      ],
    },
  ],
};
