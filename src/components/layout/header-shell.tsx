"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "@/components/motion/use-reduced-motion";

type Props = { children: ReactNode };

const HIDE_THRESHOLD_PX = 80;

export function HeaderShell({ children }: Props) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (y < HIDE_THRESHOLD_PX) {
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
      className="header-shell border-hairline bg-canvas/90 fixed top-0 right-0 left-0 z-40 flex items-center justify-between border-b px-6 py-4 backdrop-blur"
      data-hidden={hidden && !reducedMotion ? "true" : "false"}
    >
      {children}
    </header>
  );
}
