"use client";

import {
  Check,
  Clock,
  FileText,
  FolderClosed,
  FolderOpen,
  Globe,
  Image as ImageIcon,
  Link2,
  Play,
  RotateCcw,
  Search,
} from "lucide-react";

import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

/**
 * The lower half of each feature card.
 *
 * Every one of these is a fragment of the real interface rather than an
 * illustration of it — the same rows, chips and type the product uses. A card
 * that shows the thing working is a stronger claim than one that describes it.
 */

const ROW = "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm";
const PANEL = "rounded-lg border border-line/70 bg-bg-deep/60 p-2 backdrop-blur-[2px]";

/* ---------------------------------------------------------------- search -- */

function SearchVisual() {
  const results = [
    { name: "Q3 invoice — Northline.pdf", match: true },
    { name: "Invoices 2026", match: false },
    { name: "Invoice template.docx", match: false },
  ];

  return (
    <div className={PANEL}>
      <div className="mb-1.5 flex items-center gap-2.5 border-b border-line/70 px-2.5 pb-2.5">
        <Search className="size-3.5 shrink-0 text-dim" />
        <span className="flex-1 text-sm text-foreground">
          invo
          <span className="ml-px inline-block h-3 w-px translate-y-0.5 animate-[dd-caret_1.05s_steps(1,end)_infinite] bg-brand" />
        </span>
        <span className="font-mono text-2xs text-dim">3</span>
      </div>

      {results.map((result, index) => (
        <div
          key={result.name}
          className={cn(
            ROW,
            index === 0
              ? "bg-brand-tint text-foreground ring-1 ring-brand/25 ring-inset"
              : "text-muted-foreground",
          )}
        >
          <FileText className={cn("size-3.5 shrink-0", index === 0 ? "text-brand" : "text-dim")} />
          <span className="truncate">
            {result.name.split(/(invo)/i).map((part, at) =>
              part.toLowerCase() === "invo" ? (
                <mark key={at} className="rounded-xs bg-brand-tint px-0.5 text-brand">
                  {part}
                </mark>
              ) : (
                part
              ),
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- share -- */

function ShareVisual() {
  return (
    <div className={cn(PANEL, "p-3.5")}>
      <div className="flex items-center gap-2 rounded-md border border-line/70 bg-surface px-2.5 py-2">
        <Link2 className="size-3.5 shrink-0 text-brand" />
        <span className="flex-1 truncate font-mono text-2xs text-brand">
          datadock.app/s/9fK2xQ
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 text-2xs text-dim">
          <Check className="size-3 text-success" />
          Copied
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-2.5">
        {[
          [Globe, "Anyone with the link", "Can view"],
          [Clock, "Expires in 14 days", "Editable"],
        ].map(([Icon, label, value]) => (
          <div key={label} className="flex items-center gap-2.5 text-sm">
            <Icon className="size-3.5 shrink-0 text-dim" />
            <span className="flex-1 truncate text-muted-foreground">{label}</span>
            <span className="shrink-0 text-2xs text-dim">{value}</span>
          </div>
        ))}
      </div>

      <div className="mt-3.5 flex items-center gap-2 border-t border-line/70 pt-3">
        <span className="flex -space-x-1.5">
          {["A", "M", "R"].map((initial) => (
            <span
              key={initial}
              className="grid size-6 place-items-center rounded-full border border-line-2 bg-surface-2 text-2xs text-muted-foreground"
            >
              {initial}
            </span>
          ))}
        </span>
        <span className="text-2xs text-dim">3 people opened this link</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- organize -- */

function OrganizeVisual() {
  const tree = [
    { label: "Client work", depth: 0, open: true },
    { label: "Invoices 2026", depth: 1, open: true, active: true },
    { label: "Q3 invoice — Northline.pdf", depth: 2, file: true },
    { label: "Statement of work.docx", depth: 2, file: true },
    { label: "Archive", depth: 0 },
  ];

  return (
    <div className={PANEL}>
      {tree.map((node) => {
        const Icon = node.file ? FileText : node.open ? FolderOpen : FolderClosed;

        return (
          <div
            key={node.label}
            style={{ paddingLeft: `${node.depth * 14 + 10}px` }}
            className={cn(
              ROW,
              node.active
                ? "bg-brand-tint text-foreground ring-1 ring-brand/25 ring-inset"
                : "text-muted-foreground",
            )}
          >
            <Icon
              className={cn("size-3.5 shrink-0", node.active ? "text-brand" : "text-dim")}
            />
            <span className="truncate">{node.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------------------------------------------- storage -- */

function StorageVisual() {
  const breakdown = [
    { label: "Video", share: 38, tone: "bg-brand" },
    { label: "Images", share: 24, tone: "bg-brand/60" },
    { label: "Documents", share: 21, tone: "bg-brand/35" },
    { label: "Other", share: 17, tone: "bg-surface-2" },
  ];

  return (
    <div className={cn(PANEL, "p-3.5")}>
      <p className="text-display-xs font-semibold tracking-tight text-foreground tabular-nums">
        6.12 <span className="text-md font-normal text-dim">of 10 GB</span>
      </p>

      {/* One track, four segments — the composition of the space, not just how
          much of it is gone. */}
      <div className="mt-3 flex h-2 gap-0.5 overflow-hidden rounded-full">
        {breakdown.map((slice) => (
          <span
            key={slice.label}
            style={{ width: `${slice.share}%` }}
            className={cn("h-full first:rounded-l-full last:rounded-r-full", slice.tone)}
          />
        ))}
      </div>

      <div className="mt-3.5 flex flex-col gap-2">
        {breakdown.map((slice) => (
          <div key={slice.label} className="flex items-center gap-2.5 text-sm">
            <span className={cn("size-2 shrink-0 rounded-full", slice.tone)} />
            <span className="flex-1 truncate text-muted-foreground">{slice.label}</span>
            <span className="shrink-0 font-mono text-2xs text-dim tabular-nums">
              {slice.share}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- trash -- */

function TrashVisual() {
  const deleted = [
    { name: "Statement of work.docx", left: "27 days left", first: true },
    { name: "Kickoff recording.mp4", left: "19 days left" },
    { name: "design-tokens.json", left: "4 days left" },
  ];

  return (
    <div className={PANEL}>
      {deleted.map((item) => (
        <div
          key={item.name}
          className={cn(
            ROW,
            item.first
              ? "bg-brand-tint text-foreground ring-1 ring-brand/25 ring-inset"
              : "text-muted-foreground",
          )}
        >
          <FileText
            className={cn("size-3.5 shrink-0", item.first ? "text-brand" : "text-dim")}
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate">{item.name}</span>
            <span className="block truncate text-2xs text-dim">{item.left}</span>
          </span>

          {item.first ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-brand px-2 py-1 text-2xs text-brand-contrast">
              <RotateCcw className="size-3" />
              Restore
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/* --------------------------------------------------------------- preview -- */

function PreviewVisual() {
  const tiles = [
    { kind: "PDF", Icon: FileText, hint: "24 pages" },
    { kind: "PNG", Icon: ImageIcon, hint: "2880 × 1620" },
    { kind: "MP4", Icon: Play, hint: "48 min" },
    { kind: "JSON", Icon: FileText, hint: "420 lines" },
  ];

  return (
    <div className={cn(PANEL, "p-3")}>
      <div className="grid grid-cols-2 gap-2">
        {tiles.map(({ kind, Icon, hint }, index) => (
          <div
            key={kind}
            className={cn(
              "flex aspect-4/3 flex-col items-center justify-center gap-1.5 rounded-md border",
              index === 0
                ? "border-brand/30 bg-brand-tint"
                : "border-line/70 bg-surface",
            )}
          >
            <Icon className={cn("size-5", index === 0 ? "text-brand" : "text-dim")} />
            <span className="font-mono text-2xs text-dim">{kind}</span>
            <span className="text-2xs text-dim">{hint}</span>
          </div>
        ))}
      </div>

      <p className="mt-3 flex items-center justify-center gap-2 text-2xs text-dim">
        <Kbd variant="inline">space</Kbd>
        to preview, without downloading
      </p>
    </div>
  );
}

export const FEATURE_VISUALS = {
  search: SearchVisual,
  share: ShareVisual,
  organize: OrganizeVisual,
  storage: StorageVisual,
  trash: TrashVisual,
  preview: PreviewVisual,
};
