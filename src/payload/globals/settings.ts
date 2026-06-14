import type { GlobalConfig } from "payload";
import { isAdmin } from "@/payload/access/is-admin";

export const Settings: GlobalConfig = {
  slug: "settings",
  label: "Einstellungen",
  admin: { group: "System" },
  access: { read: () => true, update: isAdmin },
  fields: [
    {
      name: "defaultWatermark",
      type: "checkbox",
      defaultValue: false,
      label: "Wasserzeichen standardmäßig aktiv",
    },
    {
      name: "accentColor",
      type: "text",
      defaultValue: "#E63946",
      label: "Akzentfarbe (Hex)",
    },
    {
      name: "homeFeaturedCount",
      type: "number",
      defaultValue: 3,
      min: 1,
      max: 6,
      label: "Anzahl Featured Stories auf der Startseite",
    },
    {
      name: "organization",
      type: "group",
      label: "Profil / SEO",
      fields: [
        { name: "instagram", type: "text", label: "Instagram-URL" },
        { name: "linkedin", type: "text", label: "LinkedIn-URL" },
        { name: "email", type: "email", label: "Kontakt-E-Mail" },
        { name: "phone", type: "text", label: "Telefon" },
        { name: "city", type: "text", defaultValue: "Bremen", label: "Stadt" },
      ],
    },
  ],
};
