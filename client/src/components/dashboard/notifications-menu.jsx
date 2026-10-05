"use client";

import { Bell, FolderPlus, Pencil, Share2, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { getNotifications, markNotificationsRead } from "@/services/api/notifications";

const ICONS = {
  share: Share2,
  upload: Upload,
  created: FolderPlus,
  modified: Pencil,
  deleted: Trash2,
  uploaded: Upload,
  imported: Upload,
  shared: Share2,
  viewed: Share2,
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
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    getNotifications(10)
      .then((page) => { setActivity(page.items); setUnread(page.unread); })
      .catch(() => setActivity([]));
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative"
            aria-label={unread ? `${unread} unread notifications` : "Notifications"}
            onClick={() => {
              if (unread) {
                setUnread(0);
                markNotificationsRead().catch(() => {});
              }
            }}
          >
            <Bell />
            {unread ? <span aria-hidden="true" className="absolute right-1 top-1 size-1.5 rounded-full bg-brand" /> : null}
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
              <div key={event.id} className="flex items-start gap-3 rounded-md px-2 py-2">
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
              </div>
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
    imported: "Import complete",
    modified: "Item updated",
    shared: "Link shared",
    viewed: "Share link opened",
    security: "Security alert",
    deleted: "Moved to trash",
  }[type] ?? "Activity";
}
