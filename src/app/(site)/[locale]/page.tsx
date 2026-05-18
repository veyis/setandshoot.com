import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSiteBootstrap } from "@/lib/supabase/data";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const bootstrap = await getSiteBootstrap();

  return (
    <main className="flex min-h-[80vh] flex-col items-start justify-center gap-8 p-12">
      <h1 className="font-display text-7xl tracking-tight md:text-8xl">belin akguel</h1>
      <p className="text-ink-muted max-w-prose font-sans text-lg">{t("site.tagline")}</p>
      <p className="font-mono text-xs">f/2.8 · 1/2000s · ISO 6400</p>
      <div className="flex flex-wrap gap-4 pt-2">
        <Link
          href="/stories"
          className="bg-accent text-canvas hover:bg-accent/90 rounded-sm px-5 py-2.5 text-sm font-medium transition-colors"
        >
          {t("home.ctaStories")}
        </Link>
        <Link
          href="/services"
          className="border-hairline hover:text-accent rounded-sm border px-5 py-2.5 text-sm transition-colors"
        >
          {t("home.ctaBooking")}
        </Link>
      </div>
      {process.env.NODE_ENV === "development" && (
        <p className="text-ink-muted font-mono text-xs" data-testid="supabase-bootstrap">
          {bootstrap.schemaReady
            ? t("site.supabaseReady", { version: bootstrap.foundationVersion ?? 1 })
            : bootstrap.connected
              ? t("site.supabaseNoSchema")
              : t("site.supabaseOffline")}
        </p>
      )}
    </main>
  );
}
