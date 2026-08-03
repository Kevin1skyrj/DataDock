"use client";

import { Menu, Search } from "lucide-react";

import { CommandTrigger } from "@/components/common/command-trigger";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { NotificationsMenu } from "@/components/dashboard/notifications-menu";
import { UserMenu } from "@/components/dashboard/user-menu";
import { Button } from "@/components/ui/button";
import { SHELL } from "@/constants/dashboard";
import { requestPalette } from "@/lib/palette-event";

/**
 * The top bar.
 *
 * Fixed, 56px, and deliberately quiet: location on the left, the command
 * interface and the two things that belong to the account on the right. Nothing
 * else earns a permanent slot.
 *
 * Below `md` the trigger collapses to its icon. The shortcut it advertises does
 * not exist on a device with no keyboard, and a 220px chip explaining a
 * keystroke you cannot press is the wrong use of a phone's top bar — but the
 * palette itself still opens, because search matters more on a small screen,
 * not less.
 */
export function DashboardTopBar({ onOpenMenu }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-background px-4 sm:px-5">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onOpenMenu}
        aria-label={SHELL.openMenu}
        className="md:hidden"
      >
        <Menu />
      </Button>

      <Breadcrumbs />

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <CommandTrigger
          label={SHELL.commandTrigger}
          className="hidden md:flex md:w-64 lg:w-72"
        />

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={requestPalette}
          aria-label={SHELL.commandTrigger}
          className="md:hidden"
        >
          <Search />
        </Button>

        <NotificationsMenu />
        <UserMenu />
      </div>
    </header>
  );
}
