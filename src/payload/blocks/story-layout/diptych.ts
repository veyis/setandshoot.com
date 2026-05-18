import type { Block } from "payload";

export const DiptychBlock: Block = {
  slug: "diptych",
  interfaceName: "DiptychBlock",
  labels: {
    singular: "Diptychon",
    plural: "Diptychen",
  },
  fields: [
    {
      name: "photoLeft",
      type: "relationship",
      relationTo: "photos",
      required: true,
      label: "Foto links",
    },
    {
      name: "photoRight",
      type: "relationship",
      relationTo: "photos",
      required: true,
      label: "Foto rechts",
    },
    {
      name: "ratio",
      type: "select",
      defaultValue: "50-50",
      options: [
        { label: "50 / 50", value: "50-50" },
        { label: "60 / 40", value: "60-40" },
      ],
    },
  ],
};
