import { ogCard, OG_SIZE } from "@/lib/seo/og-card";
import { seoCopy } from "@/lib/seo/copy";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Belin Akguel";

export default async function OgImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return ogCard({ title: seoCopy(locale, "about").title });
}
