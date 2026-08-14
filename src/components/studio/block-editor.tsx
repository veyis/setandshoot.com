"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { PhotoPickerMulti, PhotoPickerSingle } from "@/components/studio/photo-picker";
import { RichTextMini, type RichTextValue } from "@/components/studio/rich-text-mini";
import { isSupportedRichText } from "@/lib/studio/lexical";
import type { StudioPhoto } from "@/lib/studio/photos";

// text-base keeps inputs at 16px so iOS Safari doesn't auto-zoom on focus.
const fieldClass =
  "border-hairline bg-canvas focus:ring-accent w-full rounded-sm border px-3 py-2 text-base outline-none focus:ring-2";

const iconButtonClass =
  "border-hairline text-ink hover:bg-ink hover:text-canvas inline-flex rounded-sm border px-2 py-1 font-mono text-xs transition-colors disabled:opacity-50";

/**
 * Client-side draft model for one story layout block. Unlike StoryBlockInput,
 * unset photos are representable (null / short arrays) so a freshly added
 * block can render before it is complete. Converted to StoryBlockInput only
 * at save time (story-content-form).
 */
type DraftBase = { clientKey: string; id?: string };
export type DraftBlock =
  | (DraftBase & { blockType: "fullBleedPhoto"; photoId: number | null })
  | (DraftBase & {
      blockType: "diptych";
      photoLeftId: number | null;
      photoRightId: number | null;
      ratio: "50-50" | "60-40";
    })
  | (DraftBase & { blockType: "triptych"; photoIds: number[] })
  | (DraftBase & {
      blockType: "insetPortrait";
      photoId: number | null;
      textDe?: RichTextValue;
      textEn?: RichTextValue;
    })
  | (DraftBase & {
      blockType: "sequence";
      photoIds: number[];
      captionDe: string;
      captionEn: string;
    })
  | (DraftBase & {
      blockType: "pullQuote";
      quoteDe: string;
      quoteEn: string;
      attributionDe: string;
      attributionEn: string;
    })
  | (DraftBase & { blockType: "textParagraph"; textDe?: RichTextValue; textEn?: RichTextValue });

export const BLOCK_TYPE_KEYS = {
  fullBleedPhoto: "blockFullBleedPhoto",
  diptych: "blockDiptych",
  triptych: "blockTriptych",
  insetPortrait: "blockInsetPortrait",
  sequence: "blockSequence",
  pullQuote: "blockPullQuote",
  textParagraph: "blockTextParagraph",
} as const;

/** Rich-text field with the safety lock: unsupported docs render read-only. */
export function RichTextLocaleField({
  label,
  value,
  onChange,
  adminUrl,
}: {
  label: string;
  value: RichTextValue | undefined;
  onChange: (next: RichTextValue) => void;
  adminUrl: string;
}) {
  const t = useTranslations("studio");
  return (
    <div className="text-sm">
      <span className="text-ink-muted mb-1 block text-xs">{label}</span>
      {isSupportedRichText(value) ? (
        <RichTextMini value={value} onChange={onChange} ariaLabel={label} />
      ) : (
        <p className="text-ink-muted text-sm">
          {t("lockedRichText")}{" "}
          <Link href={adminUrl as any} className="text-ink underline underline-offset-4">
            {t("openInAdmin")}
          </Link>
        </p>
      )}
    </div>
  );
}

