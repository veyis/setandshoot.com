"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

// text-base keeps inputs at 16px so iOS Safari doesn't auto-zoom on focus.
const fieldClass =
  "border-hairline bg-canvas focus:ring-accent w-full rounded-sm border px-3 py-2 text-base outline-none focus:ring-2";

const buttonClass =
  "border-hairline text-ink hover:bg-ink hover:text-canvas inline-flex rounded-sm border px-3 py-1.5 font-mono text-xs tracking-[0.15em] uppercase transition-colors disabled:opacity-50";

export type TaxonomyColumn = {
  key: string;
  label: string;
  kind: "text" | "select";
  options?: { value: string; label: string }[];
  required?: boolean;
};

export type TaxonomyRowData = {
  id: number;
  published: boolean;
  values: Record<string, string>;
};

// Structurally matches StoryActionResult (actions/shared.ts is server-only,
// so the client redeclares the shape).
type ActionResult =
  | { ok: true; id?: number }
  | { ok: false; error: "forbidden" | "validation" | "server" | "slug_taken" };

type DraftRow = { id?: number; published: boolean; values: Record<string, string> };

function emptyValues(columns: TaxonomyColumn[]): Record<string, string> {
  return Object.fromEntries(columns.map((column) => [column.key, ""]));
}

function rowComplete(columns: TaxonomyColumn[], row: DraftRow): boolean {
  return columns.every(
    (column) => !column.required || (row.values[column.key] ?? "").trim() !== "",
  );
}

/** Empty-trimmed text → undefined; empty select → null (clears the field). */
function toInput(columns: TaxonomyColumn[], row: DraftRow): Record<string, unknown> {
  const data: Record<string, unknown> = { published: row.published };
  if (row.id) data.id = row.id;
  for (const column of columns) {
    const value = (row.values[column.key] ?? "").trim();
    if (column.kind === "select") {
      data[column.key] = value === "" ? null : value;
    } else {
      data[column.key] = value === "" ? undefined : value;
    }
  }
  return data;
}

function RowFields({
  columns,
  row,
  onChange,
}: {
  columns: TaxonomyColumn[];
  row: DraftRow;
  onChange: (values: Record<string, string>) => void;
}) {
  return (
    <>
      {columns.map((column) => (
        <label key={column.key} className="block min-w-36 flex-1 text-sm">
          <span className="text-ink-muted mb-1 block text-xs">{column.label}</span>
          {column.kind === "select" ? (
            <select
              value={row.values[column.key] ?? ""}
              onChange={(event) => onChange({ ...row.values, [column.key]: event.target.value })}
              className={fieldClass}
            >
              <option value="">—</option>
              {(column.options ?? []).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={row.values[column.key] ?? ""}
              onChange={(event) => onChange({ ...row.values, [column.key]: event.target.value })}
              className={fieldClass}
            />
          )}
        </label>
      ))}
    </>
  );
}

export function TaxonomyTable({
  collection,
  columns,
  rows,
  saveAction,
  deleteAction,
}: {
  collection: "teams" | "competitions" | "tags";
  columns: TaxonomyColumn[];
  rows: TaxonomyRowData[];
  saveAction: (input: unknown) => Promise<ActionResult>;
  deleteAction: (input: unknown) => Promise<ActionResult>;
}) {
  const t = useTranslations("studio");
  const router = useRouter();
  const [drafts, setDrafts] = useState<DraftRow[]>(() =>
    rows.map((row) => ({ id: row.id, published: row.published, values: { ...row.values } })),
  );
  const [addRow, setAddRow] = useState<DraftRow>(() => ({
    published: true,
    values: emptyValues(columns),
  }));
  const [busy, setBusy] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  function replaceDraft(index: number, next: DraftRow) {
    setDrafts((current) => current.map((row, i) => (i === index ? next : row)));
  }

  async function save(row: DraftRow, index: number | null) {
    if (busy || !rowComplete(columns, row)) return;
    setBusy(true);
    const result = await saveAction(toInput(columns, row));
    setBusy(false);
    if (result.ok) {
      toast.success(t("saved"));
      if (index === null && typeof result.id === "number") {
        // The add row becomes a persisted row; reset the add row.
        setDrafts((current) => [...current, { ...row, id: result.id }]);
        setAddRow({ published: true, values: emptyValues(columns) });
      }
      router.refresh();
    } else if (!result.ok && result.error === "slug_taken") {
      toast.error(t("slugTaken"));
    } else {
      toast.error(t("saveError"));
    }
  }

  async function remove(id: number) {
    if (busy) return;
    if (confirmingId !== id) {
      setConfirmingId(id);
      return;
    }
    setBusy(true);
    const result = await deleteAction({ collection, id });
    setBusy(false);
    setConfirmingId(null);
    if (result.ok) {
      setDrafts((current) => current.filter((row) => row.id !== id));
      router.refresh();
    } else {
      toast.error(t("saveError"));
    }
  }

  return (
    <div className="space-y-3">
      {drafts.length === 0 ? <p className="text-ink-muted text-sm">{t("entriesEmpty")}</p> : null}
      <ul className="space-y-3">
        {drafts.map((row, index) => (
          <li
            key={row.id}
            className="border-hairline flex flex-wrap items-end gap-3 rounded-md border p-3"
          >
            <RowFields
              columns={columns}
              row={row}
              onChange={(values) => replaceDraft(index, { ...row, values })}
            />
            <label className="flex items-center gap-2 pb-2 text-sm">
              <input
                type="checkbox"
                checked={row.published}
                onChange={(event) =>
                  replaceDraft(index, { ...row, published: event.target.checked })
                }
              />
              {t("published")}
            </label>
            <div className="flex gap-2 pb-1">
              <button
                type="button"
                onClick={() => void save(row, index)}
                disabled={busy || !rowComplete(columns, row)}
                className={buttonClass}
              >
                {t("save")}
              </button>
              <button
                type="button"
                onClick={() => void remove(row.id!)}
                disabled={busy}
                className={buttonClass}
              >
                {confirmingId === row.id ? t("confirmDelete") : t("deleteEntry")}
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="border-hairline flex flex-wrap items-end gap-3 rounded-md border border-dashed p-3">
        <RowFields
          columns={columns}
          row={addRow}
          onChange={(values) => setAddRow({ ...addRow, values })}
        />
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            checked={addRow.published}
            onChange={(event) => setAddRow({ ...addRow, published: event.target.checked })}
          />
          {t("published")}
        </label>
        <div className="pb-1">
          <button
            type="button"
            onClick={() => void save(addRow, null)}
            disabled={busy || !rowComplete(columns, addRow)}
            className={buttonClass}
          >
            {t("addEntry")}
          </button>
        </div>
      </div>
    </div>
  );
}
