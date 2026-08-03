"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FolderOpen, Search, Share2, Upload } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { HowItWorksStage } from "@/components/landing/how-it-works-stage";
import { Badge } from "@/components/ui/badge";
import { HOW_STEPS, STEP_DWELL } from "@/constants/how-it-works";
import { EASE } from "@/constants/motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const STEP_ICONS = { upload: Upload, folder: FolderOpen, search: Search, share: Share2 };

export function HowItWorks() {
  const scope = useRef(null);
  const tabsRef = useRef([]);
  const baseId = useId();

  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);

  // The loop runs for as long as the section is on screen. Hovering or focusing
  // it suspends the current step where it stands rather than cancelling the
  // sequence — reading a step should not end the demonstration.
  //
  // A ref, not state: pausing drives one imperative call on a tween and changes
  // nothing that renders, so there is no reason to re-render the section for it.
  const pausedRef = useRef(false);
  const tweenRef = useRef(null);

  const reduced = usePrefersReducedMotion();
  const running = inView && !reduced;

  const step = HOW_STEPS[active];
  const tabId = (index) => `${baseId}-tab-${index}`;
  const panelId = `${baseId}-panel`;

  const select = useCallback((index, { focus = false } = {}) => {
    setActive(index);
    if (focus) tabsRef.current[index]?.focus();
  }, []);

  const suspend = useCallback((event) => {
    // Touch fires pointerenter with no matching leave, which would strand the
    // loop paused after a single tap.
    if (event && event.pointerType && event.pointerType !== "mouse") return;
    pausedRef.current = true;
    tweenRef.current?.pause();
  }, []);

  const release = useCallback((event) => {
    if (event && event.pointerType && event.pointerType !== "mouse") return;
    pausedRef.current = false;
    tweenRef.current?.resume();
  }, []);

  // The demonstration only runs while it can be seen. Off screen it is wasted
  // work, and worse, the story would be half over by the time anyone arrived.
  useEffect(() => {
    const root = scope.current;
    if (!root) return undefined;

    // A low threshold on purpose: stacked on a phone this section is taller
    // than the viewport, and a high one would never be satisfied.
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.2 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  const onKeyDown = (event) => {
    const last = HOW_STEPS.length - 1;
    const keys = {
      ArrowDown: Math.min(active + 1, last),
      ArrowRight: Math.min(active + 1, last),
      ArrowUp: Math.max(active - 1, 0),
      ArrowLeft: Math.max(active - 1, 0),
      Home: 0,
      End: last,
    };

    const next = keys[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(next, { focus: true });
  };

  /* ------------------------------------------------------------ entrance -- */

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return undefined;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // `from` rather than a CSS initial state: this section is below the
        // fold, so there is nothing to hide before paint, and if the script
        // never runs the content is simply already in place.
        gsap.from("[data-hiw='lede'] > *", {
          opacity: 0,
          y: 18,
          duration: 0.8,
          stagger: 0.09,
          ease: EASE.entrance,
          scrollTrigger: { trigger: root, start: "top 78%", once: true },
        });

        gsap.from("[data-hiw='step']", {
          opacity: 0,
          x: -16,
          duration: 0.7,
          stagger: 0.075,
          ease: EASE.entrance,
          scrollTrigger: { trigger: "[data-hiw='body']", start: "top 85%", once: true },
        });

        gsap.from("[data-hiw='stage']", {
          opacity: 0,
          y: 26,
          scale: 0.985,
          duration: 0.9,
          ease: EASE.entrance,
          scrollTrigger: { trigger: "[data-hiw='body']", start: "top 85%", once: true },
        });
      });

      return () => mm.revert();
    },
    { scope },
  );

  /* ------------------------------------------------- the advancing rail -- */

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return undefined;

      const rails = gsap.utils.toArray("[data-rail]", root);
      gsap.set(rails, { scaleY: 0 });

      const rail = rails[active];
      if (!rail) return undefined;

      // Off screen or motion-averse: the rail is not a countdown, just a
      // marker for which step is showing.
      if (!running) {
        gsap.set(rail, { scaleY: 1 });
        return undefined;
      }

      const mm = gsap.matchMedia();

      // Only advance itself where the steps and the stage share a screen.
      // Stacked below lg the stage sits under a list the visitor has scrolled
      // past, so a step changing on a timer would be a change nobody can
      // attribute to anything.
      mm.add("(min-width: 1024px)", () => {
        // The bar *is* the timer rather than a decoration alongside one, so
        // what the visitor sees and when the step changes cannot drift apart.
        tweenRef.current = gsap.fromTo(
          rail,
          { scaleY: 0 },
          {
            scaleY: 1,
            duration: STEP_DWELL,
            ease: "none",
            // Starts suspended if the cursor is already resting on the list, so
            // the next step does not begin counting down underneath it.
            paused: pausedRef.current,
            onComplete: () => setActive((index) => (index + 1) % HOW_STEPS.length),
          },
        );
      });

      mm.add("(max-width: 1023.98px)", () => {
        gsap.set(rail, { scaleY: 1 });
      });

      return () => {
        tweenRef.current = null;
        mm.revert();
      };
    },
    { dependencies: [active, running], scope },
  );

  return (
    // Top padding is deliberately lighter than the bottom: the hero already
    // contributes its own trailing space, and stacking two full section
    // paddings left a dead band between them.
    <section id="how" className="relative scroll-mt-24 pt-12 pb-24 sm:pt-16 sm:pb-32">
      <div ref={scope} className="mx-auto max-w-page px-5 sm:px-10">
        <div data-hiw="lede" className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <Badge variant="neutral" pill size="md" className="tracking-wider uppercase">
            How it works
          </Badge>

          <h2 className="mt-5 text-display-md font-semibold tracking-tighter text-balance sm:text-display-lg lg:text-display-xl">
            From drop to shared link in four steps.
          </h2>

          <p className="mt-4 text-lg leading-[1.6] text-muted-foreground text-balance sm:text-2xl">
            No setup, no folder taxonomy to design, no admin console. The common path is the
            fastest one — here it is, start to finish.
          </p>
        </div>

        <div
          data-hiw="body"
          className="mt-14 grid gap-8 lg:mt-18 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:items-center lg:gap-14"
        >
          <div
            role="tablist"
            aria-orientation="vertical"
            aria-label="How DataDock works"
            onKeyDown={onKeyDown}
            // Hold while it is being read or navigated, resume when it is let
            // go. This is also the WCAG 2.2.2 pause mechanism for the moving
            // content — keyboard users get it via focus, and anyone who has
            // asked for reduced motion never sees it move at all.
            onPointerEnter={suspend}
            onPointerLeave={release}
            onFocus={suspend}
            onBlur={release}
            className="flex flex-col"
          >
            {HOW_STEPS.map((item, index) => {
              const Icon = STEP_ICONS[item.icon];
              const selected = index === active;

              return (
                <button
                  key={item.id}
                  ref={(node) => {
                    tabsRef.current[index] = node;
                  }}
                  type="button"
                  role="tab"
                  id={tabId(index)}
                  aria-selected={selected}
                  aria-controls={panelId}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => select(index)}
                  data-hiw="step"
                  className={cn(
                    "group relative rounded-lg py-4 pr-4 pl-6 text-left",
                    "transition-colors duration-200 ease-standard",
                    selected ? "bg-surface/60" : "hover:bg-surface/40",
                  )}
                >
                  {/* Track and fill are separate elements: one is the shape of
                      the step, the other is how much of it has elapsed. */}
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-line"
                  />
                  <span
                    data-rail
                    aria-hidden="true"
                    className="absolute inset-y-3 left-0 w-0.5 origin-top rounded-full bg-brand"
                    style={{ transform: "scaleY(0)" }}
                  />

                  <span className="flex items-start gap-3.5">
                    <span
                      className={cn(
                        "mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg transition-colors duration-200 ease-standard",
                        selected
                          ? "bg-brand-tint text-brand ring-1 ring-brand/25 ring-inset"
                          : "bg-surface-2 text-dim",
                      )}
                    >
                      <Icon className="size-4" />
                    </span>

                    <span className="min-w-0">
                      <span
                        className={cn(
                          "block text-xl font-medium transition-colors duration-200 ease-standard",
                          selected ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {item.title}
                      </span>
                      <span
                        className={cn(
                          "mt-1 block text-md leading-[1.6] transition-colors duration-200 ease-standard",
                          selected ? "text-muted-foreground" : "text-dim",
                        )}
                      >
                        {item.description}
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div
            data-hiw="stage"
            role="tabpanel"
            id={panelId}
            aria-labelledby={tabId(active)}
            tabIndex={0}
            className="relative min-h-76 overflow-hidden rounded-2xl border border-line-2 bg-overlay p-6 shadow-elevated sm:min-h-84 sm:p-8"
          >
            {/* The same light as the hero, kept faint — this panel is a stage,
                not a second product frame. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 -top-24 h-48 opacity-60"
              style={{
                background: "radial-gradient(ellipse 60% 100% at 50% 100%, var(--brand-glow), transparent 70%)",
              }}
            />

            <div className="relative h-full">
              <HowItWorksStage step={step.id} status={step.status} reduced={reduced} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