export function BlockEditor({
  block,
  photos,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
  canMoveUp,
  canMoveDown,
  adminUrl,
}: {
  block: DraftBlock;
  photos: StudioPhoto[];
  onChange: (next: DraftBlock) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  adminUrl: string;
}) {
  const t = useTranslations("studio");

  function body() {
    switch (block.blockType) {
      case "fullBleedPhoto":
        return (
          <PhotoPickerSingle
            photos={photos}
            value={block.photoId}
            onChange={(photoId) => onChange({ ...block, photoId })}
          />
        );
      case "diptych":
        return (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <PhotoPickerSingle
                photos={photos}
                value={block.photoLeftId}
                onChange={(photoLeftId) => onChange({ ...block, photoLeftId })}
                label={t("photoLeftLabel")}
              />
              <PhotoPickerSingle
                photos={photos}
                value={block.photoRightId}
                onChange={(photoRightId) => onChange({ ...block, photoRightId })}
                label={t("photoRightLabel")}
              />
            </div>
            <label className="block text-sm sm:max-w-48">
              <span className="text-ink-muted mb-1 block text-xs">{t("ratioLabel")}</span>
              <select
                value={block.ratio}
                onChange={(event) =>
                  onChange({ ...block, ratio: event.target.value === "60-40" ? "60-40" : "50-50" })
                }
                className={fieldClass}
              >
                <option value="50-50">50 / 50</option>
                <option value="60-40">60 / 40</option>
              </select>
            </label>
          </>
        );
      case "triptych":
        return (
          <PhotoPickerMulti
            photos={photos}
            value={block.photoIds}
            onChange={(photoIds) => onChange({ ...block, photoIds })}
            min={3}
            max={3}
            label={t("photosLabel")}
          />
        );
      case "insetPortrait":
        return (
          <>
            <PhotoPickerSingle
              photos={photos}
              value={block.photoId}
              onChange={(photoId) => onChange({ ...block, photoId })}
            />
            <RichTextLocaleField
              label={t("textDe")}
              value={block.textDe}
              onChange={(textDe) => onChange({ ...block, textDe })}
              adminUrl={adminUrl}
            />
            <RichTextLocaleField
              label={t("textEn")}
              value={block.textEn}
              onChange={(textEn) => onChange({ ...block, textEn })}
              adminUrl={adminUrl}
            />
          </>
        );
      case "sequence":
        return (
          <>
            <PhotoPickerMulti
              photos={photos}
              value={block.photoIds}
              onChange={(photoIds) => onChange({ ...block, photoIds })}
              min={2}
              max={6}
              label={t("photosLabel")}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-ink-muted mb-1 block text-xs">{t("captionLabel")} (DE)</span>
                <input
                  value={block.captionDe}
                  onChange={(event) => onChange({ ...block, captionDe: event.target.value })}
                  className={fieldClass}
                />
              </label>
              <label className="block text-sm">
                <span className="text-ink-muted mb-1 block text-xs">{t("captionLabel")} (EN)</span>
                <input
                  value={block.captionEn}
                  onChange={(event) => onChange({ ...block, captionEn: event.target.value })}
                  className={fieldClass}
                />
              </label>
            </div>
          </>
        );
      case "pullQuote":
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-ink-muted mb-1 block text-xs">{t("quoteLabel")} (DE)</span>
              <textarea
                value={block.quoteDe}
                onChange={(event) => onChange({ ...block, quoteDe: event.target.value })}
                className={`${fieldClass} min-h-20`}
              />
            </label>
            <label className="block text-sm">
              <span className="text-ink-muted mb-1 block text-xs">{t("quoteLabel")} (EN)</span>
              <textarea
                value={block.quoteEn}
                onChange={(event) => onChange({ ...block, quoteEn: event.target.value })}
                className={`${fieldClass} min-h-20`}
              />
            </label>
            <label className="block text-sm">
              <span className="text-ink-muted mb-1 block text-xs">
                {t("attributionLabel")} (DE)
              </span>
              <input
                value={block.attributionDe}
                onChange={(event) => onChange({ ...block, attributionDe: event.target.value })}
                className={fieldClass}
              />
            </label>
            <label className="block text-sm">
              <span className="text-ink-muted mb-1 block text-xs">
                {t("attributionLabel")} (EN)
              </span>
              <input
                value={block.attributionEn}
                onChange={(event) => onChange({ ...block, attributionEn: event.target.value })}
                className={fieldClass}
              />
            </label>
          </div>
        );
      case "textParagraph":
        return (
          <>
            <RichTextLocaleField
              label={t("textDe")}
              value={block.textDe}
              onChange={(textDe) => onChange({ ...block, textDe })}
              adminUrl={adminUrl}
            />
            <RichTextLocaleField
              label={t("textEn")}
              value={block.textEn}
              onChange={(textEn) => onChange({ ...block, textEn })}
              adminUrl={adminUrl}
            />
          </>
        );
    }
  }

  return (
    <div className="border-hairline rounded-md border p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="font-mono text-xs tracking-[0.15em] uppercase">
          {t(BLOCK_TYPE_KEYS[block.blockType])}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            aria-label={t("moveUp")}
            className={iconButtonClass}
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            aria-label={t("moveDown")}
            className={iconButtonClass}
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={t("removeBlock")}
            className={iconButtonClass}
          >
            ✕
          </button>
        </div>
      </div>
      <div className="space-y-3">{body()}</div>
    </div>
  );
}
