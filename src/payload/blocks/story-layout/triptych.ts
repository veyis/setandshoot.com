import type { Block } from "payload";

export const TriptychBlock: Block = {
  slug: "triptych",
  interfaceName: "TriptychBlock",
  labels: {
    singular: "Triptychon",
    plural: "Triptychen",
  },
  fields: [
    {
      name: "photos",
      type: "relationship",
      relationTo: "photos",
      hasMany: true,
      minRows: 3,
      maxRows: 3,
      required: true,
    },
  ],
};
