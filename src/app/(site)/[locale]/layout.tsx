import "@/app/globals.css";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { isLocale, locales, defaultLocale, type Locale } from "@/lib/i18n/config";
import { env } from "@/env";
import { fraunces, inter, jetbrainsMono } from "@/lib/design/fonts";
import { JsonLd } from "@/components/seo/json-ld";
import { personSchema, webSiteSchema } from "@/lib/seo/schema";
import { getOrgIdentity } from "@/lib/seo/identity";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { LenisProvider } from "@/components/motion/lenis-provider";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const SITE_META: Record<Locale, { title: string; description: string }> = {
  de: {
    title: "Belin Akguel — Volleyball-Fotografie",
    description: "Cinematische Volleyball-Fotografie aus Bremen.",
  },
  en: {
    title: "Belin Akguel — Volleyball Photography",
    description: "Cinematic volleyball photography from Bremen.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = SITE_META[isLocale(locale) ? locale : defaultLocale];
  return {
    metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
    // Brand the HTML <title> once for every page (child pages set a bare topic
    // string). The og-card route reads seoCopy directly, so cards stay unbranded.
    title: { default: meta.title, template: "%s — Belin Akguel" },
    description: meta.description,
    verification: {
      google: "googleb238538e402fae05",
    },
  };
}

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
  // Required for static rendering with next-intl; reads the param, not the
  // request, so pages under this layout can be statically prerendered (ISR).
  setRequestLocale(locale);

  const org = await getOrgIdentity();
  const siteUrl = env.NEXT_PUBLIC_SITE_URL;

  const messages = await getMessages();
  const t = await getTranslations("nav");

  return (
    <html
      lang={locale}
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} dark`}
      suppressHydrationWarning
    >
      <body>
        <JsonLd data={personSchema({ siteUrl, org })} />
        <JsonLd data={webSiteSchema({ siteUrl })} />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <LenisProvider>
            <a
              href="#main-content"
              className="focus:border-hairline focus:bg-canvas focus:text-ink sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-sm focus:border focus:px-4 focus:py-2"
            >
              {t("skipToContent")}
            </a>
            <Header />
            <div id="main-content" tabIndex={-1} className="outline-none">
              {children}
            </div>
            <Footer />
          </LenisProvider>
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
