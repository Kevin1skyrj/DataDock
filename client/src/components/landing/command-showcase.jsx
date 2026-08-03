"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatePresence, motion } from "motion/react";
import {
  BarChart3,
  Braces,
  Check,
  CornerDownLeft,
  FileText,
  FolderClosed,
  FolderPlus,
  Image as ImageIcon,
  LayoutGrid,
  Link2,
  Search,
  Settings,
  Share2,
  Star,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { SectionHeading } from "@/components/common/section-heading";
import { Kbd } from "@/components/ui/kbd";
import {
  COMMAND_GROUPS,
  COMMANDS,
  GROUP_LIMIT,
  SHORTCUTS,
  SUGGESTIONS,
} from "@/constants/command-palette";
import { EASE } from "@/constants/motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const ICONS = {
  pdf: FileText,
  doc: FileText,
  image: ImageIcon,
  video: Video,
  code: Braces,
  upload: Upload,
  "folder-plus": FolderPlus,
  link: Link2,
  star: Star,
  trash: Trash2,
  layout: LayoutGrid,
  folder: FolderClosed,
  share: Share2,
  chart: BarChart3,
  settings: Settings,
};

const RESULT_MS = 3600;

/** Substring across the label and its synonyms — predictable beats clever. */
function matches(command, query) {
  if (!query) return true;
  return (
    command.label.toLowerCase().includes(query) ||
    command.keywords.some((word) => word.toLowerCase().includes(query))
  );
}

