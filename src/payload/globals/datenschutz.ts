import type { GlobalConfig } from "payload";
import { isAdmin } from "@/payload/access/is-admin";

export const Datenschutz: GlobalConfig = {
  slug: "datenschutz",
  label: "Datenschutzerklärung",
  admin: { group: "Rechtliches" },
  access: { read: () => true, update: isAdmin },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      localized: true,
      defaultValue: "Datenschutzerklärung",
    },
    { name: "intro", type: "richText", localized: true },
    { name: "body", type: "richText", localized: true },
    { name: "lastUpdated", type: "date", required: true },
  ],
};
