import { cn } from "@/lib/utils";

/**
 * The sheet laid over the window.
 *
 * Every authentication screen is this shape — a title, a line explaining what
 * is about to happen, the thing you do, and a way out to the screen you
 * probably wanted instead. Holding that in one place is what will keep five
 * screens feeling like one flow rather than five pages that happen to share a
 * background.
 *
 * `bg-overlay` on a `bg-bg-deep` window is doing real work: the sheet has to
 * read as resting *above* the drive, and it is the elevation, not the border,
 * that says so.
 *
 * The `data-auth` attributes are the window's entrance timeline reaching in.
 * Nothing here schedules its own animation — one score, one component that owns
 * it, and screens that stay declarative.
 */
export function AuthPanel({ title, description, icon, children, footer, className }) {
  return (
    <section
      data-auth="sheet"
      className={cn(
        // `min-w-0` for the same reason the window's grid cell carries it: the
        // sheet is a grid item, so its default `min-width: auto` would hold it
        // at the min-content width of the widest `whitespace-nowrap` control
        // inside it and push it out through the window frame on a phone.
        "w-full min-w-0 max-w-100 rounded-xl border border-line-2 bg-overlay p-6 shadow-elevated sm:p-8",
        className,
      )}
    >
      {/* Only the two success screens use this, and both use it for the same
          thing: saying "it worked" before the sentence that explains what
          worked. Left-aligned with everything else — a centred success panel
          would be the one screen in the flow that changes shape. */}
      {icon ? (
        <div
          data-auth="item"
          className="mb-5 grid size-11 place-items-center rounded-full bg-brand-tint text-brand ring-1 ring-brand/25 ring-inset [&_svg]:size-5"
        >
          {icon}
        </div>
      ) : null}

      <header className="flex flex-col gap-2">
        <h1
          data-auth="item"
          className="text-display-sm font-semibold tracking-tight text-balance"
        >
          {title}
        </h1>

        <p data-auth="item" className="text-lg leading-[1.55] text-muted-foreground">
          {description}
        </p>
      </header>

      <div className="mt-7">{children}</div>

      {footer ? (
        <p data-auth="item" className="mt-7 text-center text-base text-muted-foreground">
          {footer}
        </p>
      ) : null}
    </section>
  );
}
