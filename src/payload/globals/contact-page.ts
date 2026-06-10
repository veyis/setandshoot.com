import type { GlobalConfig } from "payload";
import { canManageContent } from "@/payload/access/can-manage-content";
import { marketingBlocks } from "@/payload/blocks/marketing";
import { revalidateMarketingPage } from "@/payload/hooks/revalidate-marketing-page";

export const ContactPage: GlobalConfig = {
  slug: "contactPage",
  label: "Kontakt (Seite)",
  admin: { group: "Seiten" },
  access: { read: () => true, update: canManageContent },
  hooks: { afterChange: [revalidateMarketingPage(["/contact", "/en/contact"])] },
  fields: [{ name: "sections", type: "blocks", blocks: marketingBlocks, label: "Sektionen" }],
};
