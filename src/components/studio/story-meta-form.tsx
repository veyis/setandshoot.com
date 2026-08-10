"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { setStoryPublishedAction, updateStoryMetaAction } from "@/lib/studio/actions/stories";
import type { StoryOption, StudioStoryMeta } from "@/lib/studio/stories";

// text-base keeps inputs at 16px so iOS Safari doesn't auto-zoom on focus.
const fieldClass =
  "border-hairline bg-canvas focus:ring-accent w-full rounded-sm border px-3 py-2 text-base outline-none focus:ring-2";

const buttonClass =
  "border-hairline text-ink hover:bg-ink hover:text-canvas inline-flex rounded-sm border px-4 py-2 font-mono text-xs tracking-[0.15em] uppercase transition-colors disabled:opacity-50";

function RelationSelect({
  label,
  value,
  options,
  noSelectionLabel,
  onChange,
}: {
  label: string;
  value: number | null;
  options: StoryOption[];
  noSelectionLabel: string;
  onChange: (id: number | null) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="text-ink-muted mb-1 block text-xs">{label}</span>
      <select
        value={String(value ?? "")}
        onChange={(event) =>
          onChange(event.target.value === "" ? null : Number(event.target.value))
        }
        className={fieldClass}
      >
        <option value="">{noSelectionLabel}</option>
        {options.map((option) => (
          <option key={option.id} value={String(option.id)}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function StoryMetaForm({
  story,
  options,
}: {
  story: StudioStoryMeta;
  options: { competitions: StoryOption[]; teams: StoryOption[] };
}) {
  const t = useTranslations("studio");
  const router = useRouter();
  const [titleDe, setTitleDe] = useState(story.titleDe);
  const [titleEn, setTitleEn] = useState(story.titleEn);
  const [competitionId, setCompetitionId] = useState<number | null>(story.competitionId);
  const [homeTeamId, setHomeTeamId] = useState<number | null>(story.homeTeamId);
  const [awayTeamId, setAwayTeamId] = useState<number | null>(story.awayTeamId);
  const [venue, setVenue] = useState(story.venue);
  const [playedAt, setPlayedAt] = useState(story.playedAt ?? "");
  const [result, setResult] = useState(story.result);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  async function save() {
    if (saving) return;
    setSaving(true);
    const actionResult = await updateStoryMetaAction({
      id: story.id,
      titleDe,
      titleEn: titleEn.trim() === "" ? undefined : titleEn,
      competitionId,
      homeTeamId,
      awayTeamId,
      venue: venue.trim() === "" ? undefined : venue.trim(),
      playedAt: playedAt === "" ? undefined : playedAt,
      result: result.trim() === "" ? undefined : result.trim(),
    });
    setSaving(false);
    if (actionResult.ok) {
      toast.success(t("saved"));
    } else {
      toast.error(t("saveError"));
    }
  }

  async function togglePublished() {
    if (publishing) return;
    setPublishing(true);
    const actionResult = await setStoryPublishedAction({
      id: story.id,
      published: !story.published,
    });
    setPublishing(false);
    if (actionResult.ok) {
      router.refresh();
    } else {
      toast.error(t("saveError"));
    }
  }

  return (
    <div className="border-hairline rounded-md border p-4">
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-ink-muted mb-1 block text-xs">{t("fieldTitleDe")}</span>
            <input
              value={titleDe}
              onChange={(event) => setTitleDe(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm">
            <span className="text-ink-muted mb-1 block text-xs">{t("fieldTitleEn")}</span>
            <input
              value={titleEn}
              onChange={(event) => setTitleEn(event.target.value)}
              className={fieldClass}
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <RelationSelect
            label={t("fieldCompetition")}
            value={competitionId}
            options={options.competitions}
            noSelectionLabel={t("noSelection")}
            onChange={setCompetitionId}
          />
          <RelationSelect
            label={t("fieldHomeTeam")}
            value={homeTeamId}
            options={options.teams}
            noSelectionLabel={t("noSelection")}
            onChange={setHomeTeamId}
          />
          <RelationSelect
            label={t("fieldAwayTeam")}
            value={awayTeamId}
            options={options.teams}
            noSelectionLabel={t("noSelection")}
            onChange={setAwayTeamId}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="text-ink-muted mb-1 block text-xs">{t("fieldVenue")}</span>
            <input
              value={venue}
              onChange={(event) => setVenue(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm">
            <span className="text-ink-muted mb-1 block text-xs">{t("fieldPlayedAt")}</span>
            <input
              type="date"
              value={playedAt}
              onChange={(event) => setPlayedAt(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm">
            <span className="text-ink-muted mb-1 block text-xs">{t("fieldResult")}</span>
            <input
              value={result}
              onChange={(event) => setResult(event.target.value)}
              className={fieldClass}
            />
          </label>
        </div>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || titleDe.trim() === ""}
          className={buttonClass}
        >
          {saving ? t("saving") : t("save")}
        </button>
      </div>
      <div className="border-hairline mt-6 flex flex-wrap items-center gap-4 border-t pt-4">
        <span className="border-hairline rounded-sm border px-2 py-1 font-mono text-xs tracking-[0.15em] uppercase">
          {story.published ? t("publishedBadge") : t("draftBadge")}
        </span>
        <button
          type="button"
          onClick={() => void togglePublished()}
          disabled={publishing}
          className={buttonClass}
        >
          {story.published ? t("unpublish") : t("publish")}
        </button>
        {story.published ? (
          <Link
             
            href={`/stories/${story.slug}` as any}
            target="_blank"
            rel="noreferrer"
            className="text-ink-muted hover:text-ink text-sm underline underline-offset-4 transition-colors"
          >
            {t("viewLive")} ↗
          </Link>
        ) : null}
      </div>
    </div>
  );
}
