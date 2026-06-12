import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

const cardClass =
  "border-hairline hover:bg-ink hover:text-canvas group block rounded-md border p-6 transition-colors";

const PAGES = [
  { slug: "about", nameKey: "pageAbout", path: "/about" },
  { slug: "services", nameKey: "pageServices", path: "/services" },
  { slug: "contact", nameKey: "pageContact", path: "/contact" },
  { slug: "athletes", nameKey: "pageAthletes", path: "/athletes" },
  { slug: "highlights", nameKey: "pageHighlights", path: "/highlights" },
] as const;

export default async function StudioPagesPage() {
  // Layouts render in parallel with pages — re-check here, not just in the layout.
  await requireAdmin("/studio");
  const t = await getTranslations("studio");

  return (
    <main className="grid gap-4 sm:grid-cols-2">
      {PAGES.map((page) => (
        <Link
          key={page.slug}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/studio/seiten/${page.slug}` as any}
          className={cardClass}
        >
          <h2 className="font-display text-xl tracking-tight">{t(page.nameKey)}</h2>
          <p className="text-ink-muted group-hover:text-canvas/70 mt-1 font-mono text-xs">
            {page.path}
          </p>
        </Link>
      ))}
    </main>
  );
}
