"use client";

import { useLayoutEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "./use-reduced-motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Options = {
  pin: RefObject<HTMLElement | null>;
  trigger?: RefObject<HTMLElement | null>;
  end?: string;
  scrub?: boolean;
};

/** Restore a GSAP pin-spacer wrapper before React tries to unmount the pinned node. */
function unwrapPinSpacer(el: HTMLElement) {
  const spacer = el.parentElement;
  if (!spacer?.classList.contains("pin-spacer")) return;
  const parent = spacer.parentElement;
  if (!parent) return;
  parent.insertBefore(el, spacer);
  spacer.remove();
}

/**
 * Pins an element for a scroll distance via GSAP ScrollTrigger.
 * Cleanup runs in useLayoutEffect so pin-spacer wrappers are reverted
 * synchronously before React unmounts — avoids removeChild NotFoundError.
 */
export function usePinnedScene({ pin, trigger, end = "+=300%", scrub = false }: Options) {
  const reducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    if (reducedMotion) return;

    const pinEl = pin.current;
    if (!pinEl) return;
    const triggerEl = trigger?.current ?? pinEl;

    let scrollTrigger: ScrollTrigger | undefined;

    const ctx = gsap.context(() => {
      scrollTrigger = ScrollTrigger.create({
        trigger: triggerEl,
        start: "top top",
        end,
        pin: pinEl,
        scrub,
        anticipatePin: 1,
      });
    });

    return () => {
      scrollTrigger?.kill(true);
      ctx.revert();
      unwrapPinSpacer(pinEl);
    };
  }, [reducedMotion, pin, trigger, end, scrub]);
}
