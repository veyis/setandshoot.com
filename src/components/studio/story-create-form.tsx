"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createStoryAction } from "@/lib/studio/actions/stories";
import { SLUG_PATTERN } from "@/lib/studio/schemas";

// text-base keeps inputs at 16px so iOS Safari doesn't auto-zoom on focus.
const fieldClass =
  "border-hairline bg-canvas focus:ring-accent w-full rounded-sm border px-3 py-2 text-base outline-none focus:ring-2";

function suggestSlug(title: string): string {
  return title
    .toLowerCase()
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function StoryCreateForm() {
  const t = useTranslations("studio");
  const router = useRouter();
  const [titleDe, setTitleDe] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [creating, setCreating] = useState(false);

  const slugInvalid = slug !== "" && !SLUG_PATTERN.test(slug);

  async function create() {
    if (creating) return;
    setCreating(true);
    const result = await createStoryAction({ slug, titleDe });
    setCreating(false);
    if (result.ok && typeof result.id === "number") {
       
      router.push(`/studio/stories/${result.id}` as any);
      return;
    }
    if (!result.ok && result.error === "slug_taken") {
      toast.error(t("slugTaken"));
    } else {
      toast.error(t("saveError"));
    }
  }

  return (
    <section className="mb-10">
      <h2 className="font-display mb-3 text-xl tracking-tight">{t("newStoryTitle")}</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void create();
        }}
        className="border-hairline rounded-md border p-4"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-ink-muted mb-1 block text-xs">{t("fieldTitleDe")}</span>
            <input
              value={titleDe}
              onChange={(event) => {
                setTitleDe(event.target.value);
                if (!slugEdited) setSlug(suggestSlug(event.target.value));
              }}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm">
            <span className="text-ink-muted mb-1 block text-xs">{t("fieldSlug")}</span>
            <input
              value={slug}
              onChange={(event) => {
                setSlug(event.target.value);
                setSlugEdited(true);
              }}
              className={fieldClass}
            />
            {slugInvalid ? (
              <span className="text-ink-muted mt-1 block text-xs">{t("slugInvalid")}</span>
            ) : null}
          </label>
        </div>
        <button
          type="submit"
          disabled={creating || titleDe.trim() === "" || !SLUG_PATTERN.test(slug)}
          className="border-hairline text-ink hover:bg-ink hover:text-canvas mt-3 inline-flex rounded-sm border px-4 py-2 font-mono text-xs tracking-[0.15em] uppercase transition-colors disabled:opacity-50"
        >
          {creating ? t("creating") : t("create")}
        </button>
      </form>
    </section>
  );
}
