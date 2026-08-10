import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function BookingCTA() {
  const t = await getTranslations("home.cta");

  return (
    <section className="booking-cta border-hairline bg-canvas border-t px-6 py-32 md:px-12 md:py-40">
      <div className="flex max-w-3xl flex-col gap-8">
        <p className="font-mono text-xs tracking-[0.2em] uppercase">
          <span className="text-accent">●</span>{" "}
          <span className="text-ink-faint">{t("eyebrow")}</span>
        </p>
        <h2 className="font-display text-[clamp(2.5rem,7vw,6rem)] leading-[0.95] whitespace-pre-line">
          {t("title").replace(" / ", "\n")}
        </h2>
        <p className="text-ink max-w-[42ch] font-sans text-base leading-relaxed">{t("body")}</p>
        <p className="text-ink-faint font-mono text-[10px] tracking-[0.15em] uppercase">
          {t("detail")}
        </p>
        <div className="mt-2 flex flex-col gap-2">
          <Link
             
            href={"/contact" as any}
            className="cta-primary hover:text-accent hover:border-accent inline-flex w-fit items-center gap-3 border-b border-current pb-1 font-mono text-xs tracking-[0.2em] uppercase transition-colors"
          >
            <span>{t("primary")}</span>
            <span aria-hidden className="cta-arrow transition-transform">
              →
            </span>
          </Link>
          <p className="text-ink-faint font-mono text-[10px] tracking-[0.15em] uppercase">
            {t("secondaryPrefix")}{" "}
            <a
              href={`mailto:${t("secondaryEmail")}`}
              className="hover:text-accent transition-colors"
            >
              {t("secondaryEmail")}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
