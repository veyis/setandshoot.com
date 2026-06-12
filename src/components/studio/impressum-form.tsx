"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { updateImpressumAction } from "@/lib/studio/actions/globals";
import type { StudioImpressum } from "@/lib/studio/globals";

// text-base keeps inputs at 16px so iOS Safari doesn't auto-zoom on focus.
const fieldClass =
  "border-hairline bg-canvas focus:ring-accent w-full rounded-sm border px-3 py-2 text-base outline-none focus:ring-2";

const buttonClass =
  "border-hairline text-ink hover:bg-ink hover:text-canvas inline-flex rounded-sm border px-4 py-2 font-mono text-xs tracking-[0.15em] uppercase transition-colors disabled:opacity-50";

function trimmedOrUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

export function ImpressumForm({ impressum }: { impressum: StudioImpressum }) {
  const t = useTranslations("studio");
  const [legalName, setLegalName] = useState(impressum.legalName);
  const [addressLine1, setAddressLine1] = useState(impressum.addressLine1);
  const [addressLine2, setAddressLine2] = useState(impressum.addressLine2 ?? "");
  const [postalCode, setPostalCode] = useState(impressum.postalCode);
  const [city, setCity] = useState(impressum.city);
  const [country, setCountry] = useState(impressum.country);
  const [email, setEmail] = useState(impressum.email);
  const [phone, setPhone] = useState(impressum.phone ?? "");
  const [ustIdNr, setUstIdNr] = useState(impressum.ustIdNr ?? "");
  const [responsibleForContent, setResponsibleForContent] = useState(
    impressum.responsibleForContent ?? "",
  );
  const [additionalNotesDe, setAdditionalNotesDe] = useState(impressum.additionalNotesDe ?? "");
  const [additionalNotesEn, setAdditionalNotesEn] = useState(impressum.additionalNotesEn ?? "");
  const [saving, setSaving] = useState(false);

  const requiredComplete =
    legalName.trim() !== "" &&
    addressLine1.trim() !== "" &&
    postalCode.trim() !== "" &&
    city.trim() !== "" &&
    country.trim() !== "" &&
    email.trim() !== "";

  async function save() {
    if (saving || !requiredComplete) return;
    setSaving(true);
    const result = await updateImpressumAction({
      legalName: legalName.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: trimmedOrUndefined(addressLine2),
      postalCode: postalCode.trim(),
      city: city.trim(),
      country: country.trim(),
      email: email.trim(),
      phone: trimmedOrUndefined(phone),
      ustIdNr: trimmedOrUndefined(ustIdNr),
      responsibleForContent: trimmedOrUndefined(responsibleForContent),
      additionalNotesDe: trimmedOrUndefined(additionalNotesDe),
      additionalNotesEn: trimmedOrUndefined(additionalNotesEn),
    });
    setSaving(false);
    if (result.ok) {
      toast.success(t("saved"));
    } else {
      toast.error(t("saveError"));
    }
  }

  const fields: { label: string; value: string; onChange: (value: string) => void }[] = [
    { label: t("legalNameLabel"), value: legalName, onChange: setLegalName },
    { label: t("addressLine1Label"), value: addressLine1, onChange: setAddressLine1 },
    { label: t("addressLine2Label"), value: addressLine2, onChange: setAddressLine2 },
    { label: t("postalCodeLabel"), value: postalCode, onChange: setPostalCode },
    { label: t("cityLabel"), value: city, onChange: setCity },
    { label: t("countryLabel"), value: country, onChange: setCountry },
    { label: t("emailLabel"), value: email, onChange: setEmail },
    { label: t("phoneLabel"), value: phone, onChange: setPhone },
    { label: t("ustIdNrLabel"), value: ustIdNr, onChange: setUstIdNr },
    {
      label: t("responsibleLabel"),
      value: responsibleForContent,
      onChange: setResponsibleForContent,
    },
  ];

  return (
    <div className="border-hairline space-y-4 rounded-md border p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.label} className="block text-sm">
            <span className="text-ink-muted mb-1 block text-xs">{field.label}</span>
            <input
              value={field.value}
              onChange={(event) => field.onChange(event.target.value)}
              className={fieldClass}
            />
          </label>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-ink-muted mb-1 block text-xs">{t("notesDeLabel")}</span>
          <textarea
            value={additionalNotesDe}
            onChange={(event) => setAdditionalNotesDe(event.target.value)}
            className={`${fieldClass} min-h-24`}
          />
        </label>
        <label className="block text-sm">
          <span className="text-ink-muted mb-1 block text-xs">{t("notesEnLabel")}</span>
          <textarea
            value={additionalNotesEn}
            onChange={(event) => setAdditionalNotesEn(event.target.value)}
            className={`${fieldClass} min-h-24`}
          />
        </label>
      </div>
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
