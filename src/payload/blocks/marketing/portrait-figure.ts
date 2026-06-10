import type { Block } from "payload";

export const PortraitFigureBlock: Block = {
  slug: "portraitFigure",
  interfaceName: "PortraitFigureBlock",
  labels: { singular: "Portrait", plural: "Portraits" },
  fields: [
    // Optional: when empty the page renders the built-in fallback portrait.
    { name: "photo", type: "relationship", relationTo: "photos" },
    { name: "caption", type: "text", localized: true },
  ],
};
