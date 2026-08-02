import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge resolves conflicts using Tailwind's *default* scale, so any
 * token we add in `globals.css` is invisible to it. The dangerous case is
 * `text-*`, which is ambiguous between font-size and text-colour: an
 * unrecognised `text-display-lg` gets filed as a colour, and then
 * `cn("text-display-lg", "text-brand")` silently drops the size.
 *
 * Teaching it our namespaces keeps every custom token conflict-aware. Keep
 * these lists in sync with the `@theme` block in `src/app/globals.css`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "2xs",
        "md",
        "display-xs",
        "display-sm",
        "display-md",
        "display-lg",
        "display-xl",
        "display-2xl",
        "display-hero",
      ],
      color: [
        "bg-deep",
        "surface",
        "surface-2",
        "line",
        "line-2",
        "dim",
        "lit",
        "sheen",
        "brand",
        "brand-soft",
        "brand-tint",
        "brand-glow",
        "brand-contrast",
        "success",
        "warning",
        "error",
      ],
      shadow: ["elevated", "elevated-hover"],
      ease: ["out-expo", "standard"],
      container: ["page"],
    },
  },
});

/**
 * Joins class names and resolves Tailwind conflicts, last one winning.
 * Use it anywhere a component accepts a `className` override.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
