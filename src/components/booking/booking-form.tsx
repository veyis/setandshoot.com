"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import type { Locale } from "@/lib/i18n/config";

type FormState = "idle" | "submitting" | "success" | "error";

// text-base keeps inputs at 16px so iOS Safari doesn't auto-zoom on focus.
const fieldClass =
  "border-hairline bg-canvas focus:ring-accent w-full rounded-sm border px-3 py-2 text-base outline-none focus:ring-2";

export function BookingForm() {
  const t = useTranslations("booking");
  const locale = useLocale() as Locale;
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "submitting") return;
    setState("submitting");
    setErrorMessage(null);

    const form = event.currentTarget;
    const data = new FormData(form);

    const payload = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      organization: String(data.get("organization") ?? "") || undefined,
      message: String(data.get("message") ?? ""),
      company: String(data.get("company") ?? ""),
      locale,
    };

    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let body: { error?: string } = {};
      try {
        body = (await response.json()) as { error?: string };
      } catch {
        // Non-JSON response (proxy timeout, 502, etc.) — fall through to the
        // generic error below.
      }

      if (!response.ok) {
        setState("error");
        setErrorMessage(body.error ?? t("errorGeneric"));
        return;
      }

      setState("success");
      form.reset();
    } catch {
      setState("error");
      setErrorMessage(t("errorGeneric"));
    }
  }

  if (state === "success") {
    return (
      <div
        className="border-hairline bg-elevated rounded-sm border p-8"
        data-testid="booking-success"
        role="status"
      >
        <p className="font-display text-2xl">{t("successTitle")}</p>
        <p className="text-ink-muted mt-3 text-sm">{t("successBody")}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border-hairline bg-elevated flex max-w-xl flex-col gap-5 rounded-sm border p-8"
      data-testid="booking-form"
      noValidate
    >
      {/* Honeypot: hidden from users, only bots fill it. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="booking-company">Company</label>
        <input id="booking-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="booking-name" className="text-sm">
          {t("name")}
        </label>
        <input
          id="booking-name"
          name="name"
          type="text"
          required
          aria-required="true"
          autoComplete="name"
          disabled={state === "submitting"}
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="booking-email" className="text-sm">
          {t("email")}
        </label>
        <input
          id="booking-email"
          name="email"
          type="email"
          required
          aria-required="true"
          autoComplete="email"
          disabled={state === "submitting"}
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="booking-organization" className="text-sm">
          {t("organization")} <span className="text-ink-muted">({t("optional")})</span>
        </label>
        <input
          id="booking-organization"
          name="organization"
          type="text"
          autoComplete="organization"
          disabled={state === "submitting"}
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="booking-message" className="text-sm">
          {t("message")}
        </label>
        <textarea
          id="booking-message"
          name="message"
          required
          aria-required="true"
          rows={5}
          disabled={state === "submitting"}
          className={`${fieldClass} resize-y`}
        />
      </div>

      {/* Persistent live region so screen readers reliably announce errors
          injected after submit. */}
      <p
        className="text-accent text-sm empty:sr-only"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        data-testid="booking-error"
      >
        {state === "error" ? errorMessage : ""}
      </p>

      <button
        type="submit"
        disabled={state === "submitting"}
        className="bg-accent text-canvas hover:bg-accent/90 mt-2 w-fit rounded-sm px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-60"
      >
        {state === "submitting" ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
