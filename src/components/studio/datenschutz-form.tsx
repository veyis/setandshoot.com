"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { RichTextLocaleField } from "@/components/studio/block-editor";
import type { RichTextValue } from "@/components/studio/rich-text-mini";
import { updateDatenschutzAction } from "@/lib/studio/actions/globals";
import type { StudioDatenschutz } from "@/lib/studio/globals";
import { isSupportedRichText } from "@/lib/studio/lexical";

// text-base keeps inputs at 16px so iOS Safari doesn't auto-zoom on focus.
const fieldClass =
  "border-hairline bg-canvas focus:ring-accent w-full rounded-sm border px-3 py-2 text-base outline-none focus:ring-2";

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

export function DatenschutzForm({
  datenschutz,
  adminUrl,
}: {
  datenschutz: StudioDatenschutz;
  adminUrl: string;
}) {
  const t = useTranslations("studio");
  const [titleDe, setTitleDe] = useState(datenschutz.titleDe);
  const [titleEn, setTitleEn] = useState(datenschutz.titleEn);
  const [introDe, setIntroDe] = useState<RichTextValue | undefined>(
    (datenschutz.introDe ?? undefined) as RichTextValue | undefined,
  );
  const [introEn, setIntroEn] = useState<RichTextValue | undefined>(
    (datenschutz.introEn ?? undefined) as RichTextValue | undefined,
  );
  const [bodyDe, setBodyDe] = useState<RichTextValue | undefined>(
    (datenschutz.bodyDe ?? undefined) as RichTextValue | undefined,
  );
  const [bodyEn, setBodyEn] = useState<RichTextValue | undefined>(
    (datenschutz.bodyEn ?? undefined) as RichTextValue | undefined,
  );
  const [lastUpdated, setLastUpdated] = useState(datenschutz.lastUpdated);
  const [saving, setSaving] = useState(false);

  const requiredComplete = titleDe.trim() !== "" && lastUpdated !== "";

  async function save() {
    if (saving || !requiredComplete) return;
    setSaving(true);
    const result = await updateDatenschutzAction({
      titleDe: titleDe.trim(),
      titleEn: titleEn.trim() === "" ? undefined : titleEn.trim(),
      introDe: richTextOrUndefined(introDe),
      introEn: richTextOrUndefined(introEn),
      bodyDe: richTextOrUndefined(bodyDe),
      bodyEn: richTextOrUndefined(bodyEn),
      lastUpdated,
    });
    setSaving(false);
    if (result.ok) {
      toast.success(t("saved"));
    } else {
      toast.error(t("saveError"));
    }
  }

  return (
    <div className="border-hairline space-y-4 rounded-md border p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-ink-muted mb-1 block text-xs">{t("titleLabel")} (DE)</span>
          <input
            value={titleDe}
            onChange={(event) => setTitleDe(event.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="block text-sm">
          <span className="text-ink-muted mb-1 block text-xs">{t("titleLabel")} (EN)</span>
          <input
            value={titleEn}
            onChange={(event) => setTitleEn(event.target.value)}
            className={fieldClass}
          />
        </label>
      </div>
      <div className="space-y-3">
        <span className="text-ink-muted block text-xs">{t("introLabel")}</span>
        <RichTextLocaleField
          label={t("textDe")}
          value={introDe}
          onChange={setIntroDe}
          adminUrl={adminUrl}
        />
        <RichTextLocaleField
          label={t("textEn")}
          value={introEn}
          onChange={setIntroEn}
          adminUrl={adminUrl}
        />
      </div>
      <div className="space-y-3">
        <span className="text-ink-muted block text-xs">{t("contentTitle")}</span>
        <RichTextLocaleField
          label={t("textDe")}
          value={bodyDe}
          onChange={setBodyDe}
          adminUrl={adminUrl}
        />
        <RichTextLocaleField
          label={t("textEn")}
          value={bodyEn}
          onChange={setBodyEn}
          adminUrl={adminUrl}
        />
      </div>
      <label className="block text-sm sm:max-w-48">
        <span className="text-ink-muted mb-1 block text-xs">{t("lastUpdatedLabel")}</span>
        <input
          type="date"
          value={lastUpdated}
          onChange={(event) => setLastUpdated(event.target.value)}
          className={fieldClass}
        />
      </label>
      <button
        type="button"
        onClick={() => void save()}
        disabled={saving || !requiredComplete}
        className={buttonClass}
      >
        {saving ? t("saving") : t("save")}
      </button>
    </div>
  );
}
