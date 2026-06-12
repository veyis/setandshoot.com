import { RichText } from "@payloadcms/richtext-lexical/react";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getPayload } from "@/lib/payload/get-payload";
import { getStoryBySlug } from "@/lib/payload/queries/stories";
import { localeAlternates } from "@/lib/seo/alternates";
import { StoryBlocks } from "@/components/story/story-blocks";
import { PayloadPhoto } from "@/components/story/payload-photo";
import { resolvePhoto } from "@/lib/payload/media";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

// ISR: published stories are prerendered at build; the revalidateStory hook
// busts list + detail on publish. New stories render on demand (dynamicParams).
export const revalidate = 3600;

export async function generateStaticParams() {
  const payload = await getPayload();
  const { docs } = await payload.find({
    collection: "stories",
    where: { published: { equals: true } },
    limit: 500,
    depth: 0,
  });
  return docs.map((story) => ({ slug: story.slug as string }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const story = await getStoryBySlug(slug, locale as Locale);
  if (!story) return {};
  return {
    title: story.title ?? undefined,
    alternates: localeAlternates(`/stories/${slug}`, locale),
  };
}

function formatPlayedAt(value: string | null | undefined, locale: string): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default async function StoryPage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const story = await getStoryBySlug(slug, locale as Locale);
  if (!story) notFound();

  const cover = resolvePhoto(story.coverPhoto);
  const playedAt = formatPlayedAt(story.playedAt, locale);
  const storiesHref = locale === "de" ? "/stories" : `/${locale}/stories`;

  const metaLine = [playedAt, story.venue, story.result].filter(Boolean).join(" · ");

  return (
    <article className="mx-auto max-w-4xl px-6 py-16 md:px-12">
      <header className="mb-12 flex flex-col gap-6">
        <Link
          href={storiesHref as never}
          className="text-ink-muted hover:text-accent font-mono text-xs tracking-widest uppercase transition-colors"
        >
          <span aria-hidden="true">←</span> Stories
        </Link>
        <h1 className="font-display text-5xl tracking-tight md:text-6xl">{story.title}</h1>
        {metaLine ? (
          <p className="text-ink-muted font-mono text-xs tracking-wide uppercase">{metaLine}</p>
        ) : null}
        {cover ? (
          <PayloadPhoto
            photo={cover}
            size="full"
            priority
            className="aspect-[16/10] w-full object-cover"
          />
        ) : null}
        {story.summary ? (
          <div className="prose prose-sm text-ink-muted max-w-prose">
            <RichText data={story.summary as never} />
          </div>
        ) : null}
      </header>

      {story.layout?.length ? <StoryBlocks blocks={story.layout} /> : null}
    </article>
  );
}
