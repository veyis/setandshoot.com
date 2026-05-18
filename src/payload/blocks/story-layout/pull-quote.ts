import type { Block } from "payload";

export const PullQuoteBlock: Block = {
  slug: "pullQuote",
  interfaceName: "PullQuoteBlock",
  labels: {
    singular: "Zitat",
    plural: "Zitate",
  },
  fields: [
    {
      name: "quote",
      type: "textarea",
      required: true,
      localized: true,
    },
    {
      name: "attribution",
      type: "text",
      localized: true,
    },
  ],
};
