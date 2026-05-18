import type { Block } from "payload";

export const FullBleedPhotoBlock: Block = {
  slug: "fullBleedPhoto",
  interfaceName: "FullBleedPhotoBlock",
  labels: {
    singular: "Vollflächiges Foto",
    plural: "Vollflächige Fotos",
  },
  fields: [
    {
      name: "photo",
      type: "relationship",
      relationTo: "photos",
      required: true,
    },
  ],
};
