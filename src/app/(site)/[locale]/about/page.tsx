import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";
import { LandingImage } from "@/components/landing/landing-image";
import { PageShell } from "@/components/site/page-shell";
import { getAboutFallbackPhoto } from "@/lib/landing/photos";
import type { Locale } from "@/lib/i18n/config";

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("pages.about");
  const tCommon = await getTranslations("pages.common");
  const tHome = await getTranslations("home.about");
  const portrait = getAboutFallbackPhoto(locale as Locale);

  return (
    <PageShell>
      <header className="flex flex-col gap-4">
        <p className="text-ink-muted font-mono text-xs tracking-widest uppercase">
          {tCommon("label")}
        </p>
        <h1 className="font-display text-5xl tracking-tight md:text-6xl">{t("title")}</h1>
        <p className="text-ink-muted max-w-prose text-base leading-relaxed">{t("intro")}</p>
      </header>

      <figure className="bg-elevated relative aspect-[4/5] w-full max-w-md overflow-hidden">
        <LandingImage
          photo={portrait}
          sizes="(min-width: 768px) 400px, 90vw"
          className="size-full object-cover saturate-[0.92]"
        />
      </figure>
      <figcaption className="text-ink-faint -mt-6 font-mono text-[10px] tracking-[0.15em] uppercase">
        {tHome("cameraCaption")}
      </figcaption>

      <div className="flex flex-col gap-8">
        <p className="text-ink-faint font-mono text-xs tracking-[0.2em] uppercase">
          {tHome("eyebrow")}
        </p>
        <h2 className="font-display text-[clamp(1.75rem,3vw,2.75rem)] leading-[1.15] tracking-tight whitespace-pre-line italic">
          {tHome("title").replace(" / ", "\n")}
        </h2>
        <p className="text-ink max-w-prose text-base leading-relaxed">{tHome("body1")}</p>
        <blockquote className="border-hairline text-ink-faint font-display border-l pl-6 text-2xl italic">
          {tHome("pullQuote")}
        </blockquote>
        <p className="text-ink-muted max-w-prose text-base leading-relaxed">{tHome("body2")}</p>
        <div className="text-ink-faint flex flex-col gap-1 font-mono text-[10px] tracking-[0.15em] uppercase">
          <span>{tHome("publications")}</span>
          <span>{tHome("clients")}</span>
          <span>{tHome("availability")}</span>
        </div>
      </div>

      <Link
        href="/contact"
        className="text-accent hover:text-accent/90 w-fit text-sm font-medium transition-colors"
      >
        {tCommon("cta")} →
      </Link>
    </PageShell>
  );
}
