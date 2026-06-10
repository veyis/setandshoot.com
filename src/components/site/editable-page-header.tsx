import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n/config";
import { getPayload } from "@/lib/payload/get-payload";
import { MarketingBlocks } from "@/components/site/marketing-blocks";

type MarketingGlobalSlug =
  | "aboutPage"
  | "contactPage"
  | "servicesPage"
  | "athletesPage"
  | "highlightsPage";

/**
 * Renders an editable page header from the page's Payload global, falling back
 * to the provided markup until the global is seeded.
 */
export async function EditablePageHeader({
  slug,
  locale,
  fallback,
}: {
  slug: MarketingGlobalSlug;
  locale: Locale;
  fallback: ReactNode;
}) {
  const payload = await getPayload();
  const data = await payload.findGlobal({ slug, locale });
  if (data.sections?.length) {
    return <MarketingBlocks sections={data.sections} locale={locale} />;
  }
  return <>{fallback}</>;
}
