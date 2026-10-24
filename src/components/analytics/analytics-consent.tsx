"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Clarity } from "@/components/analytics/clarity";
import type { Locale } from "@/lib/i18n/config";

const STORAGE_KEY = "setandshoot-analytics-consent-v1";
const OPEN_EVENT = "setandshoot:open-privacy-settings";
const CHANGE_EVENT = "setandshoot:analytics-consent-change";
type Choice = "loading" | "unset" | "accepted" | "rejected";
let sessionChoice: Choice = "unset";

function readChoice(): Choice {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "accepted" || stored === "rejected" ? stored : sessionChoice;
  } catch {
    return sessionChoice;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

const copy = {
  de: {
    heading: "Optionale Analyse",
    body: "Wir möchten Google Analytics, Vercel Analytics und Speed Insights sowie gegebenenfalls Microsoft Clarity nutzen, um Nutzung und Fehler zu verstehen. Ohne Zustimmung bleibt die Website nutzbar.",
    accept: "Analyse erlauben",
    reject: "Ablehnen",
  },
  en: {
    heading: "Optional analytics",
    body: "We would like to use Google Analytics, Vercel Analytics and Speed Insights, and possibly Microsoft Clarity, to understand use and errors. The site works if you decline.",
    accept: "Allow analytics",
    reject: "Decline",
  },
} as const;

export function PrivacySettingsButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
      className="text-ink-muted hover:text-ink focus-visible:outline-[var(--accent-signal)] w-fit cursor-pointer text-left font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
    >
      {label}
    </button>
  );
}

export function AnalyticsConsent({ locale, clarityId }: { locale: Locale; clarityId?: string }) {
  const choice = useSyncExternalStore(subscribe, readChoice, () => "loading");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const open = () => setShowSettings(true);
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, []);

  function save(next: "accepted" | "rejected") {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Keep the choice for this visit when storage is unavailable.
    }
    sessionChoice = next;
    setShowSettings(false);
    window.dispatchEvent(new Event(CHANGE_EVENT));
    if (choice === "accepted" && next === "rejected") window.location.reload();
  }

  const t = copy[locale];
  return (
    <>
      {choice === "accepted" && (
        <>
          <Script src="https://www.googletagmanager.com/gtag/js?id=G-GT5YK23462" strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-GT5YK23462');`}
          </Script>
          <Analytics />
          <SpeedInsights />
          <Clarity clarityId={clarityId} />
        </>
      )}
      {(choice === "unset" || showSettings) && (
        <section
          aria-labelledby="analytics-consent-heading"
          className="bg-elevated border-hairline fixed inset-x-0 bottom-0 z-50 border-t px-6 py-5 shadow-2xl md:px-12"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-8">
            <div className="max-w-2xl">
              <h2 id="analytics-consent-heading" className="font-display text-xl text-ink">{t.heading}</h2>
              <p className="text-ink-muted mt-2 text-sm leading-relaxed">{t.body}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <button
                type="button"
                onClick={() => save("rejected")}
                className="border-hairline text-ink hover:bg-canvas focus-visible:outline-[var(--accent-signal)] min-h-11 cursor-pointer border px-4 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97]"
              >
                {t.reject}
              </button>
              <button
                type="button"
                onClick={() => save("accepted")}
                className="bg-[var(--accent-signal)] text-canvas hover:opacity-90 focus-visible:outline-[var(--accent-signal)] min-h-11 cursor-pointer px-4 py-2 text-sm font-medium transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97]"
              >
                {t.accept}
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
