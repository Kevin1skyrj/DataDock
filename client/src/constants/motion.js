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
  nav: 0.06,
  badge: 0.18,
  /** Second line trails the first, so the headline reads rather than lands. */
  headline: 0.26,
  headlineLine: 0.1,
  copy: 0.56,
  cta: 0.68,
  /** After the buttons, so the CTA reads as powering on rather than fading in. */
  ctaGlow: 0.8,
  /** The device rises… */
  frame: 0.92,
  /** …then fills itself in, rather than arriving complete. */
  chrome: 1.1,
  rows: 1.26,
  storage: 1.44,
  /** Last, and alone on stage — this is the beat we want remembered. */
  palette: 1.8,
};

/**
 * How long the palette demo holds before it dismisses itself: enough to finish
 * typing and be read, then gone. The hero's resting state is the working file
 * table, not a modal sitting on top of it.
 */
export const PALETTE_HOLD_MS = 3100;

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

/**
 * The scroll entrance, shared by every section below the hero.
 *
 * These were five near-identical sets of numbers written five times, drifting a
 * few hundredths apart. Scrolling the page felt marginally uneven because it
 * was: each section began at a slightly different point in the viewport and
 * staggered at a slightly different rate. One set of values makes the whole
 * page arrive with a single rhythm.
 */
export const REVEAL = {
  /** Where a section's entrance begins, as a share of the viewport height. */
  start: "top 82%",

  /** Eyebrow, title, lead — the section introducing itself. */
  head: { opacity: 0, y: 18, duration: 0.85, stagger: 0.08 },

  /** Cards, plans, rows — the section's substance. */
  body: { opacity: 0, y: 24, duration: 0.85, stagger: 0.07 },

  /** A single large surface arriving as one piece rather than in parts. */
  panel: { opacity: 0, y: 26, scale: 0.99, duration: 0.95 },
};
