"use client";

import { useLayoutEffect, type RefObject } from "react";
import { useReducedMotion } from "./use-reduced-motion";

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
 * GSAP is loaded on demand so unused pin scenes never pay the ~60KB cost
 * on the homepage critical path.
 */
export function usePinnedScene({ pin, trigger, end = "+=300%", scrub = false }: Options) {
  const reducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    if (reducedMotion) return;

    const pinEl = pin.current;
    if (!pinEl) return;
    const triggerEl = trigger?.current ?? pinEl;

    let cancelled = false;
    let scrollTrigger: { kill: (reset?: boolean) => void } | undefined;
    let ctx: { revert: () => void } | undefined;

    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);
        ctx = gsap.context(() => {
          scrollTrigger = ScrollTrigger.create({
            trigger: triggerEl,
            start: "top top",
            end,
            pin: pinEl,
            scrub,
            anticipatePin: 1,
          });
        });
      },
    );

    return () => {
      cancelled = true;
      scrollTrigger?.kill(true);
      ctx?.revert();
      unwrapPinSpacer(pinEl);
    };
  }, [reducedMotion, pin, trigger, end, scrub]);
}
