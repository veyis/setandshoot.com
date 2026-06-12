import type { GlobalConfig } from "payload";
import { isAdmin } from "@/payload/access/is-admin";
import { revalidateMarketingPage } from "@/payload/hooks/revalidate-marketing-page";

export const Datenschutz: GlobalConfig = {
  slug: "datenschutz",
  label: "Datenschutzerklärung",
  admin: { group: "Rechtliches" },
  access: { read: () => true, update: isAdmin },
  hooks: { afterChange: [revalidateMarketingPage(["/datenschutz", "/en/datenschutz"])] },
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
