/**
 * Footer navigation.
 *
 * Product links are in-page anchors because the sections exist; Company and
 * Legal point at routes that still need building. Kept to three short columns
 * on purpose — a footer's job is to answer "where is the legal page" and "what
 * did I miss", not to re-sell the product one more time.
 */
export const FOOTER_NAV = [
  {
    label: "Product",
    links: [
      { label: "How it works", href: "#how" },
      { label: "Command palette", href: "#command" },
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    label: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    label: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Refunds", href: "/refund-policy" },
      { label: "Delivery", href: "/delivery-policy" },
      { label: "Security", href: "/security" },
    ],
  },
];
