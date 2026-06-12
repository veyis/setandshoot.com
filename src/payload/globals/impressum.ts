import type { GlobalConfig } from "payload";
import { isAdmin } from "@/payload/access/is-admin";
import { revalidateMarketingPage } from "@/payload/hooks/revalidate-marketing-page";

export const Impressum: GlobalConfig = {
  slug: "impressum",
  label: "Impressum",
  admin: { group: "Rechtliches" },
  access: { read: () => true, update: isAdmin },
  hooks: { afterChange: [revalidateMarketingPage(["/impressum", "/en/impressum"])] },
  fields: [
    { name: "legalName", type: "text", required: true },
    { name: "addressLine1", type: "text", required: true },
    { name: "addressLine2", type: "text" },
    { name: "postalCode", type: "text", required: true },
    { name: "city", type: "text", required: true, defaultValue: "Bremen" },
    { name: "country", type: "text", required: true, defaultValue: "Deutschland" },
    { name: "email", type: "email", required: true },
    { name: "phone", type: "text" },
    { name: "ustIdNr", type: "text", label: "USt-IdNr." },
    {
      name: "responsibleForContent",
      type: "text",
      label: "Verantwortlich i.S.d. § 18 Abs. 2 MStV",
    },
    { name: "additionalNotes", type: "textarea", localized: true },
  ],
};
