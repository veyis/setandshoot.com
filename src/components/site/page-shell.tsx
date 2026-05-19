import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** default max-w-3xl; use wide for grids */
  width?: "narrow" | "wide";
};

/** Consistent inner-page layout with room for the fixed header. */
export function PageShell({ children, width = "narrow" }: Props) {
  const maxW = width === "wide" ? "max-w-6xl" : "max-w-3xl";
  return (
    <main className={`mx-auto flex ${maxW} flex-col gap-10 px-6 pt-24 pb-16 md:px-12`}>
      {children}
    </main>
  );
}
