import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Story } from "@/payload-types";
import { PhotoImage } from "./photo-image";

type Props = { stories: Story[]; slotsTotal?: number };

export async function StoriesTeaser({ stories, slotsTotal = 3 }: Props) {
  const t = await getTranslations("home.stories");
  const filled = stories.slice(0, slotsTotal);
  const emptySlots = Math.max(0, slotsTotal - filled.length);

  return (
    <section className="border-hairline border-t px-6 py-16 md:px-12">
      <div className="pb-8">
        <h2 className="font-display text-4xl tracking-tight md:text-5xl">{t("title")}</h2>
        <p className="text-ink-muted mt-2 font-mono text-xs tracking-widest uppercase">
          {t("subtitle")}
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {filled.map((story) => {
          const cover = typeof story.coverPhoto === "object" ? story.coverPhoto : null;
          const date =
            story.playedAt &&
            new Date(story.playedAt).toISOString().slice(0, 10).replace(/-/g, ".");
          return (
            <Link
              key={story.id}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={`/stories/${story.slug}` as any}
              className="border-hairline hover:border-ink/30 group block overflow-hidden rounded-sm border transition-colors"
            >
              <figure className="bg-elevated relative aspect-[4/5] w-full overflow-hidden">
                {cover ? (
                  <PhotoImage
                    photo={cover}
                    sizes="(min-width: 768px) 33vw, 90vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                ) : null}
              </figure>
              <div className="space-y-2 p-4">
                <p className="text-ink-muted font-mono text-xs">
                  {date}
                  {story.venue ? ` · ${story.venue}` : ""}
                </p>
                <h3 className="font-display text-lg leading-snug">{story.title}</h3>
              </div>
            </Link>
          );
        })}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="border-hairline text-ink-muted flex aspect-[4/5] items-end rounded-sm border border-dashed p-4 text-sm"
          >
            {t("comingSoon")}
          </div>
        ))}
      </div>
    </section>
  );
}
