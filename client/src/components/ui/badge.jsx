import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  [
    "inline-flex shrink-0 items-center gap-1 font-medium whitespace-nowrap",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3",
  ],
  {
    variants: {
      variant: {
        brand: "bg-brand-soft text-brand",
        neutral: "bg-surface-2 text-muted-foreground",
        success: "bg-success/12 text-success",
        warning: "bg-warning/12 text-warning",
        error: "bg-error/12 text-error",
      },
      size: {
        sm: "px-2 py-0.5 text-2xs",
        md: "px-2.5 py-1 text-xs",
      },
      pill: {
        true: "rounded-full",
        false: "rounded-md",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "md",
      pill: false,
    },
  },
);

/**
 * A status or category label.
 *
 * Tone carries meaning, so pick the variant by what the badge says rather than
 * by how it should look. Typographic treatment stays with the caller — the
 * design's "Popular" pill is `<Badge variant="brand" pill className="uppercase
 * tracking-wide">` rather than another variant.
 */
export function Badge({ className, variant, size, pill, ...props }) {
  return <span className={cn(badgeVariants({ variant, size, pill }), className)} {...props} />;
}
