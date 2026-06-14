import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { seoCopy, resolveSeo } from "@/lib/seo/copy";
import { buildPageMetadata } from "@/lib/seo/metadata";
import type { AboutPage } from "@/payload-types";
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
  let data: { seo?: { title?: string | null; description?: string | null } } | null = null;
  try {
    data = await payload.findGlobal({ slug: "aboutPage", locale: safeLocale });
  } catch (err) {
    console.warn(
      "[aboutPage metadata] global read failed; using i18n default (pending migration?)",
      err,
    );
  }
  const copy = resolveSeo(seoCopy(safeLocale, "about"), data?.seo);
  return buildPageMetadata({ locale: safeLocale, path: "/about", ...copy });
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const payload = await getPayload();
  let data: { sections?: unknown[] | null } | null = null;
  try {
    data = await payload.findGlobal({ slug: "aboutPage", locale });
  } catch (err) {
    console.warn("[aboutPage] global read failed; using fallback (pending migration?)", err);
  }

  if (data?.sections?.length) {
    return (
      <PageShell>
        <MarketingBlocks
          sections={data.sections as AboutPage["sections"]}
          locale={locale as Locale}
        />
      </PageShell>
    );
  }

  return <AboutFallback locale={locale as Locale} />;
}
