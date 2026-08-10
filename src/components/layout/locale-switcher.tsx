"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { locales, type Locale } from "@/lib/i18n/config";

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const switchTo = (next: Locale) => {
    if (next === locale) return;
    const stripped = pathname.replace(/^\/(de|en)(?=\/|$)/, "");
    const target = next === "de" ? stripped || "/" : `/${next}${stripped || ""}`;
     
    startTransition(() => router.replace(target as any));
  };

  return (
    <nav aria-label={t("language")} className="flex items-center gap-2 text-xs uppercase">
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => switchTo(l)}
          disabled={pending || l === locale}
          aria-current={l === locale ? "true" : undefined}
          className={l === locale ? "text-ink" : "text-ink-muted hover:text-ink transition-colors"}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </nav>
  );
}
