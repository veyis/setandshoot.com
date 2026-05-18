"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { locales, type Locale } from "@/lib/i18n/config";

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const switchTo = (next: Locale) => {
    if (next === locale) return;
    const stripped = pathname.replace(/^\/(de|en)(?=\/|$)/, "");
    const target = next === "de" ? stripped || "/" : `/${next}${stripped || ""}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    startTransition(() => router.replace(target as any));
  };

  return (
    <nav aria-label="Sprache umschalten" className="flex items-center gap-2 text-xs uppercase">
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => switchTo(l)}
          disabled={pending}
          aria-current={l === locale ? "true" : undefined}
          className={l === locale ? "text-ink" : "text-ink-muted hover:text-ink transition-colors"}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </nav>
  );
}
