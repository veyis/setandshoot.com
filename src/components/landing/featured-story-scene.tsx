import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PhotoImage } from "./photo-image";
import { PinnedCover } from "./pinned-cover";
import { Reveal } from "@/components/motion/reveal";
import type { Story, Photo } from "@/payload-types";

type Props = { story: Story | null };

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10).replace(/-/g, ".");
}

export async function FeaturedStoryScene({ story }: Props) {
  const t = await getTranslations("home.featuredStory");
  if (!story) return null;

  const cover = typeof story.coverPhoto === "object" ? (story.coverPhoto as Photo) : null;
  const date = formatDate(story.playedAt);

  // The 3 photos in Beat 2 come from the first `sequence` layout block.
  const sequencePhotos: Photo[] = [];
  for (const block of story.layout ?? []) {
    if (block.blockType === "sequence" && Array.isArray(block.photos)) {
      for (const p of block.photos) {
        if (typeof p === "object" && p !== null) sequencePhotos.push(p as Photo);
      }
      break;
    }
  }
  const galleryPhotos = sequencePhotos.slice(0, 3);

  return (
    <section className="featured-story relative">
      <div className="grid px-6 md:px-12 lg:grid-cols-12 lg:gap-12">
        {/* Left column — pinned cover */}
        <div className="lg:col-span-5">
          <PinnedCover end="+=300%">
            <div className="story-cover bg-elevated relative aspect-[3/4] w-full overflow-hidden lg:aspect-auto lg:h-screen">
              {cover ? (
                <PhotoImage
                  photo={cover}
                  sizes="(min-width: 1024px) 42vw, 90vw"
                  className="size-full object-cover"
                  priority
                />
              ) : null}
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
          </PinnedCover>
        </div>

        {/* Right column — scrolling beats */}
        <div className="flex flex-col gap-32 py-24 lg:col-span-7 lg:min-h-[300vh]">
          {/* Beat 1: meta */}
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

          {/* Beat 2: gallery */}
          <div className="flex flex-col gap-12">
            {galleryPhotos.map((photo, i) => (
              <Reveal key={photo.id} delay={i * 100}>
                <figure className="bg-elevated relative aspect-[4/5] w-full overflow-hidden">
                  <PhotoImage
                    photo={photo}
                    sizes="(min-width: 1024px) 50vw, 90vw"
                    className="size-full object-cover"
                  />
                </figure>
              </Reveal>
            ))}
          </div>

          {/* Beat 3: close */}
          <Reveal>
            <div className="flex flex-col gap-6">
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={`/stories/${story.slug}` as any}
                className="font-display hover:text-accent w-fit text-2xl italic underline-offset-4 transition-colors hover:underline"
              >
                {t("readStory")} →
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
