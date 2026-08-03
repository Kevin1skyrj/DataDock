"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

import {
  PreviewFileHeader,
  PreviewFileRow,
  PreviewSidebar,
} from "@/components/landing/preview-parts";
import { AUTH_WINDOW } from "@/constants/auth";
import { EASE } from "@/constants/motion";
import { PREVIEW_FILES, PREVIEW_STORAGE } from "@/constants/preview-data";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

/**
 * The application window that authentication happens inside.
 *
 * The brief was that signing in should feel like entering DataDock rather than
 * visiting a second website, and a card centred on an empty page cannot say
 * that — a card is a card wherever it appears. So this is not a page with a
 * form on it; it is the product, running, with a sheet over the top of it. The
 * drive behind the glass is the same sidebar, the same file table and the same
 * storage meter the landing page's hero renders, imported rather than
 * reproduced: what a visitor was shown thirty seconds ago is literally what is
 * now waiting for them, out of focus and out of reach.
 *
 * Three details carry the continuity, and all three are borrowed rather than
 * invented:
 *
 * - the frame is the hero's construction exactly — a `bg-line-2` box whose
 *   padding *is* the rim, with an opaque panel covering all but 3px of it;
 * - the glass over the drive uses the command palette's scrim recipe, because
 *   that is already how this product covers itself;
 * - `PageAtmosphere` is the same light, so the room does not change when the
 *   route does.
 *
 * The backdrop is `inert`: it is scenery, and scenery must not be tabbable,
 * readable by a screen reader, or in any way mistakable for something you can
 * use before you have signed in.
 */
