"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Check } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

import { SectionHeading } from "@/components/common/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PLANS, PRICING_FOOTNOTE } from "@/constants/pricing";
import { revealOnScroll } from "@/lib/reveal";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

function Price({ plan }) {
  return (
    <div className="mt-7">
      <p className="flex items-baseline gap-1.5">
        <span className="text-display-lg font-semibold tracking-tighter text-foreground tabular-nums">
          ₹{plan.monthly}
        </span>
        <span className="text-md text-dim">/ month</span>
      </p>
      <p className="mt-2 text-base text-dim">
        {plan.monthly === 0 ? "Free forever" : "Billed monthly"}
      </p>
    </div>
  );
}

export function Pricing() {
  const scope = useRef(null);

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return undefined;
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        revealOnScroll("[data-section-heading] > *", "head", { scope: root, trigger: root });
        revealOnScroll("[data-plan]", "body", { scope: root, trigger: "[data-plan-grid]" });
      });

      return () => mm.revert();
    },
    { scope },
  );

  return (
    <section id="pricing" className="relative scroll-mt-24 pt-12 pb-20 sm:pt-16 sm:pb-28">
      <div ref={scope} className="mx-auto max-w-page px-5 sm:px-10">
        <SectionHeading
          eyebrow="Pricing"
          title="Simple plans that grow with your files."
          description="Start free and upgrade only when you need more storage. Every paid plan renews monthly with no annual commitment."
        />

        <div data-plan-grid className="mt-10 grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              data-plan
              className={cn(
                "relative flex h-full flex-col rounded-2xl border bg-bg-deep p-6 transition-colors duration-300 ease-standard sm:p-7",
                plan.featured
                  ? "border-brand/45 bg-surface hover:border-brand/65"
                  : "border-line-2 hover:border-line-strong hover:bg-surface",
              )}
            >
              {plan.featured ? (
                <Badge variant="brand" pill size="sm" className="absolute -top-2.5 left-6 tracking-wider uppercase sm:left-7">
                  Most popular
                </Badge>
              ) : null}

              <h3 className="text-xl font-medium text-foreground">{plan.name}</h3>
              <p className="mt-2 min-h-11 text-base leading-[1.65] text-muted-foreground">
                {plan.tagline}
              </p>
              <Price plan={plan} />

              <Button
                size="lg"
                variant={plan.featured ? "primary" : "secondary"}
                render={<Link href="/register" />}
                className="mt-7 w-full"
              >
                {plan.cta}
              </Button>

              <div className="mt-7 border-t border-line/70 pt-6">
                <p className="text-sm tracking-widest text-dim uppercase">
                  {plan.inherits ? `Everything in ${plan.inherits}, plus` : "Includes"}
                </p>
                <ul className="mt-4 flex flex-col gap-3">
                  {plan.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-base leading-[1.55] text-muted-foreground">
                      <span className={cn("mt-0.5 grid size-4 shrink-0 place-items-center rounded-full", plan.featured ? "bg-brand-tint text-brand" : "bg-surface-2 text-dim")}>
                        <Check className="size-2.5" strokeWidth={3} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-xl text-center text-base text-balance text-dim">
          {PRICING_FOOTNOTE}
        </p>
      </div>
    </section>
  );
}
