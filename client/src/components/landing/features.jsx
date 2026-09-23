"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Eye, FolderTree, Gauge, Link2, RotateCcw, Search } from "lucide-react";
import { useRef } from "react";

import { SectionHeading } from "@/components/common/section-heading";
import { FEATURE_VISUALS } from "@/components/landing/feature-visuals";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { FEATURES } from "@/constants/features";
import { revealOnScroll } from "@/lib/reveal";

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

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return undefined;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        revealOnScroll("[data-section-heading] > *", "head", { scope: root, trigger: root });
        revealOnScroll("[data-feature-card]", "body", {
          scope: root,
          trigger: "[data-feature-grid]",
        });
      });

      return () => mm.revert();
    },
    { scope },
  );

  return (
    <section id="features" className="relative scroll-mt-24 pt-12 pb-20 sm:pt-16 sm:pb-28">
      <div ref={scope} className="mx-auto max-w-page px-5 sm:px-10">
        <SectionHeading
          eyebrow="Features"
          title="Everything you need to stay organized."
          description="Find files instantly, organize work clearly, share securely, and keep storage under control without adding complexity."
        />

        <div
          data-feature-grid
          role="list"
          aria-label="Product features"
          className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5"
        >
          {FEATURES.map((feature) => {
            const Icon = ICONS[feature.icon];
            const Visual = FEATURE_VISUALS[feature.id];

            return (
              <article
                key={feature.id}
                data-feature-card
                role="listitem"
                className="flex min-h-full flex-col overflow-hidden rounded-2xl border border-line-2 bg-bg-deep p-5 transition-colors duration-300 ease-standard hover:border-line-strong hover:bg-surface sm:p-6"
              >
                <header className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-tint text-brand ring-1 ring-brand/25 ring-inset">
                    <Icon className="size-4.5" />
                  </span>

                  <h3 className="min-w-0 flex-1 truncate text-xl font-medium text-foreground">
                    {feature.name}
                  </h3>

                  <span className="flex shrink-0 items-center gap-1">
                    {feature.shortcut.map((key, at) => (
                      <Kbd key={`${feature.id}-${key}-${at}`} variant="inline">
                        {key}
                      </Kbd>
                    ))}
                  </span>
                </header>

                <p className="mt-5 text-lg leading-normal font-medium text-foreground">
                  {feature.title}
                </p>
                <p className="mt-2 text-base leading-[1.65] text-muted-foreground">
                  {feature.description}
                </p>

                <div className="mt-6 border-t border-line/70 pt-5 lg:mt-auto">
                  <Visual />
                </div>
              </article>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="sm"
          render={<a href="#pricing" />}
          className="mt-7 -ml-3"
        >
          Compare what each plan includes
          <ArrowRight />
        </Button>
      </div>
    </section>
  );
}
