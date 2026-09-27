import { PREVIEW_STORAGE } from "@/constants/preview-data";
import { cn } from "@/lib/utils";

function formatPercent(value) {
  if (value === 0) return "0%";
  if (value < 0.1) return "<0.1%";
  if (value === 100) return "100%";
  return `${value.toFixed(1).replace(/\.0$/, "")}%`;
}

/**
 * How full the drive is.
 *
 * Shared by three places that have nothing else in common — the landing page's
 * hero, the authentication backdrop, and the dashboard sidebar — which is the
 * reason it lives in `common` rather than beside any one of them.
 *
 * By default it renders empty and waits to be filled: the hero's timeline finds
 * it through `data-storage-*` and counts it up. Pass `value` where there is no
 * timeline and it renders at rest instead, dropping the animator's hooks so
 * nothing can later claim it. A meter stuck at 0% because nobody animated it is
 * the kind of bug that only shows up in the one context you did not check.
 */
export function StorageMeter({ className, value, usedLabel, totalLabel, loading = false, unavailable = false }) {
  const atRest = value != null;
  const percent = atRest ? Math.max(0, Math.min(Number(value) || 0, 100)) : 0;

  return (
    <div
      data-preview="item"
      className={cn("rounded-lg border border-line/70 bg-surface p-3.5", className)}
    >
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Storage</span>
        <span data-storage-pct={atRest ? undefined : ""} className="font-mono text-brand">
          {atRest ? formatPercent(percent) : "0%"}
        </span>
      </div>

      <div
        role={atRest ? "progressbar" : undefined}
        aria-label={atRest ? "Storage used" : undefined}
        aria-valuemin={atRest ? 0 : undefined}
        aria-valuemax={atRest ? 100 : undefined}
        aria-valuenow={atRest ? percent : undefined}
        className="mt-2.5 h-2 overflow-hidden rounded-full bg-surface-2"
      >
        {/* scaleX rather than width: the design animates width for 1.5s, which
            is layout on every frame. This composites on the GPU instead. */}
        <div
          data-storage-bar={atRest ? undefined : ""}
          className="h-full origin-left rounded-full bg-brand"
          style={{ transform: `scaleX(${percent / 100})` }}
        />
      </div>

      <p className="mt-2.5 text-xs text-dim">
        {unavailable
          ? "Storage unavailable"
          : loading
          ? "Loading storage…"
          : `${usedLabel ?? PREVIEW_STORAGE.used} of ${totalLabel ?? PREVIEW_STORAGE.total} used`}
      </p>
    </div>
  );
}
