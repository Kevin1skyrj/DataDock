"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { CornerDownLeft, Grid2x2, Rows3, Search, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { StorageMeter } from "@/components/common/storage-meter";
import {
  PreviewChrome,
  PreviewDetails,
  PreviewFileHeader,
  PreviewFileRow,
  PreviewSidebar,
} from "@/components/landing/preview-parts";
import { Kbd } from "@/components/ui/kbd";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { BEAT, EASE } from "@/constants/motion";
import { PALETTE_DEMO, PREVIEW_FILES, PREVIEW_STORAGE } from "@/constants/preview-data";
import { hasSeenEntrance } from "@/lib/entrance";
import { OPEN_PALETTE_EVENT } from "@/lib/palette-event";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

/**
 * The living product preview.
 *
 * File rows drive the details panel on hover, and the command palette filters
 * the same data the table renders. The surrounding frame stays calm and solid
 * so those product interactions remain the focus.
 */
export function ProductPreview() {
  const scope = useRef(null);
  const [activeId, setActiveId] = useState(PREVIEW_FILES[0].id);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [typed, setTyped] = useState("");

  const reduced = usePrefersReducedMotion();

  // Reduced motion skips the typing, not the palette: pressing ⌘K still opens
  // it, fully typed. Derived rather than written from an effect.
  const shownQuery = reduced ? PALETTE_DEMO.query : typed;

  const activeFile = PREVIEW_FILES.find((file) => file.id === activeId) ?? PREVIEW_FILES[0];
  const query = shownQuery.toLowerCase();
  const matches = PREVIEW_FILES.filter((file) => file.name.toLowerCase().includes(query));
  const filtering = paletteOpen && query.length >= 2;

  const closePalette = useCallback(() => {
    setPaletteOpen(false);
  }, []);

  // Opened deliberately by the visitor with ⌘K and left open until dismissed.
  const openPalette = useCallback(() => {
    setTyped("");
    setPaletteOpen(true);
  }, []);

  // The palette types only after the visitor opens it.
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
      const target = scope.current;
      if (!target) return;

      // Move only this explicit navigation request smoothly; normal wheel and
      // touch scrolling remains entirely native and immediately responsive.
      target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });

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
  }, [openPalette, closePalette, reduced]);

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return undefined;

      try {
        const bars = gsap.utils.toArray("[data-storage-bar]", root);
        const pcts = gsap.utils.toArray("[data-storage-pct]", root);
        const writePct = (value) => {
          const text = `${Math.round(value)}%`;
          pcts.forEach((node) => {
            node.textContent = text;
          });
        };

        if (reduced || hasSeenEntrance()) {
          gsap.set(bars, { scaleX: PREVIEW_STORAGE.percent / 100 });
          writePct(PREVIEW_STORAGE.percent);
          return undefined;
        }

        const parts = gsap.utils.toArray("[data-preview]", root);
        const counter = { value: 0 };
        const timeline = gsap.timeline({
          delay: BEAT.frame,
          defaults: { ease: EASE.entrance },
          onComplete: () => {
            parts.forEach((element) => element.removeAttribute("data-preview"));
            gsap.set(parts, { clearProps: "opacity,transform" });
          },
        });

        timeline
          .to("[data-preview='frame']", { opacity: 1, y: 0, scale: 1, duration: 0.8 }, 0)
          .to(
            "[data-preview='item']",
            { opacity: 1, y: 0, duration: 0.45, stagger: 0.025 },
            BEAT.chrome - BEAT.frame,
          )
          .to(
            "[data-preview='row']",
            { opacity: 1, y: 0, duration: 0.4, stagger: 0.03 },
            BEAT.rows - BEAT.frame,
          )
          .to(
            bars,
            { scaleX: PREVIEW_STORAGE.percent / 100, duration: 0.9, ease: EASE.glide },
            BEAT.storage - BEAT.frame,
          )
          .to(
            counter,
            {
              value: PREVIEW_STORAGE.percent,
              duration: 0.9,
              ease: EASE.glide,
              onUpdate: () => writePct(counter.value),
            },
            BEAT.storage - BEAT.frame,
          );

        return () => timeline.kill();
      } catch {
        document.documentElement.removeAttribute("data-motion");
        return undefined;
      }
    },
    { scope, dependencies: [reduced], revertOnUpdate: true },
  );

  return (
    /*
     * Decorative, and marked as such.
     *
     * This is a picture of the application, not the application — the files in
     * it are invented and belong to nobody. Read aloud it becomes a list of
     * fictional documents and byte counts presented as though they were the
     * visitor's own, which is noise at best and misleading at worst; the hero's
     * copy beside it is what actually explains the product, and that stays.
     *
     * The command palette remains available through ⌘K, but never covers the
     * preview automatically.
     */
    <div
      ref={scope}
      id="preview"
      // `inert` as well as `aria-hidden`, because the mockup contains real
      // buttons. `aria-hidden` alone over focusable content is itself a failure:
      // the control stays in the tab order while being unreachable to the
      // screen reader describing it. `inert` takes both away together.
      inert
      aria-hidden="true"
      className="relative mt-16 px-5 sm:mt-20 sm:px-10"
    >
      <div className="mx-auto max-w-7xl">
        <div
          data-preview="frame"
          className="relative overflow-hidden rounded-2xl border border-line-2 bg-overlay shadow-[0_1px_0_var(--lit)_inset]"
        >
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
                    <p className="truncate text-sm text-muted-foreground">
                      All files <span className="px-1">/</span>
                      <span className="text-muted-foreground">Client work</span>
                    </p>

                    <span className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 rounded-md bg-brand px-2.5 py-1.5 text-sm text-brand-contrast">
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

                  <p data-preview="item" className="mt-4 text-sm text-dim">
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
