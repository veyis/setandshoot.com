"use client";

import { useEffect } from "react";
import { LandingImage } from "@/components/landing/landing-image";
import type { ResolvedLandingPhoto } from "@/lib/landing/photos";

type Props = {
  photos: ResolvedLandingPhoto[];
  activeIndex: number;
};

/**
 * Full-bleed photo stack with Dissolve + Depth (opacity + blur) transition
 * driven entirely by CSS via `data-active` and `data-variant` attributes.
 * The variant index assigns each photo a Ken Burns trajectory (1..4).
 *
 * Performance: priority-loads photo 0, preloads the next photo in queue
 * via a transient `<link rel="preload">` on every active-index change so
 * the dissolve never reveals a half-decoded image.
 */
export function HeroPhotoStack({ photos, activeIndex }: Props) {
  // Preload the next photo on every rotation tick.
  useEffect(() => {
    if (photos.length < 2) return;
    const next = photos[(activeIndex + 1) % photos.length];
    if (!next) return;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = next.src;
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, [activeIndex, photos]);

  if (photos.length === 0) return null;

  return (
    <div className="hero-photo-stack absolute inset-0">
      {photos.map((photo, index) => (
        <div
          key={photo.id}
          className="hero-photo absolute inset-0"
          data-photo-id={photo.id}
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
  );
}
