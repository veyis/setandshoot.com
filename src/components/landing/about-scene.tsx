import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LandingImage } from "./landing-image";
import { Reveal } from "@/components/motion/reveal";
import type { ResolvedLandingPhoto } from "@/lib/landing/photos";

type Props = { portrait: ResolvedLandingPhoto };

export async function AboutScene({ portrait }: Props) {
  const t = await getTranslations("home.about");

  return (
    <section className="about-scene border-hairline border-t px-6 py-20 md:px-12">
      <div className="grid lg:grid-cols-12 lg:gap-12">
        {/* Left — sticky portrait */}
        <figure className="lg:col-span-5">
          <div className="about-portrait bg-elevated relative aspect-[3/4] w-full overflow-hidden lg:sticky lg:top-12 lg:aspect-[3/4]">
            <LandingImage
              photo={portrait}
              sizes="(min-width: 1024px) 42vw, 90vw"
              className="size-full object-cover saturate-[0.92]"
            />
          </div>
          <figcaption className="text-ink-faint mt-3 font-mono text-[10px] tracking-[0.15em] uppercase">
            {t("cameraCaption")}
          </figcaption>
        </figure>

        {/* Right — scrolling body */}
        <div className="flex flex-col justify-center gap-8 pt-12 lg:col-span-7 lg:min-h-[150vh] lg:pt-0">
          <Reveal>
            <p className="text-ink-faint font-mono text-xs tracking-[0.2em] uppercase">
              {t("eyebrow")}
            </p>
          </Reveal>
          <Reveal delay={120}>
            <h2 className="font-display text-[clamp(1.75rem,3vw,3rem)] leading-[1.15] tracking-tight whitespace-pre-line italic">
              {t("title").replace(" / ", "\n")}
            </h2>
          </Reveal>
          <Reveal delay={240}>
            <p className="text-ink max-w-prose font-sans text-base leading-relaxed">{t("body1")}</p>
          </Reveal>
          <Reveal delay={360}>
            <blockquote className="border-hairline text-ink-faint font-display border-l pl-6 text-2xl italic">
              {t("pullQuote")}
            </blockquote>
          </Reveal>
          <Reveal delay={480}>
            <p className="text-ink-muted max-w-prose font-sans text-base leading-relaxed">
              {t("body2")}
            </p>
          </Reveal>
          <Reveal delay={600}>
            <div className="text-ink-faint mt-4 flex flex-col gap-1 font-mono text-[10px] tracking-[0.15em] uppercase">
              <span>{t("publications")}</span>
              <span>{t("clients")}</span>
              <span>{t("availability")}</span>
            </div>
          </Reveal>
          <Reveal delay={720}>
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={"/about" as any}
              className="hover:text-accent inline-flex w-fit items-center text-sm transition-colors"
            >
              {t("cta")} →
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
