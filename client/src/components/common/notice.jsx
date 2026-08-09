import { cn } from "@/lib/utils";

/**
 * A dead end, and the way out of it.
 *
 * Three screens share this shape — the 404, the root error boundary and the
 * dashboard's — because they are the same message with different words: this is
 * not the page you wanted, here is what happened, here is where to go instead.
 * Writing it once is also what keeps them consistent, and consistency is most of
 * what makes an error screen feel like part of the product rather than a hole
 * in it.
 *
 * It renders the block, never the page around it. The 404 sits in a lit,
 * full-viewport frame; the dashboard's error sits inside the shell with the
 * sidebar still there to leave by. Owning the frame here would force one of
 * those two to be wrong.
 *
 * The tone is deliberately flat. Nothing here apologises twice, none of it is
 * playful, and every one of them says plainly whether the visitor's files were
 * affected — which is the only question anyone actually has when a storage
 * product shows them an error.
 */
export function Notice({ code, icon: Icon, title, body, detail, children, className }) {
  return (
    <div className={cn("flex flex-col items-center gap-5 text-center", className)}>
      <span
        aria-hidden="true"
        className="grid size-12 place-items-center rounded-xl border border-line bg-surface text-dim"
      >
        <Icon className="size-5" />
      </span>

      <div className="flex max-w-80 flex-col gap-2">
        {code ? (
          <p className="font-mono text-xs tracking-widest text-dim uppercase">{code}</p>
        ) : null}

        <h1 className="text-display-sm font-semibold tracking-tight text-foreground">{title}</h1>

        <p className="text-md leading-[1.6] text-muted-foreground text-balance">{body}</p>
      </div>

      {children ? (
        <div className="flex flex-wrap items-center justify-center gap-3">{children}</div>
      ) : null}

      {/* The digest, when there is one. Small, monospaced and selectable rather
          than hidden in a console: it is the one string that makes a support
          conversation about this page short instead of long. */}
      {detail ? (
        <p className="font-mono text-2xs tracking-wide text-dim/70 select-all">{detail}</p>
      ) : null}
    </div>
  );
}
