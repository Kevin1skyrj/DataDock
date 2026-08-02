"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Menu, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { AccentPicker } from "@/components/common/accent-picker";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { BEAT, EASE } from "@/constants/motion";
import { MARKETING_NAV } from "@/constants/nav";
import { hasSeenEntrance } from "@/lib/entrance";
import { requestPalette } from "@/lib/palette-event";
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
 * At rest it is transparent and borderless so the hero's ambient light reads
 * uninterrupted; the blur and hairline fade in once the page has scrolled. The
 * scroll state comes from an IntersectionObserver on a sentinel rather than a
 * scroll listener, so nothing runs on the main thread while scrolling.
 */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const scope = useRef(null);
  const sentinelRef = useRef(null);
  const menuButtonRef = useRef(null);
  const menuId = useId();

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

  // Escape closes the menu and returns focus to the control that opened it.
  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" className="absolute top-0 h-px w-full" />

      <header
        ref={scope}
        className={cn(
          "sticky top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ease-standard",
          "border-b",
          scrolled
            ? "border-line bg-[color-mix(in_oklab,var(--background)_78%,transparent)] backdrop-blur-[14px]"
            : "border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto flex h-16 max-w-page items-center justify-between gap-8 px-5 sm:px-10">
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
            {/* Reads as a command bar, not a text field: fixed width so it
                never looks like it wants typing, the shortcut carried inside
                it, and the accent surfacing on hover to signal it opens
                something rather than accepting input. */}
            <button
              type="button"
              onClick={requestPalette}
              aria-label="Open command palette"
              className={cn(
                "group hidden w-56 items-center gap-2 rounded-md border border-line bg-surface py-1.5 pr-1.5 pl-3 md:flex",
                "shadow-[0_1px_0_var(--lit)_inset] transition-[border-color,background-color,box-shadow] duration-200 ease-standard",
                "hover:border-brand/40 hover:bg-surface-2 hover:shadow-[0_1px_0_var(--lit)_inset,0_0_0_3px_var(--brand-soft)]",
              )}
            >
              <Search className="size-4 shrink-0 text-dim transition-colors duration-200 ease-standard group-hover:text-brand" />
              <span className="flex-1 text-left text-base text-muted-foreground">
                Search or jump to…
              </span>
              <Kbd className="transition-colors duration-200 ease-standard group-hover:border-brand/40 group-hover:text-brand">
                ⌘K
              </Kbd>
            </button>

            <AccentPicker className="hidden sm:inline-flex" />
            <ThemeToggle className="hidden sm:inline-flex" />

            <Button variant="ghost" size="sm" render={<a href="/login" />} className="hidden sm:inline-flex">
              Log in
            </Button>

            <Button size="sm" render={<a href="#pricing" />} className="hidden sm:inline-flex">
              Get started
            </Button>

            <Button
              ref={menuButtonRef}
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {/* Grid-rows collapse animates height without measuring it, so the
            panel adapts to its content at any breakpoint. Because a collapsed
            grid row is not display:none, the panel stays in the accessibility
            tree — `inert` takes it out of both the tab order and the a11y tree,
            which also stops it duplicating the navigation landmark. */}
        <div
          id={menuId}
          inert={!menuOpen}
          className={cn(
            "grid overflow-hidden transition-[grid-template-rows] duration-300 ease-standard lg:hidden",
            menuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="min-h-0">
            <nav
              aria-label="Primary"
              className="flex flex-col gap-1 border-t border-line bg-[color-mix(in_oklab,var(--background)_92%,transparent)] px-5 py-4 backdrop-blur-[14px] sm:px-10"
            >
              {MARKETING_NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md px-2 py-2.5 text-md text-muted-foreground transition-colors duration-200 ease-standard hover:bg-surface hover:text-foreground"
                >
                  {item.label}
                </a>
              ))}

              <div className="mt-3 flex items-center gap-2 sm:hidden">
                <Button
                  variant="secondary"
                  size="sm"
                  render={<a href="/login" />}
                  className="flex-1"
                >
                  Log in
                </Button>
                <Button
                  size="sm"
                  render={<a href="#pricing" />}
                  className="flex-1"
                >
                  Get started
                </Button>
                <AccentPicker />
                <ThemeToggle />
              </div>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}
