import { ogCard, OG_SIZE } from "@/lib/seo/og-card";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Belin Akguel — Volleyball-Fotografie";

export default function OgImage() {
  return ogCard({ title: "Belin Akguel — Volleyball-Fotografie" });
}
