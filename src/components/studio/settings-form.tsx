"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { updateSettingsAction } from "@/lib/studio/actions/globals";
import type { StudioSettings } from "@/lib/studio/globals";

// text-base keeps inputs at 16px so iOS Safari doesn't auto-zoom on focus.
const fieldClass =
  "border-hairline bg-canvas focus:ring-accent w-full rounded-sm border px-3 py-2 text-base outline-none focus:ring-2";

const buttonClass =
  "border-hairline text-ink hover:bg-ink hover:text-canvas inline-flex rounded-sm border px-4 py-2 font-mono text-xs tracking-[0.15em] uppercase transition-colors disabled:opacity-50";

export function SettingsForm({ settings }: { settings: StudioSettings }) {
  const t = useTranslations("studio");
  const [defaultWatermark, setDefaultWatermark] = useState(settings.defaultWatermark);
  const [accentColor, setAccentColor] = useState(settings.accentColor);
  const [homeFeaturedCount, setHomeFeaturedCount] = useState(settings.homeFeaturedCount);
  const [saving, setSaving] = useState(false);

  const countValid =
    Number.isInteger(homeFeaturedCount) && homeFeaturedCount >= 1 && homeFeaturedCount <= 6;

  async function save() {
    if (saving || !countValid) return;
    setSaving(true);
    const result = await updateSettingsAction({ defaultWatermark, accentColor, homeFeaturedCount });
    setSaving(false);
    if (result.ok) {
      toast.success(t("saved"));
    } else {
      toast.error(t("saveError"));
    }
  }

  return (
    <div className="border-hairline space-y-4 rounded-md border p-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={defaultWatermark}
          onChange={(event) => setDefaultWatermark(event.target.checked)}
        />
        {t("watermarkLabel")}
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-ink-muted mb-1 block text-xs">{t("accentColorLabel")}</span>
          <input
            type="color"
            value={accentColor}
            onChange={(event) => setAccentColor(event.target.value)}
            className="border-hairline h-10 w-20 cursor-pointer rounded-sm border"
          />
        </label>
        <label className="block text-sm sm:max-w-32">
          <span className="text-ink-muted mb-1 block text-xs">{t("featuredCountLabel")}</span>
          <input
            type="number"
            min={1}
            max={6}
            value={homeFeaturedCount}
            onChange={(event) => setHomeFeaturedCount(Number(event.target.value))}
            className={fieldClass}
          />
        </label>
      </div>
      <button
        type="button"
        onClick={() => void save()}
        disabled={saving || !countValid}
        className={buttonClass}
      >
        {saving ? t("saving") : t("save")}
      </button>
    </div>
  );
}
