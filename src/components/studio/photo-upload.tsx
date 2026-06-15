"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type DragEvent } from "react";
import { useTranslations } from "next-intl";
import { ALLOWED_MIME, MAX_UPLOAD_BYTES } from "@/lib/studio/schemas";

type Status =
  | "pending"
  | "uploading"
  | "finalizing"
  | "done"
  | "error"
  | "tooLarge"
  | "unsupported";

type QueueItem = { name: string; status: Status; progress: number };

// fetch() has no upload progress, so the direct-to-R2 PUT uses XHR.
function putWithProgress(
  url: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`PUT failed (${xhr.status})`));
    xhr.onerror = () => reject(new Error("PUT failed"));
    xhr.send(file);
  });
}

export function PhotoUpload() {
  const t = useTranslations("studio");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [busy, setBusy] = useState(false);

  function update(i: number, patch: Partial<QueueItem>) {
    setQueue((q) => q.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  }

  async function uploadFiles(files: File[]) {
    if (busy || files.length === 0) return;
    setBusy(true);
    setQueue(files.map((file) => ({ name: file.name, status: "pending", progress: 0 })));

    // One file at a time: large originals + Sharp processing can approach
    // serverless time limits, so never batch.
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i]!;
      if (!ALLOWED_MIME.includes(file.type as (typeof ALLOWED_MIME)[number])) {
        update(i, { status: "unsupported" });
        continue;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        update(i, { status: "tooLarge" });
        continue;
      }
      update(i, { status: "uploading", progress: 0 });
      try {
        const presignRes = await fetch("/api/studio/upload/presign", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size }),
        });
        if (!presignRes.ok) {
          update(i, {
            status:
              presignRes.status === 413
                ? "tooLarge"
                : presignRes.status === 415
                  ? "unsupported"
                  : "error",
          });
          continue;
        }
        const { uploadUrl, tempKey } = (await presignRes.json()) as {
          uploadUrl: string;
          tempKey: string;
        };

        await putWithProgress(uploadUrl, file, (pct) => update(i, { progress: pct }));

        update(i, { status: "finalizing" });
        const finalizeRes = await fetch("/api/studio/upload/finalize", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ tempKey }),
        });
        update(i, { status: finalizeRes.ok ? "done" : "error" });
      } catch {
        update(i, { status: "error" });
      }
    }

    setBusy(false);
    router.refresh();
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    void uploadFiles(Array.from(event.dataTransfer.files));
  }

  function label(item: QueueItem): string {
    switch (item.status) {
      case "done":
        return t("uploadDone");
      case "error":
        return t("uploadError");
      case "tooLarge":
        return t("uploadTooLarge");
      case "unsupported":
        return t("uploadUnsupported");
      case "uploading":
        return `${item.progress}%`;
      case "finalizing":
        return t("finalizing");
      default:
        return "…";
    }
  }

  return (
    <section className="mb-10">
      <h2 className="font-display mb-3 text-xl tracking-tight">{t("uploadTitle")}</h2>
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
            <li key={`${item.name}-${index}`} className="flex flex-col gap-1">
              <div className="flex justify-between gap-4">
                <span className="truncate">{item.name}</span>
                <span className="text-ink-muted shrink-0">{label(item)}</span>
              </div>
              {item.status === "uploading" ? (
                <div className="bg-canvas h-1 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-accent h-full transition-[width]"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
