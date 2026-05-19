"use client";

import { useEffect, type RefObject } from "react";
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

export function usePinnedScene({ pin, trigger, end = "+=300%", scrub = false }: Options) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    if (!pin.current) return;
    const triggerEl = trigger?.current ?? pin.current;
    if (!triggerEl) return;

    const st = ScrollTrigger.create({
      trigger: triggerEl,
      start: "top top",
      end,
      pin: pin.current,
      scrub,
      anticipatePin: 1,
    });

    return () => {
      st.kill();
    };
  }, [reducedMotion, pin, trigger, end, scrub]);
}
