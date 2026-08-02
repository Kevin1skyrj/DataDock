"use client";

import { ArrowRight, Search, Trash2, Upload } from "lucide-react";
import { useTheme } from "next-themes";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { ACCENTS } from "@/constants/accents";
import { useMounted } from "@/hooks/use-mounted";
import { useAccent } from "@/providers/accent-provider";

/**
 * Temporary foundation harness. It exists only to prove the token layer,
 * theme switching and accent switching work end to end, and is replaced by
 * the landing page in build step 4.
 */
export default function FoundationPage() {
  const { resolvedTheme, setTheme } = useTheme();
  const { accent, setAccent } = useAccent();
  const mounted = useMounted();

  return (
    <main className="mx-auto flex min-h-dvh max-w-page flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-2">
        <span className="text-xs tracking-widest text-dim uppercase">Foundation</span>
        <h1 className="text-display-lg font-semibold tracking-hero">DataDock token layer</h1>
        <p className="text-md text-muted-foreground">
          Theme, accent and surface tokens resolved from the design system.
        </p>
      </header>

      <section className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="rounded-md border border-line bg-surface px-4 py-2 text-base font-medium transition-colors duration-200 ease-standard hover:bg-surface-2"
        >
          Theme: {mounted ? resolvedTheme : "…"}
        </button>

        {ACCENTS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setAccent(option.id)}
            aria-pressed={accent === option.id}
            className="flex items-center gap-2 rounded-md border border-line bg-surface px-4 py-2 text-base font-medium transition-colors duration-200 ease-standard hover:bg-surface-2 aria-pressed:border-brand"
          >
            <span
              className="size-3 rounded-full"
              style={{ background: option.swatch }}
              aria-hidden="true"
            />
            {option.label}
          </button>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { name: "surface", className: "bg-surface" },
          { name: "surface-2", className: "bg-surface-2" },
          { name: "brand", className: "bg-brand text-brand-contrast" },
          { name: "brand-soft", className: "bg-brand-soft" },
          { name: "brand-tint", className: "bg-brand-tint" },
          { name: "success", className: "bg-success text-background" },
          { name: "warning", className: "bg-warning text-background" },
        ].map((swatch) => (
          <div
            key={swatch.name}
            className={`rounded-xl border border-line p-6 shadow-elevated ${swatch.className}`}
          >
            <span className="font-mono text-sm">{swatch.name}</span>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-6 rounded-xl border border-line bg-surface p-6">
        <p className="text-display-xs font-semibold tracking-tight">Button</p>

        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">
            <Trash2 />
            Delete
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">
            <Upload />
            Large with icon
          </Button>
          <Button size="icon" variant="secondary" aria-label="Upload">
            <Upload />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button disabled>Disabled</Button>
          <Button loading>Saving changes</Button>
          <Button variant="secondary" loading>
            Uploading
          </Button>
          <Button render={<a href="#type-ladder" />}>
            Rendered as anchor
            <ArrowRight />
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-6 rounded-xl border border-line bg-surface p-6">
        <p className="text-display-xs font-semibold tracking-tight">Input</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Small" size="sm" />
          <Input placeholder="Medium (default)" />
          <Input placeholder="Large" size="lg" />
          <Input placeholder="Search files and folders" startIcon={<Search />} />
          <Input placeholder="Disabled" disabled />
          <Input placeholder="Invalid" invalid defaultValue="not-an-email" />
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-line bg-bg-deep px-3">
          <Search className="size-4 shrink-0 text-dim" />
          <Input variant="bare" placeholder="Bare variant, inside its own container" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Input placeholder="Aligns with buttons" size="sm" className="w-56" />
          <Button size="sm" variant="secondary">
            Toolbar action
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-6 rounded-xl border border-line bg-surface p-6">
        <p className="text-display-xs font-semibold tracking-tight">Kbd &amp; Badge</p>

        <div className="flex flex-wrap items-center gap-3">
          <Kbd>⌘K</Kbd>
          <span className="flex items-center gap-1">
            <Kbd variant="key">⌘</Kbd>
            <Kbd variant="key">K</Kbd>
          </span>
          <Kbd variant="bare">↑↓ navigate</Kbd>
          <Input
            placeholder="Search everything"
            startIcon={<Search />}
            endSlot={<Kbd>⌘K</Kbd>}
            className="w-72"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="brand" pill className="uppercase tracking-wide">
            Popular
          </Badge>
          <Badge variant="brand">PDF</Badge>
          <Badge>248 files</Badge>
          <Badge variant="success">Link active</Badge>
          <Badge variant="warning">Expires in 3 days</Badge>
          <Badge variant="error">Upload failed</Badge>
          <Badge size="sm">sm</Badge>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <p className="text-display-xs font-semibold tracking-tight">Card</p>

        <div className="grid gap-4 md:grid-cols-3">
          <Card interactive>
            <CardHeader>
              <CardTitle>Instant search</CardTitle>
              <CardDescription>
                Results appear as you type — filter by type, size, or date without leaving the
                keyboard.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card as="article" variant="raised">
            <CardHeader>
              <CardTitle>Pro</CardTitle>
              <CardDescription>For daily working files.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button size="sm" className="w-full">
                Choose Pro
              </Button>
            </CardFooter>
          </Card>

          <Card padding="lg">
            <CardHeader>
              <CardTitle>Storage</CardTitle>
              <CardDescription>61.2 GB of 100 GB used</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section className="flex flex-col gap-6 rounded-xl border border-line bg-surface p-6">
        <p className="text-display-xs font-semibold tracking-tight">Dialog</p>

        <div className="flex flex-wrap items-center gap-3">
          <Dialog>
            <DialogTrigger render={<Button variant="secondary">Rename file</Button>} />
            <DialogContent size="sm">
              <DialogHeader>
                <DialogTitle>Rename file</DialogTitle>
                <DialogDescription>
                  Choose a new name for “Brand guidelines.pdf”.
                </DialogDescription>
              </DialogHeader>
              <DialogBody>
                <Input defaultValue="Brand guidelines.pdf" aria-label="File name" />
              </DialogBody>
              <DialogFooter>
                <DialogClose render={<Button variant="secondary">Cancel</Button>} />
                <DialogClose render={<Button>Save</Button>} />
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger render={<Button variant="destructive">Delete</Button>} />
            <DialogContent size="sm">
              <DialogHeader>
                <DialogTitle>Move to trash?</DialogTitle>
                <DialogDescription>
                  Deleted files rest in trash for 30 days and restore to their original folder.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="secondary">Cancel</Button>} />
                <DialogClose render={<Button variant="destructive">Move to trash</Button>} />
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger render={<Button variant="ghost">Top-anchored (palette shape)</Button>} />
            <DialogContent position="top" showClose={false}>
              <DialogHeader className="sr-only">
                <DialogTitle>Command palette</DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-3 border-b border-line px-4">
                <Search className="size-4 shrink-0 text-dim" />
                <Input
                  variant="bare"
                  size="lg"
                  placeholder="Search this page, or type a command…"
                  aria-label="Search"
                />
                <Kbd>ESC</Kbd>
              </div>
              <DialogBody className="py-4 text-base text-muted-foreground">
                Palette results will live here in step 4.
              </DialogBody>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <section
        id="type-ladder"
        className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-6"
      >
        <p className="text-display-xs font-semibold tracking-tight">Type ladder</p>
        <p className="text-2xs text-dim">2xs · 10px</p>
        <p className="text-sm text-muted-foreground">sm · 12px</p>
        <p className="text-base">base · 13px</p>
        <p className="text-md">md · 14px</p>
        <p className="text-xl font-medium">xl · 16px</p>
      </section>
    </main>
  );
}
