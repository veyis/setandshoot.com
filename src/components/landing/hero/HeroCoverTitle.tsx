"use client";

type Props = {
  /** Active photo's kicker (rotates with active index). */
  kicker: string;
  /** Active photo's camera spec (rotates). */
  cameraSpec: string;
  /** Active photo's location (rotates), shown after an em-dash. Empty string ok. */
  location: string;
  /** Brand name — static across rotations. */
  name: string;
  /** Key changes with active index so the rotating lines remount + crossfade. */
  rotationKey: number;
};

/**
 * Magazine-cover title block: red kicker rule + per-photo kicker line,
 * two-line "belin / akguel." Fraunces title (static across rotations — it
 * is the brand), then a per-photo mono camera-spec line.
 *
 * The kicker and camera-spec rotate with the active photo; the title does
 * not. Crossfade is driven by remounting those two lines via React key.
 */
export function HeroCoverTitle({ kicker, cameraSpec, location, name, rotationKey }: Props) {
  const nameParts = name.split(" ");
  const firstName = nameParts[0] ?? name;
  const lastName = nameParts.slice(1).join(" ");

  const kickerLine = location ? `${kicker} — ${location}` : kicker;

  return (
    <div className="hero-cover-title absolute right-[3%] bottom-[22%] left-[3%] z-[4] max-md:bottom-[24%]">
      {/* Red kicker rule + text — rotates */}
      <div key={`kicker-${rotationKey}`} className="hero-kicker mb-3 flex items-center gap-[10px]">
        <span className="hero-kicker-rule bg-accent inline-block h-[1.5px] w-[26px]" />
        <span
          data-test="hero-kicker"
          className="hero-kicker-text text-accent font-mono text-[10px] tracking-[0.22em] uppercase md:text-[11px]"
        >
          {kickerLine}
        </span>
      </div>

      {/* Static cover title */}
      <h1
        className="hero-cover-name font-display text-ink"
        style={{
          fontWeight: 500,
          fontSize: "clamp(2.8rem, 8.5vw, 8.5rem)",
          lineHeight: 0.86,
          letterSpacing: "-0.035em",
        }}
      >
        <span className="hero-cover-line-1 block">{firstName}</span>
        {lastName && (
          <span className="hero-cover-line-2 block">
            {lastName}
            <span className="hero-cover-period text-accent">.</span>
          </span>
        )}
      </h1>

      {/* Per-photo camera spec — rotates */}
      <div
        key={`spec-${rotationKey}`}
        data-test="hero-camera"
        className="hero-camera text-ink/60 mt-3.5 font-mono text-[10px] tracking-[0.18em] uppercase md:text-[11px]"
      >
        {cameraSpec}
      </div>
    </div>
  );
}
