export const PLANS = [
  {
    id: "free",
    name: "Free",
    tagline: "For getting a drive off your desktop and into the cloud.",
    monthly: 0,
    cta: "Start free",
    inherits: null,
    includes: [
      "500 MB of storage",
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
    monthly: 99,
    cta: "Choose Pro",
    featured: true,
    inherits: "Free",
    includes: [
      "10 GB of storage",
      "Uploads up to 1 GB per file",
      "Links that expire and can be revoked",
      "Google Drive import",
      "Monthly subscription management",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "For professionals with larger files and archives.",
    monthly: 299,
    cta: "Choose Premium",
    inherits: "Pro",
    includes: [
      "50 GB of storage",
      "Uploads up to 2 GB per file",
      "Google Drive import",
      "Monthly subscription management",
      "Larger file support",
    ],
  },
];

export const PRICING_FOOTNOTE =
  "Every plan includes the command palette, in-place previews, sharing and trash recovery until permanent deletion. Paid plans renew monthly.";
