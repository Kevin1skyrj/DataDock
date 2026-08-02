import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const kbdVariants = cva(
  "inline-flex select-none items-center justify-center font-mono leading-none whitespace-nowrap",
  {
    variants: {
      variant: {
        // Sits inside another control — the header search chip, an input's end slot.
        inline: "rounded-sm border border-line px-1.5 py-0.5 text-2xs text-dim",
        // Physical keycap, with the design's heavier bottom border. Used where
        // the shortcut is the subject rather than a hint.
        key: "min-w-11 rounded-sm border border-line border-b-2 bg-bg-deep px-1.5 py-1 text-xs text-muted-foreground",
        // No chrome — for dense rows like the palette footer legend.
        bare: "text-2xs text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "inline",
    },
  },
);

/**
 * A keyboard hint.
 *
 * Renders a real `<kbd>` so assistive technology announces it as keyboard
 * input. Compose multiple for a chord rather than passing a combined string:
 *
 *   <Kbd variant="key">⌘</Kbd><Kbd variant="key">K</Kbd>
 */
export function Kbd({ className, variant, ...props }) {
  return <kbd className={cn(kbdVariants({ variant }), className)} {...props} />;
}
