import type { Block } from "payload";

export const SequenceBlock: Block = {
  slug: "sequence",
  interfaceName: "SequenceBlock",
  labels: {
    singular: "Sequenz",
    plural: "Sequenzen",
  },
  fields: [
    {
      name: "photos",
      type: "relationship",
      relationTo: "photos",
      hasMany: true,
      minRows: 2,
      maxRows: 6,
      required: true,
    },
    {
      name: "caption",
      type: "textarea",
      localized: true,
    },
  ],
};
