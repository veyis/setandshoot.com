import type { ReactNode } from "react";

type Props = { label?: ReactNode };

export function ScrollCue({ label = "scroll" }: Props) {
  return (
    <div className="scroll-cue pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-center">
      <span aria-hidden className="scroll-cue-line mx-auto mb-2 block h-4 w-px bg-current" />
      <span className="text-ink-faint font-mono text-[10px] tracking-[0.15em] uppercase">
        {label}
      </span>
    </div>
  );
}
