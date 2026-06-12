"use client";

import { useTranslations } from "next-intl";
import { RichTextLocaleField } from "@/components/studio/block-editor";
import { PhotoPickerSingle } from "@/components/studio/photo-picker";
import type { RichTextValue } from "@/components/studio/rich-text-mini";
import type { StudioPhoto } from "@/lib/studio/photos";
import type { MarketingSectionInput } from "@/lib/studio/schemas";

// text-base keeps inputs at 16px so iOS Safari doesn't auto-zoom on focus.
const fieldClass =
  "border-hairline bg-canvas focus:ring-accent w-full rounded-sm border px-3 py-2 text-base outline-none focus:ring-2";

const iconButtonClass =
  "border-hairline text-ink hover:bg-ink hover:text-canvas inline-flex rounded-sm border px-2 py-1 font-mono text-xs transition-colors disabled:opacity-50";

const buttonClass =
  "border-hairline text-ink hover:bg-ink hover:text-canvas inline-flex rounded-sm border px-4 py-2 font-mono text-xs tracking-[0.15em] uppercase transition-colors disabled:opacity-50";

export type CtaTarget = Extract<MarketingSectionInput, { blockType: "ctaLink" }>["target"];

export const CTA_TARGETS: CtaTarget[] = [
  "/contact",
  "/about",
  "/athletes",
  "/services",
  "/highlights",
  "/stories",
  "/",
];

/**
 * Client-side draft model for one marketing section. Unset strings are
 * representable as "" so a freshly added section can render before it is
 * complete. Converted to MarketingSectionInput only at save time
 * (marketing-page-form).
 */
type DraftBase = { clientKey: string; id?: string };
export type DraftOfferItem = { clientKey: string; title: string; body: string };
export type DraftSection =
  | (DraftBase & {
      blockType: "pageHeader";
      labelDe: string;
      labelEn: string;
      titleDe: string;
      titleEn: string;
      introDe: string;
      introEn: string;
    })
  | (DraftBase & {
      blockType: "portraitFigure";
      photoId: number | null;
      captionDe: string;
      captionEn: string;
    })
  | (DraftBase & {
      blockType: "editorialProse";
      eyebrowDe: string;
      eyebrowEn: string;
      titleDe: string;
      titleEn: string;
      body1De?: RichTextValue;
      body1En?: RichTextValue;
      pullQuoteDe: string;
      pullQuoteEn: string;
      body2De?: RichTextValue;
      body2En?: RichTextValue;
      creditsDe: string;
      creditsEn: string;
    })
  | (DraftBase & { blockType: "ctaLink"; labelDe: string; labelEn: string; target: CtaTarget })
  | (DraftBase & {
      blockType: "serviceOffers";
      itemsDe: DraftOfferItem[];
      itemsEn: DraftOfferItem[];
    });

export const SECTION_TYPE_KEYS = {
  pageHeader: "secPageHeader",
  portraitFigure: "secPortraitFigure",
  editorialProse: "secEditorialProse",
  ctaLink: "secCtaLink",
  serviceOffers: "secServiceOffers",
} as const;

function TextPair({
  label,
  valueDe,
  valueEn,
  onChangeDe,
  onChangeEn,
  multiline = false,
}: {
  label: string;
  valueDe: string;
  valueEn: string;
  onChangeDe: (value: string) => void;
  onChangeEn: (value: string) => void;
  multiline?: boolean;
}) {
  const fields = [
    { suffix: "(DE)", value: valueDe, onChange: onChangeDe },
    { suffix: "(EN)", value: valueEn, onChange: onChangeEn },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map((field) => (
        <label key={field.suffix} className="block text-sm">
          <span className="text-ink-muted mb-1 block text-xs">
            {label} {field.suffix}
          </span>
          {multiline ? (
            <textarea
              value={field.value}
              onChange={(event) => field.onChange(event.target.value)}
              className={`${fieldClass} min-h-20`}
            />
          ) : (
            <input
              value={field.value}
              onChange={(event) => field.onChange(event.target.value)}
              className={fieldClass}
            />
          )}
        </label>
      ))}
    </div>
  );
}

function OfferItemList({
  label,
  items,
  onChange,
}: {
  label: string;
  items: DraftOfferItem[];
  onChange: (items: DraftOfferItem[]) => void;
}) {
  const t = useTranslations("studio");

  function replaceItem(clientKey: string, next: DraftOfferItem) {
    onChange(items.map((item) => (item.clientKey === clientKey ? next : item)));
  }

  return (
    <div className="text-sm">
      <span className="text-ink-muted mb-2 block text-xs">{label}</span>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.clientKey} className="border-hairline space-y-2 rounded-sm border p-3">
            <label className="block text-sm">
              <span className="text-ink-muted mb-1 block text-xs">{t("titleLabel")}</span>
              <input
                value={item.title}
                onChange={(event) =>
                  replaceItem(item.clientKey, { ...item, title: event.target.value })
                }
                className={fieldClass}
              />
            </label>
            <label className="block text-sm">
              <span className="text-ink-muted mb-1 block text-xs">{t("contentTitle")}</span>
              <textarea
                value={item.body}
                onChange={(event) =>
                  replaceItem(item.clientKey, { ...item, body: event.target.value })
                }
                className={`${fieldClass} min-h-20`}
              />
            </label>
            <button
              type="button"
              onClick={() => onChange(items.filter((other) => other.clientKey !== item.clientKey))}
              className={iconButtonClass}
            >
              {t("removeItem")}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() =>
          onChange([...items, { clientKey: crypto.randomUUID(), title: "", body: "" }])
        }
        className={`${buttonClass} mt-2`}
      >
        {t("addItem")}
      </button>
    </div>
  );
}

