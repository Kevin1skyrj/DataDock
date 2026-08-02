"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CornerDownLeft, Grid2x2, Rows3, Search, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  PreviewChrome,
  PreviewDetails,
  PreviewFileHeader,
  PreviewFileRow,
  PreviewSidebar,
  StorageMeter,
} from "@/components/landing/preview-parts";
import { Kbd } from "@/components/ui/kbd";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { BEAT, EASE, PALETTE_HOLD_MS } from "@/constants/motion";
import { PALETTE_DEMO, PREVIEW_FILES, PREVIEW_STORAGE } from "@/constants/preview-data";
import { hasSeenEntrance } from "@/lib/entrance";
import { OPEN_PALETTE_EVENT } from "@/lib/palette-event";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * The living product preview.
 *
 * Three things make it read as software rather than a screenshot: the file rows
 * drive the details panel on hover, the palette demo types and filters against
 * the same data the table renders, and the whole pane tilts and catches light
 * as though it were a physical surface.
 */
export function ProductPreview() {
  const scope = useRef(null);
  const [activeId, setActiveId] = useState(PREVIEW_FILES[0].id);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [typed, setTyped] = useState("");

  const reduced = usePrefersReducedMotion();
  const dismissRef = useRef(null);

  // Reduced motion skips the typing, not the palette: pressing ⌘K still opens
  // it, fully typed. Derived rather than written from an effect.
  const shownQuery = reduced ? PALETTE_DEMO.query : typed;

  const activeFile = PREVIEW_FILES.find((file) => file.id === activeId) ?? PREVIEW_FILES[0];
  const query = shownQuery.toLowerCase();
  const matches = PREVIEW_FILES.filter((file) => file.name.toLowerCase().includes(query));
  const filtering = paletteOpen && query.length >= 2;

  const cancelDismiss = useCallback(() => {
    if (dismissRef.current) {
      window.clearTimeout(dismissRef.current);
      dismissRef.current = null;
    }
  }, []);

  // Closing by hand also cancels any pending auto-dismiss, so a demo still in
  // flight cannot reopen or re-close underneath the visitor.
  const closePalette = useCallback(() => {
    cancelDismiss();
    setPaletteOpen(false);
  }, [cancelDismiss]);

  // Opened by the visitor — ⌘K, or the header's command bar. It stays open
  // until they close it; only the demo dismisses itself.
  const openPalette = useCallback(() => {
    cancelDismiss();
    setTyped("");
    setPaletteOpen(true);
  }, [cancelDismiss]);

  // Opened by the entrance. Types itself, holds long enough to be read, then
  // hands the frame back to the file table — which is the hero's resting
  // state, and the only state in which the row-to-details interaction is
  // reachable at all.
  const playPaletteDemo = useCallback(() => {
    cancelDismiss();
    setTyped("");
    setPaletteOpen(true);
    dismissRef.current = window.setTimeout(() => {
      dismissRef.current = null;
      setPaletteOpen(false);
    }, PALETTE_HOLD_MS);
  }, [cancelDismiss]);

  useEffect(() => cancelDismiss, [cancelDismiss]);

  // The palette types itself in, then holds. Re-runs whenever it reopens, so
  // the demo replays on demand rather than only once on load.
  useEffect(() => {
    if (!paletteOpen || reduced) return undefined;

    const word = PALETTE_DEMO.query;
    let index = 0;
    const id = window.setInterval(() => {
      index += 1;
      setTyped(word.slice(0, index));
      if (index >= word.length) window.clearInterval(id);
    }, 130);

    return () => window.clearInterval(id);
  }, [paletteOpen, reduced]);

  // ⌘K brings the palette forward wherever you are on the page.
  useEffect(() => {
    const reveal = () => {
      scope.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      openPalette();
    };

    const onKeyDown = (event) => {
      const key = event.key?.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === "k") {
        event.preventDefault();
        reveal();
        return;
      }
      if (key === "escape") closePalette();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_PALETTE_EVENT, reveal);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_PALETTE_EVENT, reveal);
    };
  }, [openPalette, closePalette]);

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return undefined;

      try {
        const mm = gsap.matchMedia();

        mm.add(
          {
            animate: "(prefers-reduced-motion: no-preference)",
            finePointer: "(pointer: fine)",
          },
          (context) => {
            const { animate, finePointer } = context.conditions;

            const frame = root.querySelector("[data-tilt]");
            // Two meters exist — sidebar above lg, inline below it — and only
            // one is visible at a time. Both are driven, so the storage beat
            // lands at every width.
            const bars = gsap.utils.toArray("[data-storage-bar]", root);
            const pcts = gsap.utils.toArray("[data-storage-pct]", root);
            const writePct = (value) => {
              const text = `${Math.round(value)}%`;
              pcts.forEach((node) => {
                node.textContent = text;
              });
            };

            if (!animate) {
              gsap.set(bars, { scaleX: PREVIEW_STORAGE.percent / 100 });
              writePct(PREVIEW_STORAGE.percent);
              return undefined;
            }

            const parts = gsap.utils.toArray("[data-preview]", root);
            const counter = { value: 0 };
            const replay = hasSeenEntrance();

            // The preview runs on the same clock as the header and the hero
            // copy; `frame` is its cue, and everything below is relative to it.
            // On a repeat view there is nothing hidden to reveal, so the
            // timeline collapses to its end state and the demo plays alone.
            const timeline = gsap.timeline({
              delay: replay ? 0 : BEAT.frame,
              defaults: { ease: EASE.entrance },
              onComplete: () => {
                parts.forEach((element) => element.removeAttribute("data-preview"));
                gsap.set(parts, { clearProps: "opacity,transform" });
              },
            });

            if (replay) {
              // No entrance, and no demo either. A page that renders instantly
              // and then covers itself 700ms later is more disruptive than the
              // sequence it replaced. ⌘K is still there for anyone who wants it.
              gsap.set(bars, { scaleX: PREVIEW_STORAGE.percent / 100 });
              writePct(PREVIEW_STORAGE.percent);
              counter.value = PREVIEW_STORAGE.percent;
            } else {
              timeline
                .to("[data-preview='frame']", { opacity: 1, y: 0, scale: 1, duration: 0.95 }, 0)
                // The shell arrives first, then it fills itself in — the pane
                // assembles rather than appearing.
                .to(
                  "[data-preview='item']",
                  { opacity: 1, y: 0, duration: 0.55, stagger: 0.03 },
                  BEAT.chrome - BEAT.frame,
                )
                .to(
                  "[data-preview='row']",
                  { opacity: 1, y: 0, duration: 0.45, stagger: 0.035 },
                  BEAT.rows - BEAT.frame,
                )
                .to(
                  bars,
                  { scaleX: PREVIEW_STORAGE.percent / 100, duration: 1.2, ease: EASE.glide },
                  BEAT.storage - BEAT.frame,
                )
                .to(
                  counter,
                  {
                    value: PREVIEW_STORAGE.percent,
                    duration: 1.2,
                    ease: EASE.glide,
                    onUpdate: () => writePct(counter.value),
                  },
                  BEAT.storage - BEAT.frame,
                )
                .call(playPaletteDemo, null, BEAT.palette - BEAT.frame);
            }

            // Storage creeps the way a real drive does while a background
            // upload finishes — then stops, rather than looping forever.
            const creep = window.setInterval(() => {
              if (document.hidden) return;
              counter.value = Math.min(counter.value + 0.9, PREVIEW_STORAGE.ceiling);
              writePct(counter.value);
              gsap.to(bars, { scaleX: counter.value / 100, duration: 1.4, ease: EASE.glide });
              // A brief lift on the bar as the number moves. Without it the
              // creep is invisible unless you happen to be reading the digits,
              // and a change nobody notices communicates nothing.
              gsap.fromTo(
                bars,
                { filter: "brightness(1)" },
                { filter: "brightness(1.45)", duration: 0.35, yoyo: true, repeat: 1, ease: "power2.inOut" },
              );
              if (counter.value >= PREVIEW_STORAGE.ceiling) window.clearInterval(creep);
            }, 9000);

            // The frame's edge light is a continuously running GPU layer. The
            // hero parks it when the section scrolls out of view.
            if (!frame) return () => window.clearInterval(creep);

            // Tilt: the pane starts leaning back and rights itself as it
            // reaches reading position.
            // GSAP names these rotationX / rotationY — `rotateX` is not an
            // alias, it is treated as an unknown CSS property and silently
            // does nothing.
            gsap.fromTo(
              frame,
              { rotationX: 7 },
              {
                rotationX: 0,
                ease: "none",
                scrollTrigger: { trigger: root, start: "top bottom", end: "center center", scrub: 0.6 },
              },
            );

            if (!finePointer) return () => window.clearInterval(creep);

            const specular = root.querySelector("[data-specular]");
            const rotateTo = gsap.quickTo(frame, "rotationY", { duration: 0.6, ease: EASE.pointer });
            const lightX = gsap.quickTo(specular, "x", { duration: 0.5, ease: EASE.pointer });
            const lightY = gsap.quickTo(specular, "y", { duration: 0.5, ease: EASE.pointer });

            const onPointerMove = (event) => {
              const bounds = frame.getBoundingClientRect();
              const withinX = (event.clientX - bounds.left) / Math.max(bounds.width, 1);
              const withinY = (event.clientY - bounds.top) / Math.max(bounds.height, 1);
              rotateTo((withinX - 0.5) * 5);

              const inside = withinX >= 0 && withinX <= 1 && withinY >= 0 && withinY <= 1;
              gsap.to(specular, { opacity: inside ? 1 : 0, duration: 0.4 });
              if (!inside) return;
              lightX(event.clientX - bounds.left);
              lightY(event.clientY - bounds.top);
            };

            window.addEventListener("pointermove", onPointerMove, { passive: true });

            return () => {
              window.clearInterval(creep);
              window.removeEventListener("pointermove", onPointerMove);
            };
          },
        );

        return () => mm.revert();
      } catch {
        document.documentElement.removeAttribute("data-motion");
        return undefined;
      }
    },
    { scope },
  );

  return (
    <div ref={scope} id="preview" className="relative mt-16 px-5 sm:mt-20 sm:px-10">
      <div className="mx-auto max-w-7xl perspective-[1600px]">
        <div data-tilt data-preview="frame" className="relative isolate transform-3d">
          {/* The same revolving light, blurred, spilling past the frame. It is
              clipped to just outside the border before the blur runs, so the
              glow hugs the edge instead of washing across the whole pane. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-px -z-10 overflow-hidden rounded-2xl opacity-60 blur-[11px]"
          >
            <span data-idle-motion className="dd-beam" />
          </div>

          {/* Padding is the border: the beam fills this box, the opaque panel
              below covers everything but the 3px rim. */}
          <div className="relative overflow-hidden rounded-2xl bg-line-2 p-0.75 shadow-elevated">
            <span data-idle-motion className="dd-beam" />

            <div className="relative overflow-hidden rounded-xl bg-overlay">
              {/* Specular highlight — the pane catching room light as you move. */}
              <div
                data-specular
                aria-hidden="true"
                className="pointer-events-none absolute -top-40 -left-40 z-20 size-80 rounded-full opacity-0 blur-2xl"
                style={{ background: "radial-gradient(circle, var(--sheen) 0%, transparent 70%)" }}
              />

              <PreviewChrome />

              {/* Three panes from lg, not xl: the details panel is the proof
                  the product is alive, so it earns its place before the extra
                  breathing room does. */}
              <div className="grid lg:grid-cols-[200px_minmax(0,1fr)_236px] xl:grid-cols-[248px_minmax(0,1fr)_288px]">
                <PreviewSidebar />

                <div className="relative flex min-w-0 flex-col p-4 sm:p-5">
                  <div
                    data-preview="item"
                    className="mb-4 flex items-center justify-between gap-3"
                  >
                    <p className="truncate text-xs text-dim">
                      All files <span className="px-1">/</span>
                      <span className="text-muted-foreground">Client work</span>
                    </p>

                    <span className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 rounded-md bg-brand px-2.5 py-1.5 text-xs text-brand-contrast">
                        <Upload className="size-3.5" />
                        Upload
                      </span>
                      <span className="hidden items-center rounded-md border border-line/70 sm:flex">
                        <span className="rounded-l-md bg-surface-2 p-1.5">
                          <Rows3 className="size-3.5 text-foreground" />
                        </span>
                        <span className="p-1.5">
                          <Grid2x2 className="size-3.5 text-dim" />
                        </span>
                      </span>
                    </span>
                  </div>

                  <PreviewFileHeader />

                  <div className="mt-1.5 flex flex-col">
                    {PREVIEW_FILES.map((file) => (
                      <PreviewFileRow
                        key={file.id}
                        file={file}
                        active={file.id === activeId}
                        dimmed={filtering && !file.name.toLowerCase().includes(query)}
                        onActivate={() => setActiveId(file.id)}
                      />
                    ))}
                  </div>

                  <p data-preview="item" className="mt-4 text-xs text-dim">
                    {filtering ? `${matches.length} results` : "6 items · 620.4 MB"}
                    <span className="float-right hidden sm:inline">Sorted by modified</span>
                  </p>

                  {/* Below lg there is no sidebar to hold the meter, and the
                      storage beat would otherwise animate nothing on a phone. */}
                  <StorageMeter className="mt-4 lg:hidden" />

                  <PaletteDemo
                    open={paletteOpen}
                    typed={shownQuery}
                    matches={matches}
                    onClose={closePalette}
                  />
                </div>

                <PreviewDetails file={activeFile} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-base text-dim">
        Press{" "}
        <Kbd variant="key" className="mx-0.5 align-middle">
          ⌘K
        </Kbd>{" "}
        anywhere — it works on this page.
      </p>
    </div>
  );
}

