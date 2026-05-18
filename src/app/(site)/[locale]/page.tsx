import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSiteBootstrap } from "@/lib/supabase/data";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const bootstrap = await getSiteBootstrap();

  return (
    <main className="flex min-h-screen flex-col items-start justify-center gap-6 p-12">
      <h1 className="font-display text-7xl tracking-tight">belin akguel</h1>
      <p className="text-ink-muted font-sans">{t("site.tagline")}</p>
      <p className="font-mono text-xs">f/2.8 · 1/2000s · ISO 6400</p>
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
