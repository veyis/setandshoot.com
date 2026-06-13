import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale, defaultLocale } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { seoCopy } from "@/lib/seo/copy";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { notFound } from "next/navigation";
import { BookingForm } from "@/components/booking/booking-form";
import { PageShell } from "@/components/site/page-shell";
import { EditablePageHeader } from "@/components/site/editable-page-header";

// ISR: rebuilt hourly; the contactPage global revalidate hook busts on save.
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : defaultLocale;
  const copy = seoCopy(safeLocale, "contact");
  return buildPageMetadata({ locale: safeLocale, path: "/contact", ...copy });
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("contact");

  return (
    <PageShell>
      <EditablePageHeader
        slug="contactPage"
        locale={locale as Locale}
        fallback={
          <header className="flex flex-col gap-4">
            <h1 className="font-display text-5xl tracking-tight md:text-6xl">{t("title")}</h1>
            <p className="text-ink-muted max-w-prose text-base leading-relaxed">{t("intro")}</p>
          </header>
        }
      />
      <section className="flex flex-col gap-6">
        <h2 className="font-display text-2xl">{t("bookingHeading")}</h2>
        <BookingForm />
      </section>
    </PageShell>
  );
}
