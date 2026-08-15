import { PageAtmosphere } from "@/components/common/page-atmosphere";
import { SiteHeader } from "@/components/landing/site-header";
import { SmoothScroll } from "@/components/landing/smooth-scroll";

/**
 * The marketing shell.
 *
 * Its whole job is the order of these three things. ScrollSmoother transforms
 * the content it scrolls, and a transformed ancestor is a containing block for
 * `position: fixed` — so anything that must hold still relative to the viewport
 * has to be a sibling of the smooth wrapper rather than a child of it.
 *
 * The header and the ambient light used to be rendered by the page. Inside the
 * transformed content the header would scroll away with the page and the light
 * would stop covering the viewport, so both moved up here. The page keeps only
 * what is meant to scroll.
 *
 * The page-wide grain in the root layout is already outside all of this and
 * needs no such care.
 */
export default function MarketingLayout({ children }) {
  return (
    <>
      <PageAtmosphere />
      <SiteHeader />
      <SmoothScroll>{children}</SmoothScroll>
    </>
  );
}
