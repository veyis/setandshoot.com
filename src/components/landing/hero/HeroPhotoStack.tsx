"use client";

import { useEffect, useState } from "react";
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
 * Performance: mounts only photo 0 during initial paint so secondary slides
 * never compete with the LCP image on mobile bandwidth, then mounts remaining
 * slides after idle before the first 6.5s crossfade.
 */
export function HeroPhotoStack({ photos, activeIndex }: Props) {
  const [secondaryMounted, setSecondaryMounted] = useState(false);

  useEffect(() => {
    if (photos.length < 2) return;
    const id = window.setTimeout(() => setSecondaryMounted(true), 2500);
    return () => window.clearTimeout(id);
  }, [photos.length]);

  if (photos.length === 0) return null;

  const visiblePhotos = secondaryMounted ? photos : photos.slice(0, 1);

  return (
    <div className="hero-photo-stack absolute inset-0">
      {visiblePhotos.map((photo, index) => (
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
