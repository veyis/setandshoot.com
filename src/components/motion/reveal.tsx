"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "./use-reduced-motion";

type Props = {
  children: ReactNode;
  delay?: number;
  className?: string;
  threshold?: number;
};

export function Reveal({ children, delay = 0, className, threshold = 0.15 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (revealed) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (delay > 0) {
              timer = setTimeout(() => setRevealed(true), delay);
            } else {
              setRevealed(true);
            }
            observer.disconnect();
          }
        }
      },
      { threshold },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [delay, threshold, revealed]);

  return (
    <div
      ref={ref}
      data-revealed={revealed ? "true" : "false"}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      className={["reveal", className].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
}
