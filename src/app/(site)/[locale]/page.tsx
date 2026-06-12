import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPayload } from "@/lib/payload/get-payload";
import { type Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/seo/alternates";
import { getAboutFallbackPhoto, getHeroPhotos, getHighlightPhotos } from "@/lib/landing/photos";
import type { Story } from "@/payload-types";
import { HeroScene } from "@/components/landing/hero";
import { FeaturedStoryScene } from "@/components/landing/featured-story-scene";
import { WorkMosaicScene } from "@/components/landing/work-mosaic-scene";
import { AboutScene } from "@/components/landing/about-scene";
import { BookingCTA } from "@/components/landing/booking-cta";

// ISR: rebuilt hourly; the story revalidate hook busts this on publish.
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: localeAlternates("/", locale) };
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const typedLocale = locale as Locale;
  const t = await getTranslations();

  // Static landing photos
  const heroPhotos = getHeroPhotos(typedLocale);
  const highlightPhotos = getHighlightPhotos(typedLocale);
  const aboutPortrait = getAboutFallbackPhoto(typedLocale);

  // One Payload story for the Featured Story scene
  const payload = await getPayload();
  const stories = await payload.find({
    collection: "stories",
    where: { published: { equals: true } },
    limit: 1,
    sort: "-publishedAt",
    locale: typedLocale,
    depth: 2,
  });
  const featuredStory = (stories.docs[0] as Story | undefined) ?? null;

  return (
    <>
      <HeroScene
        photos={heroPhotos}
        name="belin akguel"
        tagline={t("site.tagline")}
        cameraSpec={t("home.hero.cameraSpec")}
        ctaPrimaryLabel={t("home.ctaStories")}
        ctaPrimaryHref="/stories"
        ctaSecondaryLabel={t("home.ctaBooking")}
        ctaSecondaryHref="/contact"
        scrollCueLabel={t("home.hero.scrollCue")}
        mastheadLeft={t("home.hero.masthead.left")}
        mastheadCounter={t("home.hero.masthead.counter", {
          current: "{current}",
          total: "{total}",
        })}
      />
      <FeaturedStoryScene story={featuredStory} />
      <WorkMosaicScene photos={highlightPhotos} />
      <AboutScene portrait={aboutPortrait} />
      <BookingCTA />
    </>
  );
}
