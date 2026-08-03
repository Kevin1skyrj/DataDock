"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, FileText, FolderOpen, Link2, Search, Upload } from "lucide-react";

import { Kbd } from "@/components/ui/kbd";
import { HOW_FOLDERS, HOW_QUERY, HOW_SHARE_LINK } from "@/constants/how-it-works";
import { PREVIEW_FILES } from "@/constants/preview-data";
import { cn } from "@/lib/utils";

/** The hero's palette finds this file. This section follows it. */
const FILE = PREVIEW_FILES.find((file) => file.id === "invoice") ?? PREVIEW_FILES[0];

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1];

/* --------------------------------------------------------------- helpers -- */

/**
 * Swaps a zone's contents on step change. Every zone that uses this has a fixed
 * height in its parent, so the panel never reflows mid-transition — a stage
 * that resizes as its story advances reads as a bug, not as motion.
 */
function Swap({ step, duration, className, children }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration, ease: EASE_OUT_EXPO }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/** The file's name with the search step's query marked inside it. */
function MatchedName({ matched }) {
  if (!matched) return FILE.name;

  const at = FILE.name.toLowerCase().indexOf(HOW_QUERY);
  if (at < 0) return FILE.name;

  return (
    <>
      {FILE.name.slice(0, at)}
      <mark className="rounded-xs bg-brand-tint px-0.5 text-brand">
        {FILE.name.slice(at, at + HOW_QUERY.length)}
      </mark>
      {FILE.name.slice(at + HOW_QUERY.length)}
    </>
  );
}

/* ----------------------------------------------------------------- zones -- */

function Context({ step, duration }) {
  const content = {
    upload: (
      <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-brand/40 bg-brand-tint/50 px-3.5 py-1.5 text-xs text-muted-foreground">
        <Upload className="size-3.5 text-brand" />
        Drag & drop, or
        <Kbd variant="inline">⌘U</Kbd>
      </span>
    ),
    organize: (
      <span className="flex flex-wrap items-center justify-center gap-1.5">
        {HOW_FOLDERS.map((folder, index) => (
          <span
            key={folder}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors duration-200 ease-standard",
              index === 1
                ? "bg-brand-tint text-foreground ring-1 ring-brand/25 ring-inset"
                : "border border-line/70 text-dim",
            )}
          >
            <FolderOpen className={cn("size-3.5", index === 1 ? "text-brand" : "text-dim")} />
            {folder}
          </span>
        ))}
      </span>
    ),
    search: (
      <span className="inline-flex w-full max-w-72 items-center gap-2.5 rounded-md border border-line bg-surface px-3 py-2 shadow-[0_1px_0_var(--lit)_inset]">
        <Search className="size-3.5 shrink-0 text-dim" />
        <span className="flex-1 text-left text-xs text-foreground">
          {HOW_QUERY}
          <span className="ml-px inline-block h-3 w-px translate-y-0.5 animate-[dd-caret_1.05s_steps(1,end)_infinite] bg-brand" />
        </span>
        <Kbd variant="inline">ESC</Kbd>
      </span>
    ),
    share: (
      <span className="inline-flex items-center gap-2 rounded-full border border-line/70 px-3.5 py-1.5 text-xs text-muted-foreground">
        <Link2 className="size-3.5 text-brand" />
        Anyone with the link
      </span>
    ),
  };

  return (
    <Swap step={step} duration={duration} className="flex justify-center">
      {content[step]}
    </Swap>
  );
}

function Accessory({ step, duration }) {
  const content = {
    upload: (
      <span className="flex items-center gap-3">
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
          {/* Replays on its own because the zone remounts on every step change,
              so the fill is never stale when the visitor comes back to it. */}
          <span className="block h-full origin-left rounded-full bg-brand animate-[dd-fill_1.15s_var(--ease-standard)_both]" />
        </span>
        <span className="font-mono text-2xs text-dim">100%</span>
      </span>
    ),
    organize: (
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <FolderOpen className="size-3.5 text-brand" />
        Invoices 2026
        <span className="ml-auto inline-flex items-center gap-1 text-2xs text-dim">
          <Check className="size-3 text-success" />
          Auto-filed
        </span>
      </span>
    ),
    search: (
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <Search className="size-3.5 text-brand" />
        Matched in name
        <Kbd variant="inline" className="ml-auto">
          ↵
        </Kbd>
      </span>
    ),
    share: (
      <span className="flex items-center gap-2 text-xs">
        <span className="truncate font-mono text-2xs text-brand">{HOW_SHARE_LINK}</span>
        <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-2xs text-dim">
          <Check className="size-3 text-success" />
          Copied
        </span>
      </span>
    ),
  };

  return (
    <Swap step={step} duration={duration}>
      {content[step]}
    </Swap>
  );
}

/* ----------------------------------------------------------------- stage -- */

/**
 * One file, four contexts. The card itself never unmounts — only the zones
 * around it swap — so the section reads as a single object moving through a
 * process rather than four separate illustrations.
 */
export function HowItWorksStage({ step, status, reduced }) {
  const duration = reduced ? 0 : 0.3;

  return (
    <div className="flex h-full flex-col justify-center gap-6 sm:gap-7">
      <div className="flex h-11 items-center">
        <Context step={step} duration={duration} />
      </div>

      <div className="relative mx-auto w-full max-w-sm">
        {/* The drop target belongs to the upload beat alone. Kept mounted and
            toggled in CSS rather than through AnimatePresence: upload is the
            default step, so a library start-state would serialise it invisible
            and leave it that way without JavaScript. */}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -inset-3 rounded-2xl border border-dashed border-brand/35",
            "transition-[opacity,scale] duration-300 ease-out-expo",
            step === "upload" ? "scale-100 opacity-100" : "scale-[1.04] opacity-0",
          )}
        />

        <div className="relative rounded-xl border border-line-2 bg-bg-deep p-4 shadow-elevated">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-tint text-brand">
              <FileText className="size-5" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-md text-foreground">
                <MatchedName matched={step === "search"} />
              </span>
              <span className="mt-0.5 block text-xs text-dim">{FILE.meta}</span>
            </span>
          </div>

          <div className="mt-3.5 h-5">
            <Accessory step={step} duration={duration} />
          </div>
        </div>
      </div>

      <div className="flex h-5 items-center justify-center">
        <Swap step={step} duration={duration} className="text-xs text-dim">
          {status}
        </Swap>
      </div>
    </div>
  );
}
