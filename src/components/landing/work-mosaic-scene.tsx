import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LandingImage } from "./landing-image";
import { Reveal } from "@/components/motion/reveal";
import type { ResolvedLandingPhoto } from "@/lib/landing/photos";

type Props = { photos: ResolvedLandingPhoto[] };

/**
 * Editorial work mosaic. Asymmetric grid when there are ≥4 photos:
 *   [2×2 hero] [1×1] [1×1]   →   row band A
 *   [2×1 wide spanning full]  →   row band B
 *
 * Fewer than 3 photos → section omitted.
 * 3 photos → simple 3-column grid (no asymmetry).
 */
export async function WorkMosaicScene({ photos }: Props) {
  const t = await getTranslations("home.workMosaic");
  if (photos.length < 3) return null;

  const total = photos.length;
  const useAsymmetric = total >= 4;
  const [hero, two, three, wide] = photos;

  return (
    <section className="work-mosaic border-hairline border-t px-6 py-20 md:px-12">
      <Reveal>
        <p className="text-ink-faint mb-10 font-mono text-xs tracking-[0.2em] uppercase">
          <span className="text-ink">{t("title")}</span> · {t("seasons")} ·{" "}
          <span className="text-ink">{total}</span> {t("framesSuffix")}
        </p>
      </Reveal>

      {useAsymmetric && hero && two && three && wide ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:auto-rows-[minmax(280px,40vh)] lg:grid-cols-12 lg:gap-4">
            <Reveal className="col-span-2 lg:col-span-8 lg:row-span-2">
              <figure className="bg-elevated relative size-full overflow-hidden">
                <LandingImage
                  photo={hero}
                  sizes="(min-width: 1024px) 66vw, 100vw"
                  className="size-full object-cover"
                />
              </figure>
            </Reveal>
            <Reveal className="col-span-1 lg:col-span-4">
              <figure className="bg-elevated relative size-full overflow-hidden">
                <LandingImage
                  photo={two}
                  sizes="(min-width: 1024px) 33vw, 50vw"
                  className="size-full object-cover"
                />
              </figure>
            </Reveal>
            <Reveal className="col-span-1 lg:col-span-4">
              <figure className="bg-elevated relative size-full overflow-hidden">
                <LandingImage
                  photo={three}
                  sizes="(min-width: 1024px) 33vw, 50vw"
                  className="size-full object-cover"
                />
              </figure>
            </Reveal>
            <Reveal className="col-span-2 lg:col-span-12">
              <figure className="bg-elevated relative aspect-[16/7] w-full overflow-hidden">
                <LandingImage photo={wide} sizes="100vw" className="size-full object-cover" />
              </figure>
            </Reveal>
          </div>
          {photos.length > 4 ? (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:mt-4 lg:grid-cols-3 lg:gap-4">
              {photos.slice(4).map((p) => (
                <Reveal key={p.id}>
                  <figure className="bg-elevated relative aspect-[16/10] w-full overflow-hidden">
                    <LandingImage
                      photo={p}
                      sizes="(min-width: 1024px) 33vw, 100vw"
                      className="size-full object-cover"
                    />
                  </figure>
                </Reveal>
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {photos.map((p) => (
            <Reveal key={p.id}>
              <figure className="bg-elevated relative aspect-square w-full overflow-hidden">
                <LandingImage
                  photo={p}
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="size-full object-cover"
                />
              </figure>
            </Reveal>
          ))}
        </div>
      )}

      <Reveal>
        <Link
          href={"/highlights" as any}
          className="hover:text-accent mt-10 inline-block font-mono text-xs tracking-[0.2em] uppercase transition-colors"
        >
          {t("viewIndex")} <span aria-hidden="true">→</span>
        </Link>
      </Reveal>
    </section>
  );
}
