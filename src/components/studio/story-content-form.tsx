"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  BLOCK_TYPE_KEYS,
  BlockEditor,
  RichTextLocaleField,
  type DraftBlock,
} from "@/components/studio/block-editor";
import { PhotoPickerSingle } from "@/components/studio/photo-picker";
import type { RichTextValue } from "@/components/studio/rich-text-mini";
import { updateStoryContentAction } from "@/lib/studio/actions/stories";
import { isSupportedRichText } from "@/lib/studio/lexical";
import type { StudioPhoto } from "@/lib/studio/photos";
import type { StoryBlockInput } from "@/lib/studio/schemas";
import type { StudioStoryContent } from "@/lib/studio/story-content";

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

function toDraft(block: StoryBlockInput): DraftBlock {
  const clientKey = crypto.randomUUID();
  switch (block.blockType) {
    case "fullBleedPhoto":
      return { clientKey, id: block.id, blockType: "fullBleedPhoto", photoId: block.photoId };
    case "diptych":
      return {
        clientKey,
        id: block.id,
        blockType: "diptych",
        photoLeftId: block.photoLeftId,
        photoRightId: block.photoRightId,
        ratio: block.ratio,
      };
    case "triptych":
      return { clientKey, id: block.id, blockType: "triptych", photoIds: block.photoIds };
    case "insetPortrait":
      return {
        clientKey,
        id: block.id,
        blockType: "insetPortrait",
        photoId: block.photoId,
        textDe: block.textDe as RichTextValue | undefined,
        textEn: block.textEn as RichTextValue | undefined,
      };
    case "sequence":
      return {
        clientKey,
        id: block.id,
        blockType: "sequence",
        photoIds: block.photoIds,
        captionDe: block.captionDe ?? "",
        captionEn: block.captionEn ?? "",
      };
    case "pullQuote":
      return {
        clientKey,
        id: block.id,
        blockType: "pullQuote",
        quoteDe: block.quoteDe,
        quoteEn: block.quoteEn ?? "",
        attributionDe: block.attributionDe ?? "",
        attributionEn: block.attributionEn ?? "",
      };
    case "textParagraph":
      return {
        clientKey,
        id: block.id,
        blockType: "textParagraph",
        textDe: block.textDe as RichTextValue,
        textEn: block.textEn as RichTextValue | undefined,
      };
  }
}

function emptyDraft(blockType: DraftBlock["blockType"]): DraftBlock {
  const clientKey = crypto.randomUUID();
  switch (blockType) {
    case "fullBleedPhoto":
      return { clientKey, blockType: "fullBleedPhoto", photoId: null };
    case "diptych":
      return {
        clientKey,
        blockType: "diptych",
        photoLeftId: null,
        photoRightId: null,
        ratio: "50-50",
      };
    case "triptych":
      return { clientKey, blockType: "triptych", photoIds: [] };
    case "insetPortrait":
      return { clientKey, blockType: "insetPortrait", photoId: null };
    case "sequence":
      return { clientKey, blockType: "sequence", photoIds: [], captionDe: "", captionEn: "" };
    case "pullQuote":
      return {
        clientKey,
        blockType: "pullQuote",
        quoteDe: "",
        quoteEn: "",
        attributionDe: "",
        attributionEn: "",
      };
    case "textParagraph":
      return { clientKey, blockType: "textParagraph" };
  }
}

/** All required photos chosen? Drives the photoMissing hint. */
function photosComplete(block: DraftBlock): boolean {
  switch (block.blockType) {
    case "fullBleedPhoto":
    case "insetPortrait":
      return block.photoId !== null;
    case "diptych":
      return block.photoLeftId !== null && block.photoRightId !== null;
    case "triptych":
      return block.photoIds.length === 3;
    case "sequence":
      return block.photoIds.length >= 2 && block.photoIds.length <= 6;
    default:
      return true;
  }
}

/** Required DE text present? (schema: pullQuote quote, textParagraph text) */
function textComplete(block: DraftBlock): boolean {
  switch (block.blockType) {
    case "pullQuote":
      return block.quoteDe.trim() !== "";
    case "textParagraph":
      // A locked doc counts as complete: it has content, just not editable here.
      if (block.textDe && !isSupportedRichText(block.textDe)) return true;
      return richTextOrUndefined(block.textDe) !== undefined;
    default:
      return true;
  }
}

