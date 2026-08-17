"use client";

import { Check, CreditCard, LogOut, Monitor, Moon, Settings, Sun } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ACCENTS } from "@/constants/accents";
import { notify } from "@/components/ui/toast";
import { useAccent } from "@/providers/accent-provider";
import { useMounted } from "@/hooks/use-mounted";
import { useSession } from "@/providers/session-provider";
import { logout } from "@/services/auth";
import { cn } from "@/lib/utils";

const THEMES = [
  { id: "light", label: "Light", Icon: Sun },
  { id: "dark", label: "Dark", Icon: Moon },
  { id: "system", label: "System", Icon: Monitor },
];

/**
 * The account, and the preferences that belong to it.
 *
 * Theme and accent live in here rather than in the top bar, and that is a
 * deliberate departure from the marketing header. On the landing page they are
 * in the chrome because a visitor is deciding how the site should look. In an
 * application they are settings — chosen once, changed rarely — and two
 * permanent slots in a bar you stare at all day is exactly the sort of thing
 * that stops a workspace feeling calm.
 *
 * Theme offers System here where the marketing toggle does not, because this is
 * the surface where you configure rather than flick.
 */
export function UserMenu() {
  const session = useSession();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const { theme, setTheme } = useTheme();
  const { accent, setAccent } = useAccent();
  const mounted = useMounted();

  const signOut = async () => {
    setSigningOut(true);

    try {
      await logout();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      setSigningOut(false);
      notify({ title: "Could not sign out", description: error.message, type: "error" });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Account — ${session.name}`}
            className="rounded-full"
          >
            <span
              aria-hidden="true"
              className="grid size-7 place-items-center rounded-full bg-brand-tint text-2xs font-semibold text-brand ring-1 ring-brand/25 ring-inset"
            >
              {session.initials}
            </span>
          </Button>
        }
      />

      <DropdownMenuContent className="w-60">
        <div className="flex flex-col gap-0.5 px-2 py-1.5">
          <p className="truncate text-base font-medium text-foreground">{session.name}</p>
          <p className="truncate text-sm text-dim">{session.email}</p>
        </div>

        <DropdownMenuSeparator />

        {/* The label sits inside the radio group: Base UI reads its group
            context to wire aria-labelledby, and throws without it. */}
        <DropdownMenuRadioGroup
          value={mounted ? theme : undefined}
          onValueChange={setTheme}
        >
          <DropdownMenuLabel>Theme</DropdownMenuLabel>

          {THEMES.map(({ id, label, Icon }) => (
            <DropdownMenuRadioItem key={id} value={id}>
              <Icon className="size-3.5" />
              <span className="flex-1">{label}</span>
              {mounted && theme === id ? <Check className="size-3.5 text-brand" /> : null}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        <DropdownMenuRadioGroup value={accent} onValueChange={setAccent}>
          <DropdownMenuLabel>Accent</DropdownMenuLabel>

          {ACCENTS.map((option) => (
            <DropdownMenuRadioItem key={option.id} value={option.id}>
              <span
                aria-hidden="true"
                className="size-3.5 shrink-0 rounded-full ring-1 ring-line-2"
                style={{ background: option.swatch }}
              />
              <span className="flex-1">{option.label}</span>
              {accent === option.id ? <Check className="size-3.5 text-brand" /> : null}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
          <Settings className="size-3.5" />
          <span className="flex-1">Settings</span>
        </DropdownMenuItem>

        <DropdownMenuItem render={<Link href="/dashboard/settings/billing" />}>
          <CreditCard className="size-3.5" />
          <span className="flex-1">Billing</span>
          <span className="rounded-sm bg-surface-2 px-1.5 py-0.5 text-2xs text-muted-foreground">
            {session.plan}
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          disabled={signingOut}
          onClick={signOut}
          className={cn("text-muted-foreground data-highlighted:text-error")}
        >
          <LogOut className="size-3.5" />
          <span className="flex-1">Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
