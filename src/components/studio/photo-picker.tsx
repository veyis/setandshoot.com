"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { StudioPhoto } from "@/lib/studio/photos";

const buttonClass =
  "border-hairline text-ink hover:bg-ink hover:text-canvas inline-flex rounded-sm border px-4 py-2 font-mono text-xs tracking-[0.15em] uppercase transition-colors disabled:opacity-50";

function Thumb({ photo }: { photo: StudioPhoto }) {
  return photo.thumbUrl ? (
    <Image
      src={photo.thumbUrl}
      alt={photo.altDe || photo.filename}
      width={160}
      height={120}
      className="h-auto w-full rounded-sm object-cover"
    />
  ) : (
    <div className="border-hairline text-ink-muted flex aspect-[4/3] items-center justify-center rounded-sm border p-1 text-center text-[10px] break-all">
      {photo.filename}
    </div>
  );
}

// Panels are plain inline boxes, NOT portals/fixed overlays: the site header's
// backdrop-filter would trap position:fixed elements (see memory note).

export function PhotoPickerSingle({
  photos,
  value,
  onChange,
  label,
  allowEmpty = false,
}: {
  photos: StudioPhoto[];
  value: number | null;
  onChange: (id: number | null) => void;
  label?: string;
  allowEmpty?: boolean;
}) {
  const t = useTranslations("studio");
  const [open, setOpen] = useState(false);
  const selected = value === null ? null : (photos.find((photo) => photo.id === value) ?? null);

  return (
    <div className="text-sm">
      {label ? <span className="text-ink-muted mb-1 block text-xs">{label}</span> : null}
      {selected ? (
        <div className="mb-2 w-40">
          <Thumb photo={selected} />
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className={buttonClass}
        >
          {value === null ? t("choosePhoto") : t("changePhoto")}
        </button>
        {allowEmpty && value !== null ? (
          <button type="button" onClick={() => onChange(null)} className={buttonClass}>
            {t("removePhoto")}
          </button>
        ) : null}
      </div>
      {open ? (
        <div className="border-hairline mt-2 grid max-h-80 grid-cols-4 gap-2 overflow-y-auto rounded-md border p-2">
          {photos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => {
                onChange(photo.id);
                setOpen(false);
              }}
              aria-label={photo.altDe || photo.filename}
              aria-pressed={photo.id === value}
              className="focus:ring-accent rounded-sm outline-none focus:ring-2"
            >
              <Thumb photo={photo} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PhotoPickerMulti({
  photos,
  value,
  onChange,
  min,
  max,
  label,
}: {
  photos: StudioPhoto[];
  value: number[];
  onChange: (ids: number[]) => void;
  min: number;
  max: number;
  label: string;
}) {
  const t = useTranslations("studio");
  const [open, setOpen] = useState(false);
  const selected = value
    .map((id) => photos.find((photo) => photo.id === id))
    .filter((photo): photo is StudioPhoto => photo !== undefined);

  function toggle(id: number) {
    if (value.includes(id)) {
      onChange(value.filter((selectedId) => selectedId !== id));
    } else if (value.length < max) {
      onChange([...value, id]);
    }
  }

  return (
    <div className="text-sm">
      <span className="text-ink-muted mb-1 block text-xs">
        {label} ({value.length}/{min === max ? min : `${min}–${max}`})
      </span>
      {!open && selected.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-2">
          {selected.map((photo, index) => (
            <div key={`${photo.id}-${index}`} className="w-20">
              <Thumb photo={photo} />
            </div>
          ))}
        </div>
      ) : null}
      <button type="button" onClick={() => setOpen((current) => !current)} className={buttonClass}>
        {value.length === 0 ? t("choosePhoto") : t("changePhoto")}
      </button>
      {open ? (
        <div className="border-hairline mt-2 grid max-h-80 grid-cols-4 gap-2 overflow-y-auto rounded-md border p-2">
          {photos.map((photo) => {
            const index = value.indexOf(photo.id);
            return (
              <button
                key={photo.id}
                type="button"
                onClick={() => toggle(photo.id)}
                aria-label={photo.altDe || photo.filename}
                aria-pressed={index !== -1}
                className="focus:ring-accent relative rounded-sm outline-none focus:ring-2"
              >
                <Thumb photo={photo} />
                {index !== -1 ? (
                  <span className="bg-ink text-canvas absolute top-1 left-1 flex h-5 w-5 items-center justify-center rounded-full font-mono text-xs">
                    {index + 1}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
