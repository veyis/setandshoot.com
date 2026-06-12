"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  MarketingSectionEditor,
  SECTION_TYPE_KEYS,
  type DraftOfferItem,
  type DraftSection,
} from "@/components/studio/marketing-section-editor";
import type { RichTextValue } from "@/components/studio/rich-text-mini";
import { updateMarketingPageAction } from "@/lib/studio/actions/globals";
import { isSupportedRichText } from "@/lib/studio/lexical";
import type { StudioMarketingPage } from "@/lib/studio/marketing-pages";
import type { StudioPhoto } from "@/lib/studio/photos";
import type { MarketingSectionInput } from "@/lib/studio/schemas";

const buttonClass =
  "border-hairline text-ink hover:bg-ink hover:text-canvas inline-flex rounded-sm border px-4 py-2 font-mono text-xs tracking-[0.15em] uppercase transition-colors disabled:opacity-50";

/** True when the doc has any descendant text node with non-whitespace text. */
function hasTextContent(node: unknown): boolean {
  if (!node || typeof node !== "object") return false;
  const candidate = node as { text?: unknown; children?: unknown };
  if (typeof candidate.text === "string" && candidate.text.trim() !== "") return true;
  if (Array.isArray(candidate.children)) {
    return candidate.children.some((child) => hasTextContent(child));
  }
  return false;
}

/**
 * Empty documents (e.g. a lone empty paragraph) count as "no value".
 * Locked docs (unsupported in the mini editor, read-only in the UI) must
 * round-trip verbatim — never drop admin-authored content.
 */
function richTextOrUndefined(value: RichTextValue | undefined): RichTextValue | undefined {
  if (value && !isSupportedRichText(value)) return value;
  if (!value || !hasTextContent(value.root)) return undefined;
  return value;
}

function trimmedOrUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function toDraftItems(items: { title: string; body: string }[] | undefined): DraftOfferItem[] {
  return (items ?? []).map((item) => ({
    clientKey: crypto.randomUUID(),
    title: item.title,
    body: item.body,
  }));
}

function toDraft(section: MarketingSectionInput): DraftSection {
  const clientKey = crypto.randomUUID();
  switch (section.blockType) {
    case "pageHeader":
      return {
        clientKey,
        id: section.id,
        blockType: "pageHeader",
        labelDe: section.labelDe ?? "",
        labelEn: section.labelEn ?? "",
        titleDe: section.titleDe,
        titleEn: section.titleEn ?? "",
        introDe: section.introDe ?? "",
        introEn: section.introEn ?? "",
      };
    case "portraitFigure":
      return {
        clientKey,
        id: section.id,
        blockType: "portraitFigure",
        photoId: section.photoId,
        captionDe: section.captionDe ?? "",
        captionEn: section.captionEn ?? "",
      };
    case "editorialProse":
      return {
        clientKey,
        id: section.id,
        blockType: "editorialProse",
        eyebrowDe: section.eyebrowDe ?? "",
        eyebrowEn: section.eyebrowEn ?? "",
        titleDe: section.titleDe ?? "",
        titleEn: section.titleEn ?? "",
        body1De: section.body1De as RichTextValue | undefined,
        body1En: section.body1En as RichTextValue | undefined,
        pullQuoteDe: section.pullQuoteDe ?? "",
        pullQuoteEn: section.pullQuoteEn ?? "",
        body2De: section.body2De as RichTextValue | undefined,
        body2En: section.body2En as RichTextValue | undefined,
        creditsDe: section.creditsDe ?? "",
        creditsEn: section.creditsEn ?? "",
      };
    case "ctaLink":
      return {
        clientKey,
        id: section.id,
        blockType: "ctaLink",
        labelDe: section.labelDe,
        labelEn: section.labelEn ?? "",
        target: section.target,
      };
    case "serviceOffers":
      return {
        clientKey,
        id: section.id,
        blockType: "serviceOffers",
        itemsDe: toDraftItems(section.itemsDe),
        itemsEn: toDraftItems(section.itemsEn),
      };
  }
}

function emptyDraft(blockType: DraftSection["blockType"]): DraftSection {
  const clientKey = crypto.randomUUID();
  switch (blockType) {
    case "pageHeader":
      return {
        clientKey,
        blockType: "pageHeader",
        labelDe: "",
        labelEn: "",
        titleDe: "",
        titleEn: "",
        introDe: "",
        introEn: "",
      };
    case "portraitFigure":
      return {
        clientKey,
        blockType: "portraitFigure",
        photoId: null,
        captionDe: "",
        captionEn: "",
      };
    case "editorialProse":
      return {
        clientKey,
        blockType: "editorialProse",
        eyebrowDe: "",
        eyebrowEn: "",
        titleDe: "",
        titleEn: "",
        pullQuoteDe: "",
        pullQuoteEn: "",
        creditsDe: "",
        creditsEn: "",
      };
    case "ctaLink":
      return { clientKey, blockType: "ctaLink", labelDe: "", labelEn: "", target: "/contact" };
    case "serviceOffers":
      return { clientKey, blockType: "serviceOffers", itemsDe: [], itemsEn: [] };
  }
}

function itemComplete(item: DraftOfferItem): boolean {
  return item.title.trim() !== "" && item.body.trim() !== "";
}

/** Required DE text present? (schema: pageHeader title, ctaLink label, offer items) */
function textComplete(section: DraftSection): boolean {
  switch (section.blockType) {
    case "pageHeader":
      return section.titleDe.trim() !== "";
    case "ctaLink":
      return section.labelDe.trim() !== "";
    case "serviceOffers":
      // EN items, when present, must be complete too — the schema requires
      // title+body on every item in either locale.
      return section.itemsDe.every(itemComplete) && section.itemsEn.every(itemComplete);
    default:
      return true;
  }
}

