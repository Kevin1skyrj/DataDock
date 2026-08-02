"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";

import { AmbientBackdrop } from "@/components/landing/ambient-backdrop";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const HEADLINE = [
  ["Store", "smarter."],
  ["Organize", "beautifully."],
];

export function Hero({ children }) {
  const scope = useRef(null);

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;

      // Every entrance target starts hidden via CSS gated on data-motion. If
      // anything below throws, dropping the attribute restores the composed
      // page rather than leaving a blank hero behind.
      const restore = () => document.documentElement.removeAttribute("data-motion");

      try {
        const mm = gsap.matchMedia();

        mm.add(
          {
            animate: "(prefers-reduced-motion: no-preference)",
            finePointer: "(pointer: fine)",
          },
          (context) => {
            const { animate, finePointer } = context.conditions;
            if (!animate) return undefined;

            const animated = gsap.utils.toArray("[data-animate]", root);

            const timeline = gsap.timeline({
              defaults: { ease: "expo.out" },
              onComplete: () => {
                // Hand the elements back to CSS: drop the hook so the initial
                // state no longer matches, then clear GSAP's inline styles.
                // Leaving a blur filter behind would soften the text forever.
                animated.forEach((element) => element.removeAttribute("data-animate"));
                gsap.set(animated, { clearProps: "all" });
              },
            });

            timeline
              .to("[data-animate='glow']", { opacity: 1, scale: 1, duration: 1.4 }, 0)
              .to("[data-animate='rise'][data-step='badge']", { opacity: 1, y: 0, duration: 0.7 }, 0.15)
              .to(
                "[data-animate='word']",
                { y: 0, filter: "blur(0px)", duration: 1.1, stagger: 0.105 },
                0.25,
              )
              .to("[data-animate='rise'][data-step='copy']", { opacity: 1, y: 0, duration: 0.8 }, 0.7)
              .to(
                "[data-animate='cta']",
                { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.06 },
                0.88,
              )
              // The glow lands after the buttons, so the CTA reads as powering
              // on rather than fading in.
              .to("[data-animate='rise'][data-step='cta-glow']", { opacity: 1, duration: 0.9 }, 1.0);

            // Ambient layers drift against the scroll so the hero reads as
            // stacked planes. Scrubbed, never a scroll listener.
            gsap.utils.toArray("[data-parallax]", root).forEach((layer) => {
              gsap.to(layer, {
                yPercent: (parseFloat(layer.dataset.parallax) || 0.2) * 26,
                ease: "none",
                scrollTrigger: {
                  trigger: root,
                  start: "top top",
                  end: "bottom top",
                  scrub: 0.5,
                },
              });
            });

            if (!finePointer) return undefined;

            const spotlight = root.querySelector("[data-spotlight]");
            if (!spotlight) return undefined;

            gsap.to(spotlight, { opacity: 0.5, duration: 1.6, delay: 0.6 });

            // quickTo interpolates on GSAP's ticker, so pointer events never
            // write styles directly and the work stays on one rAF per frame.
            const moveX = gsap.quickTo(spotlight, "x", { duration: 0.9, ease: "power3" });
            const moveY = gsap.quickTo(spotlight, "y", { duration: 0.9, ease: "power3" });

            const onPointerMove = (event) => {
              const bounds = root.getBoundingClientRect();
              moveX(((event.clientX - bounds.left) / Math.max(bounds.width, 1) - 0.5) * 140);
              moveY((event.clientY / Math.max(window.innerHeight, 1) - 0.5) * 60);
            };

            window.addEventListener("pointermove", onPointerMove, { passive: true });
            return () => window.removeEventListener("pointermove", onPointerMove);
          },
        );

        return () => mm.revert();
      } catch {
        restore();
        return undefined;
      }
    },
    { scope },
  );

  return (
    <section ref={scope} id="top" className="relative isolate overflow-hidden">
      <AmbientBackdrop />

      <div className="relative mx-auto flex max-w-page flex-col items-center px-5 pt-20 text-center sm:px-10 sm:pt-28 lg:pt-32">
        <div data-animate="rise" data-step="badge">
          <Badge variant="brand" pill size="md">
            Now in early access — 5 GB free
          </Badge>
        </div>

        <h1 className="mt-7 max-w-[900px] text-display-lg leading-[1.02] font-semibold tracking-hero text-balance sm:text-display-2xl lg:text-[3.625rem] xl:text-display-hero">
          {HEADLINE.map((line) => (
            <span
              key={line.join(" ")}
              // Padding opens the clip below the baseline so descenders survive
              // the mask; the matching negative margin keeps the line box
              // unchanged. Both in em, so it holds at every breakpoint.
              className="block overflow-hidden pb-[0.14em] -mb-[0.14em]"
            >
              {line.map((word, index) => (
                <span key={word}>
                  {index > 0 ? " " : null}
                  <span data-animate="word" className="inline-block will-change-transform">
                    {word}
                  </span>
                </span>
              ))}
            </span>
          ))}
        </h1>

        <p
          data-animate="rise"
          data-step="copy"
          className="mt-6 max-w-[620px] text-md text-muted-foreground text-balance sm:text-xl"
        >
          A cloud drive that behaves like a desktop app. Upload, find, and share files in seconds —
          without the clutter of an enterprise suite.
        </p>

        <div className="relative mt-9 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
          <div
            data-animate="rise"
            data-step="cta-glow"
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-10 -inset-y-8 -z-10 rounded-full opacity-0 blur-2xl"
            style={{
              background: "radial-gradient(ellipse, var(--brand-glow) 0%, transparent 70%)",
            }}
          />

          <div data-animate="cta" className="w-full sm:w-auto">
            <Button size="lg" render={<a href="#pricing" />} className="w-full sm:w-auto">
              Start free
              <ArrowRight />
            </Button>
          </div>

          <div data-animate="cta" className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="secondary"
              render={<a href="#how" />}
              className="w-full sm:w-auto"
            >
              See how it works
            </Button>
          </div>
        </div>
      </div>

      {/* The product preview mounts here, inside the hero's light and parallax
          rather than as a separate section below it. */}
      {children}
    </section>
  );
}
