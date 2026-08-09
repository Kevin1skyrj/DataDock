import { cn } from "@/lib/utils";

/**
 * The hero's ambient layers.
 *
 * The three drifting radial pools and the cursor spotlight are gone: the dock
 * casts that light for real now, from its own halo, floor glow and rim light,
 * and stacking gradients over it only muted what they were imitating.
 *
 * What remains is two flat layers doing work the scene cannot:
 *
 *   vignette — lets the corners fall away so the eye lands on the centre
 *              column. Hierarchy work, not decoration.
 *   fade     — grounds the section into the page instead of ending it on a
 *              hard horizontal edge where the next one begins.
 *
 * The scene itself is not here. It renders in its own band in the hero's flow,
 * below the copy — see `hero.jsx`. Placed here it was a full-bleed layer behind
 * everything, which is precisely how the headline came to sit on top of it.
 */
export function AmbientBackdrop({ className }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {/* Draws the eye to the centre column by letting the corners fall away.
          Lighter than the 0.55 the flat gradients needed: that value was tuned
          to mute three overlapping radial pools, and at full strength it erases
          the dock now rendering beneath it. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 32%, transparent 45%, var(--background) 100%)",
          opacity: 0.38,
        }}
      />

      {/* Grounds the composition so the scene fades into the page rather than
          stopping at a hard edge. */}
      <div className="absolute inset-x-0 bottom-0 h-64 bg-linear-to-b from-transparent to-background" />
    </div>
  );
}
