"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SETTINGS_SECTIONS } from "@/constants/settings";
import { cn } from "@/lib/utils";

/**
 * The settings sections.
 *
 * A column at `lg`, a scrolling row below it. Not a dropdown on mobile: there
 * are six of these and they are the only navigation on the page, so hiding them
 * behind a control would make every section two taps away instead of one.
 *
 * The active check is exact for the index and prefixed for the rest, because
 * `/dashboard/settings` is a parent of all of them and would otherwise light up
 * on every page.
 */
export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Settings sections" className="lg:w-48 lg:shrink-0">
      <ul
        className={cn(
          "flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0",
          // The scrollbar is suppressed on the horizontal rail; the overflow is
          // legible from the cut-off item, the way a tab strip should read.
          "dd-rail [--dd-rail-gutter:0px]",
        )}
      >
        {SETTINGS_SECTIONS.map((section) => {
          const active =
            section.href === "/dashboard/settings"
              ? pathname === section.href
              : pathname.startsWith(section.href);

          return (
            <li key={section.id} className="shrink-0">
              <Link
                href={section.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block rounded-md px-3 py-2 text-md whitespace-nowrap lg:px-2.5",
                  "transition-colors duration-150 ease-standard",
                  active
                    ? "bg-brand-tint text-foreground ring-1 ring-brand/25 ring-inset"
                    : "text-muted-foreground hover:bg-surface hover:text-foreground",
                )}
              >
                {section.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
