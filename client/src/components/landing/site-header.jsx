"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { AccentPicker } from "@/components/common/accent-picker";
import { CommandTrigger } from "@/components/common/command-trigger";
import { HEADER_GUTTER, HeaderIsland } from "@/components/common/header-island";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BEAT, EASE } from "@/constants/motion";
import { MARKETING_NAV } from "@/constants/nav";
import { useMediaQuery } from "@/hooks/use-media-query";
import { hasSeenEntrance } from "@/lib/entrance";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

/** Underline that grows from the cursor's side and retreats the way it came. */
const NAV_LINK =
  "relative text-base text-muted-foreground transition-colors duration-200 ease-standard hover:text-foreground " +
  "after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 " +
  "after:bg-brand after:transition-transform after:duration-300 after:ease-out-expo " +
  "hover:after:origin-left hover:after:scale-x-100 focus-visible:after:origin-left focus-visible:after:scale-x-100";

/**
 * The marketing header.
 *
 * A floating island rather than a bar pinned to the top edge. A full-width bar
 * cuts the page in two at the very moment the hero is trying to open; an island
 * sits *in* the page instead of across it, and the ambient light carries on
 * around and behind it.
 *
 * The island is always present rather than materialising on scroll — it reads
 * as a piece of chrome, and chrome that appears out of nothing is a trick. What
 * scrolling changes is depth: the surface firms up, the hairline strengthens,
 * and it lifts onto the elevation shadow, because by then there is content
 * passing underneath that it needs to be clearly in front of.
 *
 * Its outer edge sits exactly on the page container, so it lines up with the
 * hero below it and with the window on the authentication screens. The inner
 * padding is deliberately asymmetric: `pl-10` puts the wordmark precisely on
 * the hero's text column, while the right side tucks in closer because it ends
 * in a filled button that supplies its own visual mass.
 *
 * The scroll state comes from an IntersectionObserver on a sentinel rather than
 * a scroll listener, so nothing runs on the main thread while scrolling.
 */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const scope = useRef(null);
  const sentinelRef = useRef(null);

  // Openness is derived rather than stored, the same way the dashboard shell
  // derives its drawer. Growing past `lg` restores the real navigation, so the
  // sheet closes itself — Base UI unmounts it and releases the scroll lock —
  // without an effect watching the viewport and without a resize leaving the
  // page locked behind a panel that is no longer visible.
  const compact = useMediaQuery("(max-width: 1023.98px)");
  const sheetOpen = menuOpen && compact;

  // The header settles in first, before anything in the hero. Its initial
  // state is CSS gated on data-motion, so a JavaScript failure leaves a fully
  // composed header rather than an invisible one.
  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;

      try {
        const mm = gsap.matchMedia();

        mm.add("(prefers-reduced-motion: no-preference)", () => {
          if (hasSeenEntrance()) return;

          const items = gsap.utils.toArray("[data-animate='nav']", root);
          if (!items.length) return;

          gsap.to(items, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.06,
            delay: BEAT.nav,
            ease: EASE.entrance,
            onComplete: () => {
              items.forEach((item) => item.removeAttribute("data-animate"));
              gsap.set(items, { clearProps: "all" });
            },
          });
        });

        return () => mm.revert();
      } catch {
        document.documentElement.removeAttribute("data-motion");
        return undefined;
      }
    },
    { scope },
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    // The root renders no element of its own — it is the context the trigger and
    // the panel find each other through — so it stands in for the fragment
    // rather than adding a wrapper around the header.
    <Sheet open={sheetOpen} onOpenChange={setMenuOpen}>
      <div ref={sentinelRef} aria-hidden="true" className="absolute top-0 h-px w-full" />

      <header ref={scope} className={cn("sticky top-0 z-50", HEADER_GUTTER)}>
        <HeaderIsland scrolled={scrolled}>
          <div className="flex items-center gap-10">
            <a
              href="#top"
              data-animate="nav"
              className="text-xl font-semibold tracking-tight text-foreground hover:text-foreground"
            >
              DataDock
            </a>

            <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
              {MARKETING_NAV.map((item) => (
                <a key={item.href} href={item.href} data-animate="nav" className={NAV_LINK}>
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <div data-animate="nav" className="flex items-center gap-2">
            <CommandTrigger label="Search or jump to…" className="hidden w-56 md:flex" />

            <AccentPicker className="hidden sm:inline-flex" />
            <ThemeToggle className="hidden sm:inline-flex" />

            {/* A real route, so a real Link. An `<a>` here would tear the whole
                document down and rebuild it — new paint, new fonts, the ambient
                light restarting — which is precisely the seam the authentication
                screens are built to avoid. */}
            <Button variant="ghost" size="sm" render={<Link href="/login" />} className="hidden sm:inline-flex">
              Log in
            </Button>

            <Button size="sm" render={<a href="#pricing" />} className="hidden sm:inline-flex">
              Get started
            </Button>

            {/* `aria-expanded` and `aria-controls` are wired by the primitive
                from the trigger/popup pair, so they are no longer spelled out
                here — and cannot fall out of step with the panel they describe. */}
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Open menu">
                  <Menu />
                </Button>
              }
            />
          </div>
        </HeaderIsland>
      </header>

      {/* The panel this replaced lived in the document, inside a sticky header,
          and grew it — which is what pushed the hero down the page every time
          the menu opened. This one is portalled and fixed, so it covers the page
          instead of displacing it. It sits outside the header for the same
          reason: it is no longer part of it. */}
      <SheetContent showClose={false} aria-label="Menu">
        <SheetTitle className="sr-only">Menu</SheetTitle>

        {/* Matches the island's height and gutter exactly, so the wordmark
            does not move when the sheet opens over it. */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center justify-between",
            "px-9 sm:px-14",
          )}
        >
          <span className="text-xl font-semibold tracking-tight text-foreground">
            DataDock
          </span>

          <SheetClose
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Close menu">
                <X />
              </Button>
            }
          />
        </div>

        <nav
          aria-label="Primary"
          className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-5 py-6 sm:px-10"
        >
          {MARKETING_NAV.map((item, index) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              style={{ animationDelay: `${70 + index * 55}ms` }}
              className={cn(
                "group flex items-center justify-between gap-4 rounded-lg px-4 py-4",
                "text-display-xs font-medium tracking-tight text-foreground",
                "transition-colors duration-200 ease-standard hover:bg-surface",
                "motion-safe:animate-[dd-sheet-item_460ms_var(--ease-out-expo)_both]",
              )}
            >
              {item.label}
              <ArrowRight
                className="size-4 text-dim transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5 group-hover:text-brand"
                aria-hidden="true"
              />
            </a>
          ))}
        </nav>

        {/* Pinned to the bottom edge, where a thumb actually reaches. The
            safe-area inset keeps the primary action clear of the home
            indicator on a notched phone. */}
        <div
          style={{
            animationDelay: `${70 + MARKETING_NAV.length * 55}ms`,
            paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
          }}
          className={cn(
            "flex shrink-0 flex-col gap-3 border-t border-line px-5 pt-5 sm:px-10",
            "motion-safe:animate-[dd-sheet-item_460ms_var(--ease-out-expo)_both]",
          )}
        >
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="lg"
              render={<Link href="/login" />}
              className="flex-1"
              onClick={() => setMenuOpen(false)}
            >
              Log in
            </Button>

            <Button
              size="lg"
              render={<a href="#pricing" />}
              className="flex-1"
              onClick={() => setMenuOpen(false)}
            >
              Get started
            </Button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-sm text-dim">Appearance</span>
            <div className="flex items-center gap-2">
              <AccentPicker />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
