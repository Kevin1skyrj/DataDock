"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Eye,
  FileText,
  FolderOpen,
  FolderTree,
  Gauge,
  Link2,
  RotateCcw,
  Search,
} from "lucide-react";
import { useRef } from "react";

import { SectionHeading } from "@/components/common/section-heading";
import { FEATURES, PREVIEW_KINDS } from "@/constants/features";
import { EASE } from "@/constants/motion";
import { PREVIEW_STORAGE } from "@/constants/preview-data";
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

/* ------------------------------------------------------------------ proof --
   A single row under each card showing the capability as product rather than
   as prose. Six cards of icon-title-paragraph is a wall; one line of real
   interface each is what makes the grid read as software.
   -------------------------------------------------------------------------- */

const PROOF = {
  search: (
    <span className="flex items-center gap-2 text-xs">
      <FileText className="size-3.5 shrink-0 text-dim" />
      <span className="truncate text-muted-foreground">
        Q3 <mark className="rounded-xs bg-brand-tint px-0.5 text-brand">invo</mark>ice —
        Northline.pdf
      </span>
      <span className="ml-auto shrink-0 font-mono text-2xs text-dim">12ms</span>
    </span>
  ),

  share: (
    <span className="flex items-center gap-2 text-xs">
      <Link2 className="size-3.5 shrink-0 text-brand" />
      <span className="truncate font-mono text-2xs text-brand">datadock.app/s/9fK2xQ</span>
      <span className="ml-auto shrink-0 text-2xs text-dim">14 days</span>
    </span>
  ),

  organize: (
    <span className="flex items-center gap-1.5">
      {["Client work", "Invoices", "Archive"].map((folder, index) => (
        <span
          key={folder}
          className={cn(
            "inline-flex items-center gap-1.5 truncate rounded-md px-2 py-1 text-2xs",
            index === 0
              ? "bg-brand-tint text-foreground ring-1 ring-brand/25 ring-inset"
              : "border border-line/70 text-dim",
          )}
        >
          <FolderOpen className={cn("size-3 shrink-0", index === 0 ? "text-brand" : "text-dim")} />
          {folder}
        </span>
      ))}
    </span>
  ),

  storage: (
    <span className="flex items-center gap-3">
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
        {/* Rests at its real value and is animated *from* zero, so reduced
            motion and a failed script both show a full bar rather than an
            empty one. The hero's meter can start at zero because GSAP always
            fills it; this one only fills on scroll. */}
        <span
          data-feature-bar
          className="block h-full origin-left rounded-full bg-brand"
          style={{ transform: `scaleX(${PREVIEW_STORAGE.percent / 100})` }}
        />
      </span>
      <span className="shrink-0 font-mono text-2xs text-brand">{PREVIEW_STORAGE.percent}%</span>
    </span>
  ),

  trash: (
    <span className="flex items-center gap-2 text-xs">
      <FileText className="size-3.5 shrink-0 text-dim" />
      <span className="truncate text-muted-foreground">Statement of work.docx</span>
      <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-2xs text-brand">
        <RotateCcw className="size-3" />
        Restore
      </span>
    </span>
  ),

  preview: (
    <span className="flex flex-wrap items-center gap-1.5">
      {PREVIEW_KINDS.map((kind) => (
        <span
          key={kind}
          className="rounded-sm border border-line/70 px-1.5 py-0.5 font-mono text-2xs text-dim"
        >
          {kind}
        </span>
      ))}
    </span>
  ),
};

/* --------------------------------------------------------------- section -- */

export function Features() {
  const scope = useRef(null);

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return undefined;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-section-heading] > *", {
          opacity: 0,
          y: 18,
          duration: 0.8,
          stagger: 0.09,
          ease: EASE.entrance,
          scrollTrigger: { trigger: root, start: "top 78%", once: true },
        });

        gsap.from("[data-feature-card]", {
          opacity: 0,
          y: 22,
          duration: 0.75,
          // Row by row rather than one long sweep: at three columns a flat
          // stagger makes the last card arrive noticeably late.
          stagger: { each: 0.06, grid: "auto", from: "start" },
          ease: EASE.entrance,
          scrollTrigger: { trigger: "[data-feature-grid]", start: "top 85%", once: true },
        });

        gsap.from("[data-feature-bar]", {
          scaleX: 0,
          duration: 1.2,
          ease: EASE.glide,
          scrollTrigger: { trigger: "[data-feature-grid]", start: "top 70%", once: true },
        });
      });

      // The light under the cursor is the one interaction here, so it is worth
      // doing properly: `quickSetter` writes the transform with no tween at
      // all, and the fade-in is left to CSS. A pointer that has to drag a glow
      // behind it feels like lag, not polish.
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
      <div ref={scope} className="mx-auto max-w-page px-5 sm:px-10">
        <SectionHeading
          eyebrow="Features"
          title="The whole product, minus the parts nobody opens."
          description="Every capability here removes a step from something you already do. None of it is present to fill a row in a comparison table."
        />

        <div
          data-feature-grid
          className="mt-14 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:mt-18 lg:grid-cols-3"
        >
          {FEATURES.map((feature) => {
            const Icon = ICONS[feature.icon];

            return (
              <article
                key={feature.id}
                data-feature-card
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-xl border border-line bg-surface p-6",
                  "shadow-[0_1px_0_var(--lit)_inset]",
                  "transition-[border-color,transform,box-shadow] duration-300 ease-standard",
                  "hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-elevated",
                )}
              >
                {/* Centred on the card's origin so the tracked offset is the
                    pointer position, with nothing to subtract. */}
                <span
                  data-spot
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-32 -left-32 size-64 rounded-full opacity-0 blur-3xl transition-opacity duration-500 ease-standard group-hover:opacity-100"
                  style={{
                    background: "radial-gradient(circle, var(--brand-glow) 0%, transparent 70%)",
                  }}
                />

                <span className="relative grid size-10 place-items-center rounded-lg bg-surface-2 text-dim transition-colors duration-300 ease-standard group-hover:bg-brand-tint group-hover:text-brand">
                  <Icon className="size-5" />
                </span>

                <h3 className="relative mt-5 text-xl font-medium text-foreground">
                  {feature.title}
                </h3>

                {/* The paragraph owns the minimum gap; `mt-auto` below absorbs
                    whatever is left over. */}
                <p className="relative mt-2 mb-6 text-md leading-[1.6] text-muted-foreground">
                  {feature.description}
                </p>

                {/* Pushed to the bottom so the proof rows line up across a row
                    of cards whose copy runs to different lengths. */}
                <div className="relative mt-auto border-t border-line/70 pt-4">
                  {PROOF[feature.id]}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
