"use client";

import { useRef } from "react";
import Link from "next/link";
import { LandingImage } from "@/components/landing/landing-image";
import { ScrollCue } from "@/components/landing/scroll-cue";
import { usePinnedScene } from "@/components/motion/use-pinned-scene";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import type { ResolvedLandingPhoto } from "@/lib/landing/photos";

type Props = {
  photo: ResolvedLandingPhoto | null;
  name: string;
  tagline: string;
  cameraSpec: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
  scrollCueLabel: string;
};

export function HeroScene({
  photo,
  name,
  tagline,
  cameraSpec,
  ctaPrimaryLabel,
  ctaPrimaryHref,
  ctaSecondaryLabel,
  ctaSecondaryHref,
  scrollCueLabel,
}: Props) {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  usePinnedScene({ pin: sectionRef, end: "+=100%" });
  return (
    <section
      ref={sectionRef}
      className="hero-scene bg-canvas relative flex h-screen min-h-[80vh] w-full items-end overflow-hidden"
      data-reduced-motion={reducedMotion ? "true" : "false"}
    >
      {photo ? (
        <div className="hero-photo absolute inset-0">
          <LandingImage photo={photo} sizes="100vw" priority className="size-full object-cover" />
        </div>
      ) : null}

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-1/2"
        style={{
          backgroundImage: "linear-gradient(to top, var(--bg-scrim) 0%, transparent 55%)",
        }}
      />

      <div className="relative z-10 flex w-full flex-col gap-6 p-8 md:p-12">
        <h1 className="hero-name font-display text-[clamp(4rem,12vw,12rem)] leading-[0.95] tracking-tight">
          {name}
        </h1>
        <p className="hero-tagline text-ink max-w-prose font-sans text-base md:text-lg">
          {tagline}
        </p>
        <p className="hero-camera text-ink-faint font-mono text-xs tracking-[0.15em]">
          {cameraSpec}
        </p>
        <div className="hero-ctas flex flex-wrap gap-4 pt-2">
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={ctaPrimaryHref as any}
            className="bg-accent text-canvas hover:bg-accent/90 rounded-sm px-5 py-2.5 text-sm font-medium transition-colors"
          >
            {ctaPrimaryLabel}
          </Link>
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={ctaSecondaryHref as any}
            className="border-hairline hover:text-accent rounded-sm border px-5 py-2.5 text-sm transition-colors"
          >
            {ctaSecondaryLabel}
          </Link>
        </div>
      </div>

      <ScrollCue label={scrollCueLabel} />
    </section>
  );
}
