import Link from "next/link";
import { getPayload } from "payload";
import { getTranslations, setRequestLocale } from "next-intl/server";
import config from "@payload-config";
import { type Locale } from "@/lib/i18n/config";
import type { Photo, Story, Tag } from "@/payload-types";
import { HeroRotator, type HeroPhoto } from "@/components/landing/hero-rotator";
import { HighlightsStrip } from "@/components/landing/highlights-strip";
import { StoriesTeaser } from "@/components/landing/stories-teaser";
import { AboutTeaser } from "@/components/landing/about-teaser";
import { BookingCTA } from "@/components/landing/booking-cta";

export const dynamic = "force-dynamic";

/**
 * Strip Payload's `serverURL` origin from a file URL so next/image treats it
 * as same-origin (Next.js 16 blocks optimizing images served from private IPs).
 */
function toRelativeUrl(src: string | null | undefined): string {
  if (!src) return "";
  try {
    const url = new URL(src);
    return url.pathname + url.search;
  } catch {
    return src;
  }
}

function toHeroPhoto(photo: Photo): HeroPhoto {
  const feed = photo.sizes?.feed;
  const relSrc = toRelativeUrl(feed?.url ?? photo.url);
  return {
    id: photo.id as number,
    alt: photo.alt ?? "",
    src: relSrc,
    srcSet: feed?.url ? `${relSrc} ${feed.width}w` : undefined,
    width: feed?.width ?? photo.width ?? 1400,
    height: feed?.height ?? photo.height ?? 933,
  };
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const payload = await getPayload({ config });

  const portraitTag = await payload.find({
    collection: "tags",
    where: { slug: { equals: "portrait" } },
    limit: 1,
  });
  const portraitTagId = (portraitTag.docs[0] as Tag | undefined)?.id;

  const typedLocale = locale as Locale;

  const [heroPhotos, highlightPhotos, recentStories, portraitPhotos] = await Promise.all([
    payload.find({
      collection: "photos",
      where: { isHighlight: { equals: true } },
      limit: 5,
      sort: "-updatedAt",
      locale: typedLocale,
    }),
    payload.find({
      collection: "photos",
      where: { isHighlight: { equals: true } },
      limit: 8,
      sort: "-updatedAt",
      locale: typedLocale,
    }),
    payload.find({
      collection: "stories",
      where: { published: { equals: true } },
      limit: 3,
      sort: "-publishedAt",
      locale: typedLocale,
      depth: 2,
    }),
    portraitTagId
      ? payload.find({
          collection: "photos",
          where: { tags: { in: [portraitTagId] } },
          limit: 1,
          locale: typedLocale,
        })
      : Promise.resolve({ docs: [] as Photo[] }),
  ]);

  const overlay = (
    <div className="flex max-w-2xl flex-col items-start gap-6">
      <h1 className="font-display text-6xl tracking-tight md:text-8xl">belin akguel</h1>
      <p className="text-ink max-w-prose font-sans text-base md:text-lg">{t("site.tagline")}</p>
      <p className="font-mono text-xs">f/2.8 · 1/2000s · ISO 6400</p>
      <div className="flex flex-wrap gap-4 pt-2">
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={"/stories" as any}
          className="bg-accent text-canvas hover:bg-accent/90 rounded-sm px-5 py-2.5 text-sm font-medium transition-colors"
        >
          {t("home.ctaStories")}
        </Link>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={"/contact" as any}
          className="border-hairline hover:text-accent rounded-sm border px-5 py-2.5 text-sm transition-colors"
        >
          {t("home.ctaBooking")}
        </Link>
      </div>
    </div>
  );

  const bookingBgPhoto =
    (highlightPhotos.docs[highlightPhotos.docs.length - 1] as Photo | undefined) ?? null;

  return (
    <>
      <HeroRotator
        photos={heroPhotos.docs.map((photo) => toHeroPhoto(photo as Photo))}
        overlay={overlay}
      />
      <HighlightsStrip photos={highlightPhotos.docs as Photo[]} />
      <StoriesTeaser stories={recentStories.docs as Story[]} />
      <AboutTeaser portrait={(portraitPhotos.docs[0] as Photo | undefined) ?? null} />
      <BookingCTA backgroundPhoto={bookingBgPhoto} />
    </>
  );
}
