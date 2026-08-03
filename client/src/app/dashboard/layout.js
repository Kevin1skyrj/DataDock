import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireSession } from "@/services/mock/session";

export const metadata = {
  title: {
    default: "Dashboard",
    template: "%s · DataDock",
  },
};

/**
 * Every authenticated screen renders through here.
 *
 * `requireSession` is awaited even though it cannot currently fail. It is the
 * seam: when there is a backend, this is the line that reads the cookie and
 * redirects to `/login`, and having the call already in place means adding the
 * guard is a change to one function rather than to every route beneath it.
 *
 * No `PageAtmosphere`. Drifting light behind a file table is noise, and this is
 * somewhere people work. The visual continuity with the landing page and the
 * authentication screens comes from the tokens, the surfaces and the type —
 * not from repeating the marketing light show.
 */
export default async function DashboardLayout({ children }) {
  await requireSession();

  return <DashboardShell>{children}</DashboardShell>;
}
