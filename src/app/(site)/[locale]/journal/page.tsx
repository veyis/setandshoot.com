import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";
import { LandingImage } from "@/components/landing/landing-image";
import { PageShell } from "@/components/site/page-shell";
import { getLandingPhotos } from "@/lib/landing/photos";

export default async function JournalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("pages.journal");
  const tCommon = await getTranslations("pages.common");
  const entries = getLandingPhotos(locale as Locale).slice(0, 3);

  return (
    <PageShell width="wide">
      <header className="flex max-w-3xl flex-col gap-4">
        <p className="text-ink-muted font-mono text-xs tracking-widest uppercase">
          {tCommon("label")}
        </p>
        <h1 className="font-display text-5xl tracking-tight md:text-6xl">{t("title")}</h1>
        <p className="text-ink-muted max-w-prose text-base leading-relaxed">{t("intro")}</p>
      </header>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {entries.map((photo, index) => (
          <article
            key={photo.id}
            className="border-hairline flex flex-col gap-4 rounded-sm border p-4"
          >
            <div className="bg-elevated relative aspect-[16/10] overflow-hidden">
              <LandingImage
                photo={photo}
                sizes="(min-width: 768px) 33vw, 100vw"
                className="size-full object-cover"
              />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-ink-faint font-mono text-[10px] tracking-[0.18em] uppercase">
                {t("entryLabel", { number: index + 1 })}
              </p>
              <h2 className="font-display text-xl tracking-tight">{photo.kicker}</h2>
              <p className="text-ink-muted text-sm leading-relaxed">{t("entryTeaser")}</p>
              <p className="text-ink-faint font-mono text-[10px] tracking-[0.12em] uppercase">
                {photo.location} · {photo.cameraSpec}
              </p>
            </div>
          </article>
        ))}
      </div>

      <p className="border-hairline text-ink-muted max-w-prose rounded-sm border px-4 py-3 text-sm">
        {t("comingSoon")}
      </p>

      <Link
        href="/contact"
        className="text-accent hover:text-accent/90 w-fit text-sm font-medium transition-colors"
      >
        {tCommon("cta")} →
      </Link>
    </PageShell>
  );
}
