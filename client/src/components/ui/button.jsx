"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { isValidElement } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap font-medium",
    "transition-[transform,background-color,border-color,box-shadow,color,filter] duration-200 ease-standard",
    // Icons size themselves unless the caller says otherwise.
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    // Covers both the native disabled attribute and Base UI's data-disabled,
    // which is what appears when the button is rendered as a non-button element.
    "disabled:pointer-events-none disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-brand text-brand-contrast",
          "shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_8px_22px_-10px_var(--brand-glow)]",
          "hover:-translate-y-px hover:brightness-[1.07]",
          "hover:shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_14px_30px_-10px_var(--brand-glow)]",
          "active:translate-y-0 active:scale-[0.98]",
        ],
        secondary: [
          "border border-line bg-surface text-foreground",
          "shadow-[0_1px_0_var(--lit)_inset]",
          // The border warms towards the accent and the surface lifts, so the
          // secondary answers a hover in the same language as the primary
          // without competing with it for attention.
          "hover:-translate-y-px hover:border-brand/35 hover:bg-surface-2",
          "hover:shadow-[0_1px_0_var(--lit)_inset,0_8px_20px_-12px_var(--brand-glow)]",
          "active:translate-y-0 active:scale-[0.985]",
        ],
        ghost: "text-muted-foreground hover:bg-surface hover:text-foreground active:scale-[0.98]",
        destructive:
          "bg-error/12 text-error hover:bg-error/20 active:scale-[0.98] dark:bg-error/15 dark:hover:bg-error/25",
      },
      size: {
        sm: "h-8 rounded-md px-3.5 text-sm",
        md: "h-9 rounded-md px-4 text-base",
        lg: "h-11 rounded-lg px-5 text-md",
        "icon-sm": "size-8 rounded-md",
        icon: "size-9 rounded-md",
        "icon-lg": "size-11 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

/**
 * The product's button.
 *
 * Composition uses Base UI's `render` prop rather than a wrapper element, so a
 * link-shaped call to action is still a real anchor:
 *
 *   <Button render={<Link href="/pricing" />}>Start free</Button>
 *
 * Focus is intentionally left to the global `:focus-visible` outline in
 * `globals.css` — one focus treatment across the whole app, and no double ring
 * when a button sits inside another focusable primitive.
 */
export function Button({
  className,
  variant,
  size,
  loading = false,
  disabled = false,
  render,
  nativeButton,
  children,
  ...props
}) {
  const isDisabled = disabled || loading;

  // Base UI emits native button props unless told otherwise, which would put an
  // invalid type="button" on a rendered anchor. Infer it from the render target
  // so callers get valid HTML without having to remember the flag.
  const isNativeButton =
    nativeButton ?? (isValidElement(render) ? render.type === "button" : true);

  // A control that navigates should be announced as a link, not a button.
  // Base UI defaults non-native targets to role="button", so anything with an
  // href gets its native link semantics put back.
  const isLink = isValidElement(render) && render.props?.href != null;

  return (
    <ButtonPrimitive
      render={render}
      nativeButton={isNativeButton}
      role={isLink ? "link" : undefined}
      disabled={isDisabled}
      // Keeps the button focused while a submit is in flight; without this the
      // focus ring jumps to <body> the moment the button disables itself.
      focusableWhenDisabled={loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading ? (
        <span className="absolute inset-0 grid place-items-center">
          <LoaderCircle data-motion="loop" className="size-4 animate-spin" />
          <span className="sr-only">Loading</span>
        </span>
      ) : null}

      {/* Held at full size while loading so the button never changes width. */}
      <span className={cn("inline-flex items-center gap-2", loading && "opacity-0")}>
        {children}
      </span>
    </ButtonPrimitive>
  );
}
