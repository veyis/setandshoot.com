import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { seoCopy, resolveSeo } from "@/lib/seo/copy";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getPayload } from "@/lib/payload/get-payload";
import { PageShell } from "@/components/site/page-shell";
import { MarketingBlocks } from "@/components/site/marketing-blocks";
import { AboutFallback } from "./about-fallback";

// ISR: rebuilt hourly; the aboutPage global revalidate hook busts on save.
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : defaultLocale;
  const payload = await getPayload();
  const data = await payload.findGlobal({ slug: "aboutPage", locale: safeLocale });
  const copy = resolveSeo(
    seoCopy(safeLocale, "about"),
    (data as { seo?: { title?: string | null; description?: string | null } }).seo,
  );
  return buildPageMetadata({ locale: safeLocale, path: "/about", ...copy });
}

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
