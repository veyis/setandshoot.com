"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

type Props = {
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

/**
 * Renders the two CTA chips. On mobile (< md) the chips live in a sticky
 * bottom bar inside the hero section, gradient-faded over the photo, sitting
 * above the iOS home indicator. On desktop they appear in-flow at bottom-left.
 *
 * Writes the bar's measured height to a CSS var `--hero-cta-h` on the section,
 * so HeroSlateFrame's progress strip can sit just above the bar on mobile.
 */
export function HeroStickyCTA({ primaryLabel, primaryHref, secondaryLabel, secondaryHref }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const section = el.closest(".hero-scene") as HTMLElement | null;
    if (!section) return;

    const apply = () => {
      if (window.matchMedia("(max-width: 767px)").matches) {
        section.style.setProperty("--hero-cta-h", `${el.offsetHeight}px`);
      } else {
        section.style.setProperty("--hero-cta-h", "0px");
      }
    };

    apply();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(apply) : null;
    ro?.observe(el);
    const onResize = () => apply();
    window.addEventListener("resize", onResize);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", onResize);
      section.style.removeProperty("--hero-cta-h");
    };
  }, []);

  return (
    <div
      ref={ref}
      data-test="hero-cta-bar"
      className="hero-cta-bar absolute right-0 bottom-0 left-0 z-[4] grid grid-cols-[1.4fr_1fr] gap-2 px-[14px] pt-3 pb-[max(22px,env(safe-area-inset-bottom))] md:right-auto md:bottom-[10%] md:left-[3%] md:flex md:gap-2 md:p-0"
    >
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={primaryHref as any}
        className="hero-cta-primary bg-accent text-canvas hover:bg-accent/90 px-4 py-3 text-center font-mono text-[10px] tracking-[0.2em] uppercase transition-colors"
      >
        {primaryLabel}
      </Link>
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={secondaryHref as any}
        className="hero-cta-ghost border-ink/45 text-ink hover:text-accent hover:border-accent border px-4 py-3 text-center font-mono text-[10px] tracking-[0.2em] uppercase transition-colors"
      >
        {secondaryLabel}
      </Link>
    </div>
  );
}
