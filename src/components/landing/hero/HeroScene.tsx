"use client";

import "./hero-motion.css";

import { useEffect, useRef, useState } from "react";
import { ScrollCue } from "@/components/landing/scroll-cue";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";
import type { ResolvedLandingPhoto } from "@/lib/landing/photos";
import { HeroCoverTitle } from "./HeroCoverTitle";
import { HeroPhotoStack } from "./HeroPhotoStack";
import { HeroSlateFrame } from "./HeroSlateFrame";
import { HeroStickyCTA } from "./HeroStickyCTA";

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
  const [tabVisible, setTabVisible] = useState(
    typeof document === "undefined" ? true : document.visibilityState !== "hidden",
  );
  const [firstLoad, setFirstLoad] = useState(true);

  const activePhoto = photos[activeIndex];
  const activeKicker = activePhoto?.kicker ?? "";
  const activeCamera = activePhoto?.cameraSpec ?? cameraSpec;
  const activeLocation = activePhoto?.location ?? "";

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

  // Pause rotation when the browser tab is hidden (visibilitychange).
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVis = () => setTabVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Crossfade rotation.
  useEffect(() => {
    if (!hasMultiple || reducedMotion || !inView || !tabVisible) return;
    const id = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % photos.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [hasMultiple, reducedMotion, inView, tabVisible, photos.length, intervalMs]);

  useEffect(() => {
    const t = window.setTimeout(() => setFirstLoad(false), 2500);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="hero-scene bg-canvas relative flex w-full items-end overflow-hidden"
      role="region"
      aria-label="Belin Akguel — sports photography hero"
      style={{ minHeight: "80vh", height: "100dvh" }}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      data-active-index={activeIndex}
      data-first-load={firstLoad ? "true" : "false"}
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

      <HeroCoverTitle
        kicker={activeKicker}
        cameraSpec={activeCamera}
        location={activeLocation}
        name={name}
        rotationKey={activeIndex}
      />
      <HeroStickyCTA
        primaryLabel={ctaPrimaryLabel}
        primaryHref={ctaPrimaryHref}
        secondaryLabel={ctaSecondaryLabel}
        secondaryHref={ctaSecondaryHref}
      />

      <ScrollCue label={scrollCueLabel} />
    </section>
  );
}
