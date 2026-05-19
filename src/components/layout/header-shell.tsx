"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";

type Props = { children: ReactNode };

export function HeaderShell({ children }: Props) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      const delta = y - lastY.current;
      // Keep header visible while the hero (pinned, ~100dvh) is in view.
      if (y < window.innerHeight) {
        setHidden(false);
      } else if (delta > 4) {
        setHidden(true);
      } else if (delta < -4) {
        setHidden(false);
      }
      lastY.current = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="header-shell border-hairline bg-canvas/90 fixed top-0 right-0 left-0 z-50 flex items-center justify-between border-b px-6 py-4 backdrop-blur"
      data-hidden={hidden && !reducedMotion ? "true" : "false"}
    >
      {children}
    </header>
  );
}