function PaletteDemo({ open, typed, matches, onClose }) {
  return (
    <div
      aria-hidden={!open}
      onClick={onClose}
      className={cn(
        "absolute inset-0 z-10 flex justify-center rounded-b-xl px-4 pt-12 transition-opacity duration-300 ease-standard",
        "bg-[color-mix(in_oklab,var(--overlay)_58%,transparent)] backdrop-blur-[3px]",
        open ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <div
        className={cn(
          "h-fit w-full max-w-125 overflow-hidden rounded-xl border border-line-2 bg-overlay",
          "transition-[transform,box-shadow] duration-300 ease-standard",
          // Lit in the accent while open, so the palette reads as active
          // software rather than a panel that happens to be on top.
          open
            ? "translate-y-0 scale-100 shadow-[var(--elevation),0_16px_50px_-18px_var(--brand-glow)]"
            : "-translate-y-2.5 scale-[0.98] shadow-elevated",
        )}
      >
        <div className="flex items-center gap-3 border-b border-line/70 px-3.5 py-3">
          <Search className="size-4 shrink-0 text-dim" />
          <span className="flex-1 text-sm text-foreground">
            {typed}
            <span className="ml-px inline-block h-3.5 w-px translate-y-0.5 animate-[dd-caret_1.05s_steps(1,end)_infinite] bg-brand" />
          </span>
          <Kbd variant="inline">ESC</Kbd>
        </div>

        <div className="flex flex-col gap-0.5 p-2">
          <p className="px-2.5 py-1 text-xs tracking-widest text-dim uppercase">Files</p>

          {matches.slice(0, 2).map((file, index) => (
            <span
              key={file.id}
              className={cn(
                "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm",
                index === 0
                  ? "bg-brand-tint text-foreground ring-1 ring-brand/25 ring-inset"
                  : "text-muted-foreground",
              )}
            >
              <span className="flex-1 truncate">{file.name}</span>
              {index === 0 ? <CornerDownLeft className="size-3.5 text-brand" /> : null}
            </span>
          ))}

          <p className="px-2.5 pt-2 pb-1 text-xs tracking-widest text-dim uppercase">Actions</p>

          {PALETTE_DEMO_ACTIONS.map((action) => (
            <span
              key={action.id}
              className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-muted-foreground"
            >
              <span className="flex-1 truncate">{action.label}</span>
              <Kbd variant="inline">{action.hint}</Kbd>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const PALETTE_DEMO_ACTIONS = PALETTE_DEMO.actions;
