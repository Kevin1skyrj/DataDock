"use client";

import { Check } from "lucide-react";
import Link from "next/link";

import { AuthPanel } from "@/components/auth/auth-panel";
import { Button } from "@/components/ui/button";
import { useAnnounceScreen } from "@/lib/auth-screen";

/**
 * The end of a flow.
 *
 * Both places this appears — a confirmed email, a changed password — are the
 * last moment of something that took several screens, and both want the same
 * three things: a mark saying it worked, a sentence saying what worked, and one
 * door out. No secondary action, because there is no second thing anyone wants
 * from this screen.
 *
 * It is a state rather than a route on purpose. `/success` would be a URL that
 * means nothing if you reload it and lies if you bookmark it; this arrives in
 * the same window the flow has been running in all along, and the window's
 * height morph carries it in.
 */
export function AuthSuccess({ title, description, action }) {
  // Replaced a form at the same URL, so the window has to be told — see
  // lib/auth-screen.js.
  useAnnounceScreen();

  return (
    <AuthPanel title={title} description={description} icon={<Check strokeWidth={2.5} />}>
      <Button
        data-auth="item"
        size="lg"
        render={<Link href={action.href} />}
        className="dd-shine w-full"
      >
        {action.label}
      </Button>
    </AuthPanel>
  );
}
