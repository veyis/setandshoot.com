"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { updatePhotoMetaAction } from "@/lib/studio/actions/photos";
import type { StudioPhoto, StudioTag } from "@/lib/studio/photos";

// text-base keeps inputs at 16px so iOS Safari doesn't auto-zoom on focus.
const fieldClass =
  "border-hairline bg-canvas focus:ring-accent w-full rounded-sm border px-3 py-2 text-base outline-none focus:ring-2";

export function PhotoCard({ photo, tags }: { photo: StudioPhoto; tags: StudioTag[] }) {
  const t = useTranslations("studio");
  const [altDe, setAltDe] = useState(photo.altDe);
  const [altEn, setAltEn] = useState(photo.altEn);
  const [published, setPublished] = useState(photo.published);
  const [isHighlight, setIsHighlight] = useState(photo.isHighlight);
  const [isCover, setIsCover] = useState(photo.isCover);
  const [tagIds, setTagIds] = useState<number[]>(photo.tagIds);
  const [saving, setSaving] = useState(false);

  function toggleTag(id: number) {
    setTagIds((current) =>
      current.includes(id) ? current.filter((tagId) => tagId !== id) : [...current, id],
    );
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    const result = await updatePhotoMetaAction({
      id: photo.id,
      altDe,
      // Always send EN (including "") so an emptied field clears the EN
      // override instead of silently keeping the old value.
      altEn,
      published,
      isHighlight,
      isCover,
      tagIds,
    });
    setSaving(false);
    if (result.ok) {
      toast.success(t("saved"));
    } else {
      toast.error(t("saveError"));
    }
  }

  return (
    <li className="border-hairline rounded-md border p-4">
      {photo.thumbUrl ? (
        <Image
          src={photo.thumbUrl}
          alt={photo.altDe || photo.filename}
          width={480}
          height={360}
          className="mb-3 w-full rounded-sm object-cover"
        />
      ) : (
        <div className="border-hairline text-ink-muted mb-3 flex aspect-[4/3] items-center justify-center rounded-sm border text-xs">
          {photo.filename}
        </div>
      )}
      <div className="space-y-2">
        <label className="block text-sm">
          <span className="text-ink-muted mb-1 block text-xs">{t("altDe")}</span>
          <input
            value={altDe}
            onChange={(event) => setAltDe(event.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="block text-sm">
          <span className="text-ink-muted mb-1 block text-xs">{t("altEn")}</span>
          <input
            value={altEn}
            onChange={(event) => setAltEn(event.target.value)}
            className={fieldClass}
          />
        </label>
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={published}
              onChange={(event) => setPublished(event.target.checked)}
            />
            {t("published")}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isHighlight}
              onChange={(event) => setIsHighlight(event.target.checked)}
            />
            {t("highlight")}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isCover}
              onChange={(event) => setIsCover(event.target.checked)}
            />
            {t("cover")}
          </label>
        </div>
        {tags.length > 0 ? (
          <div className="text-sm">
            <span className="text-ink-muted mb-1 block text-xs">{t("tags")}</span>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {tags.map((tag) => (
                <label key={tag.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={tagIds.includes(tag.id)}
                    onChange={() => toggleTag(tag.id)}
                  />
                  {tag.name}
                </label>
              ))}
            </div>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || altDe.trim() === ""}
          className="border-hairline text-ink hover:bg-ink hover:text-canvas inline-flex rounded-sm border px-4 py-2 font-mono text-xs tracking-[0.15em] uppercase transition-colors disabled:opacity-50"
        >
          {saving ? t("saving") : t("save")}
        </button>
      </div>
    </li>
  );
}
