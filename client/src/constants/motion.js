/**
 * The hero's score.
 *
 * The entrance plays across three components — header, hero, product preview —
 * that mount independently, so they cannot share one GSAP timeline without
 * coupling them to each other. They share these beats instead: one place to
 * read the rhythm, one place to change it, and no drifting magic numbers.
 *
 * Values are seconds from the moment the page becomes interactive. The order
 * is deliberate: light, then chrome, then the promise, then the proof.
 */
export const BEAT = {
  /** The light arrives before anything readable does. */
  ambient: 0,
  nav: 0.08,
  badge: 0.26,
  /** Second line trails the first, so the headline reads rather than lands. */
  headline: 0.38,
  headlineLine: 0.13,
  copy: 0.85,
  cta: 1.02,
  /** After the buttons, so the CTA reads as powering on rather than fading in. */
  ctaGlow: 1.18,
  /** The device rises… */
  frame: 1.38,
  /** …then fills itself in, rather than arriving complete. */
  chrome: 1.64,
  rows: 1.82,
  storage: 2.1,
  /** Last, and alone on stage — this is the beat we want remembered. */
  palette: 2.9,
};

/**
 * Named curves, so no component reaches for a library default.
 * `entrance` has a long tail: things arrive quickly and settle slowly, which is
 * what separates expensive-feeling motion from abrupt motion.
 */
export const EASE = {
  entrance: "expo.out",
  settle: "power4.out",
  glide: "power3.out",
  pointer: "power3",
};
