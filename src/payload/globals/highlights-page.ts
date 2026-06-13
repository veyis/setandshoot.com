import type { GlobalConfig } from "payload";
import { canManageContent } from "@/payload/access/can-manage-content";
import { marketingBlocks } from "@/payload/blocks/marketing";
import { revalidateMarketingPage } from "@/payload/hooks/revalidate-marketing-page";

export const HighlightsPage: GlobalConfig = {
  slug: "highlightsPage",
  label: "Highlights (Seite)",
  admin: { group: "Seiten" },
  access: { read: () => true, update: canManageContent },
  hooks: { afterChange: [revalidateMarketingPage(["/highlights", "/en/highlights"])] },
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
