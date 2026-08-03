import { ArrowUp } from "lucide-react";

import { FOOTER_NAV } from "@/constants/footer";

/**
 * The marketing footer.
 *
 * The one landing component with no "use client" and no animation. Nothing here
 * needs state, a pointer or a scroll position, so it ships no JavaScript at all
 * — which is also the honest answer to "should the footer animate": no.
 *
 * The year is resolved when the page is built. This route is statically
 * prerendered, so it freezes until the next deploy; that is the usual trade for
 * a static page, and the alternative — resolving it on the client — would cost
 * a hydration boundary for a number nobody reads.
 */
const YEAR = new Date().getFullYear();

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-page px-5 py-14 sm:px-10 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 sm:gap-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-24">
          <div className="max-w-xs">
            <a
              href="#top"
              className="text-xl font-semibold tracking-tight text-foreground transition-colors duration-200 ease-standard hover:text-foreground"
            >
              DataDock
            </a>
            <p className="mt-3 text-base leading-[1.6] text-dim">
              Store smarter. Organize beautifully.
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 sm:gap-x-12 lg:gap-x-16"
          >
            {FOOTER_NAV.map((group) => (
              <div key={group.label}>
                {/* A real heading, so the columns are landmarks a screen reader
                    can jump between rather than three unlabelled lists. */}
                <h2 className="text-2xs tracking-widest text-dim uppercase">{group.label}</h2>

                <ul className="mt-4 flex flex-col gap-2.5">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        className="text-base text-muted-foreground transition-colors duration-200 ease-standard hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-14 flex flex-col-reverse items-start gap-4 border-t border-line/70 pt-6 sm:mt-16 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base text-dim">© {YEAR} DataDock. All rights reserved.</p>

          <a
            href="#top"
            className="group inline-flex items-center gap-1.5 text-base text-dim transition-colors duration-200 ease-standard hover:text-foreground"
          >
            Back to top
            <ArrowUp className="size-3.5 transition-transform duration-300 ease-out-expo group-hover:-translate-y-0.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
