"use client";

import "./hero-motion.css";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ScrollCue } from "@/components/landing/scroll-cue";
import { usePinnedScene } from "@/components/motion/use-pinned-scene";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import type { ResolvedLandingPhoto } from "@/lib/landing/photos";
import { HeroPhotoStack } from "./HeroPhotoStack";
import { HeroSlateFrame } from "./HeroSlateFrame";

type Props = {
  photos: ResolvedLandingPhoto[];
  name: string;
  tagline: string;
  cameraSpec: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
  scrollCueLabel: string;
  mastheadLeft: string;
  mastheadCounter: string;
  /** Hold per photo in ms; default 6500. */
  intervalMs?: number;
};

const DEFAULT_INTERVAL_MS = 6500;

/**
 * Cinematic rotating hero — full-bleed crossfade between photos, each with a
 * unique Ken Burns trajectory (variant 1–4, rotated by index). Pauses when
 * out of viewport. Honors `prefers-reduced-motion` (no rotation, no zoom).
 */
export function HeroScene({
  photos,
  name,
  tagline,
  cameraSpec,
  ctaPrimaryLabel,
  ctaPrimaryHref,
  ctaSecondaryLabel,
  ctaSecondaryHref,
  scrollCueLabel,
  mastheadLeft,
  mastheadCounter,
  intervalMs = DEFAULT_INTERVAL_MS,
}: Props) {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [inView, setInView] = useState(true);
  usePinnedScene({ pin: sectionRef, end: "+=100%" });

  const hasMultiple = photos.length > 1;

  // Pause rotation when the hero scrolls off-screen.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setInView(entry.isIntersecting);
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Crossfade rotation.
  useEffect(() => {
    if (!hasMultiple || reducedMotion || !inView) return;
    const id = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % photos.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [hasMultiple, reducedMotion, inView, photos.length, intervalMs]);

  return (
    <section
      ref={sectionRef}
      className="hero-scene bg-canvas relative flex w-full items-end overflow-hidden"
      style={{ minHeight: "80vh", height: "100dvh" }}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      data-active-index={activeIndex}
    >
      <HeroPhotoStack photos={photos} activeIndex={activeIndex} />

      {/* Bottom scrim for text legibility */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-3/5"
        style={{
          backgroundImage:
            "linear-gradient(to top, rgba(11,14,19,0.95) 0%, rgba(11,14,19,0.55) 40%, transparent 75%)",
        }}
      />
      {/* Top fade so the header doesn't fight the photo */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-32"
        style={{
          backgroundImage: "linear-gradient(to bottom, rgba(11,14,19,0.5) 0%, transparent 100%)",
        }}
      />

      <HeroSlateFrame
        current={activeIndex + 1}
        total={photos.length}
        mastheadLeft={mastheadLeft}
        mastheadCounterTemplate={mastheadCounter}
        intervalMs={intervalMs}
        reducedMotion={reducedMotion}
      />

      <div className="relative z-10 flex w-full flex-col gap-5 p-6 pb-28 md:gap-6 md:p-12 md:pb-24">
        <h1 className="hero-name font-display text-[clamp(3rem,11vw,11rem)] leading-[0.92] tracking-tight">
          {name}
        </h1>
        <p className="hero-tagline text-ink max-w-prose font-sans text-base md:text-lg">
          {tagline}
        </p>
        <p className="hero-camera text-ink-faint font-mono text-[11px] tracking-[0.18em] uppercase">
          {cameraSpec}
        </p>
        <div className="hero-ctas flex flex-wrap gap-3 pt-2 md:gap-4">
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
