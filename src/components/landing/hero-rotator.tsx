"use client";

import Image from "next/image";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";

export type HeroPhoto = {
  id: number;
  alt: string;
  src: string;
  srcSet?: string;
  width?: number;
  height?: number;
};

type Props = {
  photos: HeroPhoto[];
  overlay: ReactNode;
  intervalMs?: number;
};

const DEFAULT_INTERVAL_MS = 6_000;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener?.("change", callback);
  return () => mq.removeEventListener?.("change", callback);
}

function getReducedMotionSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getReducedMotionServerSnapshot(): boolean {
  return false;
}

export function HeroRotator({ photos, overlay, intervalMs = DEFAULT_INTERVAL_MS }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  useEffect(() => {
    if (reducedMotion || photos.length <= 1) return;
    const id = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % photos.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [reducedMotion, photos.length, intervalMs]);

  return (
    <section
      className="bg-canvas relative flex h-screen min-h-[80vh] w-full items-end overflow-hidden"
      data-testid="hero-rotator"
    >
      <span data-testid="hero-active-index" className="sr-only">
        {activeIndex}
      </span>
      {photos.map((photo, index) => (
        <div
          key={photo.id}
          aria-hidden={index !== activeIndex}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === activeIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="100vw"
            priority={index === 0}
            fetchPriority={index === 0 ? "high" : "low"}
            className="object-cover"
          />
        </div>
      ))}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
        style={{
          backgroundImage: "linear-gradient(to top, rgba(11,14,19,0.85), rgba(11,14,19,0) 100%)",
        }}
      />
      <div className="relative z-10 w-full p-8 md:p-12">{overlay}</div>
      {photos.length > 1 && (
        <div className="absolute right-6 bottom-6 z-10 flex gap-2">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              aria-label={`Show photo ${index + 1}`}
              aria-current={index === activeIndex}
              onClick={() => setActiveIndex(index)}
              className={`border-ink/40 h-2 w-2 rounded-full border transition-colors ${
                index === activeIndex ? "bg-accent" : "bg-ink/20 hover:bg-ink/40"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
