import { getTranslations } from "next-intl/server";
import { listStudioPhotos, listStudioTags } from "@/lib/studio/photos";
import { PhotoUpload } from "@/components/studio/photo-upload";
import { PhotoCard } from "@/components/studio/photo-card";
import { requireAdmin } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function StudioPhotosPage() {
  // Layouts render in parallel with pages — re-check here, not just in the layout.
  await requireAdmin("/studio");
  const t = await getTranslations("studio");
  const [photos, tags] = await Promise.all([listStudioPhotos(), listStudioTags()]);

  return (
    <main>
      <PhotoUpload />
      <h2 className="font-display mb-4 text-xl tracking-tight">{t("photosTitle")}</h2>
      {photos.length === 0 ? (
        <p className="text-ink-muted">{t("photosEmpty")}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} tags={tags} />
          ))}
        </ul>
      )}
    </main>
  );
}
