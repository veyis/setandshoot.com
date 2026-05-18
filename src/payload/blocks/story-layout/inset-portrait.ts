import type { Block } from "payload";

export const InsetPortraitBlock: Block = {
  slug: "insetPortrait",
  interfaceName: "InsetPortraitBlock",
  labels: {
    singular: "Portrait mit Text",
    plural: "Portraits mit Text",
  },
  fields: [
    {
      name: "photo",
      type: "relationship",
      relationTo: "photos",
      required: true,
    },
    {
      name: "text",
      type: "richText",
      localized: true,
    },
  ],
};
