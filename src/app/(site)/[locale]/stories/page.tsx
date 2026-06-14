import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale, defaultLocale, type Locale } from "@/lib/i18n/config";
import { seoCopy } from "@/lib/seo/copy";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { notFound } from "next/navigation";
import { getPublishedStories } from "@/lib/payload/queries/stories";
import { StoryCard } from "@/components/story/story-card";
import { PageShell } from "@/components/site/page-shell";

// ISR: rebuilt hourly; the story revalidate hook busts this on publish.
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : defaultLocale;
  const copy = seoCopy(safeLocale, "stories");
  return buildPageMetadata({ locale: safeLocale, path: "/stories", ...copy });
}

export default async function StoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("pages.stories");
  const tCommon = await getTranslations("pages.common");
  const stories = await getPublishedStories(locale as Locale);

  return (
    <PageShell width="wide">
      <header className="flex max-w-3xl flex-col gap-4">
        <p className="text-ink-muted font-mono text-xs tracking-widest uppercase">
          {tCommon("label")}
        </p>
        <h1 className="font-display text-5xl tracking-tight md:text-6xl">{t("title")}</h1>
        <p className="text-ink-muted max-w-prose text-base leading-relaxed">{t("intro")}</p>
      </header>

      {stories.length === 0 ? (
        <p className="border-hairline text-ink-muted rounded-sm border px-4 py-3 text-sm">
          {t("empty")}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} locale={locale} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
