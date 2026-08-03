/**
 * The three subscription plans (PRD §13).
 *
 * Included lists are written as what you get rather than as what the tier is
 * called — "Uploads up to 5 GB per file" instead of "Larger upload limits" —
 * so a visitor can compare rows without decoding marketing tiers.
 *
 * Annual prices are the per-month figure when billed yearly; `yearly` is what
 * actually gets charged, shown underneath so the discount is never implied
 * without the real number next to it.
 */
export const PLANS = [
  {
    id: "free",
    name: "Free",
    tagline: "For getting a drive off your desktop and into the cloud.",
    monthly: 0,
    annual: 0,
    yearly: 0,
    cta: "Start free",
    inherits: null,
    includes: [
      "5 GB of storage",
      "Uploads up to 100 MB per file",
      "Basic link sharing",
      "Standard download speeds",
      "Community support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For people who live in their files all day.",
    monthly: 8,
    annual: 6,
    yearly: 72,
    cta: "Start 14-day trial",
    featured: true,
    inherits: "Free",
    includes: [
      "100 GB of storage",
      "Uploads up to 5 GB per file",
      "Links that expire and can be revoked",
      "Priority upload and download",
      "Priority support",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "For professionals and small teams sharing everything.",
    monthly: 24,
    annual: 19,
    yearly: 228,
    cta: "Start 14-day trial",
    inherits: "Pro",
    includes: [
      "1 TB of storage",
      "No file size limit",
      "Unlimited sharing",
      "Advanced storage analytics",
      "Early access to AI features",
      "Premium support",
    ],
  },
];

export const BILLING = [
  { id: "monthly", label: "Monthly" },
  { id: "annual", label: "Annual" },
];

/** Largest discount across the paid plans, so the claim stays true. */
export const ANNUAL_SAVING = "Save 25%";

export const PRICING_FOOTNOTE =
  "Every plan includes the command palette, in-place previews and 30-day recovery. Cancel whenever — no call, no retention flow.";
