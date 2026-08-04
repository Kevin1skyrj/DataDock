import { cn } from "@/lib/utils";

/**
 * The surface every dashboard page renders into.
 *
 * `bg-overlay` on `bg-background`, hairline, `rounded-xl` — the same material
 * as the authentication sheet and the hero's product frame. The chrome around
 * it is flush and full-bleed so a file table gets every pixel of width, while
 * the pane itself stays a distinct, raised object: the window inside the
 * window, which is the shape this product has been showing since the hero.
 *
 * The pane fills the column by being a flex child of a `min-h-full` wrapper,
 * rather than by a `calc()` subtracting the top bar and the padding. A short
 * page still reads as a surface instead of a strip floating in an empty column,
 * and the height stays right when either of those measurements changes — which
 * a calc would silently get wrong at exactly one breakpoint.
 *
 * `toolbar` is pinned above the scrolling content — a view switcher or a sort
 * control belongs to the pane, not to the rows, and should not scroll away from
 * them. Nothing uses it yet; it is here because `PageContainer` is the contract
 * every page in the milestones after this one will be written against.
 */
/**
 * `flush` hands the padding to the child. The file workspace has a toolbar, a
 * scrolling listing and a status bar that each own their own edges, and a pane
 * that insets them all would put a gutter between the toolbar and the border it
 * is supposed to sit against.
 */
export function PageContainer({ toolbar, children, className, flush = false }) {
  return (
    <div className="flex min-h-full flex-col p-3 sm:p-4">
      <div
        className={cn(
          "flex flex-1 flex-col overflow-hidden rounded-xl border border-line bg-overlay",
          className,
        )}
      >
        {toolbar ? (
          <div className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3 sm:px-5">
            {toolbar}
          </div>
        ) : null}

        <div className={cn("flex min-h-0 flex-1 flex-col", !flush && "p-4 sm:p-6")}>
          {children}
        </div>
      </div>
    </div>
  );
}
