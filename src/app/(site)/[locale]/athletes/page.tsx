import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { seoCopy } from "@/lib/seo/copy";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { notFound } from "next/navigation";
import { LandingImage } from "@/components/landing/landing-image";
import { PageShell } from "@/components/site/page-shell";
import { getLandingPhotos } from "@/lib/landing/photos";
import { EditablePageHeader } from "@/components/site/editable-page-header";

// ISR: rebuilt hourly; the athletesPage global revalidate hook busts on save.
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : defaultLocale;
  const copy = seoCopy(safeLocale, "athletes");
  return buildPageMetadata({ locale: safeLocale, path: "/athletes", ...copy });
}

export default async function AthletesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("pages.athletes");
  const tCommon = await getTranslations("pages.common");
  const portraits = getLandingPhotos(locale as Locale).slice(0, 6);

  return (
    <PageShell width="wide">
      <EditablePageHeader
        slug="athletesPage"
        locale={locale as Locale}
        fallback={
          <header className="flex max-w-3xl flex-col gap-4">
            <p className="text-ink-muted font-mono text-xs tracking-widest uppercase">
              {tCommon("label")}
            </p>
            <h1 className="font-display text-5xl tracking-tight md:text-6xl">{t("title")}</h1>
            <p className="text-ink-muted max-w-prose text-base leading-relaxed">{t("intro")}</p>
          </header>
        }
      />

      <p className="border-hairline text-ink-muted max-w-prose rounded-sm border px-4 py-3 text-sm">
        {t("comingSoon")}
      </p>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {portraits.map((photo) => (
          <figure key={photo.id} className="bg-elevated flex flex-col gap-2 overflow-hidden">
            <div className="relative aspect-[3/4] overflow-hidden">
              <LandingImage
                photo={photo}
                sizes="(min-width: 768px) 25vw, 50vw"
                className="size-full object-cover"
              />
            </div>
            <figcaption className="px-3 pb-3">
              <p className="text-ink font-mono text-[10px] tracking-[0.15em] uppercase">
                {t("profileLabel")}
              </p>
              <p className="text-ink-muted mt-1 text-xs">{photo.kicker}</p>
            </figcaption>
          </figure>
        ))}
      </div>

      <Link
        href="/contact"
        className="text-accent hover:text-accent/90 w-fit text-sm font-medium transition-colors"
      >
        {tCommon("cta")} <span aria-hidden="true">→</span>
      </Link>
    </PageShell>
  );
}
