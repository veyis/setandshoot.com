import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Photo } from "@/payload-types";
import { PhotoImage } from "./photo-image";

type Props = { backgroundPhoto: Photo | null };

export async function BookingCTA({ backgroundPhoto }: Props) {
  const t = await getTranslations("home.cta");

  return (
    <section className="relative overflow-hidden">
      {backgroundPhoto ? (
        <div className="absolute inset-0">
          <PhotoImage photo={backgroundPhoto} sizes="100vw" className="object-cover" />
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.55)" }} />
        </div>
      ) : (
        <div className="bg-elevated absolute inset-0" />
      )}
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-24 text-center md:py-32">
        <h2 className="font-display text-5xl tracking-tight md:text-6xl">{t("title")}</h2>
        <p className="text-ink-muted max-w-xl text-base">{t("subtitle")}</p>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={"/contact" as any}
          className="bg-accent text-canvas hover:bg-accent/90 mt-2 rounded-sm px-6 py-3 text-sm font-medium transition-colors"
        >
          {t("button")}
        </Link>
      </div>
    </section>
  );
}
