"use client";

import { BarChart3, Bell, Clock, Share2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NOTIFICATIONS } from "@/constants/dashboard";
import { cn } from "@/lib/utils";

const ICONS = {
  share: Share2,
  upload: Upload,
  clock: Clock,
  chart: BarChart3,
};

/**
 * Recent activity, out of the way.
 *
 * A menu rather than a bespoke popover because every row here is going
 * somewhere — a file, a link, the storage page — so menu semantics are the
 * honest ones, and Base UI's already handle the arrow keys, the focus return
 * and the outside press.
 *
 * The unread dot is deliberately small and unlabelled in the visual, with the
 * count carried in the button's accessible name instead. A number badge in
 * permanent chrome is a standing demand for attention, and this dashboard is
 * supposed to feel calm.
 */
export function NotificationsMenu() {
  const unread = NOTIFICATIONS.filter((item) => item.unread).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative"
            aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
          >
            <Bell />
            {unread ? (
              <span
                aria-hidden="true"
                className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-brand ring-2 ring-background"
              />
            ) : null}
          </Button>
        }
      />

      <DropdownMenuContent className="w-[min(20rem,calc(100vw-2rem))]">
        <DropdownMenuLabel>Activity</DropdownMenuLabel>

        {NOTIFICATIONS.map((item) => {
          const Icon = ICONS[item.icon] ?? Bell;

          return (
            <DropdownMenuItem key={item.id} className="items-start gap-3 py-2">
              <span
                className={cn(
                  "mt-0.5 grid size-7 shrink-0 place-items-center rounded-md",
                  item.unread ? "bg-brand-tint text-brand" : "bg-surface-2 text-dim",
                )}
              >
                <Icon className="size-3.5" />
              </span>

              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span
                  className={cn(
                    "truncate text-base",
                    item.unread ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {item.title}
                </span>
                <span className="truncate text-sm text-dim">{item.body}</span>
              </span>

              <span className="shrink-0 text-xs text-dim">{item.time}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
