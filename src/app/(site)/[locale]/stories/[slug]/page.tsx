import { RichText } from "@payloadcms/richtext-lexical/react";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getPayload } from "@/lib/payload/get-payload";
import { getStoryBySlug } from "@/lib/payload/queries/stories";
import { StoryBlocks } from "@/components/story/story-blocks";
import { PayloadPhoto } from "@/components/story/payload-photo";
import { resolvePhoto, photoSrc, photoDimensions, photoAlt } from "@/lib/payload/media";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { seoCopy } from "@/lib/seo/copy";
import type { Metadata } from "next";
import { env } from "@/env";
import { JsonLd } from "@/components/seo/json-ld";
import { articleSchema, breadcrumbSchema } from "@/lib/seo/schema";

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

  const cover = resolvePhoto(story.coverPhoto);
  const url = photoSrc(cover, "feed");
  const { width, height } = photoDimensions(cover, "feed");
  const fallback = seoCopy(locale, "stories");

  return buildPageMetadata({
    locale,
    path: `/stories/${slug}`,
    title: story.title ?? fallback.title,
    description: fallback.description,
    image: url ? { url, width, height, alt: photoAlt(cover, story.title ?? "") } : undefined,
  });
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

  const siteUrl = env.NEXT_PUBLIC_SITE_URL;
  const canonical =
    locale === "de" ? `${siteUrl}/stories/${story.slug}` : `${siteUrl}/en/stories/${story.slug}`;
  const ogUrl = photoSrc(cover, "feed");
  const dims = photoDimensions(cover, "feed");

  return (
    <article className="mx-auto max-w-4xl px-6 py-16 md:px-12">
      <JsonLd
        data={articleSchema({
          siteUrl,
          title: story.title ?? "",
          description: seoCopy(locale, "stories").description,
          url: canonical,
          image: ogUrl ? { url: ogUrl, width: dims.width, height: dims.height } : undefined,
          datePublished: story.publishedAt ?? undefined,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: locale === "de" ? siteUrl : `${siteUrl}/en` },
          {
            name: seoCopy(locale, "stories").title,
            url: locale === "de" ? `${siteUrl}/stories` : `${siteUrl}/en/stories`,
          },
          { name: story.title ?? "", url: canonical },
        ])}
      />
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
