"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, ChevronLeft, ChevronRight, Eye, FolderTree, Gauge, Link2, RotateCcw, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { SectionHeading } from "@/components/common/section-heading";
import { FEATURE_VISUALS } from "@/components/landing/feature-visuals";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { CARD_LIGHT, FEATURES } from "@/constants/features";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { revealOnScroll } from "@/lib/reveal";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const ICONS = {
  search: Search,
  link: Link2,
  folder: FolderTree,
  gauge: Gauge,
  restore: RotateCcw,
  preview: Eye,
};

export function Features() {
  const scope = useRef(null);
  const trackRef = useRef(null);
  const startRef = useRef(null);
  const endRef = useRef(null);

  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const reduced = usePrefersReducedMotion();

  // Sentinels at each end of the track rather than a scroll listener: the
  // arrows only need to know when an edge comes into view, and nothing should
  // be running on the main thread while the rail is being flicked.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === startRef.current) setAtStart(entry.isIntersecting);
          if (entry.target === endRef.current) setAtEnd(entry.isIntersecting);
        });
      },
      { root: track, threshold: 1 },
    );

    if (startRef.current) observer.observe(startRef.current);
    if (endRef.current) observer.observe(endRef.current);
    return () => observer.disconnect();
  }, []);

  // One card plus one gap, measured rather than hard-coded, so the step stays
  // correct as the card width changes across breakpoints.
  const slide = (direction) => {
    const track = trackRef.current;
    const card = track?.querySelector("[data-feature-card]");
    if (!track || !card) return;

    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({
      left: direction * (card.offsetWidth + gap),
      behavior: reduced ? "auto" : "smooth",
    });
  };

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return undefined;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        revealOnScroll("[data-section-heading] > *", "head", { scope: root, trigger: root });
        revealOnScroll("[data-feature-card]", "body", {
          scope: root,
          trigger: "[data-feature-rail]",
        });
      });

      // The light under the cursor, written with `quickSetter` so there is no
      // tween between the pointer and the glow. Only fine pointers pay for it.
      mm.add("(pointer: fine)", () => {
        const offs = [];

        gsap.utils.toArray("[data-feature-card]", root).forEach((card) => {
          const spot = card.querySelector("[data-spot]");
          if (!spot) return;

          const setX = gsap.quickSetter(spot, "x", "px");
          const setY = gsap.quickSetter(spot, "y", "px");

          const onMove = (event) => {
            const bounds = card.getBoundingClientRect();
            setX(event.clientX - bounds.left);
            setY(event.clientY - bounds.top);
          };

          card.addEventListener("pointermove", onMove, { passive: true });
          offs.push(() => card.removeEventListener("pointermove", onMove));
        });

        return () => offs.forEach((off) => off());
      });

      return () => mm.revert();
    },
    { scope },
  );

  return (
    <section id="features" className="relative scroll-mt-24 pt-12 pb-24 sm:pt-16 sm:pb-32">
      <div ref={scope}>
        <div className="mx-auto max-w-page px-5 sm:px-10">
          <SectionHeading
            eyebrow="Features"
            title="The whole product, minus the parts nobody opens."
            description="Every capability here removes a step from something you already do. None of it is present to fill a row in a comparison table."
          />
        </div>

        {/* The rail breaks the page container on purpose: cards run to the
            viewport edge so the next one is always half-visible, which is what
            says "there is more" without a scrollbar having to. */}
        <div
          ref={trackRef}
          data-feature-rail
          role="region"
          aria-label="Product features"
          tabIndex={0}
          className={cn(
            // `items-stretch` is the flex default, but stated here because the
            // cards depend on it: it is what makes every card the height of the
            // tallest one and pins their tops to the same line.
            "dd-rail mt-6 flex snap-x snap-mandatory items-stretch gap-5 overflow-x-auto scroll-smooth lg:mt-10",
            // Vertical padding, not margin: `overflow-x: auto` forces
            // `overflow-y` to compute as auto too, so a card lifting on hover —
            // and its shadow — would be clipped and could raise a stray
            // vertical scrollbar. The margin above is reduced to match.
            // Horizontal padding is `.dd-rail`'s job: it has to track the page
            // container's edge, which no static utility can express.
            "py-8",
            // The rail is focusable so it can be scrolled from the keyboard;
            // the ring would otherwise be clipped by its own overflow.
            "focus-visible:-outline-offset-2",
          )}
        >
          <span ref={startRef} aria-hidden="true" className="w-px shrink-0" />

          {FEATURES.map((feature, index) => {
            const Icon = ICONS[feature.icon];
            const Visual = FEATURE_VISUALS[feature.id];

            return (
              <article
                key={feature.id}
                data-feature-card
                style={{
                  backgroundImage: `radial-gradient(ellipse 130% 85% at ${CARD_LIGHT[index]}% 0%, color-mix(in oklab, var(--brand) 20%, transparent) 0%, transparent 62%)`,
                }}
                className={cn(
                  "group relative flex w-[84vw] max-w-88 shrink-0 snap-start flex-col overflow-hidden",
                  "rounded-2xl border border-line-2 bg-bg-deep p-5 sm:w-88 sm:p-6",
                  "transition-[border-color,transform,box-shadow] duration-300 ease-standard",
                  "hover:-translate-y-1 hover:border-brand/35 hover:shadow-elevated",
                )}
              >
                <span
                  data-spot
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-40 -left-40 size-80 rounded-full opacity-0 blur-3xl transition-opacity duration-500 ease-standard group-hover:opacity-100"
                  style={{
                    background: "radial-gradient(circle, var(--brand-glow) 0%, transparent 70%)",
                  }}
                />

                <header className="relative flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-tint text-brand ring-1 ring-brand/25 ring-inset">
                    <Icon className="size-4.5" />
                  </span>

                  <h3 className="min-w-0 flex-1 truncate text-lg font-medium text-foreground">
                    {feature.name}
                  </h3>

                  {/* The reference puts a “go to detail” chevron here. There is
                      no detail page to go to, so the slot carries the thing that
                      is actually true of every capability: its shortcut. */}
                  <span className="flex shrink-0 items-center gap-1">
                    {feature.shortcut.map((key, at) => (
                      <Kbd key={`${feature.id}-${key}-${at}`} variant="inline">
                        {key}
                      </Kbd>
                    ))}
                  </span>
                </header>

                <p className="relative mt-4 text-md leading-normal font-medium text-foreground">
                  {feature.title}
                </p>
                <p className="relative mt-1.5 text-sm leading-[1.6] text-muted-foreground">
                  {feature.description}
                </p>

                <div className="relative mt-5 border-t border-line/70 pt-5">
                  <Visual />
                </div>
              </article>
            );
          })}

          <span ref={endRef} aria-hidden="true" className="w-px shrink-0" />
        </div>

        {/* Stacked below `sm`. Buttons are `whitespace-nowrap` by design, so on a
            320px screen this row cannot shrink: the link alone measures ~239px
            of the 280px available and the two arrows need another 96. Side by
            side they push the page 23px wider than the viewport. Given one axis
            has to give, it is the arrangement rather than the content — both
            controls survive at every width, which a `hidden sm:flex` on the
            arrows would not have managed. */}
        <div className="mx-auto mt-6 flex max-w-page flex-col gap-3 px-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-10">
          <Button
            variant="ghost"
            size="sm"
            render={<a href="#pricing" />}
            className="-ml-3 self-start"
          >
            Compare what each plan includes
            <ArrowRight />
          </Button>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {[
              { direction: -1, label: "Previous features", Icon: ChevronLeft, disabled: atStart },
              { direction: 1, label: "Next features", Icon: ChevronRight, disabled: atEnd },
            ].map(({ direction, label, Icon: Chevron, disabled }) => (
              <Button
                key={label}
                variant="secondary"
                size="icon"
                aria-label={label}
                disabled={disabled}
                onClick={() => slide(direction)}
                className="rounded-full"
              >
                <Chevron />
              </Button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
