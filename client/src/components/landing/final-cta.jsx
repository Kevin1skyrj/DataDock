"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Check } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { CTA, CTA_POINTS } from "@/constants/cta";
import { EASE } from "@/constants/motion";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * The closing section.
 *
 * Deliberately the only section without an eyebrow label. Everything above has
 * announced itself — "How it works", "Features", "Pricing" — because it had
 * something to introduce. This one has nothing to introduce; it should simply
 * speak. The heading is written inline rather than through `SectionHeading` for
 * the same reason: it wants one step more weight than a section title, and
 * adding a size prop to a shared component for a single use is the kind of
 * guesswork that abstraction is supposed to avoid.
 */
export function FinalCta() {
  const scope = useRef(null);

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return undefined;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const panel = root.querySelector("[data-cta-panel]");
        const items = gsap.utils.toArray("[data-cta='item']", root);

        gsap.from(panel, {
          opacity: 0,
          y: 28,
          scale: 0.99,
          duration: 0.9,
          ease: EASE.entrance,
          scrollTrigger: { trigger: panel, start: "top 88%", once: true },
          onComplete: () => gsap.set(panel, { clearProps: "opacity,transform" }),
        });

        gsap.from(items, {
          opacity: 0,
          y: 16,
          duration: 0.75,
          stagger: 0.08,
          ease: EASE.entrance,
          scrollTrigger: { trigger: panel, start: "top 82%", once: true },
          onComplete: () => gsap.set(items, { clearProps: "opacity,transform" }),
        });
      });

      mm.add("(pointer: fine)", () => {
        const panel = root.querySelector("[data-cta-panel]");
        const spot = root.querySelector("[data-cta-spot]");
        if (!panel || !spot) return undefined;

        const setX = gsap.quickSetter(spot, "x", "px");
        const setY = gsap.quickSetter(spot, "y", "px");

        const onMove = (event) => {
          const bounds = panel.getBoundingClientRect();
          setX(event.clientX - bounds.left);
          setY(event.clientY - bounds.top);
        };

        panel.addEventListener("pointermove", onMove, { passive: true });
        return () => panel.removeEventListener("pointermove", onMove);
      });

      return () => mm.revert();
    },
    { scope },
  );

  return (
    <section id="get-started" className="relative scroll-mt-24 pt-12 pb-24 sm:pt-16 sm:pb-32">
      <div ref={scope} className="mx-auto max-w-page px-5 sm:px-10">
        <div
          data-cta-panel
          className="group relative isolate overflow-hidden rounded-[2rem] border border-line-2 bg-overlay px-6 py-16 text-center shadow-elevated sm:px-16 sm:py-24"
        >
          {/* The hero opens on light rising from above the fold; this closes on
              light rising from below it. Same system, read as a bookend. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -bottom-32 h-80"
            style={{
              background:
                "radial-gradient(ellipse 55% 100% at 50% 100%, var(--brand-glow), transparent 72%)",
            }}
          />

          <div
            data-cta-spot
            aria-hidden="true"
            className="pointer-events-none absolute -top-48 -left-48 size-96 rounded-full opacity-0 blur-3xl transition-opacity duration-700 ease-standard group-hover:opacity-100"
            style={{
              background: "radial-gradient(circle, var(--brand-glow) 0%, transparent 70%)",
            }}
          />

          <div className="relative mx-auto flex max-w-2xl flex-col items-center">
            <h2
              data-cta="item"
              className="text-display-md font-semibold tracking-tighter text-balance sm:text-display-lg lg:text-display-2xl"
            >
              {CTA.title}
            </h2>

            <p
              data-cta="item"
              className="mt-5 text-lg leading-[1.6] text-muted-foreground text-balance sm:text-2xl"
            >
              {CTA.description}
            </p>

            <div
              data-cta="item"
              className="mt-9 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row"
            >
              <Button
                size="lg"
                render={<a href={CTA.primary.href} />}
                className="dd-shine w-full sm:w-auto"
              >
                {CTA.primary.label}
                <ArrowRight />
              </Button>

              <Button
                size="lg"
                variant="secondary"
                render={<a href={CTA.secondary.href} />}
                className="w-full sm:w-auto"
              >
                {CTA.secondary.label}
              </Button>
            </div>

            <ul
              data-cta="item"
              className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2.5 text-base text-dim"
            >
              {CTA_POINTS.map((point) => (
                <li key={point} className="flex items-center gap-1.5">
                  <Check className="size-3.5 shrink-0 text-brand" strokeWidth={2.5} />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
