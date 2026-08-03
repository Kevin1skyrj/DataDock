import gsap from "gsap";

import { EASE, REVEAL } from "@/constants/motion";

/**
 * A section's scroll entrance.
 *
 * Every call site needs the same four things, and one of them is easy to
 * forget: a `from` tween leaves its inline transform on the element after it
 * finishes, so an element that keeps one sits permanently out of line with its
 * neighbours. That bug shipped three times before this existed. Clearing the
 * props is now part of what a reveal *is*, not something each section has to
 * remember.
 *
 * Selectors resolve inside `scope`, so two sections can use the same hook name
 * without reaching into each other.
 *
 * @param {string|Element|Element[]} targets  what animates
 * @param {"head"|"body"|"panel"}    preset   which of the shared rhythms to use
 * @param {object}                   options  `scope` (required), `trigger`, `start`
 */
export function revealOnScroll(targets, preset, { scope, trigger, start = REVEAL.start } = {}) {
  const items = gsap.utils.toArray(targets, scope);
  if (!items.length) return null;

  const triggerEl =
    typeof trigger === "string" ? (scope ?? document).querySelector(trigger) : trigger;

  return gsap.from(items, {
    ...REVEAL[preset],
    ease: EASE.entrance,
    scrollTrigger: {
      trigger: triggerEl ?? items[0],
      start,
      once: true,
    },
    onComplete: () => gsap.set(items, { clearProps: "opacity,transform" }),
  });
}
