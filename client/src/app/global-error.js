"use client";

import { TriangleAlert } from "lucide-react";

import { Notice } from "@/components/common/notice";
import { Button } from "@/components/ui/button";
import { fontVariables } from "@/lib/fonts";

import "./globals.css";

/**
 * The last resort.
 *
 * `global-error` replaces the root layout rather than rendering inside it, which
 * is the only way to catch a failure in the layout itself. Everything that
 * layout normally supplies therefore has to be supplied again here — the
 * document elements, the stylesheet and the fonts — because by definition none
 * of it ran.
 *
 * Three deliberate reductions, all for the same reason: whatever this screen
 * depends on is something that can also be broken when it is needed.
 *
 * - No providers. The theme is pinned to `dark`, the product's declared primary
 *   experience, rather than read from a provider that has not mounted. A light
 *   user sees one dark screen on a failure that should never happen twice.
 * - No boot script. It only applies preferences — accent, density, sidebar —
 *   and none of them change whether this message can be read.
 * - Plain anchors, not `next/link`. A soft navigation would re-enter the tree
 *   that just failed; a real document load is what actually recovers.
 */

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en" className={`dark ${fontVariables}`}>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <main className="flex min-h-dvh items-center justify-center px-5 py-16">
          <Notice
            icon={TriangleAlert}
            title="DataDock couldn't start"
            body="Something failed before the application finished loading. Your account and your files are untouched."
            detail={error?.digest ? `Reference ${error.digest}` : null}
          >
            <Button onClick={() => reset()}>Try again</Button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages --
                The full document load is the point. `next/link` would navigate
                on the client, back into the tree whose root layout just threw,
                and a deterministic failure would simply throw again. This is the
                one route in the application that must not be soft. */}
            <Button variant="secondary" render={<a href="/" />}>
              Reload DataDock
            </Button>
          </Notice>
        </main>
      </body>
    </html>
  );
}
