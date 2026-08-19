const razorpayProPlanId = process.env.RAZORPAY_PRO_PLAN_ID;
const razorpayPremiumPlanId = process.env.RAZORPAY_PREMIUM_PLAN_ID;

if (!razorpayProPlanId || !razorpayPremiumPlanId) {
  throw new Error("Razorpay plan IDs are missing");
}

export const PLANS = Object.freeze({
  free: Object.freeze({
    id: "free",
    name: "Free",
    pricePaise: 0,
    currency: "INR",
    storageQuotaBytes: 500_000_000,
    maxFileSizeBytes: 100_000_000,
    razorpayPlanId: null,
  }),

  pro: Object.freeze({
    id: "pro",
    name: "Pro",
    pricePaise: 9_900,
    currency: "INR",
    storageQuotaBytes: 10_000_000_000,
    maxFileSizeBytes: 1_000_000_000,
    razorpayPlanId: razorpayProPlanId,
  }),

  premium: Object.freeze({
    id: "premium",
    name: "Premium",
    pricePaise: 29_900,
    currency: "INR",
    storageQuotaBytes: 50_000_000_000,
    maxFileSizeBytes: 2_000_000_000,
    razorpayPlanId: razorpayPremiumPlanId,
  }),
});

export function getPlan(planId) {
  return PLANS[planId] ?? null;
}