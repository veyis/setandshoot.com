"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type DragEvent } from "react";
import { useTranslations } from "next-intl";
import { MAX_UPLOAD_BYTES } from "@/lib/studio/schemas";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/avif"];

type QueueItem = {
  name: string;
  status: "pending" | "uploading" | "done" | "error" | "tooLarge" | "unsupported";
};

type Watermark = "none" | "light" | "standard";

export function PhotoUpload({ defaultWatermark = false }: { defaultWatermark?: boolean }) {
  const t = useTranslations("studio");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [watermark, setWatermark] = useState<Watermark>(defaultWatermark ? "standard" : "none");

  async function uploadFiles(files: File[]) {
    if (busy || files.length === 0) return;
    setBusy(true);
    setQueue(files.map((file) => ({ name: file.name, status: "pending" })));

    // One file per request: large originals + Sharp processing can approach
    // serverless time limits, so never batch.
    for (let i = 0; i < files.length; i += 1) {
      if (!ALLOWED_MIME.includes(files[i]!.type)) {
        setQueue((q) =>
          q.map((item, idx) => (idx === i ? { ...item, status: "unsupported" } : item)),
        );
        continue;
      }
      if (files[i]!.size > MAX_UPLOAD_BYTES) {
        setQueue((q) => q.map((item, idx) => (idx === i ? { ...item, status: "tooLarge" } : item)));
        continue;
      }
      setQueue((q) => q.map((item, idx) => (idx === i ? { ...item, status: "uploading" } : item)));
      const form = new FormData();
      form.append("file", files[i]!);
      form.append("watermark", watermark);
      let newStatus: QueueItem["status"] = "error";
      try {
        const response = await fetch("/api/studio/upload", { method: "POST", body: form });
        if (response.ok) {
          newStatus = "done";
        } else if (response.status === 413) {
          newStatus = "tooLarge";
        } else if (response.status === 415) {
          newStatus = "unsupported";
        }
      } catch {
        newStatus = "error";
      }
      setQueue((q) => q.map((item, idx) => (idx === i ? { ...item, status: newStatus } : item)));
    }

    setBusy(false);
    router.refresh();
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    void uploadFiles(Array.from(event.dataTransfer.files));
  }

  return (
    <section className="mb-10">
      <h2 className="font-display mb-3 text-xl tracking-tight">{t("uploadTitle")}</h2>
      <label className="text-ink-muted mb-3 flex items-center gap-2 text-sm">
        {t("watermarkFieldLabel")}
        <select
          value={watermark}
          disabled={busy}
          onChange={(event) => setWatermark(event.target.value as Watermark)}
          className="border-hairline rounded-md border bg-transparent px-2 py-1"
        >
          <option value="none">{t("watermarkNone")}</option>
          <option value="light">{t("watermarkLight")}</option>
          <option value="standard">{t("watermarkStandard")}</option>
        </select>
      </label>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        className="border-hairline text-ink-muted hover:text-ink focus:ring-accent cursor-pointer rounded-md border border-dashed p-8 text-center text-sm transition-colors outline-none focus:ring-2"
      >
        {busy ? t("uploading") : t("uploadHint")}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="hidden"
          onChange={(event) => {
            void uploadFiles(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
      </div>
      {queue.length > 0 ? (
        <ul className="mt-3 space-y-1 text-sm">
          {queue.map((item, index) => (
            <li key={`${item.name}-${index}`} className="flex justify-between gap-4">
              <span className="truncate">{item.name}</span>
              <span className="text-ink-muted shrink-0">
                {item.status === "done"
                  ? t("uploadDone")
                  : item.status === "error"
                    ? t("uploadError")
                    : item.status === "tooLarge"
                      ? t("uploadTooLarge")
                      : item.status === "unsupported"
                        ? t("uploadUnsupported")
                        : item.status === "uploading"
                          ? t("uploading")
                          : "…"}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
