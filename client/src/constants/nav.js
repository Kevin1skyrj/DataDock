/**
 * The marketing navigation.
 *
 * Every href is absolute, including the section links. A bare `#pricing` only
 * means anything on the page that owns that section — from `/about` it resolves
 * to `/about#pricing`, an anchor that does not exist there, and the click does
 * nothing at all. `/#pricing` names the page as well as the place, so the link
 * works from anywhere.
 *
 * The header still treats them differently: when the target page is the one you
 * are already on, the smoother scrolls to it; otherwise it is a navigation that
 * happens to land at a hash.
 */
export const MARKETING_NAV = [
  { label: "How it works", href: "/#how" },
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "About", href: "/about" },
];
