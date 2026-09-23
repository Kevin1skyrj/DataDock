"use client";

import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CTA, CTA_POINTS } from "@/constants/cta";

/**
 * A deliberately quiet close to the landing page. It has no pointer tracking
 * or client-side animation, so the final decision point stays clear and fast.
 */
export function FinalCta() {
  return (
    <section id="get-started" className="relative scroll-mt-24 pt-12 pb-20 sm:pt-16 sm:pb-28">
      <div className="mx-auto max-w-page px-5 sm:px-10">
        <div className="rounded-2xl border border-line-2 bg-bg-deep px-6 py-14 text-center sm:px-14 sm:py-20 lg:px-20">
          <div className="mx-auto flex max-w-2xl flex-col items-center">
            <h2 className="text-display-md font-semibold tracking-tighter text-balance sm:text-display-lg lg:text-display-xl">
              {CTA.title}
            </h2>

            <p className="mt-5 text-lg leading-[1.65] text-muted-foreground text-balance sm:text-2xl">
              {CTA.description}
            </p>

            <div className="mt-9 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
              <Button
                size="lg"
                render={<a href={CTA.primary.href} />}
                className="w-full sm:w-auto"
              >
                {CTA.primary.label}
                <ArrowRight />
              </Button>

              <Button
                size="lg"
                variant="secondary"
                render={<a href={CTA.secondary.href} />}
                className="w-full sm:w-auto"
              >
                {CTA.secondary.label}
              </Button>
            </div>

            <ul className="mt-8 flex flex-col items-center gap-2.5 text-md text-dim sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-5">
              {CTA_POINTS.map((point) => (
                <li key={point} className="flex items-center gap-1.5">
                  <Check className="size-3.5 shrink-0 text-brand" strokeWidth={2.5} />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
