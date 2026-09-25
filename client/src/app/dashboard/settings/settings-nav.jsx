"use client";

import Link from "next/link";
import { Check, ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SETTINGS_SECTIONS } from "@/constants/settings";
import { cn } from "@/lib/utils";

/**
 * The settings sections.
 *
 * A stable column on desktop and a themed section picker below `lg`. Six tabs
 * no longer fit honestly once the sidebar and page padding are accounted for;
 * clipping the final destinations is worse than one clear, full-width control.
 * The shared menu primitive keeps the picker inside the product's dark/light
 * theme instead of delegating its popup colours to the operating system.
 *
 * The active check is exact for the index and prefixed for the rest, because
 * `/dashboard/settings` is a parent of all of them and would otherwise light up
 * on every page.
 */
export function SettingsNav() {
  const pathname = usePathname();
  const isActive = (section) =>
    section.href === "/dashboard/settings"
      ? pathname === section.href
      : pathname.startsWith(section.href);
  const activeSection = SETTINGS_SECTIONS.find(isActive) ?? SETTINGS_SECTIONS[0];

  return (
    <nav aria-label="Settings sections" className="lg:w-48 lg:shrink-0">
      <div className="lg:hidden">
        <span className="mb-1.5 block text-xs font-medium text-dim">
          Settings section
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="secondary"
                size="lg"
                aria-label="Choose settings section"
                className="w-full px-3 [&>span]:w-full [&>span]:justify-between"
              >
                <span>{activeSection.label}</span>
                <ChevronDown className="size-4 text-dim" />
              </Button>
            }
          />

          <DropdownMenuContent
            side="bottom"
            align="start"
            className="w-[calc(100vw-2rem)] sm:w-80"
          >
            {SETTINGS_SECTIONS.map((section) => (
              <DropdownMenuItem
                key={section.id}
                render={
                  <Link
                    href={section.href}
                    aria-current={isActive(section) ? "page" : undefined}
                  />
                }
                className={cn(isActive(section) && "bg-brand-tint text-foreground")}
              >
                <span className="flex-1">{section.label}</span>
                {isActive(section) ? <Check className="size-4 text-brand" /> : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ul
        className={cn(
          "hidden gap-1 lg:flex lg:flex-col",
        )}
      >
        {SETTINGS_SECTIONS.map((section) => {
          const active = isActive(section);

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
