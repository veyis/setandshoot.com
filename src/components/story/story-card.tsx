import Link from "next/link";
import type { Story } from "@/payload-types";
import { PayloadPhoto } from "@/components/story/payload-photo";
import { resolvePhoto } from "@/lib/payload/media";

type StoryCardProps = {
  story: Story;
  locale: string;
};

function formatPlayedAt(value: string | null | undefined, locale: string): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function StoryCard({ story, locale }: StoryCardProps) {
  const cover = resolvePhoto(story.coverPhoto);
  const playedAt = formatPlayedAt(story.playedAt, locale);
  const href = locale === "de" ? `/stories/${story.slug}` : `/${locale}/stories/${story.slug}`;

  return (
    <article className="group flex flex-col gap-4">
      <Link href={href as never} className="bg-surface-elevated block overflow-hidden">
        {cover ? (
          <PayloadPhoto
            photo={cover}
            size="feed"
            className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="bg-surface text-ink-muted flex aspect-[4/3] items-center justify-center text-sm">
            —
          </div>
        )}
      </Link>
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-2xl tracking-tight">
          <Link href={href as never} className="hover:text-accent transition-colors">
            {story.title}
          </Link>
        </h2>
        {(playedAt || story.venue) && (
          <p className="text-ink-muted font-mono text-xs tracking-wide uppercase">
            {[playedAt, story.venue].filter(Boolean).join(" · ")}
          </p>
        )}
        {story.result ? <p className="text-sm">{story.result}</p> : null}
      </div>
    </article>
  );
}
