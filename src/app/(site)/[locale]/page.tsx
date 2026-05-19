import { getPayload } from "payload";
import { getTranslations, setRequestLocale } from "next-intl/server";
import config from "@payload-config";
import { type Locale } from "@/lib/i18n/config";
import { getAboutFallbackPhoto, getHeroPhotos, getHighlightPhotos } from "@/lib/landing/photos";
import type { Story } from "@/payload-types";
import { HeroScene } from "@/components/landing/hero-scene";
import { FeaturedStoryScene } from "@/components/landing/featured-story-scene";
import { WorkMosaicScene } from "@/components/landing/work-mosaic-scene";
import { AboutScene } from "@/components/landing/about-scene";
import { BookingCTA } from "@/components/landing/booking-cta";

export const dynamic = "force-dynamic";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const typedLocale = locale as Locale;
  const t = await getTranslations();

  // Static landing photos
  const heroPhotos = getHeroPhotos(typedLocale);
  // Prefer the "block" composition (index 1) for the static hero; fall back to first.
  const heroPhoto = heroPhotos[1] ?? heroPhotos[0] ?? null;
  const highlightPhotos = getHighlightPhotos(typedLocale);
  const aboutPortrait = getAboutFallbackPhoto(typedLocale);

  // One Payload story for the Featured Story scene
  const payload = await getPayload({ config });
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
        photo={heroPhoto}
        name="belin akguel"
        tagline={t("site.tagline")}
        cameraSpec={t("home.hero.cameraSpec")}
        ctaPrimaryLabel={t("home.ctaStories")}
        ctaPrimaryHref="/stories"
        ctaSecondaryLabel={t("home.ctaBooking")}
        ctaSecondaryHref="/contact"
        scrollCueLabel={t("home.hero.scrollCue")}
      />
      <FeaturedStoryScene story={featuredStory} />
      <WorkMosaicScene photos={highlightPhotos} />
      <AboutScene portrait={aboutPortrait} />
      <BookingCTA />
    </>
  );
}
