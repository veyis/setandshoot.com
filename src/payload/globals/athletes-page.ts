import type { GlobalConfig } from "payload";
import { canManageContent } from "@/payload/access/can-manage-content";
import { marketingBlocks } from "@/payload/blocks/marketing";
import { revalidateMarketingPage } from "@/payload/hooks/revalidate-marketing-page";

export const AthletesPage: GlobalConfig = {
  slug: "athletesPage",
  label: "Athletinnen (Seite)",
  admin: { group: "Seiten" },
  access: { read: () => true, update: canManageContent },
  hooks: { afterChange: [revalidateMarketingPage(["/athletes", "/en/athletes"])] },
  fields: [{ name: "sections", type: "blocks", blocks: marketingBlocks, label: "Sektionen" }],
};
