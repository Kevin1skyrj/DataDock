"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";
import { useRef, useState } from "react";

import { SectionHeading } from "@/components/common/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ANNUAL_SAVING, BILLING, PLANS, PRICING_FOOTNOTE } from "@/constants/pricing";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { revealOnScroll } from "@/lib/reveal";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/* --------------------------------------------------------------- billing -- */

/**
 * Segmented control rather than a switch: two named options read faster than
 * an on/off whose meaning depends on which side is lit. The indicator is a
 * plain 50% slide, so nothing has to be measured for it to land correctly.
 */
function BillingToggle({ period, onChange }) {
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row">
      <div
        role="radiogroup"
        aria-label="Billing period"
        className="relative inline-flex rounded-full border border-line bg-surface p-1 shadow-[0_1px_0_var(--lit)_inset]"
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-brand-tint ring-1 ring-brand/25 ring-inset",
            "transition-transform duration-300 ease-out-expo",
            period === "annual" && "translate-x-full",
          )}
        />

        {BILLING.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={period === option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              "relative z-10 rounded-full px-4 py-1.5 text-sm transition-colors duration-200 ease-standard",
              period === option.id ? "text-foreground" : "text-dim hover:text-muted-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <Badge variant="brand" pill size="sm">
        {ANNUAL_SAVING}
      </Badge>
    </div>
  );
}

/* ----------------------------------------------------------------- price -- */

function Price({ plan, period, reduced }) {
  const amount = period === "annual" ? plan.annual : plan.monthly;

  const note =
    plan.monthly === 0
      ? "Free forever"
      : period === "annual"
        ? `$${plan.yearly} billed yearly`
        : "Billed monthly";

  return (
    <div className="mt-6">
      <p className="flex items-baseline gap-1.5">
        {/* popLayout takes the outgoing figure out of flow, so the digits swap
            in place instead of pushing the “/month” suffix sideways. */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={amount}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: reduced ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="text-display-lg font-semibold tracking-tighter text-foreground tabular-nums"
          >
            ${amount}
          </motion.span>
        </AnimatePresence>

        <span className="text-md text-dim">/ month</span>
      </p>

      {/* Fixed height: the note changes with the toggle, and a card that grows
          a line taller would shove the whole row down. */}
      <p className="mt-2 h-4 text-xs text-dim">{note}</p>
    </div>
  );
}

/* --------------------------------------------------------------- section -- */

export function Pricing() {
  const scope = useRef(null);
  const [period, setPeriod] = useState("monthly");
  const reduced = usePrefersReducedMotion();

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
          description="No seat minimums, no annual lock-in, no sales call. Every plan is the whole product — the difference is how much room you get."
        />

        <div className="mt-8 flex justify-center">
          <BillingToggle period={period} onChange={setPeriod} />
        </div>

        {/* `items-center` lets the featured card be taller than its siblings
            without dragging their tops down with it. */}
        <div
          data-plan-grid
          className="mt-12 grid gap-5 lg:mt-14 lg:grid-cols-3 lg:items-center"
        >
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              data-plan
              className={cn(
                "group relative flex flex-col rounded-2xl p-6 sm:p-7",
                "transition-[border-color,transform,box-shadow] duration-300 ease-standard",
                "hover:-translate-y-1",
                plan.featured
                  ? // Pro carries the hierarchy three ways at once: a lit
                    // border, a heavier surface, and more vertical room than
                    // its neighbours. Any one alone reads as a styling accident.
                    "border border-brand/35 bg-overlay shadow-[var(--elevation),0_20px_60px_-24px_var(--brand-glow)] lg:py-10 hover:border-brand/55 hover:shadow-[var(--elevation-hover),0_28px_70px_-24px_var(--brand-glow)]"
                  : "border border-line bg-surface shadow-[0_1px_0_var(--lit)_inset] hover:border-brand/30 hover:shadow-elevated",
              )}
            >
              {plan.featured ? (
                <Badge
                  variant="brand"
                  pill
                  size="sm"
                  className="absolute -top-2.5 left-6 tracking-wider uppercase sm:left-7"
                >
                  Most popular
                </Badge>
              ) : null}

              <h3 className="text-xl font-medium text-foreground">{plan.name}</h3>
              <p className="mt-1.5 text-md leading-[1.6] text-muted-foreground">{plan.tagline}</p>

              <Price plan={plan} period={period} reduced={reduced} />

              <Button
                size="lg"
                variant={plan.featured ? "primary" : "secondary"}
                render={<a href="/register" />}
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
                      <span
                        className={cn(
                          "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full",
                          plan.featured ? "bg-brand-tint text-brand" : "bg-surface-2 text-dim",
                        )}
                      >
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
