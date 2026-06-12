import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { LandingImage } from "./landing-image";
import { Reveal } from "@/components/motion/reveal";
import { getLandingPhotos, type ResolvedLandingPhoto } from "@/lib/landing/photos";
import type { Story } from "@/payload-types";
import type { Locale } from "@/lib/i18n/config";

type Props = { story: Story | null };

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10).replace(/-/g, ".");
}

/** Curated landing frames for the featured-story visuals (CMS story drives copy only). */
function featuredStoryPhotos(locale: Locale): {
  cover: ResolvedLandingPhoto;
  gallery: ResolvedLandingPhoto[];
} {
  const photos = getLandingPhotos(locale);
  const byId = (id: ResolvedLandingPhoto["id"]) => photos.find((p) => p.id === id);
  const cover = byId("joust") ?? photos[0]!;
  const gallery = (["spike", "set", "dig"] as const)
    .map((id) => byId(id))
    .filter((p): p is ResolvedLandingPhoto => Boolean(p));
  return { cover, gallery };
}

export async function FeaturedStoryScene({ story }: Props) {
  const t = await getTranslations("home.featuredStory");
  if (!story) return null;

  const locale = (await getLocale()) as Locale;
  const { cover, gallery } = featuredStoryPhotos(locale);
  const date = formatDate(story.playedAt);

  return (
    <section className="featured-story relative">
      <div className="grid px-6 md:px-12 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-20 lg:self-start">
            <div className="story-cover bg-elevated relative aspect-[3/4] w-full overflow-hidden lg:max-h-[calc(100dvh-5rem)]">
              <LandingImage
                photo={cover}
                sizes="(min-width: 1024px) 42vw, 90vw"
                className="size-full object-cover"
                priority
              />
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-20"
                style={{
                  backgroundImage:
                    "linear-gradient(to bottom, rgba(11,14,19,0.5) 0%, transparent 100%)",
                }}
              />
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
                style={{
                  backgroundImage:
                    "linear-gradient(to top, rgba(11,14,19,0.5) 0%, transparent 100%)",
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-32 py-24 lg:col-span-7">
          <Reveal>
            <div className="flex flex-col gap-4">
              <p className="text-ink-faint font-mono text-xs tracking-[0.2em] uppercase">
                {t("eyebrow")} · {date} · {story.venue ?? ""}
              </p>
              <h2 className="font-display text-[clamp(1.75rem,3vw,3rem)] leading-[1.1] tracking-tight">
                {story.title}
              </h2>
              {story.result ? (
                <p className="text-ink-muted font-mono text-xs tracking-[0.15em] uppercase">
                  {story.result}
                </p>
              ) : null}
              <p className="text-ink mt-4 max-w-prose font-sans text-base leading-relaxed">
                {t("blurb")}
              </p>
            </div>
          </Reveal>

          <div className="flex flex-col gap-12">
            {gallery.map((photo, i) => (
              <Reveal key={photo.id} delay={i * 100}>
                <figure className="bg-elevated relative aspect-[4/5] w-full overflow-hidden">
                  <LandingImage
                    photo={photo}
                    sizes="(min-width: 1024px) 50vw, 90vw"
                    className="size-full object-cover"
                  />
                </figure>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="flex flex-col gap-6">
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={`/stories/${story.slug}` as any}
                className="font-display hover:text-accent w-fit text-2xl italic underline-offset-4 transition-colors hover:underline"
              >
                {t("readStory")} <span aria-hidden="true">→</span>
              </Link>
              <p className="text-ink-faint font-mono text-xs">
                © Belin Akguel · {new Date().getUTCFullYear()}
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
