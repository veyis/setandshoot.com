import type { GlobalConfig } from "payload";
import { canManageContent } from "@/payload/access/can-manage-content";
import { marketingBlocks } from "@/payload/blocks/marketing";
import { revalidateMarketingPage } from "@/payload/hooks/revalidate-marketing-page";

export const AboutPage: GlobalConfig = {
  slug: "aboutPage",
  label: "Über mich (Seite)",
  admin: { group: "Seiten" },
  access: { read: () => true, update: canManageContent },
  hooks: { afterChange: [revalidateMarketingPage(["/about", "/en/about"])] },
  fields: [
    { name: "sections", type: "blocks", blocks: marketingBlocks, label: "Sektionen" },
    {
      name: "seo",
      type: "group",
      localized: true,
      label: "SEO",
      fields: [
        { name: "title", type: "text", label: "SEO-Titel" },
        { name: "description", type: "textarea", label: "SEO-Beschreibung" },
      ],
    },
  ],
};
