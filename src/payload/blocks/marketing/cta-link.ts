import type { Block } from "payload";

export const CtaLinkBlock: Block = {
  slug: "ctaLink",
  interfaceName: "CtaLinkBlock",
  labels: { singular: "Button", plural: "Buttons" },
  fields: [
    { name: "label", type: "text", required: true, localized: true },
    {
      name: "target",
      type: "select",
      required: true,
      defaultValue: "/contact",
      options: [
        { label: "Kontakt", value: "/contact" },
        { label: "Über mich", value: "/about" },
        { label: "Athletinnen", value: "/athletes" },
        { label: "Leistungen", value: "/services" },
        { label: "Highlights", value: "/highlights" },
        { label: "Stories", value: "/stories" },
        { label: "Startseite", value: "/" },
      ],
    },
  ],
};
