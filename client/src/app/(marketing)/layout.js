import { SiteHeader } from "@/components/landing/site-header";

/**
 * The marketing shell keeps navigation outside the page content while the
 * browser handles scrolling natively. Marketing pages intentionally use the
 * solid application background rather than a moving ambient light layer.
 */
export default function MarketingLayout({ children }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
