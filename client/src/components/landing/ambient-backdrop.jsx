import { cn } from "@/lib/utils";

const GLOW = (color) => ({
  background: `radial-gradient(circle, ${color} 0%, transparent 62%)`,
});

/**
 * The hero's light.
 *
 * Three soft radial pools plus a cursor-tracked spotlight, over a noise layer
 * that dithers away the banding large dark gradients produce on 8-bit displays.
 *
 * Each pool is split across three elements on purpose, because three things
 * want to write to the same box and only one can own each property:
 *   outer  — parallax target, written by GSAP on scroll
 *   middle — final opacity, so the entrance can animate 0 → 1 without needing
 *            to know each pool's resting level
 *   inner  — idle drift keyframe
 */
export function AmbientBackdrop({ className }) {
  return (
    <div
      aria-hidden="true"
      className={cn("dd-noise pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div data-parallax="0.5" className="absolute -top-48 left-1/2 -translate-x-1/2 opacity-70">
        <div data-animate="glow">
          <div
            data-idle-motion
            className="size-[min(820px,140vw)] animate-[dd-drift_22s_ease-in-out_infinite] rounded-full"
            style={GLOW("var(--brand-glow)")}
          />
        </div>
      </div>

      <div data-parallax="0.28" className="absolute top-24 -left-40 hidden opacity-40 md:block">
        <div data-animate="glow">
          <div
            data-idle-motion
            className="size-140 animate-[dd-drift-alt_26s_ease-in-out_infinite] rounded-full"
            style={GLOW("var(--brand-glow)")}
          />
        </div>
      </div>

      <div data-parallax="0.18" className="absolute top-64 -right-40 hidden opacity-30 md:block">
        <div data-animate="glow">
          <div
            data-idle-motion
            className="size-155 animate-[dd-drift_30s_ease-in-out_infinite] rounded-full"
            style={GLOW("var(--sheen)")}
          />
        </div>
      </div>

      {/* Cursor spotlight. Left at zero opacity until GSAP confirms a fine
          pointer, so touch devices never pay for it. */}
      <div
        data-spotlight
        className="absolute top-0 left-1/2 size-170 -translate-x-1/2 rounded-full opacity-0"
        style={GLOW("var(--brand-glow)")}
      />

      {/* Draws the eye to the centre column by letting the corners fall away.
          Barely perceptible on its own — it is doing hierarchy work, not
          decorative work. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 32%, transparent 40%, var(--background) 100%)",
          opacity: 0.55,
        }}
      />

      {/* Grounds the composition so the light fades into the page rather than
          stopping at a hard edge. */}
      <div className="absolute inset-x-0 bottom-0 h-64 bg-linear-to-b from-transparent to-background" />
    </div>
  );
}
