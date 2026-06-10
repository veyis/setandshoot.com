import type { GlobalConfig } from "payload";
import { canManageContent } from "@/payload/access/can-manage-content";
import { marketingBlocks } from "@/payload/blocks/marketing";
import { revalidateAbout } from "@/payload/hooks/revalidate-about";

export const AboutPage: GlobalConfig = {
  slug: "aboutPage",
  label: "Über mich (Seite)",
  admin: { group: "Seiten" },
  access: { read: () => true, update: canManageContent },
  hooks: { afterChange: [revalidateAbout] },
  fields: [{ name: "sections", type: "blocks", blocks: marketingBlocks, label: "Sektionen" }],
};
