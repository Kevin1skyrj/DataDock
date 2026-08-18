"use client";

import { Bell, FolderPlus, Pencil, Share2, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { getStorageActivity } from "@/services/files";

const ICONS = {
  share: Share2,
  upload: Upload,
  created: FolderPlus,
  modified: Pencil,
  deleted: Trash2,
  uploaded: Upload,
  shared: Share2,
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
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    getStorageActivity(6).then(setActivity).catch(() => setActivity([]));
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative"
            aria-label="Recent activity"
          >
            <Bell />
          </Button>
        }
      />

      <DropdownMenuContent className="w-[min(20rem,calc(100vw-2rem))]">
        {/* The label lives inside the group: Base UI reads that context to wire
            `aria-labelledby`, and throws outright without it. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>Activity</DropdownMenuLabel>

          {activity.length === 0 ? (
            <p className="px-3 py-5 text-center text-sm text-dim">No recent activity.</p>
          ) : activity.map((event) => {
            const Icon = ICONS[event.type] ?? Bell;

            return (
              <DropdownMenuItem key={event.id} className="items-start gap-3 py-2">
                <span
                  className={cn(
                    "mt-0.5 grid size-7 shrink-0 place-items-center rounded-md",
                    "bg-surface-2 text-dim",
                  )}
                >
                  <Icon className="size-3.5" />
                </span>

                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span
                    className={cn(
                      "truncate text-base",
                      "text-muted-foreground",
                    )}
                  >
                    {activityTitle(event.type)}
                  </span>
                  <span className="truncate text-sm text-dim">{event.item.name}</span>
                </span>

                <span className="shrink-0 text-xs text-dim">{formatDate(event.at)}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function activityTitle(type) {
  return {
    created: "Folder created",
    uploaded: "File uploaded",
    modified: "Item updated",
    shared: "Link shared",
    deleted: "Moved to trash",
  }[type] ?? "Activity";
}
