import type { Metadata } from "next";
import { getPayload } from "@/lib/payload/get-payload";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/seo/alternates";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

// ISR: rebuilt hourly; the impressum global revalidate hook busts on save.
export const revalidate = 3600;

// Legal pages carry no seoCopy entry, so they inherit the layout's title and
// description. They still need a self-referencing canonical — without one
// Search Console reports them as "Duplicate without user-selected canonical".
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : defaultLocale;
  return { alternates: localeAlternates("/impressum", safeLocale) };
}

export default async function ImpressumPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const payload = await getPayload();
  const data = await payload.findGlobal({ slug: "impressum", locale });

  if (!data.legalName) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-display text-5xl tracking-tight">Impressum</h1>
        <p className="text-ink-muted mt-8 text-sm">
          Inhalte werden im Admin unter Globals → Impressum gepflegt.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-tight">Impressum</h1>
      <dl className="mt-10 space-y-6 text-sm leading-relaxed">
        <div>
          <dt className="text-ink-muted">Anbieter</dt>
          <dd>{data.legalName}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Anschrift</dt>
          <dd>
            {data.addressLine1}
            {data.addressLine2 ? (
              <>
                <br />
                {data.addressLine2}
              </>
            ) : null}
            <br />
            {data.postalCode} {data.city}
            <br />
            {data.country}
          </dd>
        </div>
        <div>
          <dt className="text-ink-muted">Kontakt</dt>
          <dd>
            <a href={`mailto:${data.email}`} className="hover:text-accent transition-colors">
              {data.email}
            </a>
            {data.phone ? (
              <>
                <br />
                {data.phone}
              </>
            ) : null}
          </dd>
        </div>
        {data.ustIdNr ? (
          <div>
            <dt className="text-ink-muted">USt-IdNr.</dt>
            <dd>{data.ustIdNr}</dd>
          </div>
        ) : null}
        {data.responsibleForContent ? (
          <div>
            <dt className="text-ink-muted">Verantwortlich i.S.d. § 18 Abs. 2 MStV</dt>
            <dd>{data.responsibleForContent}</dd>
          </div>
        ) : null}
        {data.additionalNotes ? (
          <div>
            <dt className="text-ink-muted">Hinweise</dt>
            <dd className="whitespace-pre-wrap">{data.additionalNotes}</dd>
          </div>
        ) : null}
      </dl>
    </main>
  );
}
