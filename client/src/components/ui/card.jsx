import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva("relative rounded-xl border shadow-[0_1px_0_var(--lit)_inset]", {
  variants: {
    variant: {
      // Solid surfaces keep text and controls clear against the page.
      default: "border-line bg-bg-deep",
      // A distinct plane for featured or long-form content.
      raised: "border-line-2 bg-overlay",
    },
    padding: {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    },
    interactive: {
      true: [
        "transition-[transform,border-color,box-shadow] duration-240 ease-standard",
        "hover:-translate-y-1 hover:scale-[1.008] hover:border-line-2",
        "hover:shadow-[0_1px_0_var(--lit)_inset,var(--elevation-hover)]",
      ],
      false: "",
    },
  },
  defaultVariants: {
    variant: "default",
    padding: "md",
    interactive: false,
  },
});

/**
 * A surface.
 *
 * The card owns its padding so the parts below stay layout-only and can be
 * used in any order. `as` exists because a pricing tier is an `<article>` and a
 * settings panel is a `<section>` — semantics shouldn't require a wrapper.
 *
 * Set `interactive` only when the whole card is a link or button. A card that
 * lifts on hover but does nothing is a false affordance.
 */
export function Card({ as: Component = "div", className, variant, padding, interactive, ...props }) {
  return (
    <Component
      className={cn(cardVariants({ variant, padding, interactive }), className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("flex flex-col gap-1.5", className)} {...props} />;
}

export function CardTitle({ as: Component = "h3", className, ...props }) {
  return (
    <Component className={cn("text-xl font-semibold tracking-tight", className)} {...props} />
  );
}

export function CardDescription({ className, ...props }) {
  return <p className={cn("text-base text-muted-foreground", className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return <div className={cn("flex items-center gap-3 pt-2", className)} {...props} />;
}
