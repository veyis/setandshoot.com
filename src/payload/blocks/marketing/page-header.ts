import type { Block } from "payload";

export const PageHeaderBlock: Block = {
  slug: "pageHeader",
  interfaceName: "PageHeaderBlock",
  labels: { singular: "Seitenkopf", plural: "Seitenköpfe" },
  fields: [
    { name: "label", type: "text", localized: true },
    { name: "title", type: "text", required: true, localized: true },
    { name: "intro", type: "textarea", localized: true },
  ],
};
