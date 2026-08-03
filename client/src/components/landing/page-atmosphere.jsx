"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const GLOW = (color, reach = 62) => ({
  background: `radial-gradient(circle, ${color} 0%, transparent ${reach}%)`,
});

/**
 * The page's light.
 *
 * The hero always had ambient light; everything below it sat on flat
 * background. That is what made the page read as a hero followed by a
 * document — each section began and ended against nothing, so every boundary
 * was a boundary. This is one field that spans all of them: no section owns
 * its own light, and no section starts on an edge.
 *
 * Fixed rather than page-height on purpose. A tall absolute layer would be an
 * enormous composited surface; a fixed one is exactly a viewport, drifts on
 * scroll instead of scrolling, and costs a single transform per frame.
 *
 * It also stays out of the hero's way: the hero has its own, much stronger
 * light, so this fades up only as the hero leaves. The two never stack at full
 * strength, and the handover happens across a whole viewport of scrolling —
 * long enough that nobody can point at where it occurred.
 */
export function PageAtmosphere() {
  const scope = useRef(null);

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
    { scope },
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
