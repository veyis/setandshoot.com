import type { Block } from "payload";

export const ServiceOffersBlock: Block = {
  slug: "serviceOffers",
  interfaceName: "ServiceOffersBlock",
  labels: { singular: "Leistungs-Liste", plural: "Leistungs-Listen" },
  fields: [
    {
      name: "items",
      type: "array",
      localized: true,
      label: "Leistungen",
      fields: [
        { name: "title", type: "text", required: true },
        { name: "body", type: "textarea", required: true },
      ],
    },
  ],
};
