"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import * as Sentry from "@sentry/nextjs";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-start justify-center px-6 py-24">
      <h1 className="font-display text-5xl tracking-tight md:text-6xl">{t("title")}</h1>
      <p className="text-ink-muted mt-6 max-w-prose text-base leading-relaxed">{t("body")}</p>
      <button
        type="button"
        onClick={reset}
        className="border-hairline text-ink hover:bg-ink hover:text-canvas mt-10 inline-flex w-fit rounded-sm border px-5 py-2.5 font-mono text-xs tracking-[0.15em] uppercase transition-colors"
      >
        {t("retry")}
      </button>
    </main>
  );
}
