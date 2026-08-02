"use client";

import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const fieldVariants = cva(
  [
    "flex w-full items-center gap-2 transition-[border-color,background-color,box-shadow] duration-200 ease-standard",
    // The wrapper owns the focus treatment, so the outline traces the whole
    // field instead of the bare input sitting inside it.
    "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand",
    "has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        default: "border border-line bg-surface shadow-[0_1px_0_var(--lit)_inset] hover:border-line-2",
        // Borderless — for fields that sit inside an already-styled container,
        // such as the command palette or an inline rename.
        bare: "border-0 bg-transparent shadow-none focus-within:outline-none",
      },
      size: {
        sm: "h-8 rounded-md px-3 text-sm",
        md: "h-9 rounded-md px-3.5 text-base",
        lg: "h-11 rounded-lg px-4 text-md",
      },
      invalid: {
        true: "border-error focus-within:outline-error",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      invalid: false,
    },
  },
);

/**
 * A text field.
 *
 * The wrapper carries the border, background and focus ring; the `<input>`
 * itself is transparent. That mirrors how the design builds its search field
 * and lets icons or a keyboard hint sit inside the field's bounds:
 *
 *   <Input startIcon={<Search />} endSlot={<Kbd>⌘K</Kbd>} />
 *
 * `className` styles the field. Every other prop, including `ref`, goes to the
 * input, so `{...register("email")}` from React Hook Form spreads cleanly.
 */
export function Input({
  className,
  variant,
  size,
  invalid = false,
  startIcon,
  endSlot,
  ref,
  ...props
}) {
  return (
    <div className={cn(fieldVariants({ variant, size, invalid }), className)}>
      {startIcon ? <span className="text-dim">{startIcon}</span> : null}

      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "min-w-0 flex-1 bg-transparent text-foreground placeholder:text-dim",
          // The wrapper draws focus for the whole field; a second outline on
          // the input would nest inside it.
          "outline-none focus-visible:outline-none",
          "disabled:cursor-not-allowed",
        )}
        {...props}
      />

      {endSlot}
    </div>
  );
}
