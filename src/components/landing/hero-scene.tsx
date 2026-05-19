"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LandingImage } from "@/components/landing/landing-image";
import { ScrollCue } from "@/components/landing/scroll-cue";
import { usePinnedScene } from "@/components/motion/use-pinned-scene";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import type { ResolvedLandingPhoto } from "@/lib/landing/photos";

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
      {photos.length > 0 && (
        <div className="hero-photo-stack absolute inset-0">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="hero-photo absolute inset-0"
              data-active={index === activeIndex ? "true" : "false"}
              data-variant={(index % 4) + 1}
              aria-hidden={index !== activeIndex}
            >
              <LandingImage
                photo={photo}
                sizes="100vw"
                priority={index === 0}
                className="size-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

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

      <div className="relative z-10 flex w-full flex-col gap-5 p-6 pb-20 md:gap-6 md:p-12 md:pb-24">
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

      {/* Dot indicators — only when more than one photo */}
      {hasMultiple && (
        <div className="hero-dots absolute right-4 bottom-6 z-10 flex items-center gap-1 md:right-12 md:bottom-12 md:gap-2">
          {photos.map((photo, index) => {
            const active = index === activeIndex;
            return (
              <button
                key={photo.id}
                type="button"
                aria-label={`Show photo ${index + 1} of ${photos.length}`}
                aria-current={active}
                onClick={() => setActiveIndex(index)}
                className="group relative flex h-11 w-11 items-center justify-center"
              >
                <span
                  aria-hidden
                  className={[
                    "block rounded-full border transition-all duration-300",
                    active
                      ? "border-accent bg-accent h-2 w-8"
                      : "border-ink/40 bg-ink/20 group-hover:bg-ink/40 h-1.5 w-1.5",
                  ].join(" ")}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Progress bar pinned to the very bottom edge */}
      {hasMultiple && !reducedMotion && (
        <div className="hero-progress bg-ink/10 pointer-events-none absolute inset-x-0 bottom-0 z-10 h-px">
          <div
            key={`${activeIndex}-${intervalMs}`}
            className="hero-progress-fill bg-accent h-full"
            style={{ animationDuration: `${intervalMs}ms` }}
          />
        </div>
      )}

      <ScrollCue label={scrollCueLabel} />
    </section>
  );
}
