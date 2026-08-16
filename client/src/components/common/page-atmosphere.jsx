"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";
import { useRef } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const GLOW = (color, reach = 62) => ({
  background: `radial-gradient(circle, ${color} 0%, transparent ${reach}%)`,
});

/**
 * The application's light.
 *
 * Originally the landing page's, now shared with authentication — which is the
 * point. Signing in should not feel like arriving at a different website, and
 * the cheapest, most convincing way to say "same product" is for the room to be
 * lit the same way. Nothing about it is section-specific: it is one field, and
 * whatever renders on top of it simply sits in it.
 *
 * Fixed rather than page-height on purpose. A tall absolute layer would be an
 * enormous composited surface; a fixed one is exactly a viewport, drifts on
 * scroll instead of scrolling, and costs a single transform per frame.
 *
 * Both behaviours below are opt-in on what the page actually contains, so this
 * needs no props to work correctly in either place:
 *
 * - The hero has its own, much stronger light, so this fades up only as the
 *   hero leaves. Where there is no hero — authentication — it simply renders at
 *   full strength from the start.
 * - The parallax drift needs a document taller than the viewport to scrub
 *   against. A single-screen page gets a still field instead of a
 *   zero-length ScrollTrigger.
 */
export function PageAtmosphere() {
  const scope = useRef(null);
  const pathname = usePathname();

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return undefined;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const hero = document.querySelector("#top");

        if (hero) {
          gsap.fromTo(
            root,
            { opacity: 0.12 },
            {
              opacity: 1,
              ease: "none",
              scrollTrigger: {
                trigger: hero,
                start: "bottom bottom",
                end: "bottom top",
                scrub: 0.6,
              },
            },
          );
        }

        // Each pool drifts at its own rate over the length of the document, so
        // the field has depth rather than being one flat sheet sliding past.
        // Nothing to scrub against on a page that fits the viewport, and a
        // ScrollTrigger whose start and end coincide is not a drift, it is a
        // division by zero waiting to happen.
        const scrollable =
          document.documentElement.scrollHeight - window.innerHeight > 1;
        if (!scrollable) return;

        gsap.utils.toArray("[data-atmos]", root).forEach((pool) => {
          gsap.to(pool, {
            yPercent: parseFloat(pool.dataset.atmos) * -100,
            ease: "none",
            scrollTrigger: {
              trigger: document.documentElement,
              start: "top top",
              end: "bottom bottom",
              scrub: 1.2,
            },
          });
        });
      });

      return () => mm.revert();
    },
    /**
     * Rebuilt on every navigation, and reverted first.
     *
     * This layer belongs to the layout, so it survives a move between marketing
     * pages while the thing it is keyed to does not: the fade is driven by a
     * ScrollTrigger on `#top`, the hero. Leaving the landing page removes that
     * element, which strands the tween at its end value — full strength — and
     * coming back builds a *new* hero the old trigger has never heard of. The
     * result was a page that opened at 0.12 the first time and 1 every time
     * after, which reads as the whole hero having fogged over.
     *
     * `revertOnUpdate` is the half that matters most: without it the rebuild
     * would add correct triggers on top of an opacity someone else already set,
     * and the stale value would simply win.
     */
    { scope, dependencies: [pathname], revertOnUpdate: true },
  );

  return (
    <div
      ref={scope}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-20 overflow-hidden"
    >
      <div
        data-atmos="0.22"
        className="absolute -top-1/4 -left-1/4 size-[70vmax] opacity-40"
        style={GLOW("var(--brand-glow)")}
      />

      <div
        data-atmos="0.14"
        className="absolute top-1/3 -right-1/3 size-[65vmax] opacity-25"
        style={GLOW("var(--sheen)", 58)}
      />

      <div
        data-atmos="0.3"
        className="absolute -bottom-1/4 left-1/4 size-[60vmax] opacity-30"
        style={GLOW("var(--brand-glow)")}
      />
    </div>
  );
}
