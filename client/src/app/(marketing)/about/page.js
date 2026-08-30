import {
  ArrowRight,
  Command,
  FolderTree,
  Gauge,
  Layers,
  Search,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import { SiteFooter } from "@/components/landing/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "About",
  description:
    "Why DataDock exists: cloud storage that stays out of the way, built around the handful of things people actually do with their files.",
};

/**
 * About.
 *
 * Built from the same parts as the landing page — `SectionHeading`'s type ramp,
 * `Card`'s surface, the `Badge` eyebrow — so it reads as the same product
 * rather than a plain page that happens to share a header. Short, because an
 * about page earns nothing by being long: it answers one question, which is why
 * this exists when other drives already do.
 *
 * Everything here comes from the PRD's problem statement, positioning and
 * personas. Nothing is invented to fill space.
 */

const PRINCIPLES = [
  {
    icon: Layers,
    title: "Fewer things, done properly",
    body: "Most drives grow into ecosystems. This one does not. Upload, organise, find, share, and see what room is left — those are the jobs, and they get the attention.",
  },
  {
    icon: Command,
    title: "It behaves like a desktop app",
    body: "A command palette, real keyboard navigation, multi-select, drag and drop, instant previews. The things that make a file manager fast are the things the web usually leaves out.",
  },
  {
    icon: Gauge,
    title: "Speed is a feeling, not a metric",
    body: "Every action answers immediately and reconciles afterwards. Nothing spins where it could simply be done.",
  },
];

const AUDIENCE = [
  { who: "Students", what: "Notes, assignments and projects that must still be findable a term later." },
  { who: "Developers", what: "Documentation, screenshots, archives — everything a project accumulates." },
  { who: "Designers", what: "Large libraries of images, prototypes and exports that resist tidy naming." },
  { who: "Freelancers", what: "Client deliverables, contracts and invoices, shared without a second service." },
];

const NOT = [
  "A document editor",
  "A collaboration suite",
  "A sync client for your desktop",
  "A replacement for an enterprise ecosystem",
];

export default function AboutPage() {
  return (
    <>
      <main className="pb-24">
        {/* ----------------------------------------------------- opening -- */}
        <section className="mx-auto max-w-page px-5 pt-39 sm:px-10 sm:pt-48 lg:pt-44">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <Badge variant="neutral" pill size="md" className="tracking-wider uppercase">
              About
            </Badge>

            <h1 className="mt-5 text-display-md font-semibold tracking-tighter text-balance sm:text-display-lg lg:text-display-xl">
              Storage should get out of the way.
            </h1>

            <p className="mt-5 text-lg leading-[1.6] text-muted-foreground text-balance sm:text-2xl">
              Cloud storage became essential, then became complicated. The tools that hold our
              files grew into suites — more surfaces, more menus, more places a document could be.
              Somewhere in that growth, putting a file down and finding it again got slower.
            </p>
          </div>

          {/* The claim, restated as a surface rather than another paragraph. */}
          <div className="mx-auto mt-12 max-w-3xl">
            <Card variant="raised" padding="lg" className="relative overflow-hidden">
              {/* One soft light behind the panel, in the accent, so the card
                  belongs to the same room as the hero rather than sitting on
                  the page as a grey box. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 left-1/2 size-80 -translate-x-1/2 rounded-full opacity-45 blur-2xl"
                style={{
                  background: "radial-gradient(circle, var(--brand-glow) 0%, transparent 70%)",
                }}
              />

              <p className="relative text-lg leading-[1.6] text-foreground sm:text-xl">
                DataDock is a reply to that. Not a shorter feature list for its own sake — a drive
                built around the handful of things people genuinely do every day, made fast enough
                that they stop thinking about the drive at all.
              </p>
            </Card>
          </div>
        </section>

        {/* -------------------------------------------------- principles -- */}
        <section className="mx-auto mt-24 max-w-page px-5 sm:mt-28 sm:px-10">
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <h2 className="text-display-sm font-semibold tracking-tighter text-balance sm:text-display-md">
              What that means in practice
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {PRINCIPLES.map(({ icon: Icon, title, body }) => (
              <Card key={title} interactive className="h-full">
                <CardHeader>
                  <span
                    aria-hidden="true"
                    className="mb-4 grid size-10 place-items-center rounded-xl border border-line bg-brand-tint text-brand"
                  >
                    <Icon className="size-4.5" />
                  </span>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{body}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------- audience -- */}
        <section className="mx-auto mt-24 max-w-page px-5 sm:mt-28 sm:px-10">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-16">
            <div className="lg:pt-2">
              <h2 className="text-display-sm font-semibold tracking-tighter text-balance sm:text-display-md">
                Who it is for
              </h2>
              <p className="mt-4 max-w-md text-lg leading-[1.6] text-muted-foreground">
                People with enough files that organisation matters, and enough work to do that it
                should not take long.
              </p>
            </div>

            <dl className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
              {AUDIENCE.map(({ who, what }) => (
                <div key={who} className="flex flex-col gap-2 bg-bg-deep p-5">
                  <dt className="text-md font-medium text-foreground">{who}</dt>
                  <dd className="text-base leading-[1.6] text-muted-foreground">{what}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ------------------------------------------------------- scope -- */}
        <section className="mx-auto mt-24 max-w-page px-5 sm:mt-28 sm:px-10">
          <Card padding="lg" className="mx-auto max-w-3xl">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
              <span
                aria-hidden="true"
                className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-surface text-dim"
              >
                <ShieldCheck className="size-5" />
              </span>

              <div className="min-w-0">
                <h2 className="text-display-xs font-semibold tracking-tight">What it is not</h2>
                <p className="mt-2.5 text-base leading-[1.65] text-muted-foreground">
                  Saying this plainly seems better than implying otherwise. These are deliberately
                  out of scope, not missing.
                </p>

                <ul className="mt-5 flex flex-wrap gap-2">
                  {NOT.map((item) => (
                    <li key={item}>
                      <Badge variant="neutral" size="md" className="font-normal">
                        {item}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </section>

        {/* --------------------------------------------------------- cta -- */}
        <section className="mx-auto mt-24 max-w-page px-5 sm:mt-28 sm:px-10">
          <Card variant="raised" padding="lg" className="relative overflow-hidden text-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-32 left-1/2 size-125 -translate-x-1/2 rounded-full opacity-40 blur-2xl"
              style={{
                background: "radial-gradient(circle, var(--brand-glow) 0%, transparent 70%)",
              }}
            />

            <div className="relative mx-auto flex max-w-2xl flex-col items-center py-4">
              <h2 className="text-display-sm font-semibold tracking-tighter text-balance sm:text-display-md">
                Store smarter. Organize beautifully.
              </h2>

              <p className="mt-4 text-lg leading-[1.6] text-muted-foreground text-balance">
                Start with 500&nbsp;MB, free forever. No card, no sales call.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button size="lg" render={<Link href="/register" />} className="dd-shine">
                  Start free
                  <ArrowRight />
                </Button>
                <Button size="lg" variant="secondary" render={<Link href="/#pricing" />}>
                  See pricing
                </Button>
              </div>

              {/* The two things the product is actually judged on, named. */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-base text-dim">
                <span className="inline-flex items-center gap-2">
                  <Search className="size-4" aria-hidden="true" />
                  Instant search
                </span>
                <span className="inline-flex items-center gap-2">
                  <FolderTree className="size-4" aria-hidden="true" />
                  Nested folders
                </span>
                <span className="inline-flex items-center gap-2">
                  <Command className="size-4" aria-hidden="true" />
                  Command palette
                </span>
              </div>
            </div>
          </Card>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
