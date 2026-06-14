import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { seoCopy, resolveSeo } from "@/lib/seo/copy";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getPayload } from "@/lib/payload/get-payload";
import { notFound } from "next/navigation";
import { LandingImage } from "@/components/landing/landing-image";
import { PageShell } from "@/components/site/page-shell";
import { getHighlightPhotos } from "@/lib/landing/photos";
import { EditablePageHeader } from "@/components/site/editable-page-header";

// ISR: rebuilt hourly; the highlightsPage global revalidate hook busts on save.
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
    data = await payload.findGlobal({ slug: "highlightsPage", locale: safeLocale });
  } catch (err) {
    console.warn(
      "[highlightsPage metadata] global read failed; using i18n default (pending migration?)",
      err,
    );
  }
  const copy = resolveSeo(seoCopy(safeLocale, "highlights"), data?.seo);
  return buildPageMetadata({ locale: safeLocale, path: "/highlights", ...copy });
}

export default async function HighlightsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("pages.highlights");
  const tCommon = await getTranslations("pages.common");
  const photos = getHighlightPhotos(locale as Locale);

  return (
    <PageShell width="wide">
      <EditablePageHeader
        slug="highlightsPage"
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo) => (
          <figure key={photo.id} className="bg-elevated group flex flex-col gap-3 overflow-hidden">
            <div className="relative aspect-[3/2] overflow-hidden">
              <LandingImage
                photo={photo}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>
            <figcaption className="flex flex-col gap-1 px-4 pb-4">
              <p className="text-ink font-mono text-[10px] tracking-[0.18em] uppercase">
                {photo.kicker}
              </p>
              <p className="text-ink-muted text-xs">{photo.cameraSpec}</p>
              <p className="text-ink-faint font-mono text-[10px] tracking-[0.12em] uppercase">
                {photo.location}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>
    </PageShell>
  );
}
