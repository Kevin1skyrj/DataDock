"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { SEGMENT_LABELS } from "@/constants/dashboard";
import { cn } from "@/lib/utils";

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
 */
export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const trail = segments.map((segment, index) => ({
    segment,
    label: SEGMENT_LABELS[segment] ?? segment,
    href: `/${segments.slice(0, index + 1).join("/")}`,
    last: index === segments.length - 1,
  }));

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5">
        {trail.map((rung) => (
          <li
            key={rung.href}
            className={cn("flex min-w-0 items-center gap-1.5", !rung.last && "hidden sm:flex")}
          >
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
