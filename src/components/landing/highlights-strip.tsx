import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Photo } from "@/payload-types";
import { PhotoImage } from "./photo-image";

type Props = { photos: Photo[] };

export async function HighlightsStrip({ photos }: Props) {
  const t = await getTranslations("home.highlights");
  if (photos.length < 3) return null;

  return (
    <section className="border-hairline border-t px-6 py-16 md:px-12">
      <div className="flex items-end justify-between pb-8">
        <div>
          <h2 className="font-display text-4xl tracking-tight md:text-5xl">{t("title")}</h2>
          <p className="text-ink-muted mt-2 font-mono text-xs tracking-widest uppercase">
            {t("subtitle")}
          </p>
        </div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={"/highlights" as any}
          className="text-ink-muted hover:text-ink text-sm transition-colors"
        >
          {t("viewAll")} →
        </Link>
      </div>
      <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
        {photos.map((photo) => (
          <figure
            key={photo.id}
            className="ring-hairline hover:ring-accent group relative aspect-square w-[60vw] flex-shrink-0 snap-start overflow-hidden rounded-sm ring-1 transition-all hover:ring-2 lg:w-auto"
          >
            <PhotoImage
              photo={photo}
              sizes="(min-width: 1024px) 25vw, 60vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </figure>
        ))}
      </div>
    </section>
  );
}
