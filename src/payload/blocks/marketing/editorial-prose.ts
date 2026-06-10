import type { Block } from "payload";

export const EditorialProseBlock: Block = {
  slug: "editorialProse",
  interfaceName: "EditorialProseBlock",
  labels: { singular: "Editorial-Text", plural: "Editorial-Texte" },
  fields: [
    { name: "eyebrow", type: "text", localized: true },
    // textarea so the editor can use line breaks (was the " / " split).
    { name: "title", type: "textarea", localized: true },
    { name: "body1", type: "richText", localized: true },
    { name: "pullQuote", type: "text", localized: true },
    { name: "body2", type: "richText", localized: true },
    // One credit line per row, rendered as separate spans (split on newline).
    { name: "credits", type: "textarea", localized: true },
  ],
};
