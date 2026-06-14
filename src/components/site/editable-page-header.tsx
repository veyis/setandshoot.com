import type { ReactNode } from "react";
import type { AboutPage } from "@/payload-types";
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
  let data: { sections?: unknown[] | null } | null = null;
  try {
    data = await payload.findGlobal({ slug, locale });
  } catch (err) {
    console.warn(
      `[EditablePageHeader] ${slug} read failed; using fallback (pending migration?)`,
      err,
    );
  }
  if (data?.sections?.length) {
    return <MarketingBlocks sections={data.sections as AboutPage["sections"]} locale={locale} />;
  }
  return <>{fallback}</>;
}
