"use client";

import { useRef, type ReactNode } from "react";
import { usePinnedScene } from "@/components/motion/use-pinned-scene";

type Props = {
  children: ReactNode;
  /** ScrollTrigger end, default "+=300%". */
  end?: string;
};

/** Pins its child via usePinnedScene. Single-purpose. */
export function PinnedCover({ children, end = "+=300%" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  usePinnedScene({ pin: ref, end });
  return <div ref={ref}>{children}</div>;
}