/** Only called for complete sections — required DE strings are non-empty. */
function toInput(section: DraftSection): MarketingSectionInput {
  switch (section.blockType) {
    case "pageHeader":
      return {
        id: section.id,
        blockType: "pageHeader",
        labelDe: trimmedOrUndefined(section.labelDe),
        labelEn: trimmedOrUndefined(section.labelEn),
        titleDe: section.titleDe.trim(),
        titleEn: trimmedOrUndefined(section.titleEn),
        introDe: trimmedOrUndefined(section.introDe),
        introEn: trimmedOrUndefined(section.introEn),
      };
    case "portraitFigure":
      return {
        id: section.id,
        blockType: "portraitFigure",
        photoId: section.photoId,
        captionDe: trimmedOrUndefined(section.captionDe),
        captionEn: trimmedOrUndefined(section.captionEn),
      };
    case "editorialProse":
      return {
        id: section.id,
        blockType: "editorialProse",
        eyebrowDe: trimmedOrUndefined(section.eyebrowDe),
        eyebrowEn: trimmedOrUndefined(section.eyebrowEn),
        titleDe: trimmedOrUndefined(section.titleDe),
        titleEn: trimmedOrUndefined(section.titleEn),
        body1De: richTextOrUndefined(section.body1De),
        body1En: richTextOrUndefined(section.body1En),
        pullQuoteDe: trimmedOrUndefined(section.pullQuoteDe),
        pullQuoteEn: trimmedOrUndefined(section.pullQuoteEn),
        body2De: richTextOrUndefined(section.body2De),
        body2En: richTextOrUndefined(section.body2En),
        creditsDe: trimmedOrUndefined(section.creditsDe),
        creditsEn: trimmedOrUndefined(section.creditsEn),
      };
    case "ctaLink":
      return {
        id: section.id,
        blockType: "ctaLink",
        labelDe: section.labelDe.trim(),
        labelEn: trimmedOrUndefined(section.labelEn),
        target: section.target,
      };
    case "serviceOffers": {
      const itemsEn = section.itemsEn.map((item) => ({
        title: item.title.trim(),
        body: item.body.trim(),
      }));
      return {
        id: section.id,
        blockType: "serviceOffers",
        itemsDe: section.itemsDe.map((item) => ({
          title: item.title.trim(),
          body: item.body.trim(),
        })),
        itemsEn: itemsEn.length > 0 ? itemsEn : undefined,
      };
    }
  }
}

const SECTION_TYPES = Object.keys(SECTION_TYPE_KEYS) as DraftSection["blockType"][];

export function MarketingPageForm({
  page,
  photos,
  adminUrl,
}: {
  page: StudioMarketingPage;
  photos: StudioPhoto[];
  adminUrl: string;
}) {
  const t = useTranslations("studio");
  const router = useRouter();
  const [sections, setSections] = useState<DraftSection[]>(() => page.sections.map(toDraft));
  const [saving, setSaving] = useState(false);

  const allTextComplete = sections.every(textComplete);
  const canSave = allTextComplete;

  function replaceSection(clientKey: string, next: DraftSection) {
    setSections((current) =>
      current.map((section) => (section.clientKey === clientKey ? next : section)),
    );
  }

  function moveSection(index: number, delta: -1 | 1) {
    setSections((current) => {
      const target = index + delta;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  }

  function removeSection(clientKey: string) {
    setSections((current) => current.filter((section) => section.clientKey !== clientKey));
  }

  async function save() {
    if (saving || !canSave) return;
    setSaving(true);
    const result = await updateMarketingPageAction({
      slug: page.slug,
      sections: sections.map(toInput),
    });
    setSaving(false);
    if (result.ok) {
      toast.success(t("saved"));
      router.refresh();
    } else {
      toast.error(t("saveError"));
    }
  }

  return (
    <div className="border-hairline space-y-6 rounded-md border p-4">
      {sections.length === 0 ? (
        <p className="text-ink-muted text-sm">{t("sectionsEmpty")}</p>
      ) : (
        <ul className="space-y-4">
          {sections.map((section, index) => (
            <li key={section.clientKey}>
              <MarketingSectionEditor
                section={section}
                photos={photos}
                onChange={(next) => replaceSection(section.clientKey, next)}
                onMoveUp={() => moveSection(index, -1)}
                onMoveDown={() => moveSection(index, 1)}
                onRemove={() => removeSection(section.clientKey)}
                canMoveUp={index > 0}
                canMoveDown={index < sections.length - 1}
                adminUrl={adminUrl}
              />
            </li>
          ))}
        </ul>
      )}
      <div className="text-sm">
        <span className="text-ink-muted mb-2 block text-xs">{t("addSection")}</span>
        <div className="flex flex-wrap gap-2">
          {SECTION_TYPES.map((blockType) => (
            <button
              key={blockType}
              type="button"
              onClick={() => setSections((current) => [...current, emptyDraft(blockType)])}
              className={buttonClass}
            >
              {t(SECTION_TYPE_KEYS[blockType])}
            </button>
          ))}
        </div>
      </div>
      <div className="border-hairline flex flex-wrap items-center gap-4 border-t pt-4">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || !canSave}
          className={buttonClass}
        >
          {saving ? t("saving") : t("save")}
        </button>
        {!allTextComplete ? <p className="text-ink-muted text-sm">{t("textMissing")}</p> : null}
      </div>
    </div>
  );
}
