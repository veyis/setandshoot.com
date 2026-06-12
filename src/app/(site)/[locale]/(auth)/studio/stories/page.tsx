import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { listStudioStories } from "@/lib/studio/stories";
import { StoryCreateForm } from "@/components/studio/story-create-form";
import { requireAdmin } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function StudioStoriesPage() {
  // Layouts render in parallel with pages — re-check here, not just in the layout.
  await requireAdmin("/studio");
  const t = await getTranslations("studio");
  const stories = await listStudioStories();

  return (
    <main>
      <StoryCreateForm />
      <h2 className="font-display mb-4 text-xl tracking-tight">{t("storiesTitle")}</h2>
      {stories.length === 0 ? (
        <p className="text-ink-muted">{t("storiesEmpty")}</p>
      ) : (
        <ul className="space-y-4">
          {stories.map((story) => (
            <li
              key={story.id}
              className="border-hairline flex items-center gap-4 rounded-md border p-4"
            >
              {story.coverThumbUrl ? (
                <Image
                  src={story.coverThumbUrl}
                  alt={story.titleDe}
                  width={96}
                  height={72}
                  className="h-18 w-24 shrink-0 rounded-sm object-cover"
                />
              ) : (
                <div className="border-hairline h-18 w-24 shrink-0 rounded-sm border" />
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{story.titleDe}</div>
                {story.titleEn ? (
                  <div className="text-ink-muted truncate text-sm">{story.titleEn}</div>
                ) : null}
                <div className="text-ink-muted mt-1 flex flex-wrap items-center gap-3 text-xs">
                  {story.playedAt ? <span>{story.playedAt.slice(0, 10)}</span> : null}
                  <span className="font-mono tracking-[0.15em] uppercase">
                    {story.published ? t("publishedBadge") : t("draftBadge")}
                  </span>
                </div>
              </div>
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={`/studio/stories/${story.id}` as any}
                className="border-hairline text-ink hover:bg-ink hover:text-canvas inline-flex shrink-0 rounded-sm border px-3 py-1.5 font-mono text-xs tracking-[0.15em] uppercase transition-colors"
              >
                {t("editStory")}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
