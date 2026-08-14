import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";
import Link from "next/link";

type SectionPageProps = {
  params: Promise<{ locale: string }>;
  namespace:
    "pages.stories" | "pages.highlights" | "pages.athletes" | "pages.about" | "pages.journal";
};

export async function SectionPage({ params, namespace }: SectionPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations(namespace);
  const tCommon = await getTranslations("pages.common");

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16 md:px-12">
      <header className="flex flex-col gap-4">
        <p className="text-ink-muted font-mono text-xs tracking-widest uppercase">
          {tCommon("label")}
        </p>
        <h1 className="font-display text-5xl tracking-tight md:text-6xl">{t("title")}</h1>
        <p className="text-ink-muted max-w-prose text-base leading-relaxed">{t("intro")}</p>
      </header>
      <p className="border-hairline text-ink-muted rounded-sm border px-4 py-3 text-sm">
        {t("comingSoon")}
      </p>
      <Link
        href="/services"
        className="text-accent hover:text-accent/90 w-fit text-sm font-medium transition-colors"
      >
        {tCommon("cta")} →
      </Link>
    </main>
  );
}
