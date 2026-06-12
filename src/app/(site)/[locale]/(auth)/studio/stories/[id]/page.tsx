import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getStudioStoryMeta, listStoryOptions } from "@/lib/studio/stories";
import { getStudioStoryContent } from "@/lib/studio/story-content";
import { listStudioPhotos } from "@/lib/studio/photos";
import { StoryMetaForm } from "@/components/studio/story-meta-form";
import { StoryContentForm } from "@/components/studio/story-content-form";

export const dynamic = "force-dynamic";

export default async function StudioStoryEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [t, story, options, content, photos] = await Promise.all([
    getTranslations("studio"),
    getStudioStoryMeta(id),
    listStoryOptions(),
    getStudioStoryContent(id),
    listStudioPhotos(),
  ]);
  if (!story || !content) notFound();

  return (
    <main>
      <h2 className="font-display mb-1 text-xl tracking-tight">{story.titleDe}</h2>
      <p className="text-ink-muted mb-6 font-mono text-xs">/stories/{story.slug}</p>
      <StoryMetaForm story={story} options={options} />
      <h2 className="font-display mt-10 mb-3 text-xl tracking-tight">{t("contentTitle")}</h2>
      <StoryContentForm
        content={content}
        photos={photos}
        adminUrl={`/admin/collections/stories/${id}`}
      />
    </main>
  );
}
