import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Photo } from "@/payload-types";
import { PhotoImage } from "./photo-image";

type Props = { portrait: Photo | null };

export async function AboutTeaser({ portrait }: Props) {
  const t = await getTranslations("home.about");

  return (
    <section className="border-hairline grid border-t px-6 py-16 md:px-12 lg:grid-cols-12 lg:gap-12">
      {portrait ? (
        <figure className="lg:col-span-5">
          <div className="bg-elevated relative aspect-[3/4] w-full overflow-hidden rounded-sm">
            <PhotoImage
              photo={portrait}
              sizes="(min-width: 1024px) 40vw, 90vw"
              className="object-cover saturate-[0.9]"
            />
          </div>
        </figure>
      ) : null}
      <div
        className={`flex flex-col justify-center gap-4 pt-8 lg:pt-0 ${
          portrait ? "lg:col-span-7" : "lg:col-span-12"
        }`}
      >
        <h2 className="font-display text-4xl tracking-tight md:text-5xl">{t("title")}</h2>
        <p className="text-ink max-w-prose font-sans text-base leading-relaxed">{t("body1")}</p>
        <p className="text-ink-muted max-w-prose font-sans text-base leading-relaxed">
          {t("body2")}
        </p>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={"/about" as any}
          className="hover:text-accent mt-2 inline-flex items-center text-sm transition-colors"
        >
          {t("cta")} →
        </Link>
      </div>
    </section>
  );
}
