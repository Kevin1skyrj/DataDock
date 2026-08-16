"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

gsap.registerPlugin(useGSAP, ScrollSmoother, ScrollToPlugin, ScrollTrigger);

/**
 * Inertial scrolling for the marketing site.
 *
 * ScrollSmoother rather than a standalone smooth-scroll library, because ten
 * files on this page already drive their animations from ScrollTrigger — the
 * parallax, the pinned sections, every reveal. A library that hijacks scroll
 * without ScrollTrigger's knowledge leaves those reading a scroll position that
 * no longer matches what is on screen, and the whole page desynchronises. These
 * two are built to share a ticker.
 *
 * It works by transforming `#smooth-content` while the page keeps a real
 * scrollbar, which has one consequence that shapes the layout around it:
 * `position: fixed` and `sticky` resolve against a transformed ancestor rather
 * than the viewport, so anything meant to stay put has to live *outside* the
 * content. That is why the header and the ambient light are rendered by the
 * marketing layout and not by the page.
 *
 * Not applied to the dashboard. That is somewhere people work, and weighting
 * the scroll of a file list makes it feel like the machine is behind you —
 * the opposite of what the shell is built for.
 */
export function SmoothScroll({ children }) {
  const wrapper = useRef(null);
  const content = useRef(null);
  const pathname = usePathname();

  /**
   * Where a new page starts.
   *
   * This component belongs to the layout, so moving between marketing pages
   * never remounts it and never resets anything by itself. The smoother keeps
   * its own scroll position across the navigation, which produces the wrong
   * answer in both directions: arriving at `/#pricing` did nothing, and
   * arriving at `/about` from halfway down the landing page opened it halfway
   * down too — or, because About is the shorter document, clamped to its very
   * bottom.
   *
   * So the rule is stated here rather than left to the browser. A hash means
   * the section it names; no hash means the top, immediately, the way opening a
   * page is supposed to feel.
   *
   * The first run is skipped deliberately. On a fresh load the browser has
   * already restored a position, or honoured a hash in the address bar, and
   * overriding that would throw away a reload's place in the page.
   */
  const navigated = useRef(false);

  useEffect(() => {
    const firstRender = !navigated.current;
    navigated.current = true;

    const hash = window.location.hash;
    if (firstRender && !hash) return undefined;

    // The delay is not decoration: the new page has to lay out and
    // ScrollTrigger has to remeasure against its height before any position
    // here means anything.
    const id = window.setTimeout(() => {
      const smoother = ScrollSmoother.get();
      ScrollTrigger.refresh();

      const target = hash ? document.querySelector(hash) : null;

      if (target) {
        const offset = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
        if (smoother) smoother.scrollTo(target, true, `top ${offset}px`);
        else target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      if (firstRender) return;

      // A new page opens at its beginning, and does so instantly — animating
      // the scroll would look like the previous page sliding away rather than
      // a different one arriving.
      if (smoother) smoother.scrollTo(0, false);
      else window.scrollTo(0, 0);
    }, 260);

    return () => window.clearTimeout(id);
  }, [pathname]);

  useGSAP(
    () => {
      // Never for someone who asked for less motion. Smooth scrolling is the
      // single most likely thing on this page to cause discomfort, and it is
      // also the one an operating system preference most clearly covers.
      const reduced =
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        document.documentElement.dataset.reduceMotion === "1";

      if (reduced) return undefined;

      // Touch devices already scroll with momentum, supplied by the platform
      // and tuned to the hardware. Adding a second easing layer on top is what
      // makes a phone feel like it is lagging behind your thumb.
      const smoother = ScrollSmoother.create({
        wrapper: wrapper.current,
        content: content.current,
        // Seconds of catch-up. Beyond about 1.5 the page stops feeling weighted
        // and starts feeling unresponsive — the point where a scroll no longer
        // reads as a reply to the gesture.
        smooth: 1.15,
        smoothTouch: false,
        // Lets any element opt into a different rate with `data-speed` or
        // `data-lag`, which is how the existing parallax layers can eventually
        // move off their own ScrollTriggers.
        effects: true,
        // Routes the wheel through GSAP's ticker so scroll-linked animation
        // updates on the same frame as the scroll itself, rather than a frame
        // behind it.
        normalizeScroll: true,
        ignoreMobileResize: true,
      });

      /**
       * Anchor navigation, routed through the smoother.
       *
       * Left alone, a `#pricing` link is a native jump: the browser sets
       * `scrollTop` directly and the smoother spends the next second catching
       * up from wherever it was, which reads as a lurch followed by a drift.
       * Handing the target to `scrollTo` instead makes the trip one continuous
       * eased move.
       *
       * The offset matches the `scroll-mt-24` the sections already carry, so a
       * heading never lands underneath the fixed header.
       */
      const scrollToHash = (hash) => {
        const target = hash && hash !== "#" ? document.querySelector(hash) : null;
        if (!target) return false;
        const offset = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
        smoother.scrollTo(target, true, `top ${offset}px`);
        return true;
      };

      const onClick = (event) => {
        if (event.defaultPrevented || event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        const link = event.target.closest?.("a[href]");
        if (!link || link.target === "_blank") return;

        // Resolved against the current document, so `#how`, `/#how` and a full
        // URL are all judged the same way.
        const url = new URL(link.href, window.location.href);
        if (url.origin !== window.location.origin) return;

        // A link to a *different* page is a navigation, even when it carries a
        // hash. Intercepting those was the bug: from `/about`, "Pricing" was
        // handled here, found no `#pricing` in the document, and left the
        // visitor exactly where they were.
        if (url.pathname !== window.location.pathname) return;
        if (!url.hash) return;

        if (!scrollToHash(url.hash)) return;
        event.preventDefault();

        // The URL should still change — the link is a link, and a visitor
        // should be able to copy it or use the back button afterwards.
        window.history.pushState(null, "", url.hash);
      };

      document.addEventListener("click", onClick);

      return () => {
        document.removeEventListener("click", onClick);
        smoother.kill();
      };
    },
    { scope: wrapper },
  );

  return (
    <div id="smooth-wrapper" ref={wrapper}>
      <div id="smooth-content" ref={content}>
        {children}
      </div>
    </div>
  );
}
