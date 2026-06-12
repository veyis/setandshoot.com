import { notFound } from "next/navigation";
import { getStudioStoryMeta, listStoryOptions } from "@/lib/studio/stories";
import { StoryMetaForm } from "@/components/studio/story-meta-form";

export const dynamic = "force-dynamic";

export default async function StudioStoryEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [story, options] = await Promise.all([getStudioStoryMeta(id), listStoryOptions()]);
  if (!story) notFound();

  return (
    <main>
      <h2 className="font-display mb-1 text-xl tracking-tight">{story.titleDe}</h2>
      <p className="text-ink-muted mb-6 font-mono text-xs">/stories/{story.slug}</p>
      <StoryMetaForm story={story} options={options} />
    </main>
  );
}
