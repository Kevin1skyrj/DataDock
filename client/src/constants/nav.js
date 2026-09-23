/**
 * The marketing navigation.
 *
 * Every href is absolute, including the section links. A bare `#pricing` only
 * means anything on the page that owns that section — from `/about` it resolves
 * to `/about#pricing`, an anchor that does not exist there, and the click does
 * nothing at all. `/#pricing` names the page as well as the place, so the link
 * works from anywhere.
 *
 * The header still treats them differently: a target on the current page uses
 * a native anchor, while any other target is a real navigation that happens to
 * land at a hash.
 */
export const MARKETING_NAV = [
  { label: "How it works", href: "/#how" },
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "About", href: "/about" },
];
