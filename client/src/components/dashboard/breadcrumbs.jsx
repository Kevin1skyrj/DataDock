"use client";

import { ChevronRight, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SEGMENT_LABELS } from "@/constants/dashboard";
import { useBreadcrumbTrail } from "@/lib/breadcrumb-trail";
import { cn } from "@/lib/utils";

/** Rungs kept either side of the overflow menu when the trail is too long. */
const HEAD = 1;
const TAIL = 2;

/**
 * Where you are.
 *
 * Built from the URL rather than declared by each page, so it cannot fall out
 * of step with the route — and so folder navigation gets it for free: once
 * `/dashboard/files/client-work` exists, the trail already has a rung for it.
 * Segments missing from the label map fall through to the segment itself, which
 * is exactly what a folder slug should do until real folder names arrive.
 *
 * This is the only "where am I" indicator in the shell. Pages do not repeat it
 * as a heading — a breadcrumb reading `Home / All files` above an `<h1>` saying
 * "All files" is the same sentence twice, and the second one is louder.
 *
 * On narrow screens everything but the current page falls away. The parent
 * rungs are navigation, and there is already a way to navigate: the drawer.
 *
 * Folders are appended from a store rather than read from the URL. The route
 * cannot name them — a segment would be `fld_9k2m4x` and the breadcrumb would
 * render that — so the workspace, which is the only thing that has asked what
 * the folder is called, publishes the trail and this draws it. See
 * `lib/breadcrumb-trail.js`.
 *
 * Deep trails collapse in the middle. The first rung and the last two are what
 * people navigate by — where you started and where you are — so the middle
 * folds into a menu rather than the whole bar scrolling or truncating to
 * nothing.
 */
export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const folders = useBreadcrumbTrail();

  const routeTrail = segments.map((segment, index) => ({
    id: segment,
    label: SEGMENT_LABELS[segment] ?? segment,
    href: `/${segments.slice(0, index + 1).join("/")}`,
  }));

  const full = [
    ...routeTrail.map((rung) => ({ ...rung, folder: false })),
    ...folders.map((rung) => ({ id: rung.id, label: rung.name, href: rung.href, folder: true })),
  ];

  const overflowing = full.length > HEAD + TAIL + 1;
  const collapsed = overflowing ? full.slice(HEAD, full.length - TAIL) : [];
  const shown = overflowing ? [...full.slice(0, HEAD), ...full.slice(full.length - TAIL)] : full;
  const overflowAfter = HEAD - 1;

  const trail = shown.map((rung, index) => ({
    ...rung,
    last: index === shown.length - 1,
  }));

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5">
        {trail.map((rung, index) => (
          <li
            key={rung.href}
            className={cn("flex min-w-0 items-center gap-1.5", !rung.last && "hidden sm:flex")}
          >
            {overflowing && index === overflowAfter + 1 ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        aria-label={`${collapsed.length} more folders`}
                        className="grid size-5 place-items-center rounded-xs text-dim transition-colors duration-150 ease-standard hover:bg-surface hover:text-foreground"
                      >
                        <MoreHorizontal className="size-3.5" />
                      </button>
                    }
                  />
                  <DropdownMenuContent align="start" className="w-52">
                    {collapsed.map((hidden) => (
                      <DropdownMenuItem key={hidden.href} render={<Link href={hidden.href} />}>
                        <span className="truncate">{hidden.label}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 text-dim" />
              </>
            ) : null}

            {rung.last ? (
              <span aria-current="page" className="truncate text-md font-medium text-foreground">
                {rung.label}
              </span>
            ) : (
              <>
                <Link
                  href={rung.href}
                  className="truncate rounded-xs text-md text-muted-foreground transition-colors duration-150 ease-standard hover:text-foreground"
                >
                  {rung.label}
                </Link>
                <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 text-dim" />
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
