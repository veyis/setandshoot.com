import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { MarketingPageForm } from "@/components/studio/marketing-page-form";
import { getMarketingPage, type MarketingPageSlug } from "@/lib/studio/marketing-pages";
import { listStudioPhotos } from "@/lib/studio/photos";

export const dynamic = "force-dynamic";

// URL-safe page keys → Payload global slugs + display-name message keys.
const PAGE_MAP: Record<string, { globalSlug: MarketingPageSlug; nameKey: string }> = {
  about: { globalSlug: "aboutPage", nameKey: "pageAbout" },
  services: { globalSlug: "servicesPage", nameKey: "pageServices" },
  contact: { globalSlug: "contactPage", nameKey: "pageContact" },
  athletes: { globalSlug: "athletesPage", nameKey: "pageAthletes" },
  highlights: { globalSlug: "highlightsPage", nameKey: "pageHighlights" },
};

export default async function StudioMarketingPageEditor({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = PAGE_MAP[slug];
  if (!entry) notFound();

  const [t, page, photos] = await Promise.all([
    getTranslations("studio"),
    getMarketingPage(entry.globalSlug),
    listStudioPhotos(),
  ]);

  return (
    <main>
      <h2 className="font-display mb-6 text-xl tracking-tight">{t(entry.nameKey)}</h2>
      <MarketingPageForm
        page={page}
        photos={photos}
        adminUrl={`/admin/globals/${entry.globalSlug}`}
      />
    </main>
  );
}
