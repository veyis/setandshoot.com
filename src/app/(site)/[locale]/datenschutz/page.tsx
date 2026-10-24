import type { Metadata } from "next";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { getPayload } from "@/lib/payload/get-payload";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/seo/alternates";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

// ISR: rebuilt hourly; the datenschutz global revalidate hook busts on save.
export const revalidate = 3600;

// Legal pages need distinct metadata and a self-referencing canonical.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : defaultLocale;
  return {
    title: safeLocale === "de" ? "Datenschutz" : "Privacy Policy",
    description: safeLocale === "de"
      ? "Datenschutzerklärung der Fotografie-Website von Belin Akguel."
      : "Privacy policy for Belin Akguel’s photography website.",
    alternates: localeAlternates("/datenschutz", safeLocale),
  };
}

export default async function DatenschutzPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const payload = await getPayload();
  const data = await payload.findGlobal({ slug: "datenschutz", locale });

  const dateLocale = locale === "de" ? "de-DE" : "en-GB";
  const updatedLabel = locale === "de" ? "Stand" : "Last updated";

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-tight">{data.title ?? "Datenschutz"}</h1>
      {data.intro ? (
        <div className="prose prose-invert mt-8 max-w-none">
          <RichText data={data.intro as never} />
        </div>
      ) : (
        <p className="text-ink-muted mt-8 text-sm">
          Inhalte werden im Admin unter Globals → Datenschutzerklärung gepflegt.
        </p>
      )}
      {data.body ? (
        <div className="prose prose-invert mt-8 max-w-none">
          <RichText data={data.body as never} />
        </div>
      ) : null}
      {data.lastUpdated ? (
        <p className="text-ink-muted mt-12 text-xs">
          {updatedLabel}: {new Date(data.lastUpdated).toLocaleDateString(dateLocale)}
        </p>
      ) : null}
    </main>
  );
}