export function CommandShowcase() {
  const scope = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const panelRef = useRef(null);
  const resultTimer = useRef(null);
  // A counter rather than a timestamp: AnimatePresence only needs the key to
  // change so a repeat of the same command replays, and `Date.now()` in a
  // component body is an impure call React is right to reject.
  const runCount = useRef(0);
  const baseId = useId();

  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [result, setResult] = useState(null);

  const reduced = usePrefersReducedMotion();

  const needle = query.trim().toLowerCase();
  const groups = COMMAND_GROUPS.map((group) => ({
    ...group,
    items: COMMANDS.filter(
      (command) => command.group === group.id && matches(command, needle),
    ).slice(0, GROUP_LIMIT),
  })).filter((group) => group.items.length > 0);

  const flat = groups.flatMap((group) => group.items);
  // Arrow keys walk one list; the markup renders three. This maps a command
  // back to its position in the flattened order, so rendering stays pure
  // instead of incrementing a counter as it goes.
  const positions = new Map(flat.map((command, at) => [command.id, at]));
  // Clamped rather than reset from an effect: the list changes on every
  // keystroke, and correcting it during render keeps state and view in step
  // without a second pass.
  const index = Math.min(cursor, Math.max(flat.length - 1, 0));
  const active = flat[index];

  const listId = `${baseId}-list`;
  const optionId = (position) => `${baseId}-option-${position}`;

  /* Keep the highlighted row inside the scroll box — and only that box. A
     plain scrollIntoView would happily scroll the page as well. */
  useEffect(() => {
    const list = listRef.current;
    const node = list?.querySelector('[data-command-active="true"]');
    if (!list || !node) return;

    const top = node.offsetTop;
    const bottom = top + node.offsetHeight;

    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) {
      list.scrollTop = bottom - list.clientHeight;
    }
  }, [index, query]);

  useEffect(() => () => window.clearTimeout(resultTimer.current), []);

  const run = (command) => {
    if (!command) return;

    window.clearTimeout(resultTimer.current);
    runCount.current += 1;
    setResult({ key: runCount.current, text: command.result });
    setQuery("");
    setCursor(0);
    inputRef.current?.focus();
    resultTimer.current = window.setTimeout(() => setResult(null), RESULT_MS);

    // The panel takes the keystroke physically. Two frames of scale, nothing
    // more — enough to register as a press, too little to notice as animation.
    if (!reduced && panelRef.current) {
      gsap.fromTo(
        panelRef.current,
        { scale: 1 },
        { scale: 0.994, duration: 0.09, yoyo: true, repeat: 1, ease: "power2.inOut" },
      );
    }
  };

  const onKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor(Math.min(index + 1, flat.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor(Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      run(active);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setQuery("");
      setCursor(0);
    }
  };

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return undefined;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-section-heading] > *", {
          opacity: 0,
          y: 18,
          duration: 0.8,
          stagger: 0.09,
          ease: EASE.entrance,
          scrollTrigger: { trigger: root, start: "top 78%", once: true },
        });

        // The panel only — its rows are React-owned and swap on every
        // keystroke, so a stagger over them would be tweening stale nodes.
        gsap.from("[data-command-panel]", {
          opacity: 0,
          y: 26,
          scale: 0.985,
          duration: 0.9,
          ease: EASE.entrance,
          scrollTrigger: { trigger: "[data-command-panel]", start: "top 88%", once: true },
          // The panel is scaled imperatively on Enter; a leftover entrance
          // transform would be the base that press animates from.
          onComplete: () => {
            if (panelRef.current) gsap.set(panelRef.current, { clearProps: "opacity,transform" });
          },
        });

        gsap.from("[data-shortcut]", {
          opacity: 0,
          y: 12,
          duration: 0.6,
          stagger: 0.05,
          ease: EASE.entrance,
          scrollTrigger: { trigger: "[data-shortcut-rail]", start: "top 92%", once: true },
        });
      });

      return () => mm.revert();
    },
    { scope },
  );

  return (
    <section id="command" className="relative scroll-mt-24 pt-12 pb-24 sm:pt-16 sm:pb-32">
      <div ref={scope} className="mx-auto max-w-page px-5 sm:px-10">
        <SectionHeading
          eyebrow="Command palette"
          title="Your hands never have to leave the keyboard."
          description="Find a file, run an action, jump anywhere in the app — from one field. This one is real: type in it."
        />

        <div className="mx-auto mt-14 max-w-2xl lg:mt-18">
          <div
            ref={panelRef}
            data-command-panel
            // Clicking the chrome should land in the field, the way it does in
            // a real palette. mousedown-prevented so focus never leaves it.
            onMouseDown={(event) => {
              if (event.target !== inputRef.current) {
                event.preventDefault();
                inputRef.current?.focus();
              }
            }}
            className={cn(
              "overflow-hidden rounded-2xl border border-line-2 bg-overlay shadow-elevated",
              "focus-within:border-brand/40 focus-within:shadow-[var(--elevation),0_16px_50px_-18px_var(--brand-glow)]",
              "transition-[border-color,box-shadow] duration-300 ease-standard",
            )}
          >
            <div className="flex items-center gap-3 border-b border-line/70 px-4 py-3.5">
              <Search className="size-4 shrink-0 text-dim" />

              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-controls={listId}
                aria-activedescendant={active ? optionId(index) : undefined}
                aria-autocomplete="list"
                aria-label="Search files and run commands"
                autoComplete="off"
                spellCheck="false"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setCursor(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Search files, run commands, jump anywhere…"
                className="flex-1 bg-transparent text-md text-foreground outline-none placeholder:text-dim"
              />

              <Kbd variant="inline" className="shrink-0">
                ⌘K
              </Kbd>
            </div>

            <div
              ref={listRef}
              id={listId}
              role="listbox"
              aria-label="Commands"
              className="relative max-h-72 overflow-y-auto overscroll-contain p-2"
            >
              {groups.map((group) => (
                <div key={group.id} role="group" aria-labelledby={`${baseId}-${group.id}`}>
                  <p
                    id={`${baseId}-${group.id}`}
                    className="px-2.5 pt-2 pb-1 text-2xs tracking-widest text-dim uppercase"
                  >
                    {group.label}
                  </p>

                  {group.items.map((command) => {
                    const at = positions.get(command.id);
                    const Icon = ICONS[command.icon] ?? FileText;
                    const selected = at === index;

                    return (
                      <div
                        key={command.id}
                        id={optionId(at)}
                        role="option"
                        aria-selected={selected}
                        data-command-active={selected}
                        onClick={() => run(command)}
                        // Pointer moves the highlight instead of adding a second
                        // one, so mouse and keyboard share a single selection.
                        onPointerMove={() => setCursor(at)}
                        className={cn(
                          "flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm",
                          "transition-colors duration-150 ease-standard",
                          selected
                            ? "bg-brand-tint text-foreground ring-1 ring-brand/25 ring-inset"
                            : "text-muted-foreground",
                        )}
                      >
                        <Icon
                          className={cn(
                            "size-3.5 shrink-0",
                            selected ? "text-brand" : "text-dim",
                          )}
                        />
                        <span className="flex-1 truncate">{command.label}</span>

                        {selected ? (
                          <CornerDownLeft className="size-3.5 shrink-0 text-brand" />
                        ) : (
                          <span className="shrink-0 font-mono text-2xs text-dim">
                            {command.hint}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              {flat.length === 0 ? (
                <p className="px-2.5 py-6 text-center text-sm text-dim">
                  Nothing matches “{query.trim()}”. Every other palette would stop here — this one
                  would offer to create it.
                </p>
              ) : null}
            </div>

            <div className="flex items-center gap-4 border-t border-line/70 px-4 py-2.5 text-2xs text-dim">
              <span className="flex items-center gap-1.5">
                <Kbd variant="inline">↑</Kbd>
                <Kbd variant="inline">↓</Kbd>
                navigate
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd variant="inline">↵</Kbd>
                open
              </span>
              <span className="hidden items-center gap-1.5 sm:flex">
                <Kbd variant="inline">esc</Kbd>
                clear
              </span>
              <span className="ml-auto font-mono">
                {flat.length} result{flat.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          {/* Confirmation lives outside the panel so the list never reflows to
              make room for it. */}
          <div className="mt-3 flex h-8 items-center justify-center">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.p
                  key={result.key}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: reduced ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="inline-flex items-center gap-2 rounded-full border border-line/70 bg-surface px-3.5 py-1.5 text-xs text-muted-foreground"
                >
                  <Check className="size-3.5 text-success" />
                  {result.text}
                </motion.p>
              ) : null}
            </AnimatePresence>
          </div>

          <p className="mt-2 flex flex-wrap items-center justify-center gap-2 text-base text-dim">
            Try
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  setQuery(suggestion);
                  setCursor(0);
                  inputRef.current?.focus();
                }}
                className="rounded-md border border-line px-2 py-0.5 font-mono text-2xs text-muted-foreground transition-colors duration-200 ease-standard hover:border-brand/40 hover:text-brand"
              >
                {suggestion}
              </button>
            ))}
          </p>
        </div>

        <div
          data-shortcut-rail
          className="mx-auto mt-14 flex max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-5 lg:mt-16"
        >
          {SHORTCUTS.map((shortcut) => (
            <span key={shortcut.label} data-shortcut className="group flex items-center gap-2.5">
              <span className="flex items-center gap-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <Kbd
                    key={`${shortcut.label}-${key}-${keyIndex}`}
                    variant="key"
                    // Bottoms out on hover: the cap loses its under-edge and
                    // drops onto it. A lift would be the wrong metaphor for a
                    // key you press.
                    className="transition-[translate,border-color,color] duration-150 ease-standard group-hover:translate-y-px group-hover:border-b group-hover:border-brand/40 group-hover:text-brand"
                  >
                    {key}
                  </Kbd>
                ))}
              </span>
              <span className="text-base text-dim transition-colors duration-200 ease-standard group-hover:text-muted-foreground">
                {shortcut.label}
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
