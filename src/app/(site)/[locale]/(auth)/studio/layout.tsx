import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

const navLinkClass =
  "border-hairline text-ink hover:bg-ink hover:text-canvas inline-flex rounded-sm border px-3 py-1.5 font-mono text-xs tracking-[0.15em] uppercase transition-colors";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  // Defense in depth: the proxy already gates /studio, but layouts must not
  // trust middleware alone.
  await requireAdmin("/studio");
  const t = await getTranslations("studio");

  return (
    <div className="mx-auto max-w-5xl px-4 pt-32 pb-16">
      <header className="mb-10">
        <h1 className="font-display text-3xl tracking-tight">{t("title")}</h1>
        <p className="text-ink-muted mt-1 text-sm">{t("subtitle")}</p>
        <nav className="mt-5 flex flex-wrap gap-3">
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={"/studio" as any}
            className={navLinkClass}
          >
            {t("navOverview")}
          </Link>
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={"/studio/stories" as any}
            className={navLinkClass}
          >
            {t("navStories")}
          </Link>
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={"/studio/fotos" as any}
            className={navLinkClass}
          >
            {t("navPhotos")}
          </Link>
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={"/studio/anfragen" as any}
            className={navLinkClass}
          >
            {t("navBookings")}
          </Link>
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={"/admin" as any}
            className={navLinkClass}
          >
            {t("advancedEditor")} ↗
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
