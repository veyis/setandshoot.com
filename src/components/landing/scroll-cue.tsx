import type { ReactNode } from "react";

type Props = { label?: ReactNode };

export function ScrollCue({ label = "scroll" }: Props) {
  return (
    <div className="scroll-cue text-ink-muted pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 text-center md:bottom-6">
      <span aria-hidden className="scroll-cue-line mx-auto mb-2 block h-4 w-px bg-current" />
      <span className="font-mono text-[10px] tracking-[0.15em] uppercase">{label}</span>
    </div>
  );
}
