import type { Block } from "payload";

export const TextParagraphBlock: Block = {
  slug: "textParagraph",
  interfaceName: "TextParagraphBlock",
  labels: {
    singular: "Textabsatz",
    plural: "Textabsätze",
  },
  fields: [
    {
      name: "text",
      type: "richText",
      required: true,
      localized: true,
    },
  ],
};
