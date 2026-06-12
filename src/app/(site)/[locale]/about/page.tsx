import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { getPayload } from "@/lib/payload/get-payload";
import { PageShell } from "@/components/site/page-shell";
import { MarketingBlocks } from "@/components/site/marketing-blocks";
import { AboutFallback } from "./about-fallback";

// ISR: rebuilt hourly; the aboutPage global revalidate hook busts on save.
export const revalidate = 3600;

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const payload = await getPayload();
  const data = await payload.findGlobal({ slug: "aboutPage", locale });

  if (data.sections?.length) {
    return (
      <PageShell>
        <MarketingBlocks sections={data.sections} locale={locale as Locale} />
      </PageShell>
    );
  }

  return <AboutFallback locale={locale as Locale} />;
}
