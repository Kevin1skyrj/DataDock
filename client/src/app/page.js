"use client";

import { ArrowRight, Trash2, Upload } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
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
