import Link from "next/link";
import type { Route } from "next";
import { RichText } from "@payloadcms/richtext-lexical/react";
import type { AboutPage } from "@/payload-types";
import type { Locale } from "@/lib/i18n/config";
import { LandingImage } from "@/components/landing/landing-image";
import { PayloadPhoto } from "@/components/story/payload-photo";
import { resolvePhoto } from "@/lib/payload/media";
import { getAboutFallbackPhoto } from "@/lib/landing/photos";

type Props = {
  sections: AboutPage["sections"];
  locale: Locale;
};

export function MarketingBlocks({ sections, locale }: Props) {
  if (!sections?.length) return null;

  return (
    <>
      {sections.map((block, index) => {
        const key = block.id ?? `${block.blockType}-${index}`;

        switch (block.blockType) {
          case "pageHeader":
            return (
              <header key={key} className="flex flex-col gap-4">
                {block.label ? (
                  <p className="text-ink-muted font-mono text-xs tracking-widest uppercase">
                    {block.label}
                  </p>
                ) : null}
                <h1 className="font-display text-5xl tracking-tight md:text-6xl">{block.title}</h1>
                {block.intro ? (
                  <p className="text-ink-muted max-w-prose text-base leading-relaxed">
                    {block.intro}
                  </p>
                ) : null}
              </header>
            );

          case "portraitFigure": {
            const picked = resolvePhoto(block.photo);
            return (
              <div key={key}>
                <figure className="bg-elevated relative aspect-[4/5] w-full max-w-md overflow-hidden">
                  {picked ? (
                    <PayloadPhoto
                      photo={picked}
                      size="feed"
                      className="size-full object-cover saturate-[0.92]"
                    />
                  ) : (
                    <LandingImage
                      photo={getAboutFallbackPhoto(locale)}
                      sizes="(min-width: 768px) 400px, 90vw"
                      className="size-full object-cover saturate-[0.92]"
                    />
                  )}
                </figure>
                {block.caption ? (
                  <figcaption className="text-ink-faint mt-2 font-mono text-[10px] tracking-[0.15em] uppercase">
                    {block.caption}
                  </figcaption>
                ) : null}
              </div>
            );
          }

          case "editorialProse":
            return (
              <div key={key} className="flex flex-col gap-8">
                {block.eyebrow ? (
                  <p className="text-ink-faint font-mono text-xs tracking-[0.2em] uppercase">
                    {block.eyebrow}
                  </p>
                ) : null}
                {block.title ? (
                  <h2 className="font-display text-[clamp(1.75rem,3vw,2.75rem)] leading-[1.15] tracking-tight whitespace-pre-line italic">
                    {block.title}
                  </h2>
                ) : null}
                {block.body1 ? (
                  <div className="prose prose-sm text-ink max-w-prose">
                    <RichText data={block.body1 as never} />
                  </div>
                ) : null}
                {block.pullQuote ? (
                  <blockquote className="border-hairline text-ink-faint font-display border-l pl-6 text-2xl italic">
                    {block.pullQuote}
                  </blockquote>
                ) : null}
                {block.body2 ? (
                  <div className="prose prose-sm text-ink-muted max-w-prose">
                    <RichText data={block.body2 as never} />
                  </div>
                ) : null}
                {block.credits ? (
                  <div className="text-ink-faint flex flex-col gap-1 font-mono text-[10px] tracking-[0.15em] uppercase">
                    {block.credits
                      .split("\n")
                      .filter(Boolean)
                      .map((line, i) => (
                        <span key={i}>{line}</span>
                      ))}
                  </div>
                ) : null}
              </div>
            );

          case "ctaLink":
            return (
              <Link
                key={key}
                href={(block.target ?? "/contact") as Route}
                className="text-accent hover:text-accent/90 w-fit text-sm font-medium transition-colors"
              >
                {block.label} →
              </Link>
            );

          case "serviceOffers": {
            const items = block.items ?? [];
            if (!items.length) return null;
            return (
              <section key={key} className="grid gap-4">
                {items.map((offer, i) => (
                  <article
                    key={offer.id ?? i}
                    className="border-hairline flex flex-col gap-2 rounded-sm border px-4 py-4"
                  >
                    <h3 className="font-display text-xl tracking-tight">{offer.title}</h3>
                    <p className="text-ink-muted text-sm leading-relaxed">{offer.body}</p>
                  </article>
                ))}
              </section>
            );
          }

          default:
            return null;
        }
      })}
    </>
  );
}
