"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

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
      const onClick = (event) => {
        if (event.defaultPrevented || event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        const link = event.target.closest?.('a[href^="#"]');
        if (!link) return;

        const id = link.getAttribute("href");
        if (!id || id === "#") return;

        const target = document.querySelector(id);
        if (!target) return;

        event.preventDefault();

        const offset = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
        smoother.scrollTo(target, true, `top ${offset}px`);

        // The URL should still change — the link is a link, and a visitor
        // should be able to copy it or use the back button afterwards.
        window.history.pushState(null, "", id);
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
