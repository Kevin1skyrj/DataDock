"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";

import { AmbientBackdrop } from "@/components/landing/ambient-backdrop";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BEAT, EASE } from "@/constants/motion";
import { hasSeenEntrance, markEntranceSeen } from "@/lib/entrance";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const HEADLINE = [
  ["Store", "smarter."],
  ["Organize", "beautifully."],
];

/** How far a magnetic control leans toward the pointer, in px. */
const MAGNET_RANGE = 7;

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

            // On a repeat view within the session the boot script withheld
            // data-motion, so nothing is hidden and there is nothing to reveal.
            // Everything below the entrance — parallax, handoff, pointer work —
            // still applies; only the choreography is skipped.
            if (!hasSeenEntrance()) {
              const animated = gsap.utils.toArray("[data-animate]", root);

              const timeline = gsap.timeline({
                defaults: { ease: EASE.entrance },
                onComplete: () => {
                  // Hand the elements back to CSS: drop the hook so the initial
                  // state no longer matches, then clear GSAP's inline styles.
                  // Leaving a blur filter behind would soften the text forever.
                  animated.forEach((element) => element.removeAttribute("data-animate"));
                  gsap.set(animated, { clearProps: "all" });
                  markEntranceSeen();
                },
              });

              timeline
                .to("[data-animate='glow']", { opacity: 1, scale: 1, duration: 1.4 }, BEAT.ambient)
                .to(
                  "[data-animate='rise'][data-step='badge']",
                  { opacity: 1, y: 0, duration: 0.6 },
                  BEAT.badge,
                );

              // Line by line, not word by word across the whole headline: the
              // second clause should land as a reply to the first, which a
              // single continuous stagger flattens into one long sweep.
              HEADLINE.forEach((_, line) => {
                timeline.to(
                  `[data-line='${line}'] [data-animate='word']`,
                  { y: 0, filter: "blur(0px)", duration: 0.95, stagger: 0.07 },
                  BEAT.headline + line * BEAT.headlineLine,
                );
              });

              timeline
                .to(
                  "[data-animate='rise'][data-step='copy']",
                  { opacity: 1, y: 0, duration: 0.7 },
                  BEAT.copy,
                )
                .to(
                  "[data-animate='cta']",
                  { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.06 },
                  BEAT.cta,
                )
                // The glow lands after the buttons, so the CTA reads as powering
                // on rather than fading in.
                .to(
                  "[data-animate='rise'][data-step='cta-glow']",
                  { opacity: 1, duration: 0.8 },
                  BEAT.ctaGlow,
                );
            }

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

            // The handoff into the product preview. The copy steps back as the
            // device comes forward, so the two read as one continuous move
            // rather than a section ending and another beginning.
            const copy = root.querySelector("[data-hero-copy]");

            if (copy) {
              gsap.to(copy, {
                opacity: 0.4,
                y: -26,
                ease: "none",
                scrollTrigger: {
                  // Anchored to the copy leaving rather than the preview
                  // arriving: keyed to the preview, a tall viewport would start
                  // the fade already partly applied on first paint.
                  trigger: copy,
                  start: "bottom 45%",
                  end: "bottom 5%",
                  scrub: 0.6,
                },
              });
            }

            // Looping idle motion — ambient drift, the frame's edge light — is
            // real GPU work whether or not it is on screen. Parked while the
            // hero is scrolled past, so the rest of the page is not paying for
            // animation nobody can see.
            const idle = gsap.utils.toArray("[data-idle-motion]", root);

            if (idle.length) {
              ScrollTrigger.create({
                trigger: root,
                start: "top bottom",
                end: "bottom top",
                onToggle: ({ isActive }) => {
                  idle.forEach((element) => {
                    element.style.animationPlayState = isActive ? "running" : "paused";
                  });
                },
              });
            }

            if (!finePointer) return undefined;

            const spotlight = root.querySelector("[data-spotlight]");
            const cleanups = [];

            if (spotlight) {
              gsap.to(spotlight, { opacity: 0.5, duration: 1.6, delay: 0.6 });

              // quickTo interpolates on GSAP's ticker, so pointer events never
              // write styles directly and the work stays on one rAF per frame.
              // Short enough that the light stops when the cursor does — a long
              // tail here reads as lag, not smoothness.
              const moveX = gsap.quickTo(spotlight, "x", { duration: 0.5, ease: EASE.pointer });
              const moveY = gsap.quickTo(spotlight, "y", { duration: 0.5, ease: EASE.pointer });

              const onPointerMove = (event) => {
                const bounds = root.getBoundingClientRect();
                moveX(((event.clientX - bounds.left) / Math.max(bounds.width, 1) - 0.5) * 140);
                moveY((event.clientY / Math.max(window.innerHeight, 1) - 0.5) * 60);
              };

              window.addEventListener("pointermove", onPointerMove, { passive: true });
              cleanups.push(() => window.removeEventListener("pointermove", onPointerMove));
            }

            // Magnetic call to action. The lean lives on a wrapper rather than
            // the button so it never fights the button's own hover transform,
            // and so the entrance's clearProps cannot wipe it mid-gesture.
            gsap.utils.toArray("[data-magnetic]", root).forEach((target) => {
              const toX = gsap.quickTo(target, "x", { duration: 0.4, ease: EASE.pointer });
              const toY = gsap.quickTo(target, "y", { duration: 0.4, ease: EASE.pointer });

              const onMove = (event) => {
                const bounds = target.getBoundingClientRect();
                toX(((event.clientX - bounds.left) / bounds.width - 0.5) * MAGNET_RANGE * 2);
                toY(((event.clientY - bounds.top) / bounds.height - 0.5) * MAGNET_RANGE);
              };

              const onLeave = () => {
                toX(0);
                toY(0);
              };

              target.addEventListener("pointermove", onMove, { passive: true });
              target.addEventListener("pointerleave", onLeave);
              // Keyboard users get the same resting geometry as everyone else.
              target.addEventListener("focusout", onLeave);

              cleanups.push(() => {
                target.removeEventListener("pointermove", onMove);
                target.removeEventListener("pointerleave", onLeave);
                target.removeEventListener("focusout", onLeave);
              });
            });

            return () => cleanups.forEach((off) => off());
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

      <div
        data-hero-copy
        className="relative mx-auto flex max-w-page flex-col items-center px-5 pt-20 text-center sm:px-10 sm:pt-28 lg:pt-32"
      >
        <div data-animate="rise" data-step="badge">
          <Badge variant="brand" pill size="md">
            Now in early access — 5 GB free
          </Badge>
        </div>

        <h1 className="mt-7 max-w-225 text-display-lg leading-[1.02] font-semibold tracking-hero text-balance sm:text-display-2xl lg:text-[3.625rem] xl:text-display-hero">
          {HEADLINE.map((line, index) => (
            <span
              key={line.join(" ")}
              data-line={index}
              // Padding opens the clip below the baseline so descenders survive
              // the mask; the matching negative margin keeps the line box
              // unchanged. Both in em, so it holds at every breakpoint.
              className="block overflow-hidden pb-[0.14em] mb-[-0.14em]"
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
          // The hero's second voice, not body copy: 15 → 17.5 → 20px against a
          // 36 → 76px headline. An explicit leading, because the type ladder
          // pairs no line-height and `normal` is too tight at 20px.
          className="mt-6 max-w-165 text-lg leading-[1.55] text-muted-foreground text-balance sm:text-2xl lg:text-display-xs"
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
            <div data-magnetic className="w-full sm:w-auto">
              <Button
                size="lg"
                render={<a href="#pricing" />}
                className="group/cta dd-shine w-full sm:w-auto"
              >
                Start free
                {/* The arrow leans out on hover — the button acknowledges the
                    pointer before the click, which is what makes it feel
                    tactile rather than merely styled. */}
                <ArrowRight className="transition-transform duration-300 ease-out-expo group-hover/cta:translate-x-0.5" />
              </Button>
            </div>
          </div>

          <div data-animate="cta" className="w-full sm:w-auto">
            <div data-magnetic className="w-full sm:w-auto">
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
      </div>

      {/* The product preview mounts here, inside the hero's light and parallax
          rather than as a separate section below it. */}
      {children}
    </section>
  );
}
