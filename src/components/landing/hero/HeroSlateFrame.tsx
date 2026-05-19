"use client";

type Props = {
  current: number; // 1-indexed
  total: number;
  mastheadLeft: string;
  /** Pattern with {current} and {total} placeholders. */
  mastheadCounterTemplate: string;
  intervalMs: number;
  reducedMotion: boolean;
};

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatCounter(template: string, current: number, total: number): string {
  return template.replace("{current}", pad(current)).replace("{total}", pad(total));
}

/**
 * Letterbox bars (desktop ≥ md), top hairline (mobile),
 * masthead row, and the hairline progress strip on the top edge of
 * the bottom letterbox bar. Mobile renders no bars; the progress strip
 * uses a CSS variable (--hero-cta-h) set by HeroStickyCTA in a later
 * task to position itself just above the sticky CTA bar.
 */
export function HeroSlateFrame({
  current,
  total,
  mastheadLeft,
  mastheadCounterTemplate,
  intervalMs,
  reducedMotion,
}: Props) {
  // Always render the progress element when there are 2+ photos; the CSS in
  // hero-motion.css disables the fill animation under prefers-reduced-motion.
  // reducedMotion is kept in the API for future use (e.g. dimming variations).
  void reducedMotion;
  const showProgress = total > 1;

  return (
    <>
      {/* Desktop letterbox bars */}
      <div className="hero-bar-top pointer-events-none absolute inset-x-0 top-0 z-[2] hidden bg-black md:block" />
      <div className="hero-bar-bot pointer-events-none absolute inset-x-0 bottom-0 z-[2] hidden bg-black md:block" />

      {/* Mobile top hairline */}
      <div className="hero-hairline pointer-events-none absolute inset-x-0 top-0 z-[2] block h-px md:hidden" />

      {/* Masthead row */}
      <div className="hero-masthead absolute z-[4] flex w-full items-center justify-between px-[3%]">
        <span
          data-test="hero-masthead-left"
          className="text-ink font-mono text-[10px] tracking-[0.22em] uppercase md:text-[11px]"
        >
          {mastheadLeft}
        </span>
        <span
          data-test="hero-masthead-counter"
          className="text-ink/55 font-mono text-[10px] tracking-[0.22em] uppercase md:text-[11px]"
        >
          {formatCounter(mastheadCounterTemplate, current, total)}
        </span>
      </div>

      {/* Progress strip — desktop: top edge of bottom letterbox bar; mobile: just above sticky CTA via --hero-cta-h */}
      {showProgress && (
        <div className="hero-progress bg-ink/10 pointer-events-none absolute inset-x-0 z-[3] h-px">
          <div
            key={`${current}-${intervalMs}`}
            className="hero-progress-fill bg-accent h-full"
            style={{ animationDuration: `${intervalMs}ms` }}
          />
        </div>
      )}
    </>
  );
}
