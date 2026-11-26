"use client";

import { useEffect, type ReactNode } from "react";
import { useReducedMotion } from "./use-reduced-motion";

/**
 * Smooth-scroll via Lenis. The library is imported only after mount so it
 * never competes with the LCP image on the critical path.
 */
export function LenisProvider({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    let cancelled = false;
    let frame = 0;
    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;

    const start = window.setTimeout(() => {
      void import("lenis").then(({ default: Lenis }) => {
        if (cancelled) return;
        lenis = new Lenis({ lerp: 0.08 });
        function raf(time: number) {
          lenis?.raf(time);
          frame = window.requestAnimationFrame(raf);
        }
        frame = window.requestAnimationFrame(raf);
      });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(start);
      window.cancelAnimationFrame(frame);
      lenis?.destroy();
    };
  }, [reducedMotion]);

  return <>{children}</>;
}