export function MarketingSectionEditor({
  section,
  photos,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
  canMoveUp,
  canMoveDown,
  adminUrl,
}: {
  section: DraftSection;
  photos: StudioPhoto[];
  onChange: (next: DraftSection) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  adminUrl: string;
}) {
  const t = useTranslations("studio");

  function body() {
    switch (section.blockType) {
      case "pageHeader":
        return (
          <>
            <TextPair
              label={t("labelLabel")}
              valueDe={section.labelDe}
              valueEn={section.labelEn}
              onChangeDe={(labelDe) => onChange({ ...section, labelDe })}
              onChangeEn={(labelEn) => onChange({ ...section, labelEn })}
            />
            <TextPair
              label={t("titleLabel")}
              valueDe={section.titleDe}
              valueEn={section.titleEn}
              onChangeDe={(titleDe) => onChange({ ...section, titleDe })}
              onChangeEn={(titleEn) => onChange({ ...section, titleEn })}
            />
            <TextPair
              label={t("introLabel")}
              valueDe={section.introDe}
              valueEn={section.introEn}
              onChangeDe={(introDe) => onChange({ ...section, introDe })}
              onChangeEn={(introEn) => onChange({ ...section, introEn })}
              multiline
            />
          </>
        );
      case "portraitFigure":
        return (
          <>
            <PhotoPickerSingle
              photos={photos}
              value={section.photoId}
              onChange={(photoId) => onChange({ ...section, photoId })}
              allowEmpty
            />
            <TextPair
              label={t("captionLabel")}
              valueDe={section.captionDe}
              valueEn={section.captionEn}
              onChangeDe={(captionDe) => onChange({ ...section, captionDe })}
              onChangeEn={(captionEn) => onChange({ ...section, captionEn })}
            />
          </>
        );
      case "editorialProse":
        return (
          <>
            <TextPair
              label={t("eyebrowLabel")}
              valueDe={section.eyebrowDe}
              valueEn={section.eyebrowEn}
              onChangeDe={(eyebrowDe) => onChange({ ...section, eyebrowDe })}
              onChangeEn={(eyebrowEn) => onChange({ ...section, eyebrowEn })}
            />
            <TextPair
              label={t("titleLabel")}
              valueDe={section.titleDe}
              valueEn={section.titleEn}
              onChangeDe={(titleDe) => onChange({ ...section, titleDe })}
              onChangeEn={(titleEn) => onChange({ ...section, titleEn })}
              multiline
            />
            <RichTextLocaleField
              label={`${t("textDe")} 1`}
              value={section.body1De}
              onChange={(body1De) => onChange({ ...section, body1De })}
              adminUrl={adminUrl}
            />
            <RichTextLocaleField
              label={`${t("textEn")} 1`}
              value={section.body1En}
              onChange={(body1En) => onChange({ ...section, body1En })}
              adminUrl={adminUrl}
            />
            <TextPair
              label={t("pullQuoteLabel")}
              valueDe={section.pullQuoteDe}
              valueEn={section.pullQuoteEn}
              onChangeDe={(pullQuoteDe) => onChange({ ...section, pullQuoteDe })}
              onChangeEn={(pullQuoteEn) => onChange({ ...section, pullQuoteEn })}
            />
            <RichTextLocaleField
              label={`${t("textDe")} 2`}
              value={section.body2De}
              onChange={(body2De) => onChange({ ...section, body2De })}
              adminUrl={adminUrl}
            />
            <RichTextLocaleField
              label={`${t("textEn")} 2`}
              value={section.body2En}
              onChange={(body2En) => onChange({ ...section, body2En })}
              adminUrl={adminUrl}
            />
            <TextPair
              label={t("creditsLabel")}
              valueDe={section.creditsDe}
              valueEn={section.creditsEn}
              onChangeDe={(creditsDe) => onChange({ ...section, creditsDe })}
              onChangeEn={(creditsEn) => onChange({ ...section, creditsEn })}
              multiline
            />
          </>
        );
      case "ctaLink":
        return (
          <>
            <TextPair
              label={t("labelLabel")}
              valueDe={section.labelDe}
              valueEn={section.labelEn}
              onChangeDe={(labelDe) => onChange({ ...section, labelDe })}
              onChangeEn={(labelEn) => onChange({ ...section, labelEn })}
            />
            <label className="block text-sm sm:max-w-48">
              <span className="text-ink-muted mb-1 block text-xs">{t("targetLabel")}</span>
              <select
                value={section.target}
                onChange={(event) => {
                  const value = event.target.value as CtaTarget;
                  onChange({ ...section, target: CTA_TARGETS.includes(value) ? value : "/" });
                }}
                className={fieldClass}
              >
                {CTA_TARGETS.map((target) => (
                  <option key={target} value={target}>
                    {target}
                  </option>
                ))}
              </select>
            </label>
          </>
        );
      case "serviceOffers":
        return (
          <div className="grid gap-4 lg:grid-cols-2">
            <OfferItemList
              label={t("itemsDeLabel")}
              items={section.itemsDe}
              onChange={(itemsDe) => onChange({ ...section, itemsDe })}
            />
            <OfferItemList
              label={t("itemsEnLabel")}
              items={section.itemsEn}
              onChange={(itemsEn) => onChange({ ...section, itemsEn })}
            />
          </div>
        );
    }
  }

  return (
    <div className="border-hairline rounded-md border p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="font-mono text-xs tracking-[0.15em] uppercase">
          {t(SECTION_TYPE_KEYS[section.blockType])}
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
