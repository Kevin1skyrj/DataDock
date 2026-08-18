"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * One destination.
 *
 * The active treatment — tinted fill, accent ring, accent rail — is the same
 * one `PreviewFileRow` and the How It Works steps use. Selection should mean
 * the same thing everywhere in the product, and it costs nothing to say it the
 * same way.
 *
 * The accessible name is written out rather than left to the text content,
 * because in rail mode there is no text content: the label is `display: none`,
 * not merely invisible. The count goes into it too — "Shared, 12 items" is what
 * a screen reader should hear, not "Shared" followed by a bare number.
 *
 * `title` appears only in the rail, which is why it comes from React state
 * rather than CSS. A native tooltip is the one hover hint that cannot be
 * clipped by the nav list's own scrolling, and the alternative was a popover
 * primitive for eight rows.
 */
export function SidebarNavItem({ item, Icon, active, collapsed, onNavigate }) {
  const hasCount = item.count != null;
  const description = hasCount ? `${item.label}, ${item.count} items` : item.label;

  return (
    <Link
      href={item.href}
      data-shell="nav-item"
      aria-label={description}
      aria-current={active ? "page" : undefined}
      title={collapsed ? description : undefined}
      onClick={onNavigate}
      className={cn(
        "relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-md",
        "transition-colors duration-150 ease-standard",
        active
          ? "bg-brand-tint text-foreground ring-1 ring-brand/25 ring-inset"
          : "text-muted-foreground hover:bg-surface hover:text-foreground",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-brand transition-opacity duration-150 ease-standard",
          active ? "opacity-100" : "opacity-0",
        )}
      />

      <Icon className={cn("size-4 shrink-0", active && "text-brand")} />

      <span data-shell="rail-hide" className="min-w-0 flex-1 truncate">
        {item.label}
      </span>

      {hasCount ? (
        <span data-shell="rail-hide" className="font-mono text-xs text-dim">
          {item.count}
        </span>
      ) : null}
    </Link>
  );
}
