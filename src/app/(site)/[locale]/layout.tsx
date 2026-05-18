import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale, locales } from "@/lib/i18n/config";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AuthUIProvider } from "@/components/auth/auth-ui-provider";

export const metadata: Metadata = {
  title: "Belin Akguel — Volleyball-Fotografie",
  description: "Cinematic volleyball photography from Bremen.",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AuthUIProvider>
        <Header />
        {children}
        <Footer />
      </AuthUIProvider>
    </NextIntlClientProvider>
  );
}