export function AuthWindow({ children }) {
  const scope = useRef(null);

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return undefined;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // `from`, not a CSS initial state. useGSAP runs in a layout effect, so
        // the start values are written before paint and there is no flash —
        // and if the script never runs at all, a fully composed window is
        // already on screen rather than an invisible one.
        //
        // Children mark themselves `data-auth="item"`; React mounts them before
        // this runs, so one timeline covers the whole window without the screens
        // inside it having to know anything about the score.
        const timeline = gsap.timeline({ defaults: { ease: EASE.entrance } });

        timeline
          .from("[data-auth='window']", {
            opacity: 0,
            y: 18,
            scale: 0.985,
            duration: 0.9,
            clearProps: "opacity,transform",
          })
          // The sheet lands *on* the window rather than arriving with it, which
          // is the whole illusion: something was already open, and this was
          // placed over it.
          .from(
            "[data-auth='sheet']",
            { opacity: 0, y: 10, duration: 0.7, clearProps: "opacity,transform" },
            0.16,
          )
          .from(
            "[data-auth='item']",
            {
              opacity: 0,
              y: 10,
              duration: 0.6,
              stagger: 0.055,
              clearProps: "opacity,transform",
            },
            0.3,
          );
      });

      // The pane catching room light as the cursor crosses it — the same
      // specular the hero's preview uses, at half strength. Fine pointers only;
      // there is nothing to track on a touchscreen.
      mm.add("(pointer: fine)", () => {
        const glass = root.querySelector("[data-auth='glass']");
        const spot = root.querySelector("[data-specular]");
        if (!glass || !spot) return undefined;

        const moveX = gsap.quickTo(spot, "x", { duration: 0.5, ease: EASE.pointer });
        const moveY = gsap.quickTo(spot, "y", { duration: 0.5, ease: EASE.pointer });

        const onPointerMove = (event) => {
          const bounds = glass.getBoundingClientRect();
          const withinX = (event.clientX - bounds.left) / Math.max(bounds.width, 1);
          const withinY = (event.clientY - bounds.top) / Math.max(bounds.height, 1);
          const inside = withinX >= 0 && withinX <= 1 && withinY >= 0 && withinY <= 1;

          gsap.to(spot, { opacity: inside ? 1 : 0, duration: 0.4 });
          if (!inside) return;
          moveX(event.clientX - bounds.left);
          moveY(event.clientY - bounds.top);
        };

        window.addEventListener("pointermove", onPointerMove, { passive: true });
        return () => window.removeEventListener("pointermove", onPointerMove);
      });

      return () => mm.revert();
    },
    { scope },
  );

  return (
    // Deliberately the same container width as the marketing header above it,
    // so the wordmark does not shift sideways between the landing page and this
    // one and the window's left edge lands exactly under it.
    <div ref={scope} className="w-full max-w-page">
      <div data-auth="window" className="relative isolate">
        {/* Light pooling behind the window, so it reads as sitting in the room
            rather than pasted onto it. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-12 -z-10 opacity-70"
          style={{
            background:
              "radial-gradient(ellipse 55% 60% at 50% 45%, var(--brand-glow), transparent 70%)",
          }}
        />

        {/* Padding is the border: the panel below covers everything but the rim. */}
        <div className="relative overflow-hidden rounded-2xl bg-line-2 p-0.75 shadow-elevated">
          <div className="relative overflow-hidden rounded-xl bg-bg-deep">
            <WindowBar />

            {/* Both layers occupy one grid cell, so the window is as tall as
                whichever is taller. Below `lg` the backdrop is gone entirely and
                the sheet alone sets the height — no viewport-unit guesswork, no
                empty window on a phone. */}
            <div className="relative grid">
              <DriveBackdrop />

              <div
                data-auth="glass"
                aria-hidden="true"
                className={cn(
                  "col-start-1 row-start-1 hidden lg:block",
                  // The command palette's recipe, taken further: that one covers
                  // a table you are still meant to read past, this one covers
                  // something you are meant to stop reading.
                  "bg-[color-mix(in_oklab,var(--bg-deep)_76%,transparent)] backdrop-blur-[7px]",
                )}
              >
                <span
                  data-specular
                  className="pointer-events-none absolute -top-40 -left-40 size-80 rounded-full opacity-0 blur-2xl"
                  style={{
                    background: "radial-gradient(circle, var(--sheen) 0%, transparent 70%)",
                  }}
                />
              </div>

              {/* `relative z-10` is load-bearing, not decoration. `backdrop-filter`
                  makes the glass above a stacking context, which paints it as
                  though it had `z-index: 0` — above every *non-positioned*
                  sibling, this cell included. Left in flow, the sheet renders
                  behind the blur and the form is smeared; only the buttons
                  survive, because `Button` carries `relative` of its own. This
                  puts the sheet in the positioned layer, in front of the glass
                  for good rather than only while a transform happens to be on it. */}
              <div className="relative z-10 col-start-1 row-start-1 grid place-items-center px-5 py-11 sm:px-10 sm:py-14">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The title bar stays sharp while everything below it goes out of focus. It
 * belongs to the window, not to the drive — blurring it would turn the frame
 * into part of the scenery and lose the thing that says "application".
 */
function WindowBar() {
  return (
    <div className="flex items-center gap-3.5 border-b border-line/70 px-4 py-3">
      <span aria-hidden="true" className="flex gap-2">
        {["bg-error/50", "bg-warning/50", "bg-success/50"].map((tone) => (
          <span key={tone} className={cn("size-3 rounded-full", tone)} />
        ))}
      </span>

      <span className="ml-auto flex items-center gap-2 rounded-md border border-line/70 bg-surface px-3 py-1.5">
        <span className="font-mono text-xs text-dim">{AUTH_WINDOW.address}</span>
      </span>
    </div>
  );
}

function DriveBackdrop() {
  return (
    <div
      inert
      aria-hidden="true"
      className="col-start-1 row-start-1 hidden select-none lg:grid lg:grid-cols-[216px_minmax(0,1fr)]"
    >
      {/* Passing the storage value renders the meter at rest. On the landing
          page the hero's timeline counts it up; here there is no timeline, and
          a meter stuck at 0% would be the one detail betraying that this is a
          picture of the product rather than the product. */}
      <PreviewSidebar storage={PREVIEW_STORAGE.percent} />

      <div className="flex min-w-0 flex-col p-5">
        <PreviewFileHeader />

        <div className="mt-1.5 flex flex-col">
          {PREVIEW_FILES.map((file) => (
            <PreviewFileRow key={file.id} file={file} />
          ))}
        </div>
      </div>
    </div>
  );
}