/** Only called for complete blocks — photo ids are guaranteed non-null. */
function toInput(block: DraftBlock): StoryBlockInput {
  switch (block.blockType) {
    case "fullBleedPhoto":
      return { id: block.id, blockType: "fullBleedPhoto", photoId: block.photoId! };
    case "diptych":
      return {
        id: block.id,
        blockType: "diptych",
        photoLeftId: block.photoLeftId!,
        photoRightId: block.photoRightId!,
        ratio: block.ratio,
      };
    case "triptych":
      return { id: block.id, blockType: "triptych", photoIds: block.photoIds };
    case "insetPortrait":
      return {
        id: block.id,
        blockType: "insetPortrait",
        photoId: block.photoId!,
        textDe: richTextOrUndefined(block.textDe),
        textEn: richTextOrUndefined(block.textEn),
      };
    case "sequence":
      return {
        id: block.id,
        blockType: "sequence",
        photoIds: block.photoIds,
        captionDe: trimmedOrUndefined(block.captionDe),
        captionEn: trimmedOrUndefined(block.captionEn),
      };
    case "pullQuote":
      return {
        id: block.id,
        blockType: "pullQuote",
        quoteDe: block.quoteDe.trim(),
        quoteEn: trimmedOrUndefined(block.quoteEn),
        attributionDe: trimmedOrUndefined(block.attributionDe),
        attributionEn: trimmedOrUndefined(block.attributionEn),
      };
    case "textParagraph":
      return {
        id: block.id,
        blockType: "textParagraph",
        textDe: block.textDe!,
        textEn: richTextOrUndefined(block.textEn),
      };
  }
}

const BLOCK_TYPES = Object.keys(BLOCK_TYPE_KEYS) as DraftBlock["blockType"][];

export function StoryContentForm({
  content,
  photos,
  adminUrl,
}: {
  content: StudioStoryContent;
  photos: StudioPhoto[];
  adminUrl: string;
}) {
  const t = useTranslations("studio");
  const router = useRouter();
  const [blocks, setBlocks] = useState<DraftBlock[]>(() => content.blocks.map(toDraft));
  const [summaryDe, setSummaryDe] = useState<RichTextValue | undefined>(
    (content.summaryDe ?? undefined) as RichTextValue | undefined,
  );
  const [summaryEn, setSummaryEn] = useState<RichTextValue | undefined>(
    (content.summaryEn ?? undefined) as RichTextValue | undefined,
  );
  const [coverPhotoId, setCoverPhotoId] = useState<number | null>(content.coverPhotoId);
  const [saving, setSaving] = useState(false);

  const allPhotosComplete = blocks.every(photosComplete);
  const allTextComplete = blocks.every(textComplete);
  const canSave = allPhotosComplete && allTextComplete;

  function replaceBlock(clientKey: string, next: DraftBlock) {
    setBlocks((current) => current.map((block) => (block.clientKey === clientKey ? next : block)));
  }

  function moveBlock(index: number, delta: -1 | 1) {
    setBlocks((current) => {
      const target = index + delta;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  }

  function removeBlock(clientKey: string) {
    setBlocks((current) => current.filter((block) => block.clientKey !== clientKey));
  }

  async function save() {
    if (saving || !canSave) return;
    setSaving(true);
    const result = await updateStoryContentAction({
      id: content.id,
      coverPhotoId,
      summaryDe: richTextOrUndefined(summaryDe),
      summaryEn: richTextOrUndefined(summaryEn),
      blocks: blocks.map(toInput),
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
      <PhotoPickerSingle
        photos={photos}
        value={coverPhotoId}
        onChange={setCoverPhotoId}
        label={t("coverLabel")}
        allowEmpty
      />
      <div className="space-y-3">
        <span className="text-ink-muted block text-xs">{t("summaryLabel")}</span>
        <RichTextLocaleField
          label={t("textDe")}
          value={summaryDe}
          onChange={setSummaryDe}
          adminUrl={adminUrl}
        />
        <RichTextLocaleField
          label={t("textEn")}
          value={summaryEn}
          onChange={setSummaryEn}
          adminUrl={adminUrl}
        />
      </div>
      {blocks.length === 0 ? (
        <p className="text-ink-muted text-sm">{t("blocksEmpty")}</p>
      ) : (
        <ul className="space-y-4">
          {blocks.map((block, index) => (
            <li key={block.clientKey}>
              <BlockEditor
                block={block}
                photos={photos}
                onChange={(next) => replaceBlock(block.clientKey, next)}
                onMoveUp={() => moveBlock(index, -1)}
                onMoveDown={() => moveBlock(index, 1)}
                onRemove={() => removeBlock(block.clientKey)}
                canMoveUp={index > 0}
                canMoveDown={index < blocks.length - 1}
                adminUrl={adminUrl}
              />
            </li>
          ))}
        </ul>
      )}
      <div className="text-sm">
        <span className="text-ink-muted mb-2 block text-xs">{t("addBlock")}</span>
        <div className="flex flex-wrap gap-2">
          {BLOCK_TYPES.map((blockType) => (
            <button
              key={blockType}
              type="button"
              onClick={() => setBlocks((current) => [...current, emptyDraft(blockType)])}
              className={buttonClass}
            >
              {t(BLOCK_TYPE_KEYS[blockType])}
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
        {!allPhotosComplete ? <p className="text-ink-muted text-sm">{t("photoMissing")}</p> : null}
        {!allTextComplete ? <p className="text-ink-muted text-sm">{t("textMissing")}</p> : null}
      </div>
    </div>
  );
}
