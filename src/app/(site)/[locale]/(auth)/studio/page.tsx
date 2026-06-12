import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

const cardClass =
  "border-hairline hover:bg-ink hover:text-canvas group block rounded-md border p-6 transition-colors";

export default async function StudioDashboardPage() {
  const t = await getTranslations("studio");

  return (
    <main>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={"/studio/fotos" as any}
          className={cardClass}
        >
          <h2 className="font-display text-xl tracking-tight">{t("cardPhotosTitle")}</h2>
          <p className="text-ink-muted group-hover:text-canvas/70 mt-1 text-sm">
            {t("cardPhotosBody")}
          </p>
        </Link>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={"/studio/anfragen" as any}
          className={cardClass}
        >
          <h2 className="font-display text-xl tracking-tight">{t("cardBookingsTitle")}</h2>
          <p className="text-ink-muted group-hover:text-canvas/70 mt-1 text-sm">
            {t("cardBookingsBody")}
          </p>
        </Link>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={"/studio/stories" as any}
          className={cardClass}
        >
          <h2 className="font-display text-xl tracking-tight">{t("cardStoriesTitle")}</h2>
          <p className="text-ink-muted group-hover:text-canvas/70 mt-1 text-sm">
            {t("cardStoriesBody")}
          </p>
        </Link>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={"/studio/seiten" as any}
          className={cardClass}
        >
          <h2 className="font-display text-xl tracking-tight">{t("cardPagesTitle")}</h2>
          <p className="text-ink-muted group-hover:text-canvas/70 mt-1 text-sm">
            {t("cardPagesBody")}
          </p>
        </Link>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
        {(
          [
            { href: "/studio/stammdaten", label: t("navTaxonomies") },
            { href: "/studio/rechtliches", label: t("navLegal") },
            { href: "/studio/einstellungen", label: t("navSettings") },
          ] as const
        ).map((link) => (
          <Link
            key={link.href}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={link.href as any}
            className="text-ink-muted hover:text-ink text-sm underline underline-offset-4 transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </main>
  );
}
