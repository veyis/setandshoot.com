import type { GlobalConfig } from "payload";
import { canManageContent } from "@/payload/access/can-manage-content";
import { marketingBlocks } from "@/payload/blocks/marketing";
import { revalidateMarketingPage } from "@/payload/hooks/revalidate-marketing-page";

export const ServicesPage: GlobalConfig = {
  slug: "servicesPage",
  label: "Leistungen (Seite)",
  admin: { group: "Seiten" },
  access: { read: () => true, update: canManageContent },
  hooks: { afterChange: [revalidateMarketingPage(["/services", "/en/services"])] },
  fields: [{ name: "sections", type: "blocks", blocks: marketingBlocks, label: "Sektionen" }],
};
