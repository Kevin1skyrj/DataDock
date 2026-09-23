"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";

import { AmbientBackdrop } from "@/components/landing/ambient-backdrop";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BEAT, EASE } from "@/constants/motion";
import { hasSeenEntrance, markEntranceSeen } from "@/lib/entrance";

gsap.registerPlugin(useGSAP);

const HEADLINE = [
  ["Store", "smarter."],
  ["Organize", "beautifully."],
];

/**
 * A product-led hero with one clear reading path: promise, explanation, action,
 * and then the live DataDock preview. Motion is limited to the first entrance;
 * normal scrolling and pointer movement do not run hero animation work.
 */
export function Hero({ children }) {
  const scope = useRef(null);

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return undefined;

      const animated = gsap.utils.toArray("[data-animate]", root);
      if (hasSeenEntrance()) {
        animated.forEach((element) => element.removeAttribute("data-animate"));
        gsap.set(animated, { clearProps: "all" });
        return undefined;
      }

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return undefined;

      try {
        const timeline = gsap.timeline({
          defaults: { ease: EASE.entrance },
          onComplete: () => {
            animated.forEach((element) => element.removeAttribute("data-animate"));
            gsap.set(animated, { clearProps: "all" });
            markEntranceSeen();
          },
        });

        timeline.to(
          "[data-animate='rise'][data-step='badge']",
          { opacity: 1, y: 0, duration: 0.55 },
          BEAT.badge,
        );

        HEADLINE.forEach((_, line) => {
          timeline.to(
            `[data-line='${line}'] [data-animate='word']`,
            { y: 0, duration: 0.8, stagger: 0.06 },
            BEAT.headline + line * BEAT.headlineLine,
          );
        });

        timeline
          .to(
            "[data-animate='rise'][data-step='copy']",
            { opacity: 1, y: 0, duration: 0.6 },
            BEAT.copy,
          )
          .to(
            "[data-animate='cta']",
            { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.06 },
            BEAT.cta,
          )
          .to(
            "[data-animate='rise'][data-step='hint']",
            { opacity: 1, y: 0, duration: 0.55 },
            BEAT.ctaGlow,
          );

        return () => timeline.kill();
      } catch {
        document.documentElement.removeAttribute("data-motion");
        return undefined;
      }
    },
    { scope },
  );

  return (
    <section ref={scope} id="top" className="relative isolate overflow-hidden pb-16 sm:pb-24">
      <AmbientBackdrop />

      <div
        data-hero-copy
        className="relative mx-auto flex max-w-5xl flex-col items-center px-5 pt-36 text-center sm:px-10 sm:pt-44 lg:pt-48"
      >
        <div data-animate="rise" data-step="badge">
          <Badge variant="brand" pill size="md">
            Now in early access — 500 MB free
          </Badge>
        </div>

        <h1 className="mt-7 max-w-4xl text-[2.75rem] leading-[1.02] font-semibold tracking-hero text-balance sm:text-[3.75rem] lg:text-[4.5rem]">
          {HEADLINE.map((line, lineIndex) => (
            <span
              key={line.join(" ")}
              data-line={lineIndex}
              className="mb-[-0.14em] block overflow-hidden pb-[0.14em]"
            >
              {line.map((word, wordIndex) => (
                <span key={word}>
                  {wordIndex > 0 ? " " : null}
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
          className="mt-7 max-w-2xl text-xl leading-[1.7] text-muted-foreground text-balance sm:text-2xl lg:text-[1.125rem]"
        >
          A fast, secure cloud drive for everyday work. Upload, organize, find, and share your
          files without the clutter of an enterprise suite.
        </p>

        <div className="mt-9 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
          <div data-animate="cta" className="w-full sm:w-auto">
            <Button
              size="lg"
              render={<a href="#pricing" />}
              className="group/cta h-12 w-full px-6 text-md sm:w-auto"
            >
              Start free
              <ArrowRight className="transition-transform duration-200 ease-standard group-hover/cta:translate-x-0.5" />
            </Button>
          </div>

          <div data-animate="cta" className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="secondary"
              render={<a href="#features" />}
              className="h-12 w-full px-6 text-md sm:w-auto"
            >
              Explore features
            </Button>
          </div>
        </div>

        <p
          data-animate="rise"
          data-step="hint"
          className="mt-5 text-md text-muted-foreground"
        >
          No credit card required · Upgrade only when you need more space
        </p>
      </div>

      {children}
    </section>
  );
}
