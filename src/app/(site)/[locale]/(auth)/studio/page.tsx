import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

const cardClass =
  "border-hairline hover:bg-ink hover:text-canvas group block rounded-md border p-6 transition-colors";

export default async function StudioDashboardPage() {
  const t = await getTranslations("studio");

  return (
    <main className="grid gap-4 sm:grid-cols-2">
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
      <div className="border-hairline rounded-md border border-dashed p-6 opacity-60">
        <h2 className="font-display text-xl tracking-tight">{t("cardStoriesTitle")}</h2>
        <p className="text-ink-muted mt-1 text-sm">{t("comingSoon")}</p>
      </div>
      <div className="border-hairline rounded-md border border-dashed p-6 opacity-60">
        <h2 className="font-display text-xl tracking-tight">{t("cardPagesTitle")}</h2>
        <p className="text-ink-muted mt-1 text-sm">{t("comingSoon")}</p>
      </div>
    </main>
  );
}
