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
    <div className="mt-6">
      <p className="flex items-baseline gap-1.5">
        <span className="text-display-lg font-semibold tracking-tighter text-foreground tabular-nums">
          ₹{plan.monthly}
        </span>
        <span className="text-md text-dim">/ month</span>
      </p>
      <p className="mt-2 text-xs text-dim">
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
    <section id="pricing" className="relative scroll-mt-24 pt-12 pb-24 sm:pt-16 sm:pb-32">
      <div ref={scope} className="mx-auto max-w-page px-5 sm:px-10">
        <SectionHeading
          eyebrow="Pricing"
          title="Start free. Upgrade when your drive says so."
          description="No seat minimums, annual lock-in or sales call. Choose the room your files need."
        />

        <div data-plan-grid className="mt-12 grid gap-5 lg:mt-14 lg:grid-cols-3 lg:items-center">
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              data-plan
              className={cn(
                "group relative flex flex-col rounded-2xl p-6 sm:p-7",
                "transition-[border-color,transform,box-shadow] duration-300 ease-standard hover:-translate-y-1",
                plan.featured
                  ? "border border-brand/35 bg-overlay shadow-[var(--elevation),0_20px_60px_-24px_var(--brand-glow)] lg:py-10 hover:border-brand/55 hover:shadow-[var(--elevation-hover),0_28px_70px_-24px_var(--brand-glow)]"
                  : "border border-line bg-surface shadow-[0_1px_0_var(--lit)_inset] hover:border-brand/30 hover:shadow-elevated",
              )}
            >
              {plan.featured ? (
                <Badge variant="brand" pill size="sm" className="absolute -top-2.5 left-6 tracking-wider uppercase sm:left-7">
                  Most popular
                </Badge>
              ) : null}

              <h3 className="text-xl font-medium text-foreground">{plan.name}</h3>
              <p className="mt-1.5 text-md leading-[1.6] text-muted-foreground">{plan.tagline}</p>
              <Price plan={plan} />

              <Button
                size="lg"
                variant={plan.featured ? "primary" : "secondary"}
                render={<Link href="/register" />}
                className={cn("mt-6 w-full", plan.featured && "dd-shine")}
              >
                {plan.cta}
              </Button>

              <div className="mt-7 border-t border-line/70 pt-6">
                <p className="text-xs tracking-widest text-dim uppercase">
                  {plan.inherits ? `Everything in ${plan.inherits}, plus` : "Includes"}
                </p>
                <ul className="mt-4 flex flex-col gap-3">
                  {plan.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-md text-muted-foreground">
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
