import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-start justify-center px-6 py-24">
      <p
        className="text-ink-faint font-mono text-[10px] tracking-[0.2em] uppercase"
        aria-hidden="true"
      >
        404
      </p>
      <h1 className="font-display mt-4 text-5xl tracking-tight md:text-6xl">{t("title")}</h1>
      <p className="text-ink-muted mt-6 max-w-prose text-base leading-relaxed">{t("body")}</p>
      <Link
         
        href={"/" as any}
        className="border-hairline text-ink hover:bg-ink hover:text-canvas mt-10 inline-flex w-fit rounded-sm border px-5 py-2.5 font-mono text-xs tracking-[0.15em] uppercase transition-colors"
      >
        {t("home")}
      </Link>
    </main>
  );
}
