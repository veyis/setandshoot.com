import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookingForm } from "@/components/booking/booking-form";

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("services");

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-16 md:px-12">
      <header className="flex flex-col gap-4">
        <h1 className="font-display text-5xl tracking-tight md:text-6xl">{t("title")}</h1>
        <p className="text-ink-muted max-w-prose text-base">{t("intro")}</p>
      </header>

      <section className="flex flex-col gap-6">
        <h2 className="font-display text-2xl">{t("bookingHeading")}</h2>
        <BookingForm />
      </section>
    </main>
  );
}
