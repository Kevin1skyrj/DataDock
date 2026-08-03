import { cn } from "@/lib/utils";

/**
 * The gutter the island floats in.
 *
 * Deliberately the same padding every page container uses, which is what makes
 * the island's outer edge land exactly on the hero's container below it and on
 * the window's edge across the authentication screens. Change it here or the
 * two stop agreeing.
 */
export const HEADER_GUTTER = "px-5 pt-3 sm:px-10 sm:pt-4";

/**
 * The floating header surface, shared by the marketing site and the
 * authentication screens.
 *
 * It exists as one component for one reason: the whole point of the shape is
 * that the header does not change when you cross from the landing page into the
 * product. Two copies of these classes would agree today and drift by the third
 * time one of them is touched.
 *
 * The inner padding is asymmetric on purpose. `pl-10` puts the wordmark exactly
 * on the page's text column; the right side tucks in closer because it ends in
 * a filled button, which brings its own visual mass and looks marooned with a
 * matching inset.
 *
 * `scrolled` only deepens it. The island is always there — chrome that
 * materialises out of nothing is a trick — but once content is passing beneath
 * it, the surface firms up, the hairline strengthens and it lifts onto the
 * elevation shadow so it is unambiguously in front.
 */
export function HeaderIsland({ scrolled = false, className, children }) {
  return (
    <div
      className={cn(
        "mx-auto flex h-16 max-w-page items-center justify-between gap-8 rounded-2xl border",
        "pl-4 pr-3 sm:pl-10 sm:pr-4",
        // Constant. Animating a backdrop-filter re-rasterises the whole island
        // on every frame of the transition, for a change nobody can see happen.
        "backdrop-blur-[14px]",
        "transition-[background-color,border-color,box-shadow] duration-300 ease-standard",
        scrolled
          ? "border-line-2 bg-[color-mix(in_oklab,var(--overlay)_88%,transparent)] shadow-[0_1px_0_var(--lit)_inset,var(--elevation)]"
          : "border-line bg-[color-mix(in_oklab,var(--overlay)_66%,transparent)] shadow-[0_1px_0_var(--lit)_inset]",
        className,
      )}
    >
      {children}
    </div>
  );
}
