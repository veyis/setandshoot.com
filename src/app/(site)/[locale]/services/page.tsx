import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";
import { BookingForm } from "@/components/booking/booking-form";
import { PageShell } from "@/components/site/page-shell";
import { EditablePageHeader } from "@/components/site/editable-page-header";

// ISR: rebuilt hourly; the servicesPage global revalidate hook busts on save.
export const revalidate = 3600;

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("services");

  const offers = [
    { title: t("offers.0.title"), body: t("offers.0.body") },
    { title: t("offers.1.title"), body: t("offers.1.body") },
    { title: t("offers.2.title"), body: t("offers.2.body") },
  ];

  return (
    <PageShell>
      <EditablePageHeader
        slug="servicesPage"
        locale={locale as Locale}
        fallback={
          <>
            <header className="flex flex-col gap-4">
              <h1 className="font-display text-5xl tracking-tight md:text-6xl">{t("title")}</h1>
              <p className="text-ink-muted max-w-prose text-base leading-relaxed">{t("intro")}</p>
            </header>
            <section className="grid gap-4">
              {offers.map((offer) => (
                <article
                  key={offer.title}
                  className="border-hairline flex flex-col gap-2 rounded-sm border px-4 py-4"
                >
                  <h2 className="font-display text-xl tracking-tight">{offer.title}</h2>
                  <p className="text-ink-muted text-sm leading-relaxed">{offer.body}</p>
                </article>
              ))}
            </section>
          </>
        }
      />

      <section className="flex flex-col gap-6">
        <h2 className="font-display text-2xl">{t("bookingHeading")}</h2>
        <BookingForm />
      </section>
    </PageShell>
  );
}
